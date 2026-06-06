"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Activity,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Server,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import { useAuth } from "@/lib/auth-context";

const adminStats = [
  {
    title: "Total Users",
    value: "2,847",
    change: "+12% this month",
    icon: Users,
    color: "text-foreground",
  },
  {
    title: "Active Sessions",
    value: "342",
    change: "Live",
    icon: Activity,
    color: "text-success",
  },
  {
    title: "Tasks Created",
    value: "18,492",
    change: "+23% this week",
    icon: TrendingUp,
    color: "text-foreground",
  },
  {
    title: "System Alerts",
    value: "3",
    change: "Needs attention",
    icon: AlertTriangle,
    color: "text-destructive",
  },
];

const recentActivity = [
  {
    id: 1,
    action: "New user registration",
    user: "anna.schmidt@example.com",
    time: "2 minutes ago",
    type: "user",
  },
  {
    id: 2,
    action: "Password reset requested",
    user: "max.mueller@example.com",
    time: "15 minutes ago",
    type: "security",
  },
  {
    id: 3,
    action: "Subscription upgraded",
    user: "tech-gmbh@example.com",
    time: "1 hour ago",
    type: "billing",
  },
  {
    id: 4,
    action: "Account deactivated",
    user: "old-user@example.com",
    time: "3 hours ago",
    type: "user",
  },
  {
    id: 5,
    action: "API rate limit warning",
    user: "enterprise-client@example.com",
    time: "5 hours ago",
    type: "system",
  },
];

const systemHealth = [
  { name: "API Server", status: "operational", uptime: "99.99%" },
  { name: "Database", status: "operational", uptime: "99.97%" },
  { name: "Authentication", status: "operational", uptime: "100%" },
  { name: "Task Processor", status: "degraded", uptime: "98.5%" },
];

export default function AdminPage() {
  const router = useRouter();
  const { user, initialized } = useAuth();

  useEffect(() => {
    if (!initialized) return;
    if (!user) {
      router.push("/login");
    } else if (user.role !== "admin") {
      router.push("/dashboard");
    }
  }, [user, initialized, router]);

  if (!initialized || !user || user.role !== "admin") {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor system health and manage users.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {adminStats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="mt-1 text-2xl font-bold text-foreground">
                      {stat.value}
                    </p>
                    <p className={`mt-1 text-xs ${stat.color === "text-destructive" ? "text-destructive" : stat.color === "text-success" ? "text-success" : "text-muted-foreground"}`}>
                      {stat.change}
                    </p>
                  </div>
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full ${
                      stat.color === "text-destructive"
                        ? "bg-destructive/10"
                        : stat.color === "text-success"
                          ? "bg-success/10"
                          : "bg-secondary"
                    }`}
                  >
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <Button variant="ghost" size="sm">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 rounded-lg p-2 transition-colors hover:bg-secondary/50"
                  >
                    <div
                      className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full ${
                        activity.type === "user"
                          ? "bg-foreground/10"
                          : activity.type === "security"
                            ? "bg-destructive/10"
                            : activity.type === "billing"
                              ? "bg-success/10"
                              : "bg-secondary"
                      }`}
                    >
                      {activity.type === "user" && (
                        <Users className="h-4 w-4 text-foreground" />
                      )}
                      {activity.type === "security" && (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                      {activity.type === "billing" && (
                        <TrendingUp className="h-4 w-4 text-success" />
                      )}
                      {activity.type === "system" && (
                        <Server className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {activity.action}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.user}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemHealth.map((service) => (
                  <div
                    key={service.name}
                    className="flex items-center justify-between rounded-lg border border-border p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-3 w-3 rounded-full ${
                          service.status === "operational"
                            ? "bg-success"
                            : "bg-yellow-500"
                        }`}
                      />
                      <div>
                        <p className="font-medium text-foreground">
                          {service.name}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {service.status}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {service.uptime}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => router.push("/admin/users")}>
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Button>
              <Button variant="outline">
                <Activity className="mr-2 h-4 w-4" />
                View Logs
              </Button>
              <Button variant="outline">
                <Server className="mr-2 h-4 w-4" />
                System Settings
              </Button>
              <Button variant="outline">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Run Health Check
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
