import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function NotificationSettings() {
  const [emailNotifications, setEmailNotifications] = useState({
    newMessages: true,
    eventReminders: true,
    clientRequests: true,
    workoutAssignments: true,
    weeklySummary: false,
  });

  const [inAppNotifications, setInAppNotifications] = useState({
    realTime: true,
    sound: false,
    desktop: true,
  });

  const [quietHoursStart, setQuietHoursStart] = useState("22:00");
  const [quietHoursEnd, setQuietHoursEnd] = useState("08:00");

  const handleToggle = (category: string, key: string, value: boolean) => {
    if (category === "email") {
      setEmailNotifications({ ...emailNotifications, [key]: value });
    } else {
      setInAppNotifications({ ...inAppNotifications, [key]: value });
    }
    toast.success("Notification preferences updated");
  };

  return (
    <div className="space-y-6">
      <Card className="glass border-border/40">
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>Choose what updates you want to receive via email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="newMessages" className="flex flex-col gap-1">
              <span>New Messages</span>
              <span className="text-sm font-normal text-muted-foreground">
                Get notified when you receive a new message
              </span>
            </Label>
            <Switch
              id="newMessages"
              checked={emailNotifications.newMessages}
              onCheckedChange={(checked) => handleToggle("email", "newMessages", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="eventReminders" className="flex flex-col gap-1">
              <span>Event Reminders</span>
              <span className="text-sm font-normal text-muted-foreground">
                Receive reminders for upcoming events
              </span>
            </Label>
            <Switch
              id="eventReminders"
              checked={emailNotifications.eventReminders}
              onCheckedChange={(checked) => handleToggle("email", "eventReminders", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="clientRequests" className="flex flex-col gap-1">
              <span>Client Requests</span>
              <span className="text-sm font-normal text-muted-foreground">
                Get notified about new connection requests
              </span>
            </Label>
            <Switch
              id="clientRequests"
              checked={emailNotifications.clientRequests}
              onCheckedChange={(checked) => handleToggle("email", "clientRequests", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="workoutAssignments" className="flex flex-col gap-1">
              <span>Workout Assignments</span>
              <span className="text-sm font-normal text-muted-foreground">
                Be notified when new workouts are assigned
              </span>
            </Label>
            <Switch
              id="workoutAssignments"
              checked={emailNotifications.workoutAssignments}
              onCheckedChange={(checked) => handleToggle("email", "workoutAssignments", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="weeklySummary" className="flex flex-col gap-1">
              <span>Weekly Summary</span>
              <span className="text-sm font-normal text-muted-foreground">
                Receive a summary of your weekly activity
              </span>
            </Label>
            <Switch
              id="weeklySummary"
              checked={emailNotifications.weeklySummary}
              onCheckedChange={(checked) => handleToggle("email", "weeklySummary", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-border/40">
        <CardHeader>
          <CardTitle>In-App Notifications</CardTitle>
          <CardDescription>Manage your in-app notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="realTime" className="flex flex-col gap-1">
              <span>Real-time Notifications</span>
              <span className="text-sm font-normal text-muted-foreground">
                Receive instant notifications in the app
              </span>
            </Label>
            <Switch
              id="realTime"
              checked={inAppNotifications.realTime}
              onCheckedChange={(checked) => handleToggle("inApp", "realTime", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="sound" className="flex flex-col gap-1">
              <span>Sound for New Messages</span>
              <span className="text-sm font-normal text-muted-foreground">
                Play a sound when you receive a new message
              </span>
            </Label>
            <Switch
              id="sound"
              checked={inAppNotifications.sound}
              onCheckedChange={(checked) => handleToggle("inApp", "sound", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="desktop" className="flex flex-col gap-1">
              <span>Desktop Notifications</span>
              <span className="text-sm font-normal text-muted-foreground">
                Show desktop notifications when the app is in background
              </span>
            </Label>
            <Switch
              id="desktop"
              checked={inAppNotifications.desktop}
              onCheckedChange={(checked) => handleToggle("inApp", "desktop", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-border/40">
        <CardHeader>
          <CardTitle>Quiet Hours</CardTitle>
          <CardDescription>Set times when you don't want to receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quietStart">Start Time</Label>
              <Input
                id="quietStart"
                type="time"
                value={quietHoursStart}
                onChange={(e) => setQuietHoursStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quietEnd">End Time</Label>
              <Input
                id="quietEnd"
                type="time"
                value={quietHoursEnd}
                onChange={(e) => setQuietHoursEnd(e.target.value)}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            No notifications will be sent between these hours
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
