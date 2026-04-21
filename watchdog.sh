#!/bin/bash
cd /home/z/my-project
while true; do
  if ! pgrep -f "next dev" > /dev/null 2>&1; then
    echo "[$(date)] Restarting server..." >> /home/z/my-project/server.log
    node_modules/.bin/next dev -p 3000 >> /home/z/my-project/dev.log 2>&1 &
    echo "[$(date)] Started PID $!" >> /home/z/my-project/server.log
  fi
  sleep 3
done
