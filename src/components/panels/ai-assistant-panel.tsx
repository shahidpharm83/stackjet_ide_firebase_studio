"use client";

import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Bot, Mic, Send, User, CircleDashed } from "lucide-react";
import { aiCodeAssist } from "@/ai/flows/ai-code-assist";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AiAssistantPanel() {
  const projectOpen = true; 
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to the bottom when new messages are added
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const result = await aiCodeAssist({ code: '', context: input });
      const assistantMessage: Message = { role: "assistant", content: result.suggestion };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AI Assistant error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center">
              <Bot className="w-12 h-12 mb-4 text-primary" />
              <h2 className="text-lg font-semibold">AI Assistant</h2>
              <p className="text-sm">
                I can help you code, refactor, and answer questions.
              </p>
            </div>
          )}
          {messages.map((message, index) => (
            <div key={index} className="flex items-start gap-3">
              {message.role === "assistant" ? (
                <Bot className="w-6 h-6 text-primary flex-shrink-0" />
              ) : (
                <User className="w-6 h-6 text-accent flex-shrink-0" />
              )}
              <div className="bg-card/50 p-3 rounded-lg max-w-[90%]">
                 <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
             <div className="flex items-start gap-3">
                <Bot className="w-6 h-6 text-primary flex-shrink-0" />
                 <div className="flex items-center gap-2 text-muted-foreground">
                    <CircleDashed className="w-5 h-5 animate-spin" />
                    <span>Thinking...</span>
                </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="p-4 border-t border-border shrink-0">
        <form onSubmit={handleSubmit} className="relative">
          <Textarea
            placeholder={projectOpen ? "Type your prompt here..." : "Open a project to use the AI Assistant."}
            className="pr-20 min-h-[60px] resize-none"
            disabled={!projectOpen || isLoading}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <div className="absolute top-1/2 right-3 -translate-y-1/2 flex items-center gap-1">
            <Button variant="ghost" size="icon" disabled={!projectOpen || isLoading}>
              <Mic className="w-5 h-5" />
            </Button>
            <Button type="submit" size="icon" disabled={!projectOpen || isLoading || !input.trim()}>
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
