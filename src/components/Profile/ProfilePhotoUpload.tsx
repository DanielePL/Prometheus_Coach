import { useState } from "react";
import { Camera, Upload, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProfilePhotoUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfilePhotoUpload = ({ open, onOpenChange }: ProfilePhotoUploadProps) => {
  const { profile, user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    // Validate file type
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPG, PNG, and WEBP images are allowed");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setUploading(true);
    try {
      // Upload to Supabase Storage
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      toast.success("Profile photo updated successfully!");
      
      // Reset state and close dialog
      setSelectedFile(null);
      setPreviewUrl(null);
      onOpenChange(false);
      
      // Reload to update avatar everywhere
      window.location.reload();
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload profile photo");
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Camera className="w-6 h-6 text-primary" />
            Profile Photo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current/Preview Photo */}
          <div className="flex flex-col items-center gap-4">
            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-32 h-32 rounded-full object-cover border-4 border-primary"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full"
                  onClick={handleCancel}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <UserAvatar
                avatarUrl={profile?.avatar_url}
                fullName={profile?.full_name || "User"}
                userId={user?.id}
                className="w-32 h-32 text-3xl"
              />
            )}
            <p className="text-sm text-muted-foreground text-center">
              {profile?.full_name || "User"}
            </p>
          </div>

          {/* Upload Actions */}
          {!selectedFile ? (
            <div className="space-y-3">
              <input
                type="file"
                id="avatar-upload"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label htmlFor="avatar-upload">
                <Button
                  type="button"
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={() => document.getElementById("avatar-upload")?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Change Photo
                </Button>
              </label>
              <p className="text-xs text-muted-foreground text-center">
                Max 5MB • JPG, PNG, or WEBP
              </p>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCancel}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Save Photo"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
