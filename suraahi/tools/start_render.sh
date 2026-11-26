#!/bin/bash
# tools/start_render.sh <tier: draft|fast|good|final> <from> <to> [out.mp4] [audio.mp3]   -> starts DETACHED job, returns immediately.
# It RESUMES automatically if you run it again (finished segments are kept). Then poll with:  node tools/wait_render.cjs
cd "$(dirname "$0")/.." || exit 1; mkdir -p out
export NODE_PATH=${NODE_PATH:-/opt/npm-tools/node_modules} PLAYWRIGHT_BROWSERS_PATH=${PLAYWRIGHT_BROWSERS_PATH:-/opt/pw-browsers}
if [ -f out/job.json ] && grep -q '"state": "running"' out/job.json && kill -0 "$(grep -o '"pid": [0-9]*' out/job.json | grep -o '[0-9]*')" 2>/dev/null; then echo "job already running"; exit 0; fi
nohup setsid node tools/render_job.cjs --tier "${1:-fast}" --from "${2:-0}" --to "${3:-720}" --out "${4:-out/final.mp4}" ${5:+--audio "$5"} > out/job.log 2>&1 < /dev/null &
sleep 2; echo "render job started (tier ${1:-fast}, frames ${2:-0}-${3:-720}). Poll: node tools/wait_render.cjs"
