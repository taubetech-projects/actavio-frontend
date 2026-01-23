"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Calendar,
  ArrowRight,
  Plus,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import { useAuth } from "@/lib/auth-context";

const recentTasks = [
  {
    id: 1,
    title: "Follow up Müller GmbH",
    dueDate: "Today, 2:00 PM",
    status: "pending",
  },
  {
    id: 2,
    title: "Review quarterly report",
    dueDate: "Tomorrow, 10:00 AM",
    status: "pending",
  },
  {
    id: 3,
    title: "Call with marketing team",
    dueDate: "Jan 25, 3:00 PM",
    status: "completed",
  },
  {
    id: 4,
    title: "Send proposal to Schmidt AG",
    dueDate: "Jan 23, 11:00 AM",
    status: "completed",
  },
];

const stats = [
  {
    title: "Tasks Completed",
    value: "12",
    change: "+3 this week",
    icon: CheckCircle2,
  },
  { title: "Pending Tasks", value: "5", change: "2 due today", icon: Clock },
  {
    title: "Upcoming Events",
    value: "8",
    change: "Next 7 days",
    icon: Calendar,
  },
  {
    title: "Productivity Score",
    value: "87%",
    change: "+5% vs last week",
    icon: TrendingUp,
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else if (!user.onboardingCompleted) {
      router.push("/onboarding");
    }
  }, [user, router]);

  if (!user || !user.onboardingCompleted) {
    return null;
  }

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
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Task
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
                    <p className="mt-1 text-2xl font-bold text-foreground">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {stat.change}
                    </p>
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
            <Button variant="ghost" size="sm">
              View all
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-secondary/50"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        task.status === "completed"
                          ? "bg-success/10"
                          : "bg-secondary"
                      }`}
                    >
                      {task.status === "completed" ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : (
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p
                        className={`font-medium ${
                          task.status === "completed"
                            ? "text-muted-foreground line-through"
                            : "text-foreground"
                        }`}
                      >
                        {task.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {task.dueDate}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
