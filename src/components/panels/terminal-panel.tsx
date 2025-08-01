
"use client";

import { useEffect, useRef, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useTerminal } from '@/contexts/terminal-context';

type TerminalPanelProps = {
  projectOpen: boolean;
};

export default function TerminalPanel({ projectOpen }: TerminalPanelProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const { setWebSocket } = useTerminal();

  const termInstance = useRef<{ term: Terminal, fitAddon: FitAddon, ws: WebSocket } | null>(null);

  const cleanup = useCallback(() => {
    if (termInstance.current) {
        termInstance.current.ws.close();
        termInstance.current.term.dispose();
        termInstance.current = null;
        setWebSocket(null);
    }
  }, [setWebSocket]);

  useEffect(() => {
    if (projectOpen && terminalRef.current && !termInstance.current) {
      const term = new Terminal({
        cursorBlink: true,
        fontFamily: '"Source Code Pro", monospace',
        fontSize: 14,
        theme: {
          background: '#1e1e1e',
          foreground: '#d4d4d4',
        }
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(terminalRef.current);
      
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = window.location.hostname;
      const wsPort = 3001; 
      const wsUrl = `${wsProtocol}//${wsHost}:${wsPort}`;

      const ws = new WebSocket(wsUrl);
      setWebSocket(ws);

      ws.onopen = () => {
        console.log('Terminal WebSocket connection established');
        fitAddon.fit();
      };

      ws.onmessage = (event) => {
        term.write(event.data);
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        term.write('\r\n\x1b[31mConnection error. Is the terminal server running?\x1b[0m');
      };

      ws.onclose = () => {
        console.log('Terminal WebSocket connection closed');
        term.write('\r\n\x1b[31mConnection closed.\x1b[0m');
      };

      term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'stdin', payload: data }));
        }
      });
      
      termInstance.current = { term, fitAddon, ws };

      const resizeObserver = new ResizeObserver(() => {
        termInstance.current?.fitAddon.fit();
      });

      if (terminalRef.current) {
        resizeObserver.observe(terminalRef.current);
      }
      
      return () => {
         if (terminalRef.current) {
            resizeObserver.unobserve(terminalRef.current);
         }
         cleanup();
      };
    }
  }, [projectOpen, setWebSocket, cleanup]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1e1e1e]">
      {!projectOpen ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <p>Open a project to use the terminal.</p>
        </div>
      ) : (
        <div ref={terminalRef} className="w-full h-full p-2" />
      )}
    </div>
  );
}
