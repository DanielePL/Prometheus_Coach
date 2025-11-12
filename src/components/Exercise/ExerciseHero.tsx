import { Play } from "lucide-react";
import { useEffect, useRef } from "react";

interface ExerciseHeroProps {
  image: string;
  alt: string;
  title?: string;
  onPlayClick?: () => void;
}

export const ExerciseHero = ({ image, alt, title, onPlayClick }: ExerciseHeroProps) => {
  const isVideo = image?.toLowerCase().includes('.mp4') || 
                  image?.toLowerCase().includes('.mov') || 
                  image?.includes('cloudfront');

  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    try {
      v.muted = true;
      v.playsInline = true;
      v.setAttribute('playsinline', 'true');
      v.setAttribute('webkit-playsinline', 'true');
      const playPromise = v.play();
      if (playPromise && typeof (playPromise as any).then === 'function') {
        (playPromise as Promise<void>).catch(() => {
          // Autoplay might still be blocked without user gesture in some contexts
        });
      }
    } catch {}
  }, [image]);

  return (
    <div className="relative w-full aspect-video lg:aspect-[16/10] rounded-3xl overflow-hidden">
      {isVideo ? (
        <video
          ref={videoRef}
          src={image}
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          webkit-playsinline="true"
          onCanPlay={() => { try { videoRef.current?.play(); } catch {} }}
        />
      ) : (
        <img 
          src={image} 
          alt={alt}
          className="w-full h-full object-cover"
        />
      )}
      <div className="absolute inset-x-0 bottom-0 h-32 z-10 opacity-100 pointer-events-none backdrop-blur-sm bg-gradient-to-t from-background/20 to-transparent" />
      {title && (
        <div className="absolute bottom-6 left-6 z-20">
          <h2 className="text-white font-heading font-normal text-2xl lg:text-3xl drop-shadow-lg">
            {title}
          </h2>
        </div>
      )}
      <button 
        onClick={onPlayClick}
        className="absolute bottom-6 right-6 z-20 glass glass-hover px-4 py-3 rounded-xl flex items-center gap-2 text-white transition-smooth hover:scale-105 hover:glow-orange"
        aria-label="Play video"
      >
        <Play className="w-5 h-5 fill-white" />
        <span className="font-medium text-white">Play Video</span>
      </button>
    </div>
  );
};
