import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteGoalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteGoalDialog = ({ isOpen, onClose, onConfirm }: DeleteGoalDialogProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="glass border-primary/20">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this goal?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this goal? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-destructive hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
