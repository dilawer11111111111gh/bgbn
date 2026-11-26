// node preview.cjs <scale> <outdir> <from> <to> <step>
const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..','..');const [scale,outdir,a,b,st]=process.argv.slice(2);fs.mkdirSync(outdir,{recursive:true});
const mime={'.js':'text/javascript','.html':'text/html'};
const srv=http.createServer((q,s)=>{let p=path.join(root,decodeURIComponent(q.url.split('?')[0]));fs.readFile(p,(e,d)=>{if(e){s.writeHead(404);s.end();return}s.writeHead(200,{'content-type':mime[path.extname(p)]||'application/octet-stream'});s.end(d)})}).listen(0,async()=>{
 const br=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const pg=await br.newPage();pg.on('pageerror',e=>console.log('pageerror',e.message));
 await pg.goto(`http://localhost:${srv.address().port}/${process.env.APP}/web/index.html?s=${scale}`);await pg.waitForFunction('window.ready',null,{timeout:180000});
 for(let f=+a;f<+b;f+=+st){const o=`${outdir}/p${String(f).padStart(5,'0')}.jpg`;if(fs.existsSync(o))continue;await pg.evaluate(`window.renderFrame(${f})`);const b64=await pg.evaluate(`(async()=>{const m=await import('./core.js');return await m.grabJpeg(0.85)})()`);fs.writeFileSync(o,Buffer.from(b64,'base64'));}
 await br.close();srv.close();});
