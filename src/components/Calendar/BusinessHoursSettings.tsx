import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import { useBusinessHours } from "@/hooks/useBusinessHours";
import { useState, useEffect } from "react";

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function BusinessHoursSettings() {
  const { businessHours, isLoading, saveBusinessHours, toggleDay } = useBusinessHours();
  const [hours, setHours] = useState<Record<number, { start: string; end: string; enabled: boolean }>>({});

  useEffect(() => {
    const hoursMap: Record<number, { start: string; end: string; enabled: boolean }> = {};
    
    // Initialize with defaults or existing hours
    for (let i = 0; i < 7; i++) {
      const existing = businessHours.find(bh => bh.day_of_week === i);
      hoursMap[i] = {
        start: existing?.start_time.slice(0, 5) || "09:00",
        end: existing?.end_time.slice(0, 5) || "17:00",
        enabled: existing?.is_enabled ?? (i >= 1 && i <= 5), // Default Mon-Fri enabled
      };
    }
    
    setHours(hoursMap);
  }, [businessHours]);

  const handleSave = async (dayOfWeek: number) => {
    const dayHours = hours[dayOfWeek];
    await saveBusinessHours(
      dayOfWeek,
      dayHours.start + ":00",
      dayHours.end + ":00",
      dayHours.enabled
    );
  };

  const handleToggle = async (dayOfWeek: number, enabled: boolean) => {
    setHours(prev => ({
      ...prev,
      [dayOfWeek]: { ...prev[dayOfWeek], enabled }
    }));
    await toggleDay(dayOfWeek, enabled);
  };

  if (isLoading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  return (
    <Card className="p-6 glass">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">Business Hours</h3>
      </div>

      <div className="space-y-4">
        {DAYS.map((day, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Switch
                  checked={hours[index]?.enabled || false}
                  onCheckedChange={(checked) => handleToggle(index, checked)}
                />
                <Label className="text-sm font-medium min-w-[100px]">{day}</Label>
              </div>
              {hours[index]?.enabled && (
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={hours[index]?.start || "09:00"}
                    onChange={(e) =>
                      setHours(prev => ({
                        ...prev,
                        [index]: { ...prev[index], start: e.target.value }
                      }))
                    }
                    className="w-[120px]"
                  />
                  <span className="text-sm text-muted-foreground">to</span>
                  <Input
                    type="time"
                    value={hours[index]?.end || "17:00"}
                    onChange={(e) =>
                      setHours(prev => ({
                        ...prev,
                        [index]: { ...prev[index], end: e.target.value }
                      }))
                    }
                    className="w-[120px]"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleSave(index)}
                    variant="outline"
                  >
                    Save
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
        <p className="text-xs text-muted-foreground">
          💡 Business hours help others know when you're available for scheduling. Disabled days won't be available for booking.
        </p>
      </div>
    </Card>
  );
}
