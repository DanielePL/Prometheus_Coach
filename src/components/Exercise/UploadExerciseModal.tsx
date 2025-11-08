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
import { Upload, Video, Loader2, FileVideo } from "lucide-react";
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [compressing, setCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number>(0);
  const [showUploadOriginalDialog, setShowUploadOriginalDialog] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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
    
    // 30 second timeout
    const COMPRESSION_TIMEOUT = 30000;
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Compression timeout after 30 seconds')), COMPRESSION_TIMEOUT);
    });
    
    try {
      console.log('[Compression] Starting compression for:', file.name, file.size, 'bytes');
      
      // Create video element to get dimensions
      const videoElement = document.createElement('video');
      videoElement.src = URL.createObjectURL(file);
      
      await Promise.race([
        new Promise<void>((resolve, reject) => {
          videoElement.onloadedmetadata = () => resolve();
          videoElement.onerror = () => reject(new Error('Failed to load video'));
        }),
        timeoutPromise
      ]);

      const { videoWidth, videoHeight } = videoElement;
      console.log('[Compression] Video dimensions:', videoWidth, 'x', videoHeight);
      
      // Calculate target dimensions (max 720p)
      const MAX_WIDTH = 1280;
      const MAX_HEIGHT = 720;
      let targetWidth = videoWidth;
      let targetHeight = videoHeight;
      
      if (videoWidth > MAX_WIDTH || videoHeight > MAX_HEIGHT) {
        const aspectRatio = videoWidth / videoHeight;
        if (aspectRatio > MAX_WIDTH / MAX_HEIGHT) {
          targetWidth = MAX_WIDTH;
          targetHeight = Math.round(MAX_WIDTH / aspectRatio);
        } else {
          targetHeight = MAX_HEIGHT;
          targetWidth = Math.round(MAX_HEIGHT * aspectRatio);
        }
      }

      console.log('[Compression] Target dimensions:', targetWidth, 'x', targetHeight);
      setCompressionProgress(10);

      // Create canvas for drawing frames
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Failed to get canvas context');

      setCompressionProgress(20);

      // Set up MediaRecorder - prioritize MP4 for S3 compatibility
      const stream = canvas.captureStream(30); // 30fps
      
      // Try MP4 first for best S3 compatibility, then webm fallback
      const mimeTypes = [
        'video/mp4',
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm'
      ];
      
      let selectedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));
      
      if (!selectedMimeType) {
        throw new Error('No supported video encoding format found');
      }

      console.log('[Compression] Using MIME type:', selectedMimeType);

      const chunks: Blob[] = [];
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
        videoBitsPerSecond: 1500000, // 1.5 Mbps
      });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
          console.log('[Compression] Chunk received:', e.data.size, 'bytes');
        }
      };

      setCompressionProgress(30);

      // Record video frames with timeout
      const recordingPromise = Promise.race([
        new Promise<Blob>((resolve, reject) => {
          mediaRecorder.onstop = () => {
            // Force MP4 type if using webm for better S3 compatibility
            const finalMimeType = selectedMimeType!.includes('webm') ? 'video/mp4' : selectedMimeType!.split(';')[0];
            const blob = new Blob(chunks, { type: finalMimeType });
            console.log('[Compression] Recording complete. Blob size:', blob.size, 'Type:', blob.type);
            resolve(blob);
          };
          mediaRecorder.onerror = (e) => {
            console.error('[Compression] MediaRecorder error:', e);
            reject(e);
          };
        }),
        timeoutPromise
      ]);

      mediaRecorder.start();
      videoElement.play();

      // Draw frames to canvas
      const drawFrame = () => {
        if (videoElement.ended) {
          mediaRecorder.stop();
          URL.revokeObjectURL(videoElement.src);
          return;
        }
        
        ctx.drawImage(videoElement, 0, 0, targetWidth, targetHeight);
        
        // Update progress based on video playback
        const progress = 30 + (videoElement.currentTime / videoElement.duration) * 60;
        setCompressionProgress(Math.round(progress));
        
        requestAnimationFrame(drawFrame);
      };

      drawFrame();

      const compressedBlob = await recordingPromise;
      setCompressionProgress(100);

      // Create file from blob - always use .mp4 extension for S3
      const compressedFile = new File(
        [compressedBlob], 
        file.name.replace(/\.[^/.]+$/, '.mp4'), 
        { type: 'video/mp4' }
      );

      console.log('[Compression] Final compressed file:', compressedFile.name, compressedFile.size, 'bytes', compressedFile.type);

      setCompressedFile(compressedFile);
      setCompressedSize(compressedFile.size);
      
      if (compressedFile.size < file.size) {
        const sizeSavedMB = ((file.size - compressedFile.size) / (1024 * 1024)).toFixed(2);
        const compressionRatio = ((1 - compressedFile.size / file.size) * 100).toFixed(0);
        toast.success(`Video compressed! Saved ${sizeSavedMB}MB (${compressionRatio}% reduction)`);
      } else {
        toast.info("Video already optimized, using original");
        setCompressedFile(file);
        setCompressedSize(file.size);
      }
    } catch (error) {
      console.error("[Compression] Error:", error);
      if (error instanceof Error) {
        console.error("[Compression] Error message:", error.message);
        console.error("[Compression] Error stack:", error.stack);
      }
      toast.error("Compression failed. You can upload the original file.");
      setShowUploadOriginalDialog(true);
    } finally {
      setCompressing(false);
    }
  };

  const handleUploadOriginal = () => {
    setCompressedFile(videoFile);
    setCompressedSize(videoFile?.size || 0);
    setShowUploadOriginalDialog(false);
    toast.info("Using original video file");
  };

  const handleCancelUploadOriginal = () => {
    setShowUploadOriginalDialog(false);
    setVideoFile(null);
    setVideoPreview(null);
    setVideoDuration(null);
    setOriginalSize(0);
    setCompressedSize(0);
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

    if (compressing || uploading) return;

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];

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

    {/* Upload Original Confirmation Dialog */}
    <AlertDialog open={showUploadOriginalDialog} onOpenChange={setShowUploadOriginalDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Video Compression Unavailable</AlertDialogTitle>
          <AlertDialogDescription>
            Video compression failed. The original file is {formatFileSize(originalSize)}. 
            Would you like to upload the original video anyway?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancelUploadOriginal}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleUploadOriginal}>
            Upload Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
};
