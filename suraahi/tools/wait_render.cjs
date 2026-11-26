// node tools/wait_render.cjs [maxSeconds=45]   One short call per poll (keeps every tool call well under the time limit).
// exit 0 = DONE (file path printed) | 2 = still running (call again immediately, do NOT stop, do NOT ask the user) | 1 = FAILED (read "error", fix the code, start_render.sh again: it resumes)
const fs=require('fs'),path=require('path');const j=path.resolve(__dirname,'..','out','job.json');const max=(+process.argv[2]||45)*1000;const t0=Date.now();
const read=()=>{try{return JSON.parse(fs.readFileSync(j,'utf8'))}catch(e){return null}};
const line=(s)=>{const pct=s.total?Math.round(100*s.done/s.total):0;const eta=s.eta_s!=null?` ETA ${Math.floor(s.eta_s/60)}m${String(s.eta_s%60).padStart(2,'0')}s`:'';return `[${s.state}] ${pct}% (${s.done}/${s.total} frames) ${s.spf?s.spf.toFixed(1)+'s/frame':''}${eta}${s.error?'  last error: '+s.error:''}`};
(async()=>{let s;while(Date.now()-t0<max){s=read();if(s&&(s.state==='DONE'||s.state==='FAILED'))break;await new Promise(r=>setTimeout(r,5000))}
 s=read();if(!s){console.log('no job.json yet - run tools/start_render.sh first');process.exit(1)}
 console.log(line(s));if(s.state==='DONE'){console.log('FILE:',s.copied||s.out);process.exit(0)}if(s.state==='FAILED'){console.log('FAILED -> fix the error above, then run start_render.sh again (it resumes).');process.exit(1)}
 let alive=true;try{process.kill(s.pid,0)}catch(e){alive=false}if(!alive){console.log('job process is gone (sandbox restart?) -> run tools/start_render.sh again; it resumes from finished segments.');process.exit(3)}
 process.exit(2)})();
