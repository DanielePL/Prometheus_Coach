import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload } from "lucide-react";
import { useUploadProgressPhoto } from "@/hooks/useProgressPhotos";

interface UploadPhotoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadPhotoDialog({ open, onOpenChange }: UploadPhotoDialogProps) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [type, setType] = useState<string>("front");
  const [file, setFile] = useState<File | null>(null);
  const uploadPhoto = useUploadProgressPhoto();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) return;

    await uploadPhoto.mutateAsync({
      file,
      date,
      type,
    });

    // Reset form
    setDate(new Date().toISOString().split("T")[0]);
    setType("front");
    setFile(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Progress Photo</DialogTitle>
          <DialogDescription>
            Document your transformation journey with progress photos
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Photo Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Select photo type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="front">Front View</SelectItem>
                <SelectItem value="side">Side View</SelectItem>
                <SelectItem value="back">Back View</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="photo">Photo</Label>
            <Input
              id="photo"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              required
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={uploadPhoto.isPending || !file}
              className="flex-1"
            >
              {uploadPhoto.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
