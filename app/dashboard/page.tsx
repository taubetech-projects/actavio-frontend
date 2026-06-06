"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Calendar,
  ArrowRight,
  Plus,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import { tasksApi, type Task } from "@/lib/api";
import Link from "next/link";

export default function DashboardPage() {
  const { user, initialized } = useAuth();
  const router = useRouter();
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  useEffect(() => {
    if (!initialized) return;
    if (!user) {
      router.push("/login");
    } else if (!user.onboardingCompleted) {
      router.push("/onboarding");
    }
  }, [user, initialized, router]);

  useEffect(() => {
    if (!initialized || !user?.onboardingCompleted) return;
    tasksApi
      .list()
      .then((data) => setRecentTasks(data.slice(0, 4)))
      .catch(() => undefined)
      .finally(() => setTasksLoading(false));
  }, [initialized, user]);

  if (!initialized || !user || !user.onboardingCompleted) {
    return null;
  }

  const openCount = recentTasks.filter((t) => t.status === "OPEN").length;
  const doneCount = recentTasks.filter((t) => t.status === "DONE").length;

  const stats = [
    {
      title: "Tasks Done",
      value: String(doneCount),
      change: "from recent tasks",
      icon: CheckCircle2,
    },
    {
      title: "Open Tasks",
      value: String(openCount),
      change: "need attention",
      icon: Clock,
    },
    {
      title: "Upcoming Events",
      value: "—",
      change: "Next 7 days",
      icon: Calendar,
    },
    {
      title: "Productivity Score",
      value: "—",
      change: "coming soon",
      icon: TrendingUp,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back, {user.name?.split(" ")[0]}
            </h1>
            <p className="text-muted-foreground">
              {"Here's what's happening with your tasks today."}
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/tasks">
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{stat.change}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                    <stat.icon className="h-6 w-6 text-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Tasks</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/tasks">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : recentTasks.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No tasks yet.{" "}
                <Link href="/dashboard/tasks" className="font-medium text-foreground hover:underline">
                  Create your first task.
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-secondary/50"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          task.status === "DONE" ? "bg-success/10" : "bg-secondary"
                        }`}
                      >
                        {task.status === "DONE" ? (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        ) : (
                          <Clock className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p
                          className={`font-medium ${
                            task.status === "DONE"
                              ? "text-muted-foreground line-through"
                              : "text-foreground"
                          }`}
                        >
                          {task.title}
                        </p>
                        {task.dueAt && (
                          <p className="text-sm text-muted-foreground">
                            {new Date(task.dueAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/dashboard/tasks">View</Link>
                    </Button>
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
