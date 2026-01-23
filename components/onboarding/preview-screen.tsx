"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, X, ChevronDown, ChevronUp, FileText, Calendar, Bell } from "lucide-react";
import Logo from "@/components/logo";
import type { TaskData } from "@/app/onboarding/page";
import { cn } from "@/lib/utils";

interface PreviewScreenProps {
  taskData: TaskData;
  onConfirm: () => void;
  onEdit: (data: TaskData) => void;
}

export default function PreviewScreen({
  taskData,
  onConfirm,
  onEdit,
}: PreviewScreenProps) {
  const [showExplain, setShowExplain] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editData, setEditData] = useState(taskData);

  const handleSaveEdit = () => {
    onEdit(editData);
    setShowEdit(false);
  };

  const actions = [
    {
      icon: FileText,
      title: "Create task",
      subtitle: `"${taskData.taskTitle}"`,
      detail: `Due: ${taskData.dueDate}`,
    },
    {
      icon: Bell,
      title: "Create calendar reminder",
      subtitle: `${taskData.reminderMinutes} minutes`,
      detail: null,
    },
    {
      icon: Calendar,
      title: "Draft follow-up email",
      subtitle: "(not sent)",
      detail: null,
      conditional: taskData.emailDraftEnabled,
    },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <Logo />
        </div>

        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl text-balance">
            We will do the following:
          </h2>
        </div>

        {/* Action List */}
        <div className="space-y-3">
          {actions
            .filter((action) => action.conditional !== false)
            .map((action, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success/10 flex-shrink-0 mt-0.5">
                  <Check className="h-3.5 w-3.5 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <action.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">{action.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{action.subtitle}</p>
                  {action.detail && (
                    <p className="text-sm text-muted-foreground">{action.detail}</p>
                  )}
                </div>
              </div>
            ))}
        </div>

        {/* Main Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={onConfirm}
            size="lg"
            className="flex-1 h-12 text-base font-medium"
          >
            Confirm
          </Button>
          <Button
            onClick={() => setShowEdit(!showEdit)}
            variant="outline"
            size="lg"
            className="h-12 px-6 text-base font-medium"
          >
            Edit
          </Button>
        </div>

        {/* Edit Section */}
        {showEdit && (
          <div className="space-y-4 p-4 rounded-xl border border-border bg-card animate-in fade-in slide-in-from-top-2 duration-200">
            <h3 className="font-medium text-foreground">Edit action</h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due date</Label>
                <Select
                  value={editData.dueDate}
                  onValueChange={(value) =>
                    setEditData({ ...editData, dueDate: value })
                  }
                >
                  <SelectTrigger id="dueDate">
                    <SelectValue placeholder="Select date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tue, 24 Jan">Tue, 24 Jan</SelectItem>
                    <SelectItem value="Wed, 25 Jan">Wed, 25 Jan</SelectItem>
                    <SelectItem value="Thu, 26 Jan">Thu, 26 Jan</SelectItem>
                    <SelectItem value="Fri, 27 Jan">Fri, 27 Jan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminder">Reminder</Label>
                <Select
                  value={String(editData.reminderMinutes)}
                  onValueChange={(value) =>
                    setEditData({ ...editData, reminderMinutes: Number(value) })
                  }
                >
                  <SelectTrigger id="reminder">
                    <SelectValue placeholder="Select reminder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 min</SelectItem>
                    <SelectItem value="10">10 min</SelectItem>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="emailDraft">Email draft</Label>
                <Switch
                  id="emailDraft"
                  checked={editData.emailDraftEnabled}
                  onCheckedChange={(checked) =>
                    setEditData({ ...editData, emailDraftEnabled: checked })
                  }
                />
              </div>
            </div>

            <Button onClick={handleSaveEdit} className="w-full">
              Save changes
            </Button>
          </div>
        )}

        {/* Why This Section */}
        <div className="pt-2">
          <button
            onClick={() => setShowExplain(!showExplain)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
          >
            {showExplain ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            Why this?
          </button>
        </div>

        {/* Explainability Section */}
        {showExplain && (
          <div className="space-y-6 p-5 rounded-xl border border-border bg-card animate-in fade-in slide-in-from-top-2 duration-200">
            <div>
              <h4 className="font-medium text-foreground mb-2">We understood that:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                  You want to follow up
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                  The client is Müller GmbH
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                  The timing is next Tuesday
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-2">Based on your words:</h4>
              <div className="flex flex-wrap gap-2">
                {["follow up", "Müller GmbH", "next Tuesday"].map((word) => (
                  <span
                    key={word}
                    className="px-2.5 py-1 text-xs rounded-full bg-muted text-muted-foreground"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-2">Defaults used:</h4>
              <p className="text-sm text-muted-foreground">
                Reminder duration: {taskData.reminderMinutes} minutes
              </p>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-2">We will NOT:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <X className="h-3 w-3 text-destructive" />
                  Send emails automatically
                </li>
                <li className="flex items-center gap-2">
                  <X className="h-3 w-3 text-destructive" />
                  Update CRM data
                </li>
                <li className="flex items-center gap-2">
                  <X className="h-3 w-3 text-destructive" />
                  Share your data
                </li>
              </ul>
            </div>

            <div className="pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Confidence:</span>
                <span className="text-sm font-medium text-success">
                  High (clear instruction)
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setShowExplain(false)}
              className="w-full"
            >
              Back to preview
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
