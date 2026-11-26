const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..','..');const expr=process.argv[2];
const mime={'.js':'text/javascript','.html':'text/html'};
const srv=http.createServer((q,s)=>{let p=path.join(root,decodeURIComponent(q.url.split('?')[0]));fs.readFile(p,(e,d)=>{if(e){s.writeHead(404);s.end();return}s.writeHead(200,{'content-type':mime[path.extname(p)]||'application/octet-stream'});s.end(d)})}).listen(0,async()=>{
 const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const pg=await b.newPage();pg.on('pageerror',e=>console.log('pageerror:',e.message));
 await pg.goto(`http://localhost:${srv.address().port}/coaster/web/index.html?s=0.2`);await pg.waitForFunction('window.ready',null,{timeout:120000});
 console.log(await pg.evaluate(expr));await b.close();srv.close();});
