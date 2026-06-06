"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Check,
  User,
  Bell,
  Shield,
  Palette,
  Plug,
  Mail,
  Calendar,
  MessageSquare,
  BarChart2,
  BookOpen,
  ListTodo,
  AlertCircle,
  CheckCircle2,
  WifiOff,
  Unplug,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import {
  integrationsApi,
  type Integration,
  type IntegrationProvider,
} from "@/lib/api";

// ── Provider metadata ────────────────────────────────────────────────────────

const PROVIDER_META: Record<
  IntegrationProvider,
  { name: string; icon: React.ElementType; description: string }
> = {
  GMAIL: {
    name: "Gmail",
    icon: Mail,
    description: "Send and draft emails on your behalf",
  },
  GOOGLE_CALENDAR: {
    name: "Google Calendar",
    icon: Calendar,
    description: "Create and reschedule calendar events",
  },
  OUTLOOK_MAIL: {
    name: "Outlook Mail",
    icon: Mail,
    description: "Send and draft emails via Outlook",
  },
  OUTLOOK_CALENDAR: {
    name: "Outlook Calendar",
    icon: Calendar,
    description: "Create and reschedule Outlook calendar events",
  },
  SLACK: {
    name: "Slack",
    icon: MessageSquare,
    description: "Send messages and trigger workflows",
  },
  HUBSPOT: {
    name: "HubSpot",
    icon: BarChart2,
    description: "Log CRM activities and update deal status",
  },
  NOTION: {
    name: "Notion",
    icon: BookOpen,
    description: "Create and update Notion pages",
  },
  INTERNAL_TASKS: {
    name: "Internal Tasks",
    icon: ListTodo,
    description: "Manage tasks directly within Actavio",
  },
};

const ALL_PROVIDERS = Object.keys(PROVIDER_META) as IntegrationProvider[];

// ── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Integration["status"] }) {
  if (status === "CONNECTED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
        <CheckCircle2 className="h-3 w-3" />
        Connected
      </span>
    );
  }
  if (status === "ERROR") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
        <AlertCircle className="h-3 w-3" />
        Error
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      <WifiOff className="h-3 w-3" />
      Disconnected
    </span>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter();
  const { user, initialized, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({ name: "", email: "" });

  const [notifications, setNotifications] = useState({
    emailReminders: true,
    pushNotifications: true,
    weeklyDigest: false,
    marketingEmails: false,
  });

  // Integrations state
  const [integrations, setIntegrations] = useState<
    Partial<Record<IntegrationProvider, Integration>>
  >({});
  const [integrationsLoading, setIntegrationsLoading] = useState(false);
  const [integrationsError, setIntegrationsError] = useState<string | null>(null);
  const [connectingProvider, setConnectingProvider] =
    useState<IntegrationProvider | null>(null);
  const [disconnectingProvider, setDisconnectingProvider] =
    useState<IntegrationProvider | null>(null);
  const [connectDialog, setConnectDialog] = useState<{
    open: boolean;
    provider: IntegrationProvider | null;
    displayName: string;
  }>({ open: false, provider: null, displayName: "" });

  useEffect(() => {
    if (!initialized) return;
    if (!user) {
      router.push("/login");
    } else {
      setProfile({ name: user.name, email: user.email });
    }
  }, [user, initialized, router]);

  const loadIntegrations = useCallback(async () => {
    setIntegrationsLoading(true);
    setIntegrationsError(null);
    try {
      const data = await integrationsApi.list();
      const map: Partial<Record<IntegrationProvider, Integration>> = {};
      for (const integration of data) {
        map[integration.provider] = integration;
      }
      setIntegrations(map);
    } catch {
      setIntegrationsError("Failed to load integrations.");
    } finally {
      setIntegrationsLoading(false);
    }
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    updateUser({ name: profile.name });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  function openConnectDialog(provider: IntegrationProvider) {
    const existing = integrations[provider];
    setConnectDialog({
      open: true,
      provider,
      displayName: existing?.displayName ?? "",
    });
  }

  async function handleConnect() {
    const { provider, displayName } = connectDialog;
    if (!provider) return;
    setConnectingProvider(provider);
    setConnectDialog((d) => ({ ...d, open: false }));
    try {
      const result = await integrationsApi.connect(provider, {
        displayName: displayName.trim() || undefined,
      });
      setIntegrations((prev) => ({ ...prev, [provider]: result }));
    } catch {
      // Refresh the list to reflect any partial state
      loadIntegrations();
    } finally {
      setConnectingProvider(null);
    }
  }

  async function handleDisconnect(provider: IntegrationProvider) {
    setDisconnectingProvider(provider);
    try {
      await integrationsApi.disconnect(provider);
      setIntegrations((prev) => {
        const next = { ...prev };
        delete next[provider];
        return next;
      });
    } catch {
      loadIntegrations();
    } finally {
      setDisconnectingProvider(null);
    }
  }

  if (!initialized || !user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2" onClick={loadIntegrations}>
              <Plug className="h-4 w-4" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and email address.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-foreground text-2xl font-bold text-background">
                    {profile.name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <Button variant="outline" size="sm">
                      Change avatar
                    </Button>
                    <p className="mt-2 text-xs text-muted-foreground">
                      JPG, PNG or GIF. Max 2MB.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) =>
                        setProfile({ ...profile, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Contact support to change your email.
                    </p>
                  </div>
                </div>

                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : saved ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Saved
                    </>
                  ) : (
                    "Save changes"
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations">
            <Card>
              <CardHeader>
                <CardTitle>Connected Integrations</CardTitle>
                <CardDescription>
                  Connect external services so Actavio can act on your behalf.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {integrationsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : integrationsError ? (
                  <div className="flex flex-col items-center gap-3 py-12 text-center">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                    <p className="text-sm text-muted-foreground">{integrationsError}</p>
                    <Button variant="outline" size="sm" onClick={loadIntegrations}>
                      Retry
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {ALL_PROVIDERS.map((provider) => {
                      const meta = PROVIDER_META[provider];
                      const Icon = meta.icon;
                      const integration = integrations[provider];
                      const status = integration?.status ?? "DISCONNECTED";
                      const isConnected = status === "CONNECTED";
                      const isConnecting = connectingProvider === provider;
                      const isDisconnecting = disconnectingProvider === provider;
                      const isBusy = isConnecting || isDisconnecting;

                      return (
                        <div
                          key={provider}
                          className="flex flex-col gap-3 rounded-lg border border-border p-4"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                                <Icon className="h-5 w-5 text-foreground" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-foreground leading-tight">
                                  {meta.name}
                                </p>
                                {integration?.displayName && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {integration.displayName}
                                  </p>
                                )}
                              </div>
                            </div>
                            <StatusBadge status={status} />
                          </div>

                          <p className="text-xs text-muted-foreground">
                            {meta.description}
                          </p>

                          {status === "ERROR" && integration?.lastError && (
                            <p className="text-xs text-destructive">
                              {integration.lastError}
                            </p>
                          )}

                          <div className="flex gap-2">
                            {isConnected ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive bg-transparent"
                                disabled={isBusy}
                                onClick={() => handleDisconnect(provider)}
                              >
                                {isDisconnecting ? (
                                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                                ) : (
                                  <Unplug className="mr-1.5 h-3 w-3" />
                                )}
                                Disconnect
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isBusy}
                                onClick={() => openConnectDialog(provider)}
                              >
                                {isConnecting ? (
                                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                                ) : (
                                  <Plug className="mr-1.5 h-3 w-3" />
                                )}
                                {status === "ERROR" ? "Reconnect" : "Connect"}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose how you want to be notified about updates and reminders.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    key: "emailReminders" as const,
                    label: "Email reminders",
                    description: "Receive email notifications for upcoming tasks",
                  },
                  {
                    key: "pushNotifications" as const,
                    label: "Push notifications",
                    description: "Receive browser notifications for important updates",
                  },
                  {
                    key: "weeklyDigest" as const,
                    label: "Weekly digest",
                    description: "Get a weekly summary of your completed tasks",
                  },
                  {
                    key: "marketingEmails" as const,
                    label: "Marketing emails",
                    description: "Receive updates about new features and promotions",
                  },
                ].map(({ key, label, description }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-lg border border-border p-4"
                  >
                    <div>
                      <p className="font-medium text-foreground">{label}</p>
                      <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                    <Switch
                      checked={notifications[key]}
                      onCheckedChange={(checked) =>
                        setNotifications((n) => ({ ...n, [key]: checked }))
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your password and account security.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Password</p>
                      <p className="text-sm text-muted-foreground">
                        Last changed 30 days ago
                      </p>
                    </div>
                    <Button variant="outline">Change password</Button>
                  </div>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        Two-factor authentication
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Button variant="outline">Enable 2FA</Button>
                  </div>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Active sessions</p>
                      <p className="text-sm text-muted-foreground">
                        Manage your active login sessions
                      </p>
                    </div>
                    <Button variant="outline">View sessions</Button>
                  </div>
                </div>
                <div className="border-t border-border pt-6">
                  <h3 className="text-lg font-medium text-destructive">
                    Danger Zone
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Irreversible actions that affect your account.
                  </p>
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground bg-transparent"
                    >
                      Delete account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize how Actavio looks on your device.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base">Theme</Label>
                  <p className="text-sm text-muted-foreground">
                    Select your preferred color scheme
                  </p>
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <button
                      type="button"
                      className="flex flex-col items-center gap-2 rounded-lg border-2 border-foreground p-4"
                    >
                      <div className="h-16 w-full rounded bg-background border border-border" />
                      <span className="text-sm font-medium">Light</span>
                    </button>
                    <button
                      type="button"
                      className="flex flex-col items-center gap-2 rounded-lg border border-border p-4 opacity-50"
                    >
                      <div className="h-16 w-full rounded bg-foreground" />
                      <span className="text-sm">Dark</span>
                    </button>
                    <button
                      type="button"
                      className="flex flex-col items-center gap-2 rounded-lg border border-border p-4 opacity-50"
                    >
                      <div className="h-16 w-full rounded bg-gradient-to-r from-background to-foreground" />
                      <span className="text-sm">System</span>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Connect Integration Dialog */}
      <Dialog
        open={connectDialog.open}
        onOpenChange={(open) => setConnectDialog((d) => ({ ...d, open }))}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Connect{" "}
              {connectDialog.provider
                ? PROVIDER_META[connectDialog.provider].name
                : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="display-name">Display name</Label>
              <Input
                id="display-name"
                placeholder={
                  connectDialog.provider
                    ? `e.g. ${PROVIDER_META[connectDialog.provider].name} — Work`
                    : ""
                }
                value={connectDialog.displayName}
                onChange={(e) =>
                  setConnectDialog((d) => ({
                    ...d,
                    displayName: e.target.value,
                  }))
                }
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Optional label to identify this connection.
              </p>
            </div>
            <p className="text-xs text-muted-foreground rounded-lg border border-border bg-muted/50 p-3">
              Credentials are handled by your organisation&apos;s OAuth flow.
              Click Connect to register this integration.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConnectDialog((d) => ({ ...d, open: false }))}
            >
              Cancel
            </Button>
            <Button onClick={handleConnect}>Connect</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
