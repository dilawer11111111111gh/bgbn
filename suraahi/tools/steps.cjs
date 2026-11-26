const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=require('path').resolve(__dirname,'..','..');const APP=process.env.APP||'starter',PAGE=process.env.PAGE||'index';const mime={'.js':'text/javascript','.html':'text/html'};
const srv=http.createServer((q,s)=>{let p=path.join(root,decodeURIComponent(q.url.split('?')[0]));fs.readFile(p,(e,d)=>{if(e){s.writeHead(404);s.end();return}s.writeHead(200,{'content-type':mime[path.extname(p)]||'application/octet-stream'});s.end(d)})}).listen(0,async()=>{
 const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const pg=await b.newPage({viewport:{width:200,height:300}});await pg.goto(`http://localhost:${srv.address().port}/${APP}/web/${PAGE}.html?s=0.2`);await pg.waitForFunction('window.ready');
 const r=await pg.evaluate('window.stepInfo()');fs.writeFileSync(root+'/'+APP+'/audio/steps.json',JSON.stringify(r));console.log(r.length);await b.close();srv.close();});
