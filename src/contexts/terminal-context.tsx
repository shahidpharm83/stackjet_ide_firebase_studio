
"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';

interface TerminalContextType {
  webSocket: WebSocket | null;
  setWebSocket: (ws: WebSocket | null) => void;
  sendCommand: (command: string) => void;
}

const TerminalContext = createContext<TerminalContextType | undefined>(undefined);

export const TerminalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);

  const sendCommand = useCallback((command: string) => {
    if (webSocket && webSocket.readyState === WebSocket.OPEN) {
      webSocket.send(JSON.stringify({ type: 'stdin', payload: command }));
    } else {
      console.error("Terminal WebSocket is not open.");
      // Here you might want to queue the command or show an error.
    }
  }, [webSocket]);

  return (
    <TerminalContext.Provider value={{ webSocket, setWebSocket, sendCommand }}>
      {children}
    </TerminalContext.Provider>
  );
};

export const useTerminal = (): TerminalContextType => {
  const context = useContext(TerminalContext);
  if (context === undefined) {
    throw new Error('useTerminal must be used within a TerminalProvider');
  }
  return context;
};
