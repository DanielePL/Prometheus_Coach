import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import * as DialogPrimitive from "@radix-ui/react-dialog";

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
}

export const VideoPlayerModal = ({ isOpen, onClose, videoUrl, title }: VideoPlayerModalProps) => {
  const isMobile = useIsMobile();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isOpen && videoRef.current) {
      if (isMobile) {
        // Request fullscreen on mobile
        videoRef.current.play();
        videoRef.current.requestFullscreen?.()
          .catch(() => {
            // Fallback if fullscreen fails
            console.log("Fullscreen not supported");
          });
      } else {
        // Autoplay on desktop
        videoRef.current.play();
      }
    }

    // Cleanup: pause video when modal closes
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, [isOpen, isMobile]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
    }

    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPortal>
        <DialogPrimitive.Overlay 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          onClick={onClose}
        />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-[90vw] max-w-[90vw] translate-x-[-50%] translate-y-[-50%] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="relative w-full">
            {/* Close button */}
            <button 
              onClick={onClose}
              className="absolute -top-12 right-0 z-50 rounded-full p-2 glass hover:bg-primary/20 transition-smooth"
              aria-label="Close video"
            >
              <X className="h-6 w-6 text-primary" />
            </button>

            {/* Video player */}
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              className="w-full max-h-[90vh] rounded-lg shadow-2xl"
              playsInline
              aria-label={title}
            />
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};
