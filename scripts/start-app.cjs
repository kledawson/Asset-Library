const net = require('net');
const path = require('path');
const { spawn } = require('child_process');

process.env.PORT = process.env.PORT || '3002';
process.env.BROWSER = 'none';

// Saved assemblies and model editing depend on the local save service.
const socket = net.connect(Number(process.env.ASSET_SAVE_PORT) || 3001, '127.0.0.1');
socket.setTimeout(1500);
let started = false;
function startWebsite(serviceNeeded) {
  if (started) return;
  started = true;
  socket.destroy();
  if (serviceNeeded) {
    const service = spawn(process.execPath, [path.join(__dirname, 'asset-save-server.cjs')], {
      stdio: 'inherit', windowsHide: true,
    });
    process.on('exit', () => service.kill());
  }
  require('react-scripts/scripts/start');
}
socket.once('connect', () => startWebsite(false));
socket.once('error', () => startWebsite(true));
socket.once('timeout', () => startWebsite(true));
