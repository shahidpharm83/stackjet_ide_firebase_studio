"use client";

import React, { useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

type TerminalPanelProps = {
  projectOpen: boolean;
};

export default function TerminalPanel({ projectOpen }: TerminalPanelProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!projectOpen || !terminalRef.current) {
      return;
    }

    if (xtermRef.current) {
      // If terminal already exists, just fit it.
      const fitAddon = new FitAddon();
      xtermRef.current.loadAddon(fitAddon);
      fitAddon.fit();
      return;
    }

    const term = new Terminal({
      cursorBlink: true,
      convertEol: true,
      fontFamily: `'Source Code Pro', monospace`,
      fontSize: 14,
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
      },
    });
    xtermRef.current = term;

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    
    // Clear the terminal element before opening a new terminal
    while (terminalRef.current.firstChild) {
      terminalRef.current.removeChild(terminalRef.current.firstChild);
    }

    term.open(terminalRef.current);
    fitAddon.fit();

    const ws = new WebSocket('ws://localhost:9003');
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('Terminal WebSocket connected');
      term.writeln('Welcome to your local system terminal!');
      term.writeln('');
       // Inform the backend of the terminal size
      ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'data') {
        term.write(data.payload);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
      term.writeln('\r\n\x1b[31mConnection to terminal server failed. Is the server running? (npm run dev:terminal)\x1b[0m');
    };
    
    ws.onclose = () => {
        console.log('Terminal WebSocket disconnected');
        term.writeln('\r\n\x1b[31mTerminal session ended.\x1b[0m');
    };

    term.onData((data) => {
      ws.send(JSON.stringify({ type: 'data', payload: data }));
    });
    
    term.onResize(({ cols, rows }) => {
        ws.send(JSON.stringify({ type: 'resize', cols, rows }));
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
      xtermRef.current = null;
      if (terminalRef.current) {
        resizeObserver.unobserve(terminalRef.current);
      }
    };
  }, [projectOpen]);

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      <div className="flex items-center justify-between p-2 h-12 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-5 h-5" />
          <h2 className="font-semibold text-base">Terminal</h2>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Plus className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div ref={terminalRef} className="flex-1 w-full h-full p-2" />
    </div>
  );
}
