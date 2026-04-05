#!/bin/bash
while true; do
  if ! pgrep -f "next-server" > /dev/null 2>&1; then
    echo "[$(date)] Dev server died, restarting..." >> keepalive.log
    rm -rf .next 2>/dev/null
    bun run dev > dev.log 2>&1 &
    sleep 15
  else
    sleep 10
  fi
done
