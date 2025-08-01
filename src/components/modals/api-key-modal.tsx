"use client";

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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";

type ApiKeyModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

const apiKeys = [
  {
    name: "Primary OpenAI",
    key: "sk-..lT5e",
    status: "Active",
    retries: 0,
  },
  {
    name: "Backup Anthropic",
    key: "sk-..fG9j",
    status: "Inactive",
    retries: 0,
  },
  {
    name: "Personal Gemini",
    key: "gpk-..kS2a",
    status: "Exceeded",
    retries: 3,
  },
];

export default function ApiKeyModal({ isOpen, onOpenChange }: ApiKeyModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>API Key Manager</DialogTitle>
          <DialogDescription>
            Add, edit, and manage your AI provider API keys.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center space-x-2">
            <Switch id="auto-switch" defaultChecked />
            <Label htmlFor="auto-switch">
              Auto-switch key on quota exceed w/ unlimited retries
            </Label>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((apiKey) => (
                  <TableRow key={apiKey.name}>
                    <TableCell className="font-medium">{apiKey.name}</TableCell>
                    <TableCell className="font-mono">{apiKey.key}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          apiKey.status === "Active"
                            ? "default"
                            : apiKey.status === "Exceeded"
                            ? "destructive"
                            : "secondary"
                        }
                        className={apiKey.status === "Active" ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}
                      >
                        {apiKey.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        <DialogFooter>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add New Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
