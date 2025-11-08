import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, Video, Loader2, FileVideo } from "lucide-react";
import { ExerciseCategory } from "@/hooks/useExercises";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [compressing, setCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);

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

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    
    video.onloadedmetadata = async () => {
      if (video.duration > 10) {
        toast.error("Video must be 10 seconds or less");
        URL.revokeObjectURL(url);
        return;
      }
      setVideoDuration(video.duration);
      setVideoFile(file);
      setVideoPreview(url);
      setOriginalSize(file.size);
      
      // Automatically compress video after selection
      await compressVideo(file);
    };
  };

  const compressVideo = async (file: File) => {
    setCompressing(true);
    setCompressionProgress(0);
    
    try {
      const ffmpeg = new FFmpeg();
      
      // Load FFmpeg
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      // Track progress
      ffmpeg.on('progress', ({ progress }) => {
        setCompressionProgress(Math.round(progress * 100));
      });

      // Write input file
      await ffmpeg.writeFile('input.mp4', await fetchFile(file));

      // Compress video with optimal settings
      // Target: 1.5 Mbps, max 1080p, H.264, 30fps, audio at 128kbps
      await ffmpeg.exec([
        '-i', 'input.mp4',
        '-c:v', 'libx264',           // H.264 codec
        '-preset', 'medium',          // Balance between speed and compression
        '-b:v', '1500k',              // Video bitrate: 1.5 Mbps
        '-maxrate', '2000k',          // Max bitrate: 2 Mbps
        '-bufsize', '3000k',          // Buffer size
        '-vf', 'scale=min(iw\\,1920):min(ih\\,1080):force_original_aspect_ratio=decrease', // Max 1080p
        '-r', '30',                   // 30 fps
        '-c:a', 'aac',                // AAC audio codec
        '-b:a', '128k',               // Audio bitrate: 128 kbps
        '-movflags', '+faststart',    // Enable streaming
        'output.mp4'
      ]);

      // Read output file
      const data = await ffmpeg.readFile('output.mp4');
      // Convert FileData to a proper Uint8Array for Blob
      const uint8Data = new Uint8Array(data as Uint8Array);
      const compressedBlob = new Blob([uint8Data.buffer], { type: 'video/mp4' });
      const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, '.mp4'), {
        type: 'video/mp4',
      });

      setCompressedFile(compressedFile);
      setCompressedSize(compressedFile.size);
      setCompressionProgress(100);
      
      const sizeSavedMB = ((file.size - compressedFile.size) / (1024 * 1024)).toFixed(2);
      const compressionRatio = ((1 - compressedFile.size / file.size) * 100).toFixed(0);
      
      toast.success(`Video compressed! Saved ${sizeSavedMB}MB (${compressionRatio}% reduction)`);
    } catch (error) {
      console.error("Compression error:", error);
      toast.error("Failed to compress video. Will upload original.");
      setCompressedFile(file); // Fallback to original
      setCompressedSize(file.size);
    } finally {
      setCompressing(false);
    }
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

    if (!compressedFile) {
      toast.error("Please wait for video compression to complete");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Upload compressed video to S3
      setUploadProgress(10);
      const formData = new FormData();
      formData.append('video', compressedFile); // Use compressed file
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

      const { success, cloudfrontUrl, filename, error: uploadError } = uploadResponse.data;
      
      if (!success || !cloudfrontUrl || !filename) {
        throw new Error(uploadError || "Failed to upload video to S3");
      }

      setUploadProgress(60);

      // Step 2: Insert exercise into database (remaining 40%)
      const { error: dbError } = await supabase.from("exercises").insert({
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
    setCompressedFile(null);
    setVideoPreview(null);
    setVideoDuration(null);
    setOriginalSize(0);
    setCompressedSize(0);
    setCompressionProgress(0);
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
    if (!uploading && !compressing) {
      resetForm();
      onOpenChange(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
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
                  {originalSize > 0 && (
                    <div className="mt-3 p-3 bg-secondary/50 rounded-lg space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Original Size:</span>
                        <span className="font-medium">{formatFileSize(originalSize)}</span>
                      </div>
                      {compressedSize > 0 && (
                        <>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Compressed Size:</span>
                            <span className="font-medium text-green-600">{formatFileSize(compressedSize)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Space Saved:</span>
                            <span className="font-medium text-green-600">
                              {formatFileSize(originalSize - compressedSize)} 
                              ({((1 - compressedSize / originalSize) * 100).toFixed(0)}%)
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <Button
                    variant="destructive"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setVideoFile(null);
                      setCompressedFile(null);
                      setVideoPreview(null);
                      setVideoDuration(null);
                      setOriginalSize(0);
                      setCompressedSize(0);
                    }}
                    disabled={compressing}
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
                    disabled={compressing || uploading}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Compression Progress */}
          {compressing && (
            <div className="space-y-2 p-4 bg-secondary/30 rounded-lg border border-border">
              <div className="flex items-center gap-2">
                <FileVideo className="w-5 h-5 text-primary animate-pulse" />
                <span className="text-sm font-medium">Compressing video...</span>
              </div>
              <Progress value={compressionProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Optimizing video for faster upload and playback ({compressionProgress}%)
              </p>
            </div>
          )}

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
              disabled={uploading || compressing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || compressing || !compressedFile || !title || !category}
              className="flex-1"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : compressing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Compressing...
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
