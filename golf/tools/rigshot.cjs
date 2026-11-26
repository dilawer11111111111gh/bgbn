const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..','..');const [out,poses]=process.argv.slice(2);
const srv=http.createServer((q,s)=>{let p=path.join(root,decodeURIComponent(q.url.split('?')[0].split('#')[0]));fs.readFile(p,(e,d)=>{if(e){s.writeHead(404);s.end();return}s.writeHead(200,{'content-type':p.endsWith('.js')?'text/javascript':p.endsWith('.json')?'application/json':'text/html'});s.end(d)})}).listen(0,async()=>{
 const b=await chromium.launch();const pg=await b.newPage({viewport:{width:2400,height:1000}});pg.on('pageerror',e=>console.log('pageerror',e.message));
 await pg.goto(`http://localhost:${srv.address().port}/golf/web/rig.html#${encodeURIComponent(poses)}`);await pg.waitForFunction('window.ready');await pg.screenshot({path:out});await b.close();srv.close();});
