
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Bot, Mic, Send, User, CircleDashed, File, Terminal, CheckCircle2, XCircle, ChevronRight, ChevronsRight, Pencil, Lightbulb, ClipboardCheck, Play, Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { agenticFlow, AgenticFlowOutput } from "@/ai/flows/agentic-flow";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Project } from '@/app/page';


type Message = {
  role: "user" | "assistant";
  content: string | AgenticFlowOutput;
  timestamp?: string;
};

type AgentState = "idle" | "thinking" | "analyzing" | "planning" | "executing" | "summarizing" | "error";

type AiAssistantPanelProps = {
  project: Project | null;
};

const CommandOutput = ({ command, outcome }: { command: string; outcome: string }) => (
  <div className="bg-black/80 rounded-md p-3 font-code text-xs mt-2">
    <div className="flex items-center gap-2">
      <span className="text-green-400">$</span>
      <span className="text-white">{command}</span>
    </div>
    <div className="text-gray-400 whitespace-pre-wrap">{outcome}</div>
  </div>
);


export default function AiAssistantPanel({ project }: AiAssistantPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [agentState, setAgentState] = useState<AgentState>("idle");
  const [executionProgress, setExecutionProgress] = useState(0);
  const [executedSteps, setExecutedSteps] = useState(0);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const getStorageKey = useCallback((projectName: string) => `chatHistory_${projectName}`, []);

  useEffect(() => {
    if (project) {
      try {
        const savedMessages = localStorage.getItem(getStorageKey(project.name));
        if (savedMessages) {
          setMessages(JSON.parse(savedMessages));
        } else {
          setMessages([]);
        }
      } catch (error) {
        console.error("Failed to load messages from localStorage", error);
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  }, [project, getStorageKey]);

  useEffect(() => {
    if (project && messages.length > 0) {
       try {
        localStorage.setItem(getStorageKey(project.name), JSON.stringify(messages));
      } catch (error) {
        console.error("Failed to save messages to localStorage", error);
      }
    }
     if (project && messages.length === 0) {
      try {
        localStorage.removeItem(getStorageKey(project.name));
      } catch (error) {
        console.error("Failed to remove messages from localStorage", error);
      }
    }
  }, [messages, project, getStorageKey]);


  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, agentState, executionProgress]);
  
  const handleStartExecution = useCallback((plan: AgenticFlowOutput['plan']) => {
    setAgentState("executing");
    setExecutionProgress(0);
    setExecutedSteps(0);
    
    const totalSteps = plan.length;
    const interval = setInterval(() => {
        setExecutedSteps(prev => {
            const nextStep = prev + 1;
            setExecutionProgress((nextStep / totalSteps) * 100);
            if (nextStep >= totalSteps) {
                clearInterval(interval);
                setAgentState("summarizing");
                setTimeout(() => setAgentState("idle"), 2000); 
            }
            return nextStep;
        });
    }, 800);
  }, []);

  const sendPrompt = useCallback(async (promptText: string) => {
    if (!promptText.trim() || agentState !== 'idle') return;

    const userMessage: Message = { 
      role: "user", 
      content: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setAgentState("thinking");

    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      setAgentState("analyzing");
      
      const result = await agenticFlow({ prompt: promptText });

      const assistantMessage: Message = { role: "assistant", content: result };
      setMessages((prev) => [...prev, assistantMessage]);
      setAgentState("planning");
      
      handleStartExecution(result.plan);

    } catch (error) {
      console.error("AI Agent error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I encountered an error and couldn't complete your request.",
      };
      setMessages((prev) => [...prev, errorMessage]);
      setAgentState("error");
      setTimeout(() => setAgentState("idle"), 2000);
    }
  }, [agentState, handleStartExecution]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendPrompt(input);
  };
  
  const renderStepIcon = (action: string) => {
    switch (action) {
      case 'write': return <Pencil className="w-4 h-4 text-blue-400" />;
      case 'edit': return <Pencil className="w-4 h-4 text-blue-400" />;
      case 'read': return <File className="w-4 h-4 text-gray-400" />;
      case 'delete': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'rename':
      case 'move':
        return <ChevronsRight className="w-4 h-4 text-yellow-400" />;
      default: // Catches 'command' and any other case
        return <Terminal className="w-4 h-4 text-green-400" />;
    }
  };
  
  const handleDownloadPatch = (plan: AgenticFlowOutput['plan']) => {
    let patchContent = '';
    plan.forEach(step => {
      if ('fileName' in step && (step.action === 'write' || step.action === 'edit')) {
        patchContent += `--- a/${step.fileName}\n`;
        patchContent += `+++ b/${step.fileName}\n`;
        patchContent += `@@ -0,0 +1,${(step.content?.match(/\n/g) || []).length + 1} @@\n`;
        patchContent += `${step.content?.split('\n').map(line => `+${line}`).join('\n')}\n`;
      }
    });

    const blob = new Blob([patchContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agent-changes.patch';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const AgentResponse = ({ response, setInput }: { response: AgenticFlowOutput, setInput: (value: string) => void }) => {
    const totalSteps = response.plan.length;
    const isExecutingOrDone = agentState === 'executing' || agentState === 'summarizing' || agentState === 'idle';
    const successfulSteps = (agentState === 'summarizing' || agentState === 'idle') ? totalSteps : executedSteps;

    return (
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="p-4">
          <div className="flex items-center gap-3">
             <Bot className="w-6 h-6 text-primary flex-shrink-0 self-start" />
             <div>
                <CardTitle className="text-base">Stacky's Plan</CardTitle>
                 <p className="text-xs text-muted-foreground">Here's how I'll handle your request.</p>
             </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-4">
            <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>Analysis</AlertTitle>
                <AlertDescription>{response.analysis}</AlertDescription>
            </Alert>
            
            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-2"><ChevronsRight className="w-5 h-5"/> Execution Plan</h3>
              <div className="space-y-2">
                {response.plan.map((step, index) => {
                  const action = 'action' in step ? step.action : 'command';
                  return (
                    <div key={index} className={`p-3 rounded-md text-sm transition-all duration-300 ${isExecutingOrDone && index < executedSteps ? 'bg-green-500/10 border-l-4 border-green-500' : 'bg-muted/50 border-l-4 border-transparent'}`}>
                      <div className="flex items-center gap-3">
                        {isExecutingOrDone && index < executedSteps ? <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" /> : <div className="w-4 h-4 flex items-center justify-center text-muted-foreground font-mono text-xs">{index + 1}</div>}
                        {renderStepIcon(action)}
                        <span className="font-mono text-xs flex-1 truncate">{ 'fileName' in step ? step.fileName : step.command }</span>
                        <Badge variant="outline" className="text-xs capitalize">{action}</Badge>
                      </div>
                      <div className="mt-2 pl-7 text-xs space-y-1 text-muted-foreground">
                        <p><strong className="font-medium text-foreground/90">Purpose:</strong> {step.purpose}</p>
                        <p><strong className="font-medium text-foreground/90">Outcome:</strong> {step.expectedOutcome}</p>
                      </div>
                      {isExecutingOrDone && index < executedSteps && 'command' in step && (
                        <CommandOutput command={step.command} outcome={step.expectedOutcome} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {(agentState === 'executing' || agentState === 'summarizing' || agentState === 'idle') && (
                <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>{agentState === 'executing' ? `Executing step ${executedSteps + 1}/${totalSteps}...` : 'Execution Complete'}</span>
                        <span>{Math.round(executionProgress)}%</span>
                    </div>
                    <Progress value={executionProgress} className="h-2" />
                </div>
            )}
            
            {(agentState === 'summarizing' || agentState === 'idle') && (
                <>
                <Separator />
                <Alert variant="default" className="bg-green-500/10 border-green-500/30">
                    <ClipboardCheck className="h-4 w-4" />
                    <AlertTitle>Summary</AlertTitle>
                    <AlertDescription>
                        {response.summary}
                         <div className="flex items-center gap-4 mt-2 text-xs">
                           <span><strong className="text-foreground">{successfulSteps}</strong> successful steps</span>
                           <span><strong className="text-foreground">0</strong> errors</span>
                        </div>
                    </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Next Steps</h4>
                    <div className="flex flex-wrap gap-2">
                        {response.suggestions.map((s,i) => <Button key={i} variant="outline" size="sm" onClick={() => { setInput(s); }}>{s}</Button>)}
                        <Button variant="default" size="sm" onClick={() => handleDownloadPatch(response.plan)}>
                          <Download className="mr-2 h-4 w-4" />
                          Download Patch
                        </Button>
                    </div>
                </div>
              </>
            )}

        </CardContent>
      </Card>
    );
  };


  const renderMessageContent = (message: Message) => {
    if (typeof message.content === 'string') {
        return (
          <div className="flex flex-col items-end">
              <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg max-w-full">
                 <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.timestamp && <span className="text-xs text-muted-foreground mt-1">{message.timestamp}</span>}
          </div>
        )
    }
    return <AgentResponse response={message.content} setInput={setInput} />;
  };

  const getAgentStatus = () => {
    switch (agentState) {
        case 'thinking': return 'Thinking...';
        case 'analyzing': return 'Analyzing request...';
        case 'planning': return 'Creating execution plan...';
        case 'error': return 'An error occurred.';
        default: return null;
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center">
              <Bot className="w-12 h-12 mb-4 text-primary" />
              <h2 className="text-lg font-semibold">Agentic AI Assistant</h2>
              <p className="text-sm">
                I can analyze your requests, create a plan, and execute it for you.
              </p>
            </div>
          )}
          {messages.map((message, index) => (
            <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
              {message.role === "user" && <User className="w-6 h-6 text-accent flex-shrink-0 order-2" />}
              <div className={`w-full ${message.role === 'user' ? 'max-w-[90%]' : ''}`}>
                {renderMessageContent(message)}
              </div>
            </div>
          ))}
          {agentState !== 'idle' && agentState !== 'executing' && agentState !== 'summarizing' && agentState !== 'planning' && (
             <div className="flex items-start gap-3">
                <Bot className="w-6 h-6 text-primary flex-shrink-0" />
                 <div className="flex items-center gap-2 text-muted-foreground">
                    <CircleDashed className="w-5 h-5 animate-spin" />
                    <span>{getAgentStatus()}</span>
                </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="p-4 border-t border-border shrink-0">
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <Textarea
              placeholder="Prompt Stacky to build, test, or refactor..."
              className="pr-20 min-h-[60px] resize-none"
              disabled={agentState !== 'idle'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendPrompt(input);
                }
              }}
            />
            <div className="absolute top-1/2 right-3 -translate-y-1/2 flex items-center gap-1">
              <Button variant="ghost" size="icon" disabled={agentState !== 'idle'}>
                <Mic className="w-5 h-5" />
              </Button>
              <Button type="submit" size="icon" disabled={agentState !== 'idle' || !input.trim()} onClick={() => sendPrompt(input)}>
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

    