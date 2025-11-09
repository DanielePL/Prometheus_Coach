import { useState } from "react";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCoachNotes } from "@/hooks/useCoachNotes";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface ClientNotesTabProps {
  clientId: string;
}

export const ClientNotesTab = ({ clientId }: ClientNotesTabProps) => {
  const { user } = useAuth();
  const { data: notes, isLoading, refetch } = useCoachNotes(clientId);
  const [isAdding, setIsAdding] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const handleAddNote = async () => {
    if (!newNote.trim() || !user) return;

    try {
      const { error } = await supabase.from("coach_notes").insert({
        coach_id: user.id,
        client_id: clientId,
        note_text: newNote,
      });

      if (error) throw error;

      toast.success("Note added successfully");
      setNewNote("");
      setIsAdding(false);
      refetch();
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note");
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editText.trim()) return;

    try {
      const { error } = await supabase
        .from("coach_notes")
        .update({ note_text: editText })
        .eq("id", noteId);

      if (error) throw error;

      toast.success("Note updated successfully");
      setEditingId(null);
      setEditText("");
      refetch();
    } catch (error) {
      console.error("Error updating note:", error);
      toast.error("Failed to update note");
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from("coach_notes")
        .delete()
        .eq("id", noteId);

      if (error) throw error;

      toast.success("Note deleted successfully");
      refetch();
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Coach Notes</h2>
          <p className="text-sm text-muted-foreground">Private notes only visible to you</p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Add Note
          </Button>
        )}
      </div>

      {/* Add New Note */}
      {isAdding && (
        <div className="glass rounded-2xl p-6">
          <Textarea
            placeholder="Write your note here..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="mb-4 min-h-[120px]"
          />
          <div className="flex gap-2">
            <Button onClick={handleAddNote} disabled={!newNote.trim()}>
              <Save className="w-4 h-4 mr-2" />
              Save Note
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsAdding(false);
                setNewNote("");
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Notes List */}
      {notes && notes.length > 0 ? (
        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="glass rounded-2xl p-6">
              {editingId === note.id ? (
                <>
                  <Textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="mb-4 min-h-[120px]"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleUpdateNote(note.id)}>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingId(null);
                        setEditText("");
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-sm text-muted-foreground">
                      {new Date(note.created_at).toLocaleString()}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingId(note.id);
                          setEditText(note.note_text);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap">{note.note_text}</p>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        !isAdding && (
          <div className="glass rounded-2xl p-12 text-center">
            <h3 className="text-xl font-bold mb-2">No notes yet</h3>
            <p className="text-muted-foreground mb-6">
              Add private notes about this client's progress, goals, or observations
            </p>
            <Button onClick={() => setIsAdding(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add First Note
            </Button>
          </div>
        )
      )}
    </div>
  );
};
