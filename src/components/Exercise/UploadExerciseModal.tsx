import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";
import { ExerciseCategory } from "@/hooks/useExercises";
import { MultiSelectAutocomplete, MUSCLE_GROUPS, SECONDARY_MUSCLE_GROUPS, EQUIPMENT_OPTIONS } from "@/components/ui/multi-select-autocomplete";
import { SingleSelectAutocomplete, EXERCISE_NAMES } from "@/components/ui/single-select-autocomplete";

interface UploadExerciseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// Helper function to generate thumbnail from video
const generateThumbnail = (videoUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.src = videoUrl
    video.crossOrigin = 'anonymous'
    video.currentTime = 1 // Seek to 1 second for better frame
    
    video.onloadeddata = () => {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Convert to blob with JPEG compression
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create thumbnail blob'))
          return
        }
        const url = canvas.toDataURL('image/jpeg', 0.8)
        resolve(url)
      }, 'image/jpeg', 0.8)
    }
    
    video.onerror = () => reject(new Error('Failed to load video for thumbnail'))
  })
}

export const UploadExerciseModal = ({
  open,
  onOpenChange,
  onSuccess,
}: UploadExerciseModalProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [fileSize, setFileSize] = useState<number>(0);
  const [showLargeFileDialog, setShowLargeFileDialog] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ExerciseCategory | "">("");
  const [description, setDescription] = useState("");
  const [primaryMuscles, setPrimaryMuscles] = useState("");
  const [secondaryMuscles, setSecondaryMuscles] = useState("");
  const [equipment, setEquipment] = useState("");
  const [keyAspects, setKeyAspects] = useState("");
  const [commonMistakes, setCommonMistakes] = useState("");
  const [suggestedSets, setSuggestedSets] = useState("");
  const [suggestedReps, setSuggestedReps] = useState("");
  const [suggestedWeight, setSuggestedWeight] = useState("");

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    processVideoFile(file);
  };

  const processVideoFile = (file: File) => {
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
      setFileSize(file.size);

      // Show warning for large files (> 10MB)
      const TEN_MB = 10 * 1024 * 1024;
      if (file.size > TEN_MB) {
        setShowLargeFileDialog(true);
      }
    };
  };

  const handleConfirmLargeFile = () => {
    setShowLargeFileDialog(false);
    toast.info("Uploading original video file");
  };

  const handleCancelLargeFile = () => {
    setShowLargeFileDialog(false);
    setVideoFile(null);
    setVideoPreview(null);
    setVideoDuration(null);
    setFileSize(0);
    toast.info("Video upload cancelled");
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
    setUploadProgress(0);

    try {
      // Step 1: Upload video to S3
      setUploadProgress(10);
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('exerciseName', title);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      setUploadProgress(20);
      
      const uploadResponse = await supabase.functions.invoke('upload-video-to-s3', {
        body: formData,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (uploadResponse.error) {
        throw new Error(uploadResponse.error.message || "Failed to upload video");
      }

      const { success, cloudfrontUrl, thumbnailUrl, filename, error: uploadError } = uploadResponse.data;
      
      if (!success || !cloudfrontUrl || !filename) {
        throw new Error(uploadError || "Failed to upload video to S3");
      }

      console.log('📹 Video uploaded:', cloudfrontUrl)
      if (thumbnailUrl) {
        console.log('🖼️ Thumbnail URL:', thumbnailUrl)
      }

      setUploadProgress(60);

      // Generate thumbnail from video element if not provided by server
      let finalThumbnailUrl = thumbnailUrl
      if (!finalThumbnailUrl && videoPreview) {
        try {
          console.log('🎬 Generating thumbnail client-side...')
          const thumbnailDataUrl = await generateThumbnail(videoPreview)
          
          // Upload thumbnail to S3
          const thumbnailBlob = await (await fetch(thumbnailDataUrl)).blob()
          const thumbnailFile = new File([thumbnailBlob], `${filename.replace('.mp4', '-thumb.jpg')}`, { type: 'image/jpeg' })
          
          // We need to upload this thumbnail to S3 or Supabase storage
          // For now, we'll use the video URL as poster, but store the data URL
          finalThumbnailUrl = thumbnailDataUrl
          console.log('✅ Thumbnail generated client-side')
        } catch (thumbError) {
          console.error('❌ Client-side thumbnail generation failed:', thumbError)
        }
      }

      setUploadProgress(70);

      // Step 2: Insert exercise into database
      const { error: dbError } = await supabase.from("exercises").insert({
        title,
        category,
        description: description || null,
        video_filename: filename,
        cloudfront_url: cloudfrontUrl,
        thumbnail_url: finalThumbnailUrl || null,
        duration: Math.round(videoDuration),
        primary_muscles: primaryMuscles || null,
        secondary_muscles: secondaryMuscles || null,
        equipment: equipment || null,
        key_aspects: keyAspects || null,
        common_mistakes: commonMistakes || null,
        suggested_sets: suggestedSets ? parseInt(suggestedSets) : null,
        suggested_reps: suggestedReps || null,
        suggested_weight: suggestedWeight || null,
        visibility: "private",
        created_by: user.id,
      });

      if (dbError) throw dbError;

      setUploadProgress(100);
      toast.success("Exercise uploaded successfully!");
      resetForm();
      onSuccess();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload exercise");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setVideoFile(null);
    setVideoPreview(null);
    setVideoDuration(null);
    setFileSize(0);
    setTitle("");
    setCategory("");
    setDescription("");
    setPrimaryMuscles("");
    setSecondaryMuscles("");
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

  const formatFileSize = (bytes: number): string => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (uploading) return;

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];
    processVideoFile(file);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto !rounded-none sm:!rounded-none">
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
                  
                  {/* File Size Info */}
                  {fileSize > 0 && (
                    <div className="mt-3 p-3 bg-secondary/50 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">File Size:</span>
                        <span className="font-medium">{formatFileSize(fileSize)}</span>
                      </div>
                    </div>
                  )}

                  <Button
                    variant="destructive"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setVideoFile(null);
                      setVideoPreview(null);
                      setVideoDuration(null);
                      setFileSize(0);
                    }}
                    disabled={uploading}
                  >
                    Remove Video
                  </Button>
                </div>
              ) : (
                <label 
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                    isDragging 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted-foreground/25 hover:border-primary'
                  }`}
                >
                  <Upload className={`w-12 h-12 mb-4 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className="text-sm text-muted-foreground mb-2">
                    {isDragging ? 'Drop video here' : 'Drag and drop or click to upload'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    .mov, .mp4, .avi, .webm (max 10 seconds)
                  </p>
                  <input
                    type="file"
                    accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                    onChange={handleVideoSelect}
                    className="hidden"
                    disabled={uploading}
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
              <SingleSelectAutocomplete
                options={EXERCISE_NAMES}
                value={title}
                onChange={setTitle}
                placeholder="e.g., Barbell Back Squat"
                disabled={uploading}
                required
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
              <MultiSelectAutocomplete
                options={MUSCLE_GROUPS}
                value={primaryMuscles}
                onChange={setPrimaryMuscles}
                placeholder="Type to search muscles..."
                emptyMessage="No matching muscles found."
                disabled={uploading}
              />
            </div>

            <div>
              <Label htmlFor="secondaryMuscles">Secondary Muscle Groups</Label>
              <MultiSelectAutocomplete
                options={SECONDARY_MUSCLE_GROUPS}
                value={secondaryMuscles}
                onChange={setSecondaryMuscles}
                placeholder="Type to search secondary muscles..."
                emptyMessage="No matching muscles found."
                disabled={uploading}
              />
            </div>

            <div>
              <Label htmlFor="equipment">Equipment</Label>
              <MultiSelectAutocomplete
                options={EQUIPMENT_OPTIONS}
                value={equipment}
                onChange={setEquipment}
                placeholder="Type to search equipment..."
                emptyMessage="No matching equipment found."
                disabled={uploading}
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

          {/* Upload Progress */}
          {uploading && uploadProgress > 0 && (
            <div className="space-y-2 p-4 bg-secondary/30 rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Uploading to cloud...</span>
                <span className="text-sm font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

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

    {/* Large File Warning Dialog */}
    <AlertDialog open={showLargeFileDialog} onOpenChange={setShowLargeFileDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Large File Detected</AlertDialogTitle>
          <AlertDialogDescription>
            This video is larger than 10MB ({formatFileSize(fileSize)}). Consider compressing it before upload for better performance.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancelLargeFile}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmLargeFile}>
            Upload Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
};
