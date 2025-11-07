import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, Video, Loader2 } from "lucide-react";
import { ExerciseCategory } from "@/hooks/useExercises";

interface UploadExerciseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const UploadExerciseModal = ({
  open,
  onOpenChange,
  onSuccess,
}: UploadExerciseModalProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ExerciseCategory | "">("");
  const [description, setDescription] = useState("");
  const [primaryMuscles, setPrimaryMuscles] = useState("");
  const [equipment, setEquipment] = useState("");
  const [keyAspects, setKeyAspects] = useState("");
  const [commonMistakes, setCommonMistakes] = useState("");
  const [suggestedSets, setSuggestedSets] = useState("");
  const [suggestedReps, setSuggestedReps] = useState("");
  const [suggestedWeight, setSuggestedWeight] = useState("");

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload .mov, .mp4, .avi, or .webm");
      return;
    }

    // Create preview and check duration
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.src = url;
    
    video.onloadedmetadata = () => {
      if (video.duration > 10) {
        toast.error("Video must be 10 seconds or less");
        URL.revokeObjectURL(url);
        return;
      }
      setVideoDuration(video.duration);
      setVideoFile(file);
      setVideoPreview(url);
    };
  };

  const handleUpload = async () => {
    if (!user || !videoFile || !title || !category) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!videoDuration || videoDuration > 10) {
      toast.error("Video must be 10 seconds or less");
      return;
    }

    setUploading(true);

    try {
      // Generate filename
      const timestamp = Date.now();
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const filename = `${timestamp}-${slug}.mp4`;

      // For now, we'll use the cloudfront URL pattern
      // In production, you'd upload to S3 and get the CloudFront URL
      const cloudfrontUrl = `https://d2ymeuuhxjxg6g.cloudfront.net/${filename}`;

      // Insert exercise into database
      const { error } = await supabase.from("exercises").insert({
        title,
        category,
        description: description || null,
        video_filename: filename,
        cloudfront_url: cloudfrontUrl,
        duration: Math.round(videoDuration),
        primary_muscles: primaryMuscles || null,
        equipment: equipment || null,
        key_aspects: keyAspects || null,
        common_mistakes: commonMistakes || null,
        suggested_sets: suggestedSets ? parseInt(suggestedSets) : null,
        suggested_reps: suggestedReps || null,
        suggested_weight: suggestedWeight || null,
        visibility: "private",
        created_by: user.id,
      });

      if (error) throw error;

      toast.success("Exercise uploaded successfully!");
      resetForm();
      onSuccess();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload exercise");
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setVideoFile(null);
    setVideoPreview(null);
    setVideoDuration(null);
    setTitle("");
    setCategory("");
    setDescription("");
    setPrimaryMuscles("");
    setEquipment("");
    setKeyAspects("");
    setCommonMistakes("");
    setSuggestedSets("");
    setSuggestedReps("");
    setSuggestedWeight("");
  };

  const handleClose = () => {
    if (!uploading) {
      resetForm();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Upload New Exercise</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Video Upload Section */}
          <div>
            <Label>Video File *</Label>
            <div className="mt-2">
              {videoPreview ? (
                <div className="relative">
                  <video
                    src={videoPreview}
                    controls
                    className="w-full max-h-64 rounded-lg bg-black"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setVideoFile(null);
                      setVideoPreview(null);
                      setVideoDuration(null);
                    }}
                  >
                    Remove Video
                  </Button>
                </div>
              ) : (
                <label className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag and drop or click to upload
                  </p>
                  <p className="text-xs text-muted-foreground">
                    .mov, .mp4, .avi, .webm (max 10 seconds)
                  </p>
                  <input
                    type="file"
                    accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                    onChange={handleVideoSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Basic Information</h3>
            
            <div>
              <Label htmlFor="title">Exercise Name *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                placeholder="e.g., Barbell Back Squat"
              />
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={(value) => setCategory(value as ExerciseCategory)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bodybuilding">Bodybuilding</SelectItem>
                  <SelectItem value="crossfit">CrossFit</SelectItem>
                  <SelectItem value="powerlifting">Powerlifting</SelectItem>
                  <SelectItem value="weightlifting">Weightlifting</SelectItem>
                  <SelectItem value="functional">Functional</SelectItem>
                  <SelectItem value="plyometrics">Plyometrics</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Brief description of the exercise..."
              />
            </div>
          </div>

          {/* Detailed Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Detailed Information</h3>
            
            <div>
              <Label htmlFor="primaryMuscles">Primary Muscle Groups</Label>
              <Input
                id="primaryMuscles"
                value={primaryMuscles}
                onChange={(e) => setPrimaryMuscles(e.target.value)}
                placeholder="e.g., Quadriceps, Glutes, Hamstrings"
              />
            </div>

            <div>
              <Label htmlFor="equipment">Equipment</Label>
              <Input
                id="equipment"
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                placeholder="e.g., Barbell, Rack"
              />
            </div>

            <div>
              <Label htmlFor="keyAspects">Key Aspects (Form Cues)</Label>
              <Textarea
                id="keyAspects"
                value={keyAspects}
                onChange={(e) => setKeyAspects(e.target.value)}
                rows={3}
                placeholder="• Keep chest up&#10;• Drive through heels&#10;• Maintain neutral spine"
              />
            </div>

            <div>
              <Label htmlFor="commonMistakes">Common Mistakes</Label>
              <Textarea
                id="commonMistakes"
                value={commonMistakes}
                onChange={(e) => setCommonMistakes(e.target.value)}
                rows={3}
                placeholder="• Knees caving inward&#10;• Rounding lower back&#10;• Not hitting depth"
              />
            </div>
          </div>

          {/* Suggested Program */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Suggested Program</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="sets">Sets</Label>
                <Input
                  id="sets"
                  type="number"
                  value={suggestedSets}
                  onChange={(e) => setSuggestedSets(e.target.value)}
                  placeholder="3"
                />
              </div>

              <div>
                <Label htmlFor="reps">Reps</Label>
                <Input
                  id="reps"
                  value={suggestedReps}
                  onChange={(e) => setSuggestedReps(e.target.value)}
                  placeholder="8-12"
                />
              </div>

              <div>
                <Label htmlFor="weight">Weight</Label>
                <Input
                  id="weight"
                  value={suggestedWeight}
                  onChange={(e) => setSuggestedWeight(e.target.value)}
                  placeholder="135 lb"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={uploading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || !videoFile || !title || !category}
              className="flex-1"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Exercise
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
