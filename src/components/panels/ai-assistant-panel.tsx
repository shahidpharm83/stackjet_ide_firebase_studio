
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Bot, Mic, Send, User, CircleDashed, File, Terminal, CheckCircle2, XCircle, ChevronRight, ChevronsRight, Pencil, Lightbulb, ClipboardCheck, Play, Download, Paperclip, Image as ImageIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { agenticFlow, AgenticFlowOutput } from "@/ai/flows/agentic-flow";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Project, OpenFile } from '@/app/page';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { FileSystemTreeItem } from "@/components/panels/file-explorer";
import { useToast } from "@/hooks/use-toast";


type PlanStep = AgenticFlowOutput['plan'][0];

type ExecutedStep = PlanStep & {
    startTime: number;
    endTime: number;
    status: 'success' | 'error';
    outcome: string;
};

type Timings = {
    start: number;
    thinkingEnd?: number;
    executionStart?: number;
    executionEnd?: number;
    summaryEnd?: number;
};

type UploadedFile = {
    name: string;
    type: string;
    dataUri: string;
}

type Message = {
  role: "user" | "assistant";
  content: string | AgenticFlowOutput;
  timestamp?: string;
  plan?: AgenticFlowOutput['plan'];
  executedPlan?: ExecutedStep[];
  isExecuting?: boolean;
  timings?: Timings;
  summaryComplete?: boolean;
  isAwaitingExecution?: boolean;
  uploadedFile?: UploadedFile;
};

type AgentState = "idle" | "thinking" | "executing" | "summarizing" | "error" | "awaiting_execution";

type AiAssistantPanelProps = {
  project: Project | null;
  refreshFileTree: () => void;
  onOpenFile: (path: string, handle: FileSystemFileHandle, content?: string) => void;
  onFileContentChange: (path: string, newContent: string) => void;
  getOpenFile: (path: string) => OpenFile | undefined;
};

type ApiKey = {
  id: string;
  name: string;
  key: string;
};

const CommandOutput = ({ command, outcome, status }: { command: string; outcome: string, status: 'success' | 'error' }) => (
  <div className="bg-black/80 rounded-md p-3 font-code text-xs mt-2">
    <div className="flex items-center gap-2">
      <span className={status === 'success' ? 'text-green-400' : 'text-red-400'}>$</span>
      <span className="text-white">{command}</span>
    </div>
    <div className="text-gray-400 whitespace-pre-wrap">{outcome}</div>
  </div>
);


