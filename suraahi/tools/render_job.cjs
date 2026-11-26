// DETACHED, RESUMABLE RENDER JOB.  Start with tools/start_render.sh (never run this in the foreground).
// node tools/render_job.cjs --tier fast|good|final|draft --from 0 --to 720 --out out/final.mp4 [--audio audio/voice.mp3] [--seg 60] [--fps 30]
// - one persistent Chromium (no per-segment startup cost), segments of --seg frames written to out/seg/NNNNNN.mp4
// - segments that already exist and probe valid are SKIPPED  => killing / restarting the job never loses work
// - page crash / frame error => browser restarted, segment retried (3x); the JS error text lands in out/job.json for you to fix, then start again (it resumes)
// - at the end: concat -> scale to 1080x1920 (lanczos) -> optional audio mux -> faststart mp4 -> copied to /mnt/user-data/outputs if that folder exists
const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path'),{spawn,spawnSync}=require('child_process');
const root=path.resolve(__dirname,'..','..');const APP=process.env.APP||'starter',PAGE=process.env.PAGE||'index';
const A=process.argv.slice(2);const arg=(k,d)=>{const i=A.indexOf('--'+k);return i>=0?A[i+1]:d};
const tier=arg('tier','fast'),f0=+arg('from',0),f1=+arg('to',720),SEG=+arg('seg',60),FPS=+arg('fps',30),audio=arg('audio',''),outRel=arg('out','out/final.mp4'),extra=arg('extra','');
const appDir=path.join(root,APP),outDir=path.join(appDir,path.dirname(outRel)),segDir=path.join(outDir,'seg_'+tier),outFile=path.join(appDir,outRel),jobFile=path.join(outDir,'job.json');
fs.mkdirSync(segDir,{recursive:true});
const mime={'.js':'text/javascript','.html':'text/html','.json':'application/json'};
const st={state:'starting',tier,from:f0,to:f1,total:f1-f0,done:0,seg:SEG,eta_s:null,spf:null,started:Date.now(),updated:Date.now(),error:null,pid:process.pid,out:outFile};
const save=()=>{st.updated=Date.now();fs.writeFileSync(jobFile,JSON.stringify(st,null,1))};
const valid=(f)=>{try{if(!fs.existsSync(f)||fs.statSync(f).size<500)return false;const r=spawnSync('ffprobe',['-v','error','-count_frames','-select_streams','v:0','-show_entries','stream=nb_read_frames','-of','csv=p=0',f],{encoding:'utf8'});return parseInt(r.stdout)>0}catch(e){return false}};
const segs=[];for(let a=f0;a<f1;a+=SEG)segs.push([a,Math.min(f1,a+SEG)]);
const segFile=(a)=>path.join(segDir,String(a).padStart(6,'0')+'.mp4');
const srv=http.createServer((q,s)=>{let p=path.join(root,decodeURIComponent(q.url.split('?')[0]));fs.readFile(p,(e,d)=>{if(e){s.writeHead(404);s.end();return}s.writeHead(200,{'content-type':mime[path.extname(p)]||'application/octet-stream'});s.end(d)})});
let browser=null,page=null,port=0;
async function openPage(){if(browser){try{await browser.close()}catch(e){}}browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  page=await browser.newPage({viewport:{width:400,height:700}});page.on('pageerror',e=>{st.error='pageerror: '+e.message;save()});
  await page.goto(`http://localhost:${port}/${APP}/web/${PAGE}.html?q=${tier}${extra}`);await page.waitForFunction('window.ready',null,{timeout:180000})}
async function renderSeg(a,b){const tmp=segFile(a)+'.part.mp4';const ff=spawn('ffmpeg',['-y','-loglevel','error','-f','image2pipe','-framerate',String(FPS),'-c:v','mjpeg','-i','-','-vf','scale='+(process.env.OSIZE||'1920:1080')+':flags=lanczos','-c:v','libx264','-preset','veryfast','-crf',tier==='final'?'16':'19','-pix_fmt','yuv420p',tmp],{stdio:['pipe','inherit','inherit']});
  try{for(let f=a;f<b;f++){const t0=Date.now();await page.evaluate(`window.renderFrame(${f})`);const b64=await page.evaluate(`(async()=>{const m=await import('./core.js');return await m.grabJpeg(0.95)})()`);
    const buf=Buffer.from(b64,'base64');if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r));
    const dt=(Date.now()-t0)/1000;st.spf=st.spf?st.spf*0.9+dt*0.1:dt;st.cur=f;st.eta_s=Math.round(st.spf*(f1-f0-st.done-(f-a)));save()}
  ff.stdin.end();await new Promise(r=>ff.on('close',r));fs.renameSync(tmp,segFile(a))}catch(e){try{ff.stdin.destroy();ff.kill()}catch(_){}throw e}}
srv.listen(0,async()=>{port=srv.address().port;
 try{st.state='running';save();await openPage();
  for(const [a,b] of segs){ if(valid(segFile(a))){st.done+=b-a;save();continue}
    let ok=false;for(let tr=1;tr<=3&&!ok;tr++){try{await renderSeg(a,b);ok=true;st.error=null}catch(e){st.error=`segment ${a}-${b} try ${tr}: ${String(e.message).slice(0,300)}`;save();await openPage()}}
    if(!ok){st.state='FAILED';save();process.exit(1)} st.done+=b-a;save()}
  st.state='assembling';save();
  const list=path.join(segDir,'list.txt');fs.writeFileSync(list,segs.map(([a])=>`file '${segFile(a)}'`).join('\n'));
  const cat=path.join(segDir,'cat.mp4');let r=spawnSync('ffmpeg',['-y','-loglevel','error','-f','concat','-safe','0','-i',list,'-c','copy',cat]);if(r.status)throw new Error('concat failed: '+r.stderr);
  const ai=audio&&fs.existsSync(path.join(appDir,audio))?['-i',path.join(appDir,audio),'-map','0:v','-map','1:a','-c:a','aac','-b:a','192k','-shortest']:[];
  r=spawnSync('ffmpeg',['-y','-loglevel','error','-i',cat,...ai,'-c:v','copy','-movflags','+faststart',outFile]);if(r.status)throw new Error('mux failed: '+r.stderr);
  if(fs.existsSync('/mnt/user-data/outputs')){try{fs.copyFileSync(outFile,'/mnt/user-data/outputs/'+path.basename(outFile));st.copied='/mnt/user-data/outputs/'+path.basename(outFile)}catch(e){}}
  st.state='DONE';st.eta_s=0;save();await browser.close();srv.close();process.exit(0)
 }catch(e){st.state='FAILED';st.error=String(e.stack||e).slice(0,600);save();try{await browser.close()}catch(_){}process.exit(1)}});
