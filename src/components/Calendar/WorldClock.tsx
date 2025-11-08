import { Clock, Globe } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

interface WorldClockProps {
  timezones?: { name: string; timezone: string; flag?: string }[];
}

const defaultTimezones = [
  { name: "New York", timezone: "America/New_York", flag: "🇺🇸" },
  { name: "London", timezone: "Europe/London", flag: "🇬🇧" },
  { name: "Tokyo", timezone: "Asia/Tokyo", flag: "🇯🇵" },
  { name: "Sydney", timezone: "Australia/Sydney", flag: "🇦🇺" },
];

export function WorldClock({ timezones = defaultTimezones }: WorldClockProps) {
  const [times, setTimes] = useState<Record<string, string>>({});
  const [dates, setDates] = useState<Record<string, string>>({});

  useEffect(() => {
    const updateTimes = () => {
      const newTimes: Record<string, string> = {};
      const newDates: Record<string, string> = {};

      timezones.forEach((tz) => {
        const now = new Date();
        const timeStr = new Intl.DateTimeFormat("en-US", {
          timeZone: tz.timezone,
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }).format(now);

        const dateStr = new Intl.DateTimeFormat("en-US", {
          timeZone: tz.timezone,
          month: "short",
          day: "numeric",
        }).format(now);

        newTimes[tz.timezone] = timeStr;
        newDates[tz.timezone] = dateStr;
      });

      setTimes(newTimes);
      setDates(newDates);
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);

    return () => clearInterval(interval);
  }, [timezones]);

  return (
    <Card className="p-4 glass">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">World Clock</h3>
      </div>

      <div className="space-y-3">
        {timezones.map((tz) => (
          <div
            key={tz.timezone}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              {tz.flag && <span className="text-lg">{tz.flag}</span>}
              <div>
                <p className="text-sm font-medium">{tz.name}</p>
                <p className="text-xs text-muted-foreground">{dates[tz.timezone]}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <Badge variant="secondary" className="font-mono text-xs">
                {times[tz.timezone] || "Loading..."}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
