import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Search, Send } from "lucide-react";
import { useSearchProfiles } from "@/hooks/useSearchProfiles";
import { useCoachClientConnections } from "@/hooks/useCoachClientConnections";
import { useClients } from "@/hooks/useClients";

interface SendRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SendRequestDialog = ({ open, onOpenChange }: SendRequestDialogProps) => {
  const [email, setEmail] = useState("");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const { searchClientByEmail, isSearching } = useSearchProfiles();
  const { sendRequest } = useCoachClientConnections();
  const { clients } = useClients();
  const [isSending, setIsSending] = useState(false);

  const handleSearch = async () => {
    if (!email.trim()) return;
    
    // Search in existing clients list by email/name
    const client = clients.find(c => 
      c.full_name?.toLowerCase().includes(email.toLowerCase()) ||
      c.id === email
    );
    
    if (client) {
      setSelectedClient(client);
    } else {
      setSelectedClient(null);
    }
  };

  const handleSendRequest = async () => {
    if (!selectedClient) return;
    
    setIsSending(true);
    try {
      await sendRequest(selectedClient.id);
      onOpenChange(false);
      setEmail("");
      setSelectedClient(null);
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setEmail("");
    setSelectedClient(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass border-border/50 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Send Connection Request</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter client email or name"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching || !email.trim()}
              size="icon"
              variant="secondary"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {selectedClient && (
            <div className="glass rounded-lg p-4 border border-border/50">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedClient.id}`} />
                  <AvatarFallback>
                    {selectedClient.full_name?.split(" ").map((n: string) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">{selectedClient.full_name}</p>
                  <p className="text-sm text-muted-foreground capitalize">{selectedClient.role}</p>
                </div>
              </div>

              <Button
                onClick={handleSendRequest}
                disabled={isSending}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSending ? "Sending..." : "Send Request"}
              </Button>
            </div>
          )}

          {email && !selectedClient && !isSearching && (
            <p className="text-sm text-muted-foreground text-center">
              No client found with that email or name
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
