"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2 } from "lucide-react";

type ApiKeyModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

type ApiKey = {
  id: string;
  name: string;
  key: string;
};

export default function ApiKeyModal({ isOpen, onOpenChange }: ApiKeyModalProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null);

  useEffect(() => {
    if (isOpen) {
      try {
        const savedKeys = localStorage.getItem("geminiApiKeys");
        if (savedKeys) {
          setApiKeys(JSON.parse(savedKeys));
        }
      } catch (error) {
        console.error("Failed to load API keys from localStorage", error);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    try {
      localStorage.setItem("geminiApiKeys", JSON.stringify(apiKeys));
    } catch (error) {
      console.error("Failed to save API keys to localStorage", error);
    }
  }, [apiKeys]);
  
  const handleAddOrUpdateKey = () => {
    if (editingKey) {
      // Update existing key
      setApiKeys(apiKeys.map(k => k.id === editingKey.id ? { ...k, name: newKeyName, key: newKeyValue } : k));
      setEditingKey(null);
    } else {
      // Add new key
      const newKey: ApiKey = {
        id: crypto.randomUUID(),
        name: newKeyName,
        key: newKeyValue,
      };
      setApiKeys([...apiKeys, newKey]);
    }
    setNewKeyName("");
    setNewKeyValue("");
  };

  const handleEdit = (key: ApiKey) => {
    setEditingKey(key);
    setNewKeyName(key.name);
    setNewKeyValue(key.key);
  };
  
  const handleDelete = (id: string) => {
    setApiKeys(apiKeys.filter(k => k.id !== id));
  };
  
  const handleCancelEdit = () => {
    setEditingKey(null);
    setNewKeyName("");
    setNewKeyValue("");
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key;
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Gemini API Key Manager</DialogTitle>
          <DialogDescription>
            Add, edit, and manage your Gemini API keys. Keys are stored locally in your browser.
          </DialogDescription>
        </DialogHeader>
        
        <div className="rounded-md border mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((apiKey) => (
                  <TableRow key={apiKey.id}>
                    <TableCell className="font-medium">{apiKey.name}</TableCell>
                    <TableCell className="font-mono">{maskApiKey(apiKey.key)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(apiKey)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(apiKey.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                 {apiKeys.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">No API keys added yet.</TableCell>
                    </TableRow>
                 )}
              </TableBody>
            </Table>
        </div>

        <div className="grid gap-4 py-4">
            <h3 className="font-semibold text-lg">{editingKey ? 'Edit API Key' : 'Add New API Key'}</h3>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="key-name" className="text-right">Name</Label>
                <Input id="key-name" value={newKeyName} onChange={e => setNewKeyName(e.target.value)} className="col-span-3" placeholder="e.g., Personal Key" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="key-value" className="text-right">API Key</Label>
                <Input id="key-value" value={newKeyValue} onChange={e => setNewKeyValue(e.target.value)} className="col-span-3" placeholder="Enter your Gemini API key" />
            </div>
        </div>

        <DialogFooter>
          {editingKey && <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>}
          <Button onClick={handleAddOrUpdateKey} disabled={!newKeyName.trim() || !newKeyValue.trim()}>
            {editingKey ? 'Update Key' : <><Plus className="mr-2 h-4 w-4" /> Add Key</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
