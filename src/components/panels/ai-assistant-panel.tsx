
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Bot, Mic, Send, User, CircleDashed, File, Terminal, CheckCircle2, XCircle, ChevronRight, ChevronsRight, Pencil, Lightbulb, ClipboardCheck, Play, Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { agenticFlow, AgenticFlowOutput, AgenticFlowInput } from "@/ai/flows/agentic-flow";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import OperationSummaryChart from "@/components/charts/operation-summary-chart";
import type { Project } from '@/app/page';

type PlanStep = AgenticFlowOutput['plan'][0];

type ExecutedStep = PlanStep & {
    startTime: number;
    endTime: number;
};

type Timings = {
    start: number;
    thinkingEnd?: number;
    executionStart?: number;
    executionEnd?: number;
    summaryEnd?: number;
};

type Message = {
  role: "user" | "assistant";
  content: string | AgenticFlowOutput;
  timestamp?: string;
  plan?: AgenticFlowOutput['plan'];
  executedPlan?: ExecutedStep[];
  isExecuting?: boolean;
  timings?: Timings;
  summaryComplete?: boolean;
};

type AgentState = "idle" | "thinking" | "executing" | "summarizing" | "error";

type AiAssistantPanelProps = {
  project: Project | null;
};

type ApiKey = {
  id: string;
  name: string;
  key: string;
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
  const [thinkingTime, setThinkingTime] = useState(0);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const thinkingTimerRef = useRef<NodeJS.Timeout>();
  
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
  }, [messages, agentState]);
  
  const startExecution = useCallback((messageIndex: number, plan: PlanStep[]) => {
    if (!plan || plan.length === 0) return;

    setAgentState("executing");
    setMessages(prev => prev.map((msg, idx) => 
        idx === messageIndex ? { 
            ...msg, 
            isExecuting: true, 
            executedPlan: [],
            timings: { ...(msg.timings || { start: Date.now() }), executionStart: Date.now() }
        } : msg
    ));

    const totalSteps = plan.length;
    let stepIndex = 0;
    const interval = setInterval(() => {
        if (stepIndex >= totalSteps) {
            clearInterval(interval);
            setAgentState("summarizing");

            // Final update to mark execution and summary as complete
            setMessages(prev => prev.map((msg, idx) => {
                if (idx === messageIndex) {
                    const executionEndTime = Date.now();
                    return { 
                        ...msg, 
                        isExecuting: false,
                        summaryComplete: true, // Explicitly mark summary as ready
                        timings: { 
                            ...(msg.timings || { start: Date.now() }), 
                            executionEnd: executionEndTime,
                            summaryEnd: Date.now() 
                        } 
                    };
                }
                return msg;
            }));

            // Set agent back to idle after summary is shown
            setTimeout(() => {
                setAgentState("idle");
            }, 500);
            return;
        }
        
        const nextStep = plan[stepIndex];
        const stepStartTime = Date.now();
        
        // Simulate step execution time
        const stepExecutionTime = 500 + Math.random() * 500;

        setTimeout(() => {
             setMessages(prev => prev.map((msg, idx) => {
                if (idx === messageIndex) {
                    const newExecutedPlan = [
                        ...(msg.executedPlan || []), 
                        {...nextStep, startTime: stepStartTime, endTime: Date.now() }
                    ];
                    return { ...msg, executedPlan: newExecutedPlan };
                }
                return msg;
            }));
        }, stepExecutionTime)
        
        stepIndex++;
    }, 800);
  }, []);

  const agenticFlowWithRetry = useCallback(async (promptText: string): Promise<AgenticFlowOutput> => {
    let keys: ApiKey[] = [];
    try {
      const savedKeys = localStorage.getItem("geminiApiKeys");
      if (savedKeys) {
        keys = JSON.parse(savedKeys);
      }
    } catch (error) {
      console.error("Failed to load API keys from localStorage", error);
    }

    if (keys.length === 0) {
      throw new Error("No Gemini API keys found. Please add a key in the settings.");
    }

    let keyIndex = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) { // Unlimited retries
      const currentKey = keys[keyIndex];
      try {
        console.log(`Attempting request with key: ${currentKey.name}`);
        // Pass the specific key to the backend flow.
        const result = await agenticFlow({ prompt: promptText, apiKey: currentKey.key });
        return result; // Success
      } catch (error) {
        console.error(`API call failed for key ${currentKey.name}:`, error);
        keyIndex = (keyIndex + 1) % keys.length; // Move to the next key
        console.log(`Switching to next key: ${keys[keyIndex].name}`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
      }
    }
  }, []);

  const sendPrompt = useCallback(async (promptText: string) => {
    if (!promptText.trim() || agentState !== 'idle') return;
    
    const startTime = Date.now();

    const userMessage: Message = { 
      role: "user", 
      content: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    setAgentState("thinking");
    setThinkingTime(0);
    thinkingTimerRef.current = setInterval(() => {
        setThinkingTime(prev => prev + 1);
    }, 1000);

    try {
      const result = await agenticFlowWithRetry(promptText);
      
      clearInterval(thinkingTimerRef.current);
      const thinkingEnd = Date.now();
      
      const assistantMessage: Message = { 
          role: "assistant", 
          content: result,
          plan: result.plan,
          executedPlan: [],
          isExecuting: false,
          summaryComplete: false,
          timings: { start: startTime, thinkingEnd }
      };
      
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages, assistantMessage];
        const newAssistantMessageIndex = newMessages.length - 1;
        
        // Short delay to show the plan before execution starts
        setTimeout(() => {
          if (result.plan) {
             startExecution(newAssistantMessageIndex, result.plan);
          } else {
             setAgentState("idle");
          }
        }, 1500); 
        
        return newMessages;
      });


    } catch (error: any) {
      clearInterval(thinkingTimerRef.current);
      console.error("AI Agent error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: `Sorry, I encountered an error: ${error.message}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
      setAgentState("error");
      setTimeout(() => setAgentState("idle"), 3000);
    }
  }, [agentState, agenticFlowWithRetry, startExecution]);

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
        const contentLines = step.content?.split('\n') || [''];
        patchContent += `@@ -0,0 +1,${contentLines.length} @@\n`;
        patchContent += `${contentLines.map(line => `+${line}`).join('\n')}\n`;
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
  
  const formatTime = (ms: number) => {
    if (ms < 0) return '0ms';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  const AgentResponse = ({ message }: { message: Message }) => {
    if (typeof message.content !== 'object') return null;

    const response = message.content;
    const plan = message.plan || [];
    const executedPlan = message.executedPlan || [];
    const isExecuting = message.isExecuting;
    const totalSteps = plan.length;
    const executionProgress = totalSteps > 0 ? (executedPlan.length / totalSteps) * 100 : 0;
    const timings = message.timings;
    const isDone = message.summaryComplete;
    
    const totalTime = timings?.summaryEnd && timings?.start ? timings.summaryEnd - timings.start : 0;

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
                <div className="flex justify-between items-center">
                    <AlertTitle>Analysis</AlertTitle>
                    {timings?.thinkingEnd && timings.start && (
                        <span className="text-xs text-muted-foreground">
                            Thinking & Analysis: {formatTime(timings.thinkingEnd - timings.start)}
                        </span>
                    )}
                </div>
                <AlertDescription>{response.analysis}</AlertDescription>
            </Alert>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold flex items-center gap-2"><ChevronsRight className="w-5 h-5"/> Execution Plan ({plan.length} steps)</h3>
              </div>
              <div className="space-y-2">
                {plan.map((step, idx) => {
                  const action = 'action' in step ? step.action : 'command';
                  return (
                    <div key={idx} className="p-3 rounded-md text-sm bg-muted/50 border-l-4 border-transparent">
                      <div className="flex items-center gap-3 mb-1">
                        <div className="w-4 h-4 flex items-center justify-center text-muted-foreground font-mono text-xs">{idx + 1}</div>
                        {renderStepIcon(action)}
                        <span className="font-mono text-xs flex-1 truncate">{ 'fileName' in step ? step.fileName : step.command }</span>
                        <Badge variant="outline" className="text-xs capitalize">{action}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground pl-7">{step.purpose}</p>
                    </div>
                  )
                })}
              </div>
            </div>
            
            {(isExecuting || isDone || executedPlan.length > 0) && (
                <div>
                    <Separator className="my-4" />
                    <h3 className="font-semibold flex items-center gap-2 mb-2"><Play className="w-5 h-5"/> Execution Log</h3>
                     <div className="space-y-2">
                        {executedPlan.map((step, idx) => {
                          const action = 'action' in step ? step.action : 'command';
                          const stepTime = step.endTime - step.startTime;
                          return (
                            <div key={idx} className={`p-3 rounded-md text-sm transition-all duration-300 bg-green-500/10 border-l-4 border-green-500`}>
                              <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                                {renderStepIcon(action)}
                                <span className="font-mono text-xs flex-1 truncate">{ 'fileName' in step ? step.fileName : step.command }</span>
                                <span className="text-xs text-muted-foreground">{formatTime(stepTime)}</span>
                                <Badge variant="outline" className="text-xs capitalize">{action}</Badge>
                              </div>
                              { 'command' in step && (
                                <CommandOutput command={step.command} outcome={step.expectedOutcome} />
                              )}
                            </div>
                          )
                        })}
                      </div>

                    <div className="space-y-2 pt-4">
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>{isExecuting ? `Executing step ${executedPlan.length + 1}/${totalSteps}...` : 'Execution Complete'}</span>
                            <span>{Math.round(executionProgress)}%</span>
                        </div>
                        <Progress value={executionProgress} className="h-2" />
                    </div>
                </div>
            )}
            
            {isDone && (
                <>
                <Separator />
                <Alert variant="default" className="bg-green-500/10 border-green-500/30">
                    <ClipboardCheck className="h-4 w-4" />
                     <div className="flex justify-between items-center">
                        <AlertTitle>Summary</AlertTitle>
                        {totalTime > 0 && (
                            <span className="text-xs text-muted-foreground">
                                Total Time: {formatTime(totalTime)}
                            </span>
                        )}
                    </div>
                    <AlertDescription>
                        {response.summary}
                         <div className="flex items-center gap-4 mt-2 text-xs">
                           <span><strong className="text-foreground">{executedPlan.length}</strong> successful steps</span>
                           <span><strong className="text-foreground">0</strong> errors</span>
                           {timings?.executionEnd && timings.executionStart && (
                             <span>Execution Time: <strong className="text-foreground">{formatTime(timings.executionEnd - timings.executionStart)}</strong></span>
                           )}
                           {timings?.summaryEnd && timings.executionEnd && (
                             <span>Summarizing: <strong className="text-foreground">{formatTime(timings.summaryEnd - timings.executionEnd)}</strong></span>
                           )}
                        </div>
                    </AlertDescription>
                </Alert>
                
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="w-full md:w-1/2">
                        <OperationSummaryChart plan={executedPlan} />
                    </div>
                    <div className="w-full md:w-1/2 space-y-2">
                        <h4 className="font-semibold text-sm">Next Steps</h4>
                        <div className="flex flex-wrap gap-2">
                            {response.suggestions.map((s,i) => <Button key={i} variant="outline" size="sm" onClick={() => { sendPrompt(s); }}>{s}</Button>)}
                            <Button variant="default" size="sm" onClick={() => handleDownloadPatch(plan)}>
                              <Download className="mr-2 h-4 w-4" />
                              Download Patch
                            </Button>
                        </div>
                    </div>
                </div>
              </>
            )}
        </CardContent>
      </Card>
    );
  };


  const renderMessageContent = (message: Message, index: number) => {
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
    return <AgentResponse message={message} />;
  };

  const getAgentStatus = () => {
    switch (agentState) {
        case 'thinking': return `Thinking... (${thinkingTime}s)`;
        case 'executing': return 'Executing plan...';
        case 'summarizing': return 'Finalizing summary...';
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
              <Bot className="w-12 h-12 text-primary" />
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
                {renderMessageContent(message, index)}
              </div>
            </div>
          ))}
          {agentState !== 'idle' && (
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
              <Button type="submit" size="icon" disabled={agentState !== 'idle' || !input.trim()}>
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
