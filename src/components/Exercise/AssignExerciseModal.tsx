import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Search, Loader2 } from "lucide-react";
import { useConnectedClients } from "@/hooks/useConnectedClients";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AssignExerciseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exerciseId: string;
  exerciseTitle: string;
  onAssign: (clientIds: string[]) => Promise<void>;
}

export const AssignExerciseModal = ({
  open,
  onOpenChange,
  exerciseId,
  exerciseTitle,
  onAssign,
}: AssignExerciseModalProps) => {
  const { clients, isLoading } = useConnectedClients();
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const filteredClients = clients.filter((client) =>
    client.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleClient = (clientId: string) => {
    setSelectedClients((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleSelectAll = () => {
    if (selectedClients.length === filteredClients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(filteredClients.map((c) => c.id));
    }
  };

  const handleAssign = async () => {
    if (selectedClients.length === 0) return;

    setIsAssigning(true);
    try {
      await onAssign(selectedClients);
      setSelectedClients([]);
      setSearchQuery("");
      onOpenChange(false);
    } catch (error) {
      console.error("Assignment failed:", error);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleClose = () => {
    setSelectedClients([]);
    setSearchQuery("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] glass border-border">
        <DialogHeader>
          <DialogTitle className="text-xl">Assign Exercise to Clients</DialogTitle>
          <DialogDescription>
            Assign "{exerciseTitle}" to one or more of your clients
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Bar */}
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
          {filteredClients.length > 0 && (
            <div className="flex items-center gap-2 px-2">
              <Checkbox
                id="select-all"
                checked={selectedClients.length === filteredClients.length && filteredClients.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <label
                htmlFor="select-all"
                className="text-sm font-medium cursor-pointer"
              >
                {selectedClients.length === filteredClients.length && filteredClients.length > 0
                  ? "Deselect All"
                  : "Select All"}
              </label>
            </div>
          )}

          {/* Clients List */}
          <ScrollArea className="h-[300px] pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery
                  ? "No clients found matching your search"
                  : "No connected clients yet"}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredClients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center gap-3 p-3 rounded-lg glass hover:bg-background/60 transition-smooth cursor-pointer"
                    onClick={() => handleToggleClient(client.id)}
                  >
                    <Checkbox
                      checked={selectedClients.includes(client.id)}
                      onCheckedChange={() => handleToggleClient(client.id)}
                    />
                    <UserAvatar
                      fullName={client.full_name}
                      avatarUrl={client.avatar_url}
                      userId={client.id}
                      className="w-8 h-8"
                    />
                    <span className="text-sm font-medium">{client.full_name}</span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isAssigning}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={selectedClients.length === 0 || isAssigning}
              className="flex-1"
            >
              {isAssigning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                `Assign to ${selectedClients.length} client${selectedClients.length !== 1 ? "s" : ""}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
