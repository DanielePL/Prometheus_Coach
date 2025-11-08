import { Clock, Globe, Plus, X, Settings } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWorldClockTimezones } from "@/hooks/useWorldClockTimezones";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from "@/lib/utils";

const availableTimezones = [
  { timezone: "America/New_York", city: "New York", flag: "🇺🇸" },
  { timezone: "America/Los_Angeles", city: "Los Angeles", flag: "🇺🇸" },
  { timezone: "America/Chicago", city: "Chicago", flag: "🇺🇸" },
  { timezone: "America/Denver", city: "Denver", flag: "🇺🇸" },
  { timezone: "America/Toronto", city: "Toronto", flag: "🇨🇦" },
  { timezone: "America/Mexico_City", city: "Mexico City", flag: "🇲🇽" },
  { timezone: "America/Sao_Paulo", city: "São Paulo", flag: "🇧🇷" },
  { timezone: "Europe/London", city: "London", flag: "🇬🇧" },
  { timezone: "Europe/Paris", city: "Paris", flag: "🇫🇷" },
  { timezone: "Europe/Berlin", city: "Berlin", flag: "🇩🇪" },
  { timezone: "Europe/Rome", city: "Rome", flag: "🇮🇹" },
  { timezone: "Europe/Madrid", city: "Madrid", flag: "🇪🇸" },
  { timezone: "Europe/Amsterdam", city: "Amsterdam", flag: "🇳🇱" },
  { timezone: "Europe/Stockholm", city: "Stockholm", flag: "🇸🇪" },
  { timezone: "Europe/Moscow", city: "Moscow", flag: "🇷🇺" },
  { timezone: "Africa/Cairo", city: "Cairo", flag: "🇪🇬" },
  { timezone: "Africa/Johannesburg", city: "Johannesburg", flag: "🇿🇦" },
  { timezone: "Asia/Dubai", city: "Dubai", flag: "🇦🇪" },
  { timezone: "Asia/Tokyo", city: "Tokyo", flag: "🇯🇵" },
  { timezone: "Asia/Seoul", city: "Seoul", flag: "🇰🇷" },
  { timezone: "Asia/Shanghai", city: "Shanghai", flag: "🇨🇳" },
  { timezone: "Asia/Hong_Kong", city: "Hong Kong", flag: "🇭🇰" },
  { timezone: "Asia/Singapore", city: "Singapore", flag: "🇸🇬" },
  { timezone: "Asia/Kolkata", city: "Mumbai", flag: "🇮🇳" },
  { timezone: "Asia/Bangkok", city: "Bangkok", flag: "🇹🇭" },
  { timezone: "Australia/Sydney", city: "Sydney", flag: "🇦🇺" },
  { timezone: "Australia/Melbourne", city: "Melbourne", flag: "🇦🇺" },
  { timezone: "Pacific/Auckland", city: "Auckland", flag: "🇳🇿" },
];

export function WorldClock() {
  const { timezones, isLoading, addTimezone, removeTimezone, reorderTimezones } = useWorldClockTimezones();
  const [times, setTimes] = useState<Record<string, string>>({});
  const [dates, setDates] = useState<Record<string, string>>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleAddTimezone = () => {
    const selected = availableTimezones.find(tz => tz.timezone === selectedTimezone);
    if (selected) {
      addTimezone(selected.timezone, selected.city, selected.flag);
      setIsAddDialogOpen(false);
      setSelectedTimezone("");
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = timezones.findIndex((tz) => tz.id === active.id);
      const newIndex = timezones.findIndex((tz) => tz.id === over.id);

      const newOrder = arrayMove(timezones, oldIndex, newIndex);
      reorderTimezones(newOrder);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-4 glass">
        <div className="flex items-center justify-center h-32">
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 glass">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">World Clock</h3>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Timezone</DialogTitle>
              <DialogDescription>
                Select a timezone to add to your world clock
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
                  <SelectTrigger id="timezone">
                    <SelectValue placeholder="Select a timezone" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {availableTimezones.map((tz) => (
                      <SelectItem key={tz.timezone} value={tz.timezone}>
                        <div className="flex items-center gap-2">
                          <span>{tz.flag}</span>
                          <span>{tz.city}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddTimezone} disabled={!selectedTimezone}>
                  Add
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {timezones.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            No timezones added yet. Click + to add one.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={timezones.map(tz => tz.id)}
              strategy={verticalListSortingStrategy}
            >
              {timezones.map((tz) => (
                <SortableTimezoneItem
                  key={tz.id}
                  tz={tz}
                  time={times[tz.timezone]}
                  date={dates[tz.timezone]}
                  onRemove={removeTimezone}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </Card>
  );
}

// Sortable timezone item component
interface SortableTimezoneItemProps {
  tz: {
    id: string;
    timezone: string;
    city_name: string;
    flag?: string;
  };
  time: string;
  date: string;
  onRemove: (id: string) => void;
}

function SortableTimezoneItem({ tz, time, date, onRemove }: SortableTimezoneItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tz.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group",
        isDragging && "opacity-50 bg-muted/50"
      )}
    >
      <div className="flex items-center gap-2 flex-1">
        {tz.flag && <span className="text-lg">{tz.flag}</span>}
        <div className="flex-1">
          <p className="text-sm font-medium">{tz.city_name}</p>
          <p className="text-xs text-muted-foreground">{date}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <Badge variant="secondary" className="font-mono text-xs">
            {time || "Loading..."}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(tz.id);
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
