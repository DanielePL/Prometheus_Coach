import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download } from "lucide-react";

export function PrivacySettings() {
  const [profileVisibility, setProfileVisibility] = useState("public");
  const [allowAnalytics, setAllowAnalytics] = useState(true);
  const [shareWorkoutData, setShareWorkoutData] = useState(true);
  const [shareProgressPhotos, setShareProgressPhotos] = useState(true);

  const handleDownloadData = () => {
    toast.success("Your data export has been started. You'll receive an email when it's ready.");
  };

  return (
    <div className="space-y-6">
      <Card className="glass border-border/40">
        <CardHeader>
          <CardTitle>Profile Visibility</CardTitle>
          <CardDescription>Control who can see your profile</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={profileVisibility} onValueChange={setProfileVisibility}>
            <div className="flex items-center space-x-2 py-3">
              <RadioGroupItem value="public" id="public" />
              <Label htmlFor="public" className="flex flex-col gap-1">
                <span>Public</span>
                <span className="text-sm font-normal text-muted-foreground">
                  Your profile is searchable and visible to everyone
                </span>
              </Label>
            </div>
            <div className="flex items-center space-x-2 py-3">
              <RadioGroupItem value="private" id="private" />
              <Label htmlFor="private" className="flex flex-col gap-1">
                <span>Private</span>
                <span className="text-sm font-normal text-muted-foreground">
                  Only connected clients/coaches can view your profile
                </span>
              </Label>
            </div>
            <div className="flex items-center space-x-2 py-3">
              <RadioGroupItem value="hidden" id="hidden" />
              <Label htmlFor="hidden" className="flex flex-col gap-1">
                <span>Hidden</span>
                <span className="text-sm font-normal text-muted-foreground">
                  Your profile is only visible by invitation
                </span>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card className="glass border-border/40">
        <CardHeader>
          <CardTitle>Data Sharing</CardTitle>
          <CardDescription>Manage what data you share</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="analytics" className="flex flex-col gap-1">
              <span>Allow Analytics</span>
              <span className="text-sm font-normal text-muted-foreground">
                Help us improve by sharing anonymous usage data
              </span>
            </Label>
            <Switch
              id="analytics"
              checked={allowAnalytics}
              onCheckedChange={setAllowAnalytics}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="workoutData" className="flex flex-col gap-1">
              <span>Share Workout Data with Coach</span>
              <span className="text-sm font-normal text-muted-foreground">
                Allow your coach to view your workout history
              </span>
            </Label>
            <Switch
              id="workoutData"
              checked={shareWorkoutData}
              onCheckedChange={setShareWorkoutData}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="progressPhotos" className="flex flex-col gap-1">
              <span>Share Progress Photos with Coach</span>
              <span className="text-sm font-normal text-muted-foreground">
                Allow your coach to view your progress photos
              </span>
            </Label>
            <Switch
              id="progressPhotos"
              checked={shareProgressPhotos}
              onCheckedChange={setShareProgressPhotos}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-border/40">
        <CardHeader>
          <CardTitle>Connected Apps</CardTitle>
          <CardDescription>Manage integrations with other services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Google Calendar</p>
                <p className="text-sm text-muted-foreground">Sync events with Google Calendar</p>
              </div>
              <Button variant="outline" size="sm">
                Connect
              </Button>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Apple Health</p>
                <p className="text-sm text-muted-foreground">Sync health and fitness data</p>
              </div>
              <Button variant="outline" size="sm">
                Connect
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-border/40">
        <CardHeader>
          <CardTitle>Data Export</CardTitle>
          <CardDescription>Download a copy of your data</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleDownloadData} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Download My Data
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            We'll email you a JSON file containing all your account data
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
