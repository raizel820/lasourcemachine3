#!/bin/bash
cd /home/z/my-project
while true; do
  if ! curl -sf http://127.0.0.1:3000/ --max-time 3 > /dev/null 2>&1; then
    pkill -9 -f "next dev" 2>/dev/null
    sleep 1
    node_modules/.bin/next dev -p 3000 >> /home/z/my-project/dev.log 2>&1 &
    sleep 1
  fi
  sleep 2
done
