"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Calendar,
  Trash2,
  Edit2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import { useAuth } from "@/lib/auth-context";

interface Task {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  status: "pending" | "completed";
  priority: "low" | "medium" | "high";
}

const initialTasks: Task[] = [
  {
    id: 1,
    title: "Follow up Müller GmbH",
    description: "Send follow-up email regarding the proposal",
    dueDate: "Today, 2:00 PM",
    status: "pending",
    priority: "high",
  },
  {
    id: 2,
    title: "Review quarterly report",
    description: "Review and provide feedback on Q4 report",
    dueDate: "Tomorrow, 10:00 AM",
    status: "pending",
    priority: "medium",
  },
  {
    id: 3,
    title: "Call with marketing team",
    description: "Discuss upcoming campaign strategies",
    dueDate: "Jan 25, 3:00 PM",
    status: "completed",
    priority: "medium",
  },
  {
    id: 4,
    title: "Send proposal to Schmidt AG",
    description: "Finalize and send the service proposal",
    dueDate: "Jan 23, 11:00 AM",
    status: "completed",
    priority: "high",
  },
  {
    id: 5,
    title: "Update project documentation",
    description: "Update the technical documentation for new features",
    dueDate: "Jan 26, 5:00 PM",
    status: "pending",
    priority: "low",
  },
];

export default function TasksPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  if (!user) return null;

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter =
      filter === "all" || task.status === filter;
    return matchesSearch && matchesFilter;
  });

  const toggleTaskStatus = (taskId: number) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: task.status === "pending" ? "completed" : "pending",
            }
          : task
      )
    );
  };

  const deleteTask = (taskId: number) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive/10 text-destructive";
      case "medium":
        return "bg-yellow-500/10 text-yellow-600";
      case "low":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Tasks</h1>
            <p className="text-muted-foreground">
              {pendingCount} pending, {completedCount} completed
            </p>
          </div>
          <Button>
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
                  variant={filter === "pending" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setFilter("pending")}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Pending
                </Button>
                <Button
                  variant={filter === "completed" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setFilter("completed")}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Completed
                </Button>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {filter === "all"
                ? "All Tasks"
                : filter === "pending"
                  ? "Pending Tasks"
                  : "Completed Tasks"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-foreground">
                  No tasks found
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {searchQuery
                    ? "Try a different search term"
                    : "Create a new task to get started"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start justify-between gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-secondary/50"
                  >
                    <div className="flex items-start gap-4">
                      <button
                        type="button"
                        onClick={() => toggleTaskStatus(task.id)}
                        className={`mt-1 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                          task.status === "completed"
                            ? "border-success bg-success text-success-foreground"
                            : "border-muted-foreground hover:border-foreground"
                        }`}
                      >
                        {task.status === "completed" && (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p
                            className={`font-medium ${
                              task.status === "completed"
                                ? "text-muted-foreground line-through"
                                : "text-foreground"
                            }`}
                          >
                            {task.title}
                          </p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${getPriorityColor(task.priority)}`}
                          >
                            {task.priority}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {task.description}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {task.dueDate}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit2 className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteTask(task.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
