import http from 'http';
import os from 'os';
import { WebSocketServer, WebSocket } from 'ws';
import pty from 'node-pty';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Terminal server is running');
});

const wss = new WebSocketServer({ server });

const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';

wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected to terminal WebSocket');

  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.env.INIT_CWD ?? process.cwd(),
    env: process.env,
  });

  ptyProcess.onData((data: string) => {
    ws.send(data);
  });

  ptyProcess.onExit(({ exitCode, signal }) => {
    console.log(`PTY process exited with code ${exitCode}, signal ${signal}`);
    ws.close();
  });

  ws.on('message', (message: string) => {
    try {
        const parsed = JSON.parse(message);
        if (parsed.type === 'stdin') {
            ptyProcess.write(parsed.payload);
        } else if (parsed.type === 'resize') {
            ptyProcess.resize(parsed.cols, parsed.rows);
        }
    } catch (e) {
        console.error("Failed to parse incoming ws message", e);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    ptyProcess.kill();
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
    ptyProcess.kill();
  });
});

const port = 3001;
server.listen(port, () => {
  console.log(`Terminal WebSocket server is listening on port ${port}`);
});