export default function AiAssistantPanel({ project, refreshFileTree, onOpenFile, onFileContentChange, getOpenFile }: AiAssistantPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [agentState, setAgentState] = useState<AgentState>("idle");
  const [thinkingTime, setThinkingTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [fileSearch, setFileSearch] = useState({ query: "", active: false, results: [] as string[] });
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);

  const { toast } = useToast();
  const recognitionRef = useRef<any>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const thinkingTimerRef = useRef<NodeJS.Timeout>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  
  const getStorageKey = useCallback((projectName: string) => `chatHistory_${projectName}`, []);

  const flattenFileTree = (tree: FileSystemTreeItem[]): string[] => {
    let files: string[] = [];
    for (const item of tree) {
        if (item.kind === 'file') {
            files.push(item.path);
        } else if (item.children) {
            files = files.concat(flattenFileTree(item.children));
        }
    }
    return files;
  };
  

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
    // Add timestamp to the latest user message that doesn't have one
    if (messages.length > 0) {
        setMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage.role === 'user' && !lastMessage.timestamp) {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  ...lastMessage,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                return newMessages;
            }
            return prev; // Return previous state if no changes are needed
        });
    }
  }, [messages]);
  
  // Helper to get a directory handle, creating it if it doesn't exist
  const getDirectoryHandle = useCallback(async (root: FileSystemDirectoryHandle, path: string, create = false): Promise<FileSystemDirectoryHandle> => {
    let currentHandle = root;
    const parts = path.split('/').filter(p => p);
    for (const part of parts) {
        currentHandle = await currentHandle.getDirectoryHandle(part, { create });
    }
    return currentHandle;
  }, []);
  
  // Helper to get a file handle, creating directories if needed
  const getFileHandle = async (root: FileSystemDirectoryHandle, path: string, create = false): Promise<FileSystemFileHandle> => {
      const parts = path.split('/');
      const fileName = parts.pop();
      if (!fileName) throw new Error('Invalid file path');
      
      const dirPath = parts.join('/');
      const dirHandle = await getDirectoryHandle(root, dirPath, create);
      
      return await dirHandle.getFileHandle(fileName, { create });
  };
  
  const typeContent = (filePath: string, content: string, initialContent = ''): Promise<void> => {
    return new Promise(resolve => {
        let currentContent = initialContent;
        const lines = content.split('\n');
        let lineIndex = 0;

        function typeLine() {
            if (lineIndex < lines.length) {
                currentContent = (lineIndex > 0 ? currentContent + '\n' : '') + lines[lineIndex];
                onFileContentChange(filePath, currentContent);
                lineIndex++;
                setTimeout(typeLine, 100); // Slower typing speed
            } else {
                onFileContentChange(filePath, content); // Ensure final content is set
                resolve();
            }
        }
        typeLine();
    });
  };


  const startExecution = useCallback(async (messageIndex: number, plan: PlanStep[]) => {
    if (!plan || plan.length === 0 || !project) return;

    setAgentState("executing");
    setMessages(prev => prev.map((msg, idx) => 
        idx === messageIndex ? { 
            ...msg,
            isAwaitingExecution: false,
            isExecuting: true, 
            executedPlan: [],
            timings: { ...(msg.timings || { start: Date.now() }), executionStart: Date.now() }
        } : msg
    ));
    
    const allSteps: ExecutedStep[] = [];
    for (const step of plan) {
        const stepStartTime = Date.now();
        let stepResult: { status: 'success' | 'error'; outcome: string };

        try {
            if ('action' in step) { // It's a file operation
                const { action, fileName, content = '' } = step;
                const rootHandle = project.handle;
                
                switch (action) {
                    case 'write':
                        const whandle = await getFileHandle(rootHandle, fileName, true);
                        if(!getOpenFile(fileName)) onOpenFile(fileName, whandle, ''); 
                        await typeContent(fileName, content, '');
                        stepResult = { status: 'success', outcome: `Wrote ${content.length} bytes to ${fileName}` };
                        break;

                    case 'edit':
                         let ehandle: FileSystemFileHandle;
                         let existingContent = '';
                         try {
                           ehandle = await getFileHandle(rootHandle, fileName, false);
                           const fileToRead = await ehandle.getFile();
                           existingContent = await fileToRead.text();
                         } catch (e) {
                           // File doesn't exist, treat it as a write.
                           ehandle = await getFileHandle(rootHandle, fileName, true);
                           existingContent = '';
                         }
                         if(!getOpenFile(fileName)) onOpenFile(fileName, ehandle, existingContent);
                         await typeContent(fileName, content, existingContent);
                         stepResult = { status: 'success', outcome: `Edited ${fileName}` };
                         break;

                    case 'delete':
                        try {
                            const pathParts = fileName.split('/').filter(p => p);
                            const fileToDelete = pathParts.pop();
                            if (!fileToDelete) throw new Error(`Invalid file name for deletion: ${fileName}`);
                            
                            const dirPath = pathParts.join('/');
                            const dirHandle = dirPath ? await getDirectoryHandle(rootHandle, dirPath, false) : rootHandle;
                            await dirHandle.removeEntry(fileToDelete, { recursive: false });
                            stepResult = { status: 'success', outcome: `Deleted ${fileName}` };
                        } catch (e: any) {
                            if (e.name === 'NotFoundError') {
                                stepResult = { status: 'error', outcome: `File not found: ${fileName}` };
                            } else {
                                throw e;
                            }
                        }
                        break;
                    
                    case 'rename':
                        try {
                            const oldHandle = await getFileHandle(rootHandle, fileName);
                            const oldFile = await oldHandle.getFile();
                            const oldContent = await oldFile.text();
                            
                            const newHandle = await getFileHandle(rootHandle, content, true);
                            const writableRename = await newHandle.createWritable();
                            await writableRename.write(oldContent);
                            await writableRename.close();

                            const oldParts = fileName.split('/');
                            const oldName = oldParts.pop()!;
                            const oldDirHandle = await getDirectoryHandle(rootHandle, oldParts.join('/'), false);
                            await oldDirHandle.removeEntry(oldName);
                            stepResult = { status: 'success', outcome: `Renamed ${fileName} to ${content}` };
                        } catch (e: any) {
                            if (e.name === 'NotFoundError') {
                                stepResult = { status: 'error', outcome: `Source file not found: ${fileName}` };
                            } else {
                                throw e;
                            }
                        }
                        break;

                    case 'read':
                        try {
                            const rhandle = await getFileHandle(rootHandle, fileName);
                            const file = await rhandle.getFile();
                            const fileContent = await file.text();
                            const truncatedContent = fileContent.length > 500 ? fileContent.substring(0, 500) + '...' : fileContent;
                            stepResult = { status: 'success', outcome: `Read ${fileName}:\n\n${truncatedContent}` };
                        } catch (e: any) {
                             if (e.name === 'NotFoundError') {
                                stepResult = { status: 'error', outcome: `File not found: ${fileName}` };
                            } else {
                                throw e;
                            }
                        }
                        break;

                    default:
                        stepResult = { status: 'error', outcome: `Unsupported file action: ${action}` };
                }
            } else { // It's a command operation
                 const { command } = step;
                if (command.startsWith('npm install')) {
                    const packageName = command.split('install')[1].trim();
                    try {
                        const pkgHandle = await getFileHandle(project.handle, 'package.json');
                        const pkgFile = await pkgHandle.getFile();
                        const pkgContent = await pkgFile.text();
                        const pkgJson = JSON.parse(pkgContent);
                        
                        pkgJson.dependencies = pkgJson.dependencies || {};
                        // A simple version matcher, can be improved.
                        // For now, let's just add the latest. A more robust solution might query npm.
                        pkgJson.dependencies[packageName] = 'latest'; 

                        const newPkgContent = JSON.stringify(pkgJson, null, 2);
                        
                        const writable = await pkgHandle.createWritable();
                        await writable.write(newPkgContent);
                        await writable.close();
                        
                        onOpenFile('package.json', pkgHandle, newPkgContent);
                        stepResult = { status: 'success', outcome: `Successfully added ${packageName} to dependencies.` };
                    } catch (e: any) {
                        stepResult = { status: 'error', outcome: `Failed to update package.json: ${e.message}` };
                    }
                } else {
                    stepResult = { status: 'success', outcome: `(Emulated) ${step.expectedOutcome}` };
                }
            }
        } catch (error: any) {
            console.error(`Execution failed for step:`, step, error);
            stepResult = { status: 'error', outcome: error.message };
        }
        
        await refreshFileTree();

        const executedStep: ExecutedStep = {
            ...step,
            startTime: stepStartTime,
            endTime: Date.now(),
            ...stepResult,
        };
        
        allSteps.push(executedStep);

        setMessages(prev => prev.map((msg, idx) => {
            if (idx === messageIndex) {
                return { ...msg, executedPlan: allSteps };
            }
            return msg;
        }));

        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    setMessages(prev => prev.map((msg, idx) => {
        if (idx === messageIndex) {
            const executionEndTime = Date.now();
            return {
                ...msg,
                isExecuting: false,
                summaryComplete: true, 
                timings: {
                    ...(msg.timings || { start: Date.now() }),
                    executionEnd: executionEndTime,
                    summaryEnd: Date.now()
                }
            };
        }
        return msg;
    }));
    
    setAgentState("idle");
    await refreshFileTree();
  }, [project, refreshFileTree, onOpenFile, onFileContentChange, getFileHandle, getDirectoryHandle, typeContent, getOpenFile]);

  const agenticFlowWithRetry = useCallback(async (promptText: string, imageDataUri?: string): Promise<AgenticFlowOutput> => {
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
        const result = await agenticFlow({ prompt: promptText, apiKey: currentKey.key, imageDataUri });
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
    if (!promptText.trim() && !uploadedFile || agentState !== 'idle') return;
    
    if (!project) {
        setInput("Please open a folder first to provide a context for your project.");
        return;
    }
    
    const startTime = Date.now();

    const userMessage: Message = { 
      role: "user", 
      content: promptText,
      uploadedFile: uploadedFile || undefined,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setUploadedFile(null);

    setAgentState("thinking");
    setThinkingTime(0);
    thinkingTimerRef.current = setInterval(() => {
        setThinkingTime(prev => prev + 1);
    }, 1000);

    try {
      const result = await agenticFlowWithRetry(promptText, uploadedFile?.dataUri);
      
      clearInterval(thinkingTimerRef.current);
      const thinkingEnd = Date.now();

      const isReadOnlyPlan = result.plan.every(step => 'action' in step && step.action === 'read');
      
      const assistantMessage: Message = { 
          role: "assistant", 
          content: result,
          plan: result.plan,
          executedPlan: [],
          isExecuting: false,
          summaryComplete: false,
          isAwaitingExecution: !isReadOnlyPlan,
          timings: { start: startTime, thinkingEnd }
      };
      
      setMessages((prevMessages) => [...prevMessages, assistantMessage]);

      if (isReadOnlyPlan) {
        // Auto-execute if it's just a read plan
        startExecution(messages.length + 1, result.plan);
      } else {
        setAgentState("awaiting_execution");
      }


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
  }, [agentState, agenticFlowWithRetry, project, uploadedFile, startExecution, messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendPrompt(input);
  };
  
    const handleMicClick = () => {
        if (isRecording) {
            recognitionRef.current?.stop();
            setIsRecording(false);
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast({
                variant: "destructive",
                title: "Speech Recognition Not Supported",
                description: "Your browser does not support the Web Speech API.",
            });
            return;
        }

        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onstart = () => {
            setIsRecording(true);
        };

        recognitionRef.current.onend = () => {
            setIsRecording(false);
        };

        recognitionRef.current.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            setIsRecording(false);
             toast({
                variant: "destructive",
                title: "Speech Recognition Error",
                description: event.error,
            });
        };

        recognitionRef.current.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            setInput(input + finalTranscript + interimTranscript);
        };

        recognitionRef.current.start();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInput(text);

    const match = /@(\S*)$/.exec(text);
    if (match && project?.tree) {
        const query = match[1];
        const allFiles = flattenFileTree(project.tree);
        const results = allFiles.filter(file => file.toLowerCase().includes(query.toLowerCase())).slice(0, 10);
        setFileSearch({ active: true, query, results });
    } else {
        setFileSearch({ active: false, query: "", results: [] });
    }
  };

  const handleFileSelect = (filePath: string) => {
    setInput(prev => {
        const atIndex = prev.lastIndexOf('@');
        return prev.substring(0, atIndex) + `@${filePath} `;
    });
    setFileSearch({ active: false, query: "", results: [] });
    textareaRef.current?.focus();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendPrompt(input);
    }
    
    if (fileSearch.active && fileSearch.results.length > 0 && e.key === 'Tab') {
        e.preventDefault();
        handleFileSelect(fileSearch.results[0]);
    }
  };
  
    const handleFileUpload = (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast({
                variant: "destructive",
                title: "Unsupported File Type",
                description: "Currently, only image files can be uploaded.",
            });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setUploadedFile({
                name: file.name,
                type: file.type,
                dataUri: reader.result as string
            });
        };
        reader.onerror = () => {
             toast({
                variant: "destructive",
                title: "File Read Error",
                description: "Could not read the selected file.",
            });
        }
        reader.readAsDataURL(file);
  }

  const handlePaste = (event: React.ClipboardEvent) => {
    const items = event.clipboardData.items;
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          handleFileUpload(file);
          break;
        }
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleFileUpload(e.dataTransfer.files[0]);
          e.dataTransfer.clearData();
      }
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

  const AgentResponse = ({ message, index }: { message: Message; index: number; }) => {
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

            {message.isAwaitingExecution && (
                <div className="pt-2">
                    <Button onClick={() => startExecution(index, plan)} className="w-full">
                        <Play className="mr-2" />
                        Execute Plan
                    </Button>
                </div>
            )}
            
            {(isExecuting || isDone || executedPlan.length > 0) && (
                <div>
                    <Separator className="my-4" />
                    <h3 className="font-semibold flex items-center gap-2 mb-2"><Play className="w-5 h-5"/> Execution Log</h3>
                     <div className="space-y-2">
                        {executedPlan.map((step, idx) => {
                          const action = 'action' in step ? step.action : 'command';
                          const stepTime = step.endTime - step.startTime;
                          const isSuccess = step.status === 'success';
                          return (
                            <div key={idx} className={`p-3 rounded-md text-sm transition-all duration-300 ${isSuccess ? 'bg-green-500/10 border-green-500' : 'bg-red-500/10 border-red-500'} border-l-4`}>
                              <div className="flex items-center gap-3">
                                {isSuccess ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                                 ) : (
                                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                 )}
                                {renderStepIcon(action)}
                                <span className="font-mono text-xs flex-1 truncate">{ 'fileName' in step ? step.fileName : step.command }</span>
                                <span className="text-xs text-muted-foreground">{formatTime(stepTime)}</span>
                                <Badge variant="outline" className="text-xs capitalize">{action}</Badge>
                              </div>
                              { 'command' in step ? (
                                <CommandOutput command={step.command} outcome={step.outcome} status={step.status} />
                              ) : (
                                <p className="text-xs text-muted-foreground pl-7 mt-1 whitespace-pre-wrap">{step.outcome}</p>
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
                           <span><strong className="text-foreground">{executedPlan.filter(s => s.status === 'success').length}</strong> successful steps</span>
                           <span><strong className="text-foreground">{executedPlan.filter(s => s.status === 'error').length}</strong> errors</span>
                           {timings?.executionEnd && timings.executionStart && (
                             <span>Execution Time: <strong className="text-foreground">{formatTime(timings.executionEnd - timings.executionStart)}</strong></span>
                           )}
                           {timings?.summaryEnd && timings.executionEnd && (
                             <span>Summarizing: <strong className="text-foreground">{formatTime(timings.summaryEnd - timings.executionEnd)}</strong></span>
                           )}
                        </div>
                    </AlertDescription>
                </Alert>
                
                <div className="space-y-2 pt-4">
                    <h4 className="font-semibold text-sm">Next Steps</h4>
                    <div className="flex flex-wrap gap-2">
                        {response.suggestions.map((s,i) => <Button key={i} variant="outline" size="sm" onClick={() => { sendPrompt(s); }}>{s}</Button>)}
                        <Button variant="default" size="sm" onClick={() => handleDownloadPatch(plan)}>
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


  const renderMessageContent = (message: Message, index: number) => {
    if (typeof message.content === 'string') {
        return (
          <div className="flex flex-col items-end">
              <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg max-w-[90%]">
                 {message.uploadedFile && message.uploadedFile.type.startsWith('image/') && (
                     <img 
                        src={message.uploadedFile.dataUri} 
                        alt="uploaded content" 
                        className="rounded-md mb-2 max-w-xs max-h-48"
                     />
                  )}
                 <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.timestamp && <span className="text-xs text-muted-foreground mt-1">{message.timestamp}</span>}
          </div>
        )
    }
    return <AgentResponse message={message} index={index} />;
  };

  const getAgentStatus = () => {
    switch (agentState) {
        case 'thinking': return `Thinking... (${thinkingTime}s)`;
        case 'awaiting_execution': return 'Awaiting execution. Please review the plan.';
        case 'executing': return 'Executing plan...';
        case 'summarizing': return 'Finalizing summary...';
        case 'error': return 'An error occurred.';
        default: return null;
    }
  }

  return (
    <div className="flex flex-col h-full bg-background" onDragOver={handleDragOver} onDrop={handleDrop}>
       <div className="p-2 flex justify-between items-center border-b border-border h-12 shrink-0">
          <span className="text-sm font-semibold truncate pl-2 flex items-center gap-2"><Bot className="w-5 h-5 text-primary" /> AI Assistant</span>
      </div>
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
              <div className={`${message.role === 'user' ? 'max-w-[90%]' : 'w-full'}`}>
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
        <Popover open={fileSearch.active} onOpenChange={(isOpen) => setFileSearch(fs => ({ ...fs, active: isOpen }))}>
          <PopoverTrigger asChild>
            <form onSubmit={handleSubmit} className="relative">
             {uploadedFile && (
                <div className="absolute bottom-full left-0 mb-2 p-2 bg-muted rounded-md w-full">
                    <div className="flex items-center gap-2">
                        {uploadedFile.type.startsWith('image/') ? <ImageIcon className="w-5 h-5" /> : <File className="w-5 h-5" />}
                        <span className="text-sm truncate flex-1">{uploadedFile.name}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setUploadedFile(null)}>
                            <XCircle className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
              )}
              <Textarea
                ref={textareaRef}
                placeholder="Prompt Stacky, or drag & drop an image..."
                className="pr-24 min-h-[60px] resize-none"
                disabled={agentState !== 'idle'}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                onPaste={handlePaste}
              />
              <div className="absolute top-1/2 right-3 -translate-y-1/2 flex items-center gap-1">
                 <input 
                    type="file" 
                    id="file-upload" 
                    className="hidden" 
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                    accept="image/*"
                 />
                 <Button asChild variant="ghost" size="icon" disabled={agentState !== 'idle'}>
                    <label htmlFor="file-upload" className="cursor-pointer">
                        <Paperclip className="w-5 h-5" />
                    </label>
                 </Button>
                 <Button variant="ghost" size="icon" onClick={handleMicClick} disabled={agentState !== 'idle'}>
                    <Mic className={`w-5 h-5 ${isRecording ? 'text-red-500' : ''}`} />
                 </Button>
                 <Button type="submit" size="icon" disabled={agentState !== 'idle' || (!input.trim() && !uploadedFile)}>
                    <Send className="w-5 h-5" />
                 </Button>
              </div>
            </form>
          </PopoverTrigger>
          <PopoverContent 
            className="w-[400px] p-0" 
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <div className="p-2 font-semibold text-sm border-b">Mention a file</div>
            <div className="max-h-60 overflow-y-auto">
              {fileSearch.results.length > 0 ? (
                fileSearch.results.map(file => (
                  <div 
                    key={file} 
                    className="p-2 hover:bg-accent cursor-pointer text-sm"
                    onClick={() => handleFileSelect(file)}
                  >
                    {file}
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">No files found.</div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
