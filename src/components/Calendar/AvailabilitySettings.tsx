import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Trash2 } from "lucide-react";
import { useBlockedTimeSlots } from "@/hooks/useBlockedTimeSlots";
import { BlockTimeDialog } from "./BlockTimeDialog";

export function AvailabilitySettings() {
  const { blockedSlots, isLoading, deleteBlockedSlot } = useBlockedTimeSlots();

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  if (isLoading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  return (
    <Card className="p-6 glass">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Blocked Time Slots</h3>
        </div>
        <BlockTimeDialog />
      </div>

      <div className="space-y-3">
        {blockedSlots.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No blocked time slots. Click "Block Time" to add one.
          </div>
        ) : (
          blockedSlots.map((slot) => (
            <div
              key={slot.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-sm">{slot.title}</p>
                  <Badge variant="secondary" className="text-xs">
                    Blocked
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(slot.start_time)} - {formatDateTime(slot.end_time)}
                </p>
                {slot.reason && (
                  <p className="text-xs text-muted-foreground mt-1 italic">
                    {slot.reason}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteBlockedSlot(slot.id)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
        <p className="text-xs text-muted-foreground">
          💡 Blocked time slots prevent others from scheduling during these periods. They appear on your calendar as unavailable.
        </p>
      </div>
    </Card>
  );
}
