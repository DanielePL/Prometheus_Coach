import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { useState } from "react";

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const [compactMode, setCompactMode] = useState(false);
  const [reduceAnimations, setReduceAnimations] = useState(false);

  return (
    <div className="space-y-6">
      <Card className="glass border-border/40">
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>Choose your preferred color scheme</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={theme} onValueChange={setTheme}>
            <div className="flex items-center space-x-2 py-3">
              <RadioGroupItem value="light" id="light" />
              <Label htmlFor="light" className="flex items-center gap-2">
                <Sun className="h-4 w-4" />
                <div>
                  <p>Light Mode</p>
                  <p className="text-sm text-muted-foreground">Bright and clean interface</p>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 py-3">
              <RadioGroupItem value="dark" id="dark" />
              <Label htmlFor="dark" className="flex items-center gap-2">
                <Moon className="h-4 w-4" />
                <div>
                  <p>Dark Mode</p>
                  <p className="text-sm text-muted-foreground">Easy on the eyes in low light</p>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 py-3">
              <RadioGroupItem value="system" id="system" />
              <Label htmlFor="system" className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                <div>
                  <p>System Preference</p>
                  <p className="text-sm text-muted-foreground">Automatically match your device settings</p>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card className="glass border-border/40">
        <CardHeader>
          <CardTitle>Display Options</CardTitle>
          <CardDescription>Customize your viewing experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="compact" className="flex flex-col gap-1">
              <span>Compact Mode</span>
              <span className="text-sm font-normal text-muted-foreground">
                Reduce spacing and padding for more content
              </span>
            </Label>
            <Switch
              id="compact"
              checked={compactMode}
              onCheckedChange={setCompactMode}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="animations" className="flex flex-col gap-1">
              <span>Reduce Animations</span>
              <span className="text-sm font-normal text-muted-foreground">
                Minimize motion effects for better performance
              </span>
            </Label>
            <Switch
              id="animations"
              checked={reduceAnimations}
              onCheckedChange={setReduceAnimations}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-border/40">
        <CardHeader>
          <CardTitle>Language</CardTitle>
          <CardDescription>Choose your preferred language</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup defaultValue="english">
            <div className="flex items-center space-x-2 py-2">
              <RadioGroupItem value="english" id="english" />
              <Label htmlFor="english">English</Label>
            </div>
            <div className="flex items-center space-x-2 py-2 opacity-50">
              <RadioGroupItem value="spanish" id="spanish" disabled />
              <Label htmlFor="spanish">Spanish (Coming Soon)</Label>
            </div>
            <div className="flex items-center space-x-2 py-2 opacity-50">
              <RadioGroupItem value="french" id="french" disabled />
              <Label htmlFor="french">French (Coming Soon)</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}
