"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  MoreVertical,
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
import {
  membersApi,
  invitesApi,
  type MemberResponse,
  type TenantRole,
  type InviteResponse,
} from "@/lib/api";

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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function fromMember(m: MemberResponse): AdminUser {
  return {
    id: m.userId,
    name: m.name,
    email: m.email,
    role: m.role === "TENANT_ADMIN" ? "admin" : "user",
    status:
      m.status === "ACTIVE"
        ? "active"
        : m.status === "SUSPENDED"
        ? "suspended"
        : "pending",
    emailVerified: m.emailVerified,
    createdAt: formatDate(m.joinedAt),
    lastLogin: m.lastLoginAt ? formatDate(m.lastLoginAt) : "Never",
  };
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, initialized } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [operating, setOperating] = useState(false);
  const [opError, setOpError] = useState("");

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

  const loadMembers = useCallback(async () => {
    setIsLoading(true);
    setFetchError("");
    try {
      const members = await membersApi.list();
      setUsers(members.map(fromMember));
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : "Failed to load members.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialized && user?.role === "admin") {
      loadMembers();
    }
  }, [initialized, user, loadMembers]);

  if (!initialized || !user || user.role !== "admin") {
    return null;
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = statusFilter === "all" || u.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  async function toggleUserStatus(userId: string, currentStatus: "active" | "suspended" | "pending") {
    if (currentStatus === "pending") return; // PENDING is read-only
    setOpError("");
    setOperating(true);
    try {
      const updated = await membersApi.update(userId, {
        status: currentStatus === "active" ? "SUSPENDED" : "ACTIVE",
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? fromMember(updated) : u))
      );
    } catch (err: unknown) {
      setOpError(err instanceof Error ? err.message : "Operation failed.");
    } finally {
      setOperating(false);
    }
  }

  async function toggleUserRole(userId: string, currentRole: "user" | "admin") {
    setOpError("");
    setOperating(true);
    try {
      const updated = await membersApi.update(userId, {
        role: currentRole === "admin" ? "TENANT_MEMBER" : "TENANT_ADMIN",
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? fromMember(updated) : u))
      );
    } catch (err: unknown) {
      setOpError(err instanceof Error ? err.message : "Operation failed.");
    } finally {
      setOperating(false);
    }
  }

  async function deleteUser(userId: string) {
    setOpError("");
    setOperating(true);
    try {
      await membersApi.remove(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err: unknown) {
      setOpError(err instanceof Error ? err.message : "Operation failed.");
    } finally {
      setOperating(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":    return "bg-success/10 text-success";
      case "suspended": return "bg-destructive/10 text-destructive";
      case "pending":   return "bg-yellow-500/10 text-yellow-600";
      default:          return "bg-muted text-muted-foreground";
    }
  };

  async function handleInvite() {
    setInviteError("");
    setInviting(true);
    try {
      const result = await invitesApi.create({ email: inviteForm.email, role: inviteForm.role });
      setInviteResult(result);
      loadMembers();
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

        {opError && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {opError}
          </div>
        )}

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
                {(["all", "active", "suspended", "pending"] as const).map((f) => (
                  <Button
                    key={f}
                    variant={statusFilter === f ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setStatusFilter(f)}
                    className="capitalize"
                  >
                    {f}
                  </Button>
                ))}
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
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : fetchError ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <p className="text-sm text-destructive">{fetchError}</p>
                <Button variant="outline" size="sm" onClick={loadMembers}>
                  Retry
                </Button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Verified</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                            No members found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((u) => {
                          const isSelf = u.id === user.id;
                          return (
                            <TableRow key={u.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-sm font-medium text-background">
                                    {u.name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="font-medium text-foreground">
                                      {u.name}{isSelf && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{u.email}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize ${getStatusBadge(u.status)}`}>
                                  {u.status}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium capitalize ${
                                  u.role === "admin"
                                    ? "bg-foreground/10 text-foreground"
                                    : "bg-muted text-muted-foreground"
                                }`}>
                                  {u.role === "admin" && <Shield className="h-3 w-3" />}
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
                              <TableCell className="text-muted-foreground">{u.createdAt}</TableCell>
                              <TableCell className="text-muted-foreground">{u.lastLogin}</TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      disabled={operating}
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {!isSelf && (
                                      <DropdownMenuItem onClick={() => toggleUserRole(u.id, u.role)}>
                                        {u.role === "admin" ? (
                                          <><ShieldOff className="mr-2 h-4 w-4" />Remove Admin</>
                                        ) : (
                                          <><Shield className="mr-2 h-4 w-4" />Make Admin</>
                                        )}
                                      </DropdownMenuItem>
                                    )}
                                    {u.status !== "pending" && !isSelf && (
                                      <DropdownMenuItem onClick={() => toggleUserStatus(u.id, u.status)}>
                                        {u.status === "active" ? (
                                          <><UserX className="mr-2 h-4 w-4" />Suspend User</>
                                        ) : (
                                          <><UserCheck className="mr-2 h-4 w-4" />Activate User</>
                                        )}
                                      </DropdownMenuItem>
                                    )}
                                    {!isSelf && <DropdownMenuSeparator />}
                                    <DropdownMenuItem
                                      onClick={() => !isSelf && deleteUser(u.id)}
                                      disabled={isSelf}
                                      className="text-destructive focus:text-destructive disabled:opacity-50"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Remove from workspace
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredUsers.length} of {users.length} members
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
              </>
            )}
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
                  <Input readOnly value={inviteResult.inviteUrl} className="font-mono text-xs" />
                  <Button type="button" variant="outline" size="icon" onClick={copyInviteUrl} aria-label="Copy invite link">
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
                <Button onClick={handleInvite} disabled={inviting || !inviteForm.email}>
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
