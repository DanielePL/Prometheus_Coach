import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useConnectedClients } from "@/hooks/useConnectedClients";
import { useAssignWorkout } from "@/hooks/useWorkoutAssignments";
import { Search, CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AssignWorkoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workoutId: string;
  workoutName: string;
}

export function AssignWorkoutModal({
  open,
  onOpenChange,
  workoutId,
  workoutName,
}: AssignWorkoutModalProps) {
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [notes, setNotes] = useState("");

  const { clients, isLoading: loadingClients } = useConnectedClients();
  const assignWorkout = useAssignWorkout();

  const filteredClients = clients.filter((client) =>
    client.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleClient = (clientId: string) => {
    setSelectedClients((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId]
    );
  };

  const toggleAll = () => {
    if (selectedClients.length === filteredClients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(filteredClients.map((c) => c.id));
    }
  };

  const handleAssign = async () => {
    if (selectedClients.length === 0) return;

    await assignWorkout.mutateAsync({
      routineId: workoutId,
      clientIds: selectedClients,
      scheduledDate: scheduledDate ? format(scheduledDate, "yyyy-MM-dd") : undefined,
      notes: notes || undefined,
    });

    // Reset and close
    setSelectedClients([]);
    setSearchQuery("");
    setScheduledDate(undefined);
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col bg-background">
        <DialogHeader>
          <DialogTitle className="text-2xl">Assign {workoutName} to Clients</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Select All */}
          <div className="flex items-center justify-between py-2 border-b border-border">
            <Label className="text-sm font-medium">
              {selectedClients.length} of {filteredClients.length} selected
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAll}
              disabled={loadingClients}
            >
              {selectedClients.length === filteredClients.length
                ? "Deselect All"
                : "Select All"}
            </Button>
          </div>

          {/* Client List */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {loadingClients ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filteredClients.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {searchQuery ? "No clients found" : "No connected clients"}
              </p>
            ) : (
              filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => toggleClient(client.id)}
                >
                  <Checkbox
                    checked={selectedClients.includes(client.id)}
                    onCheckedChange={() => toggleClient(client.id)}
                  />
                  <UserAvatar
                    avatarUrl={client.avatar_url}
                    fullName={client.full_name}
                    userId={client.id}
                    className="w-10 h-10"
                  />
                  <span className="font-medium text-foreground">{client.full_name}</span>
                </div>
              ))
            )}
          </div>

          {/* Scheduled Date */}
          <div className="space-y-2">
            <Label>Schedule for specific date (optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !scheduledDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {scheduledDate ? format(scheduledDate, "PPP") : "Available anytime"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={scheduledDate}
                  onSelect={setScheduledDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes for clients (optional)</Label>
            <Textarea
              placeholder="Add any special instructions or notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={assignWorkout.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            className="flex-1 bg-primary hover:bg-primary/90"
            disabled={selectedClients.length === 0 || assignWorkout.isPending}
          >
            {assignWorkout.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              `Assign to ${selectedClients.length} client${
                selectedClients.length !== 1 ? "s" : ""
              }`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
