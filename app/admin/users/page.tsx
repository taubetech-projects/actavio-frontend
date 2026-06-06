"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  MoreVertical,
  Mail,
  Shield,
  ShieldOff,
  Trash2,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import { invitesApi, type TenantRole, type InviteResponse } from "@/lib/api";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  status: "active" | "suspended" | "pending";
  emailVerified: boolean;
  createdAt: string;
  lastLogin: string;
}

const mockUsers: AdminUser[] = [
  {
    id: "1",
    name: "Max Mustermann",
    email: "demo@taskflow.com",
    role: "user",
    status: "active",
    emailVerified: true,
    createdAt: "Jan 1, 2024",
    lastLogin: "Today",
  },
  {
    id: "2",
    name: "Admin User",
    email: "admin@taskflow.com",
    role: "admin",
    status: "active",
    emailVerified: true,
    createdAt: "Jan 1, 2024",
    lastLogin: "Today",
  },
  {
    id: "3",
    name: "Anna Schmidt",
    email: "anna.schmidt@example.com",
    role: "user",
    status: "active",
    emailVerified: true,
    createdAt: "Jan 15, 2024",
    lastLogin: "Yesterday",
  },
  {
    id: "4",
    name: "Thomas Weber",
    email: "t.weber@example.com",
    role: "user",
    status: "suspended",
    emailVerified: true,
    createdAt: "Dec 10, 2023",
    lastLogin: "Jan 5, 2024",
  },
  {
    id: "5",
    name: "Sarah Meyer",
    email: "sarah.m@example.com",
    role: "user",
    status: "pending",
    emailVerified: false,
    createdAt: "Jan 20, 2024",
    lastLogin: "Never",
  },
  {
    id: "6",
    name: "Klaus Fischer",
    email: "klaus.f@example.com",
    role: "user",
    status: "active",
    emailVerified: true,
    createdAt: "Nov 28, 2023",
    lastLogin: "3 days ago",
  },
];

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, initialized } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>(mockUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended" | "pending">("all");

  // Invite state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState<{ email: string; role: TenantRole }>({ email: "", role: "TENANT_MEMBER" });
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteResult, setInviteResult] = useState<InviteResponse | null>(null);
  const [copied, setCopied] = useState(false);

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

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      statusFilter === "all" || u.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const toggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              status: u.status === "active" ? "suspended" : "active",
            }
          : u
      )
    );
  };

  const toggleUserRole = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              role: u.role === "admin" ? "user" : "admin",
            }
          : u
      )
    );
  };

  const deleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success/10 text-success";
      case "suspended":
        return "bg-destructive/10 text-destructive";
      case "pending":
        return "bg-yellow-500/10 text-yellow-600";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  async function handleInvite() {
    setInviteError("");
    setInviting(true);
    try {
      const result = await invitesApi.create({ email: inviteForm.email, role: inviteForm.role });
      setInviteResult(result);
    } catch (err: unknown) {
      setInviteError(err instanceof Error ? err.message : "Failed to create invite.");
    } finally {
      setInviting(false);
    }
  }

  function copyInviteUrl() {
    if (!inviteResult) return;
    navigator.clipboard.writeText(inviteResult.inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function closeInviteDialog() {
    setInviteDialogOpen(false);
    setInviteResult(null);
    setInviteError("");
    setInviteForm({ email: "", role: "TENANT_MEMBER" });
    setCopied(false);
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Manage Users</h1>
            <p className="text-muted-foreground">
              {filteredUsers.length} users found
            </p>
          </div>
          <Button onClick={() => setInviteDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite User
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={statusFilter === "all" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setStatusFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === "active" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setStatusFilter("active")}
                >
                  Active
                </Button>
                <Button
                  variant={statusFilter === "suspended" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setStatusFilter("suspended")}
                >
                  Suspended
                </Button>
                <Button
                  variant={statusFilter === "pending" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setStatusFilter("pending")}
                >
                  Pending
                </Button>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-sm font-medium text-background">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {u.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize ${getStatusBadge(u.status)}`}
                        >
                          {u.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium capitalize ${
                            u.role === "admin"
                              ? "bg-foreground/10 text-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {u.role === "admin" && (
                            <Shield className="h-3 w-3" />
                          )}
                          {u.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        {u.emailVerified ? (
                          <UserCheck className="h-5 w-5 text-success" />
                        ) : (
                          <UserX className="h-5 w-5 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {u.createdAt}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {u.lastLogin}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Mail className="mr-2 h-4 w-4" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => toggleUserRole(u.id)}
                            >
                              {u.role === "admin" ? (
                                <>
                                  <ShieldOff className="mr-2 h-4 w-4" />
                                  Remove Admin
                                </>
                              ) : (
                                <>
                                  <Shield className="mr-2 h-4 w-4" />
                                  Make Admin
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => toggleUserStatus(u.id)}
                            >
                              {u.status === "active" ? (
                                <>
                                  <UserX className="mr-2 h-4 w-4" />
                                  Suspend User
                                </>
                              ) : (
                                <>
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Activate User
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => deleteUser(u.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">
                Showing 1-{filteredUsers.length} of {filteredUsers.length} users
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" disabled>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" disabled>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invite User Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={(open) => { if (!open) closeInviteDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite a team member</DialogTitle>
            <DialogDescription>
              Send an invitation link to add someone to your workspace.
            </DialogDescription>
          </DialogHeader>

          {inviteResult ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-success/30 bg-success/10 p-4">
                <p className="text-sm font-medium text-foreground mb-1">Invite created!</p>
                <p className="text-xs text-muted-foreground">
                  Send this link to <strong>{inviteResult.email}</strong>. It expires at{" "}
                  {new Date(inviteResult.expiresAt).toLocaleString()}.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Invite link</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={inviteResult.inviteUrl}
                    className="font-mono text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={copyInviteUrl}
                    aria-label="Copy invite link"
                  >
                    {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={closeInviteDialog}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              {inviteError && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  {inviteError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Role</Label>
                <Select
                  value={inviteForm.role}
                  onValueChange={(v) => setInviteForm((f) => ({ ...f, role: v as TenantRole }))}
                >
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TENANT_MEMBER">Member</SelectItem>
                    <SelectItem value="TENANT_ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeInviteDialog} disabled={inviting}>
                  Cancel
                </Button>
                <Button
                  onClick={handleInvite}
                  disabled={inviting || !inviteForm.email}
                >
                  {inviting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending…</>
                  ) : (
                    "Send invite"
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
