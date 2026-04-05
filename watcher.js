const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'dev.log');

function startServer() {
  const child = spawn('bun', ['run', 'dev'], {
    cwd: __dirname,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: false,
    env: { ...process.env }
  });

  child.stdout.on('data', (data) => {
    process.stdout.write(data);
    fs.appendFileSync(logFile, data.toString());
  });

  child.stderr.on('data', (data) => {
    process.stderr.write(data);
    fs.appendFileSync(logFile, data.toString());
  });

  child.on('exit', (code) => {
    console.log(`[${new Date().toISOString()}] Server exited with code ${code}, restarting in 3s...`);
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] Server exited, restarting...\n`);
    setTimeout(startServer, 3000);
  });

  return child;
}

console.log('Starting persistent dev server watcher...');
fs.writeFileSync(logFile, `[${new Date().toISOString()}] Watcher started\n`);
startServer();
