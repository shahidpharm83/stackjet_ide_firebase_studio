
"use client";

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

type TerminalPanelProps = {
  projectOpen: boolean;
};

export default function TerminalPanel({ projectOpen }: TerminalPanelProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const termRef = useRef<Terminal | null>(null);

  useEffect(() => {
    if (!projectOpen || !terminalRef.current || termRef.current) {
        return;
    }

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
    fitAddon.fit();

    const ws = new WebSocket('ws://localhost:3001');
    wsRef.current = ws;
    termRef.current = term;

    ws.onopen = () => {
        console.log('Terminal WebSocket connection established');
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
        ws.send(JSON.stringify({ type: 'stdin', payload: data }));
    });
    
    const resizeObserver = new ResizeObserver(() => {
        fitAddon.fit();
    });
    if (terminalRef.current) {
       resizeObserver.observe(terminalRef.current);
    }

    return () => {
      ws.close();
      term.dispose();
      termRef.current = null;
      if (terminalRef.current) {
        resizeObserver.unobserve(terminalRef.current);
      }
    };
  }, [projectOpen]);

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
