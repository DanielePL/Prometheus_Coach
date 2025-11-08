import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, Copy, Trash2, Plus, Power } from "lucide-react";
import { useBookingLinks } from "@/hooks/useBookingLinks";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

export function BookingLinksSettings() {
  const { bookingLinks, isLoading, createBookingLink, updateBookingLink, deleteBookingLink } =
    useBookingLinks();
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [duration, setDuration] = useState("60");
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!title || !slug || !duration) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    await createBookingLink(title, slug, parseInt(duration));
    setIsCreating(false);
    setTitle("");
    setSlug("");
    setDuration("60");
  };

  const copyBookingUrl = (slug: string) => {
    const url = `${window.location.origin}/book/${slug}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied!",
      description: "Booking link copied to clipboard",
    });
  };

  const toggleEnabled = async (id: string, currentState: boolean) => {
    await updateBookingLink(id, { is_enabled: !currentState });
  };

  if (isLoading) {
    return <div className="text-center p-4">Loading...</div>;
  }

  return (
    <Card className="p-6 glass">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Booking Links</h3>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Link
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Booking Link</DialogTitle>
              <DialogDescription>
                Create a shareable link for clients to book time slots
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Book a Consultation"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">/book/</span>
                  <Input
                    id="slug"
                    placeholder="consultation"
                    value={slug}
                    onChange={(e) =>
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="15"
                  step="15"
                  placeholder="60"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create Link</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {bookingLinks.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No booking links yet. Create one to allow clients to schedule time with you.
          </div>
        ) : (
          bookingLinks.map((link) => (
            <div
              key={link.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-sm">{link.title}</p>
                  <Badge variant={link.is_enabled ? "default" : "secondary"} className="text-xs">
                    {link.is_enabled ? "Active" : "Disabled"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {window.location.origin}/book/{link.slug}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Duration: {link.duration_minutes} minutes
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleEnabled(link.id, link.is_enabled)}
                  className="h-8 w-8 p-0"
                >
                  <Power className={`h-4 w-4 ${link.is_enabled ? 'text-primary' : 'text-muted-foreground'}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyBookingUrl(link.slug)}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteBookingLink(link.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
        <p className="text-xs text-muted-foreground">
          💡 Share booking links with clients to let them schedule time based on your business
          hours and availability. Blocked time slots are automatically excluded.
        </p>
      </div>
    </Card>
  );
}
