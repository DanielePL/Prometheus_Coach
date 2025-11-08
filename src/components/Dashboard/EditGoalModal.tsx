import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (text: string) => void;
  currentText: string;
}

export const EditGoalModal = ({ isOpen, onClose, onSave, currentText }: EditGoalModalProps) => {
  const [text, setText] = useState(currentText);

  const handleSave = () => {
    if (text.trim()) {
      onSave(text.trim());
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] glass border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Edit Goal</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="goal-text">Goal</Label>
            <Input
              id="goal-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter your goal..."
              className="glass border-primary/20"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave();
                }
              }}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!text.trim()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
