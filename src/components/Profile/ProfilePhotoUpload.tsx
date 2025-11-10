import { useState, useRef } from "react";
import { Camera, Upload, X, Crop } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactCrop, { Crop as CropType, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface ProfilePhotoUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfilePhotoUpload = ({ open, onOpenChange }: ProfilePhotoUploadProps) => {
  const { profile, user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<CropType>({ unit: "%", width: 90, height: 90, x: 5, y: 5 });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

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
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const getCroppedImg = async (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!imgRef.current || !completedCrop) {
        reject(new Error("No image to crop"));
        return;
      }

      const canvas = document.createElement("canvas");
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
      
      canvas.width = completedCrop.width;
      canvas.height = completedCrop.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("No 2d context"));
        return;
      }

      ctx.drawImage(
        imgRef.current,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        completedCrop.width,
        completedCrop.height
      );

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        resolve(blob);
      }, "image/jpeg", 0.95);
    });
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setUploading(true);
    try {
      // Get cropped image
      const croppedBlob = completedCrop ? await getCroppedImg() : selectedFile;
      
      // Upload to Supabase Storage
      const fileName = `${user.id}.jpg`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, croppedBlob, {
          cacheControl: "3600",
          upsert: true,
          contentType: "image/jpeg",
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
    setShowCropper(false);
    setCompletedCrop(null);
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
          {/* Cropper or Preview */}
          <div className="flex flex-col items-center gap-4">
            {showCropper && previewUrl ? (
              <div className="w-full space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Crop className="w-4 h-4" />
                  <span>Drag to crop your photo</span>
                </div>
                <div className="relative overflow-hidden rounded-lg border border-border">
                  <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={1}
                    circularCrop
                  >
                    <img
                      ref={imgRef}
                      src={previewUrl}
                      alt="Crop preview"
                      className="max-h-[400px] w-full object-contain"
                    />
                  </ReactCrop>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <UserAvatar
                  avatarUrl={profile?.avatar_url}
                  fullName={profile?.full_name || "User"}
                  userId={user?.id}
                  className="w-32 h-32 text-3xl"
                />
                <p className="text-sm text-muted-foreground text-center">
                  {profile?.full_name || "User"}
                </p>
              </div>
            )}
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
