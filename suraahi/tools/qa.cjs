// node tools/qa.cjs <scale 0.2> <f0> <f1> <step>   (APP=starter by default)  -> prints every mistake found, grouped. Exit code 1 if any.
const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..','..');const APP=process.env.APP||'starter',PAGE=process.env.PAGE||'index';
const [scale,f0,f1,step]=process.argv.slice(2);const mime={'.js':'text/javascript','.html':'text/html','.json':'application/json'};
const srv=http.createServer((q,s)=>{let p=path.join(root,decodeURIComponent(q.url.split('?')[0]));fs.readFile(p,(e,d)=>{if(e){s.writeHead(404);s.end();return}s.writeHead(200,{'content-type':mime[path.extname(p)]||'application/octet-stream'});s.end(d)})}).listen(0,async()=>{
 const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const pg=await b.newPage({viewport:{width:200,height:300}});pg.on('pageerror',e=>console.log('pageerror:',e.message));
 await pg.goto(`http://localhost:${srv.address().port}/${APP}/web/${PAGE}.html?s=${scale||0.2}&sh=512${process.env.X||""}`);await pg.waitForFunction("window.ready",null,{timeout:20000});
 const all=[];for(let f=+f0;f<=+f1;f+=+(step||15)){try{await pg.evaluate(`window.renderFrame(${f})`);const r=await pg.evaluate(`window.qa?window.qa(${f}):[]`);all.push(...r)}catch(e){console.log('ERR',f,e.message.slice(0,200))}}
 const g={};for(const i of all){const k=i.type+' | '+i.who;(g[k]=g[k]||[]).push(i)}
 for(const k in g){const a=g[k];if(process.env.LIST)console.log(k,a.map(x=>x.f+'('+x.msg.replace(/.*ndc /,'')+')').join(' '));console.log(`${k}  x${a.length}  frames ${a[0].f}..${a[a.length-1].f}  e.g. ${a[0].msg}`)}
 console.log(all.length?`QA: ${all.length} issues`:'QA: clean - no issues found');await b.close();srv.close();process.exit(all.length?1:0)});
