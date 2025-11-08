import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserTimezone } from "@/hooks/useUserTimezone";
import { Globe } from "lucide-react";

export function TimezoneSettings() {
  const { preferredTimezone, isLoading, updateUserTimezone } = useUserTimezone();

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="h-10 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Timezone Preferences</h3>
            <p className="text-sm text-muted-foreground">
              Set your preferred timezone for calendar events
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">Default Timezone</Label>
          <Select
            value={preferredTimezone || undefined}
            onValueChange={updateUserTimezone}
          >
            <SelectTrigger id="timezone" className="w-full">
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
              <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
              <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
              <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
              <SelectItem value="America/Anchorage">Alaska Time (AKT)</SelectItem>
              <SelectItem value="Pacific/Honolulu">Hawaii Time (HT)</SelectItem>
              <SelectItem value="Europe/London">London (GMT/BST)</SelectItem>
              <SelectItem value="Europe/Paris">Paris (CET/CEST)</SelectItem>
              <SelectItem value="Europe/Berlin">Berlin (CET/CEST)</SelectItem>
              <SelectItem value="Europe/Rome">Rome (CET/CEST)</SelectItem>
              <SelectItem value="Europe/Madrid">Madrid (CET/CEST)</SelectItem>
              <SelectItem value="Europe/Amsterdam">Amsterdam (CET/CEST)</SelectItem>
              <SelectItem value="Europe/Brussels">Brussels (CET/CEST)</SelectItem>
              <SelectItem value="Europe/Vienna">Vienna (CET/CEST)</SelectItem>
              <SelectItem value="Europe/Stockholm">Stockholm (CET/CEST)</SelectItem>
              <SelectItem value="Europe/Moscow">Moscow (MSK)</SelectItem>
              <SelectItem value="Asia/Dubai">Dubai (GST)</SelectItem>
              <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
              <SelectItem value="Asia/Bangkok">Bangkok (ICT)</SelectItem>
              <SelectItem value="Asia/Singapore">Singapore (SGT)</SelectItem>
              <SelectItem value="Asia/Hong_Kong">Hong Kong (HKT)</SelectItem>
              <SelectItem value="Asia/Shanghai">Shanghai (CST)</SelectItem>
              <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
              <SelectItem value="Asia/Seoul">Seoul (KST)</SelectItem>
              <SelectItem value="Australia/Sydney">Sydney (AEDT/AEST)</SelectItem>
              <SelectItem value="Australia/Melbourne">Melbourne (AEDT/AEST)</SelectItem>
              <SelectItem value="Australia/Perth">Perth (AWST)</SelectItem>
              <SelectItem value="Pacific/Auckland">Auckland (NZDT/NZST)</SelectItem>
              <SelectItem value="UTC">UTC</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            This timezone will be used as the default when creating new calendar events
          </p>
        </div>
      </div>
    </Card>
  );
}
