"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Plus,
  Search,
  MoreVertical,
  Calendar,
  Edit2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import { tasksApi, type Task } from "@/lib/api";

function formatDueAt(dueAt: string | null): string | null {
  if (!dueAt) return null;
  const date = new Date(dueAt);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86_400_000);
  const taskDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  if (taskDay.getTime() === today.getTime()) return `Today, ${timeStr}`;
  if (taskDay.getTime() === tomorrow.getTime()) return `Tomorrow, ${timeStr}`;
  return (
    date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    `, ${timeStr}`
  );
}

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface TaskFormState {
  title: string;
  notes: string;
  dueAt: string;
}

const emptyForm: TaskFormState = { title: "", notes: "", dueAt: "" };

export default function TasksPage() {
  const router = useRouter();
  const { user, initialized } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "OPEN" | "DONE">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState<TaskFormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!initialized) return;
    if (!user) {
      router.push("/login");
    }
  }, [user, initialized, router]);

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await tasksApi.list();
      setTasks(data);
    } catch {
      setError("Failed to load tasks. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialized && user) {
      loadTasks();
    }
  }, [initialized, user, loadTasks]);

  if (!initialized || !user) return null;

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "all" || task.status === filter;
    return matchesSearch && matchesFilter;
  });

  const openCount = tasks.filter((t) => t.status === "OPEN").length;
  const doneCount = tasks.filter((t) => t.status === "DONE").length;

  async function toggleStatus(task: Task) {
    const newStatus = task.status === "OPEN" ? "DONE" : "OPEN";
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    );
    try {
      const updated = await tasksApi.update(task.id, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch {
      // Revert on failure
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t))
      );
    }
  }

  function openNewDialog() {
    setEditingTask(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEditDialog(task: Task) {
    setEditingTask(task);
    setForm({
      title: task.title,
      notes: task.notes ?? "",
      dueAt: task.dueAt ? toDatetimeLocal(task.dueAt) : "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        notes: form.notes.trim() || undefined,
        dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : undefined,
      };

      if (editingTask) {
        const updated = await tasksApi.update(editingTask.id, payload);
        setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? updated : t)));
      } else {
        const created = await tasksApi.create(payload);
        setTasks((prev) => [created, ...prev]);
      }
      setDialogOpen(false);
    } catch {
      // form stays open — user can retry
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Tasks</h1>
            <p className="text-muted-foreground">
              {openCount} open, {doneCount} done
            </p>
          </div>
          <Button onClick={openNewDialog}>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={filter === "all" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={filter === "OPEN" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setFilter("OPEN")}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Open
                </Button>
                <Button
                  variant={filter === "DONE" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setFilter("DONE")}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Done
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {filter === "all" ? "All Tasks" : filter === "OPEN" ? "Open Tasks" : "Done Tasks"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button variant="outline" size="sm" onClick={loadTasks}>
                  Retry
                </Button>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-foreground">No tasks found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {searchQuery ? "Try a different search term" : "Create a new task to get started"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => {
                  const formattedDue = formatDueAt(task.dueAt);
                  return (
                    <div
                      key={task.id}
                      className="flex items-start justify-between gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-secondary/50"
                    >
                      <div className="flex items-start gap-4">
                        <button
                          type="button"
                          onClick={() => toggleStatus(task)}
                          className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                            task.status === "DONE"
                              ? "border-success bg-success text-success-foreground"
                              : "border-muted-foreground hover:border-foreground"
                          }`}
                          aria-label={task.status === "DONE" ? "Mark as open" : "Mark as done"}
                        >
                          {task.status === "DONE" && <CheckCircle2 className="h-4 w-4" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-medium ${
                              task.status === "DONE"
                                ? "text-muted-foreground line-through"
                                : "text-foreground"
                            }`}
                          >
                            {task.title}
                          </p>
                          {task.notes && (
                            <p className="mt-1 text-sm text-muted-foreground truncate">
                              {task.notes}
                            </p>
                          )}
                          {formattedDue && (
                            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formattedDue}
                            </div>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(task)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleStatus(task)}>
                            {task.status === "DONE" ? (
                              <>
                                <Clock className="mr-2 h-4 w-4" />
                                Mark as Open
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Mark as Done
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New / Edit Task Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Edit Task" : "New Task"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                placeholder="Task title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-notes">Notes</Label>
              <Textarea
                id="task-notes"
                placeholder="Optional notes..."
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-due">Due date</Label>
              <Input
                id="task-due"
                type="datetime-local"
                value={form.dueAt}
                onChange={(e) => setForm((f) => ({ ...f, dueAt: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!form.title.trim() || saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingTask ? "Save changes" : "Create task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
