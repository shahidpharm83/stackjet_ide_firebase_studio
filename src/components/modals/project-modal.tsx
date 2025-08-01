
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Folder, History, Plus, Briefcase, FolderOpen } from "lucide-react";
import useRecentProjects from "@/hooks/use-recent-projects";
import { ScrollArea } from "../ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

type ProjectModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  openProject: (handle: FileSystemDirectoryHandle) => void;
};

export default function ProjectModal({ isOpen, onOpenChange, openProject }: ProjectModalProps) {
  const [newProjectName, setNewProjectName] = useState("");
  const { recentProjects, addRecentProject } = useRecentProjects();
  const { toast } = useToast();

  const handleCreateNewProject = async () => {
    if (!newProjectName.trim()) {
      toast({
        variant: "destructive",
        title: "Project Name Required",
        description: "Please enter a name for your new project.",
      });
      return;
    }
    
    try {
      if ('showDirectoryPicker' in window) {
        // This opens a picker to select a PARENT directory for the new project
        const parentDirHandle = await (window as any).showDirectoryPicker({
            id: 'new-project-location',
            mode: 'readwrite',
            startIn: 'desktop'
        });
        // Then we create the new project directory inside the selected parent
        const newProjectHandle = await parentDirHandle.getDirectoryHandle(newProjectName, { create: true });
        
        // Create a default package.json
        const packageJsonHandle = await newProjectHandle.getFileHandle('package.json', { create: true });
        const writable = await packageJsonHandle.createWritable();
        await writable.write(JSON.stringify({
            name: newProjectName.toLowerCase().replace(/\s+/g, '-'),
            version: "0.1.0",
            private: true,
            scripts: {
                dev: "next dev",
                build: "next build",
                start: "next start",
                lint: "next lint"
            },
            dependencies: {
                 "react": "^18",
                 "react-dom": "^18",
                 "next": "15.3.3"
            }
        }, null, 2));
        await writable.close();

        // Create a basic README
        const readmeHandle = await newProjectHandle.getFileHandle('README.md', { create: true });
        const readmeWritable = await readmeHandle.createWritable();
        await readmeWritable.write(`# ${newProjectName}\n\nWelcome to your new project!`);
        await readmeWritable.close();

        openProject(newProjectHandle);
        addRecentProject(newProjectHandle);
        onOpenChange(false);
      } else {
        alert('Your browser does not support the File System Access API.');
      }
    } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error("Error creating new project:", error);
           toast({
            variant: "destructive",
            title: "Creation Failed",
            description: error.message,
          });
        }
    }
  };

  const handleOpenRecent = async (handle: FileSystemDirectoryHandle) => {
    try {
        const permission = await handle.queryPermission({ mode: 'readwrite' });
        if (permission === 'granted') {
            openProject(handle);
            onOpenChange(false);
        } else {
            const request = await handle.requestPermission({ mode: 'readwrite' });
            if (request === 'granted') {
                openProject(handle);
                onOpenChange(false);
            } else {
                toast({
                    variant: "destructive",
                    title: "Permission Denied",
                    description: "Cannot open the project without file system permissions.",
                });
            }
        }
    } catch (error: any) {
        console.error("Error opening recent project:", error);
        toast({
            variant: "destructive",
            title: "Failed to Open",
            description: `Could not open project: ${error.message}`,
        });
    }
  }

  const handleOpenFolder = async () => {
    try {
        const handle = await (window as any).showDirectoryPicker({mode: 'readwrite'});
        openProject(handle);
        addRecentProject(handle);
        onOpenChange(false);
    } catch (error: any) {
        if (error.name !== 'AbortError') {
            console.error("Error opening folder:", error);
            toast({ variant: 'destructive', title: 'Error opening folder', description: error.message });
        }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Projects</DialogTitle>
          <DialogDescription>
            Create a new project or open a recent one.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="recent" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recent"><History className="mr-2" /> Recent Projects</TabsTrigger>
            <TabsTrigger value="new"><Plus className="mr-2" />New Project</TabsTrigger>
            <TabsTrigger value="open"><Folder className="mr-2" /> Open Folder</TabsTrigger>
          </TabsList>
          <TabsContent value="recent" className="mt-4">
             <ScrollArea className="h-72">
                <div className="pr-4">
                  {recentProjects.length > 0 ? (
                    <div className="space-y-2">
                        {recentProjects.map((proj, index) => (
                           <div key={index} className="flex items-center justify-between p-2 rounded-md border hover:bg-muted">
                               <div className="flex items-center gap-3">
                                <Briefcase className="w-5 h-5 text-primary"/>
                                <div>
                                    <p className="font-semibold">{proj.name}</p>
                                    <p className="text-xs text-muted-foreground">A recently opened project</p>
                                </div>
                               </div>
                               <Button size="sm" onClick={() => handleOpenRecent(proj.handle)}>Open</Button>
                           </div>
                        ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-8">
                        <History className="w-12 h-12 mb-4" />
                        <h3 className="font-semibold">No Recent Projects</h3>
                        <p className="text-sm">Your recently opened folders will appear here.</p>
                    </div>
                  )}
                </div>
             </ScrollArea>
          </TabsContent>
          <TabsContent value="new" className="mt-4">
            <div className="space-y-4 py-4 h-72">
                <p className="text-sm text-muted-foreground">
                    This will create a new folder on your local machine. You will be prompted to select a parent directory to save it in.
                </p>
                <div className="space-y-2">
                    <Label htmlFor="project-name">Project Name</Label>
                    <Input 
                        id="project-name" 
                        placeholder="e.g., my-awesome-app"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                    />
                </div>
            </div>
             <DialogFooter>
                <Button onClick={handleCreateNewProject}>
                    <Folder className="mr-2" />
                    Create and Open Project
                </Button>
             </DialogFooter>
          </TabsContent>
          <TabsContent value="open" className="mt-4">
            <div className="flex flex-col items-center justify-center h-72 text-muted-foreground text-center p-8">
                <Folder className="w-12 h-12 mb-4 text-primary" />
                <h3 className="font-semibold">Open an Existing Folder</h3>
                <p className="text-sm max-w-sm mx-auto">Select a folder on your computer to open it as a project in the IDE. Your files and folders will appear in the explorer.</p>
                <Button onClick={handleOpenFolder} className="mt-4">
                    <FolderOpen className="mr-2"/>
                    Choose Folder
                </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
