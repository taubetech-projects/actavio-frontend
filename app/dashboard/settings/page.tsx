"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, User, Bell, Shield, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/dashboard/dashboard-layout";
import { useAuth } from "@/lib/auth-context";

export default function SettingsPage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
  });

  const [notifications, setNotifications] = useState({
    emailReminders: true,
    pushNotifications: true,
    weeklyDigest: false,
    marketingEmails: false,
  });

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else {
      setProfile({ name: user.name, email: user.email });
    }
  }, [user, router]);

  const handleSaveProfile = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    updateUser({ name: profile.name });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex items-center gap-2"
            >
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

                <div className="flex items-center gap-4">
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose how you want to be notified about updates and
                  reminders.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <p className="font-medium text-foreground">
                        Email reminders
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Receive email notifications for upcoming tasks
                      </p>
                    </div>
                    <Switch
                      checked={notifications.emailReminders}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          emailReminders: checked,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <p className="font-medium text-foreground">
                        Push notifications
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Receive browser notifications for important updates
                      </p>
                    </div>
                    <Switch
                      checked={notifications.pushNotifications}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          pushNotifications: checked,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <p className="font-medium text-foreground">
                        Weekly digest
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Get a weekly summary of your completed tasks
                      </p>
                    </div>
                    <Switch
                      checked={notifications.weeklyDigest}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          weeklyDigest: checked,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <p className="font-medium text-foreground">
                        Marketing emails
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Receive updates about new features and promotions
                      </p>
                    </div>
                    <Switch
                      checked={notifications.marketingEmails}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          marketingEmails: checked,
                        })
                      }
                    />
                  </div>
                </div>
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
              <CardContent className="space-y-6">
                <div className="space-y-4">
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
                        <p className="font-medium text-foreground">
                          Active sessions
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Manage your active login sessions
                        </p>
                      </div>
                      <Button variant="outline">View sessions</Button>
                    </div>
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
                    <Button variant="outline" className="text-destructive hover:bg-destructive hover:text-destructive-foreground bg-transparent">
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
                  Customize how TaskFlow looks on your device.
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
    </DashboardLayout>
  );
}
