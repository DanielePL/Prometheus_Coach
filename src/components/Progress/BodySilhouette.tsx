import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MeasurementData {
  neck?: number | null;
  chest?: number | null;
  waist?: number | null;
  hips?: number | null;
  arms?: number | null;
  legs?: number | null;
  glutes?: number | null;
}

interface MeasurementChanges {
  neck?: number | null;
  chest?: number | null;
  waist?: number | null;
  hips?: number | null;
  arms?: number | null;
  legs?: number | null;
  glutes?: number | null;
}

interface BodySilhouetteProps {
  measurements?: MeasurementData | null;
  changes?: MeasurementChanges | null;
  className?: string;
}

interface MeasurementLabelProps {
  label: string;
  value?: number | null;
  change?: number | null;
  position: "left" | "right";
  top: string;
  lineLength?: number;
}

const MeasurementLabel = ({
  label,
  value,
  change,
  position,
  top,
  lineLength = 60,
}: MeasurementLabelProps) => {
  if (!value) return null;

  const getTrendIcon = () => {
    if (!change || change === 0) return <Minus className="w-3 h-3 text-muted-foreground" />;
    if (change > 0) return <TrendingUp className="w-3 h-3 text-green-500" />;
    return <TrendingDown className="w-3 h-3 text-red-500" />;
  };

  const getChangeColor = () => {
    if (!change || change === 0) return "text-muted-foreground";
    // For waist, decrease is good (green), for muscles increase is good
    const isWaist = label.toLowerCase() === "waist";
    if (isWaist) {
      return change < 0 ? "text-green-500" : "text-red-500";
    }
    return change > 0 ? "text-green-500" : "text-red-500";
  };

  return (
    <div
      className={`absolute flex items-center gap-1 ${
        position === "left" ? "flex-row-reverse right-1/2 mr-8" : "flex-row left-1/2 ml-8"
      }`}
      style={{ top }}
    >
      {/* Line connecting to body */}
      <div
        className={`h-px bg-primary/50 ${position === "left" ? "ml-1" : "mr-1"}`}
        style={{ width: lineLength }}
      />

      {/* Dot on body */}
      <div className="w-2 h-2 rounded-full bg-primary absolute"
        style={{
          [position === "left" ? "right" : "left"]: -4,
        }}
      />

      {/* Label Card */}
      <div className={`glass rounded-lg px-3 py-1.5 min-w-[90px] ${
        position === "left" ? "text-right" : "text-left"
      }`}>
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className={`flex items-center gap-1 ${position === "left" ? "justify-end" : "justify-start"}`}>
          <span className="text-sm font-bold">{value} cm</span>
          {change !== null && change !== undefined && (
            <div className={`flex items-center text-xs ${getChangeColor()}`}>
              {getTrendIcon()}
              <span>{change > 0 ? "+" : ""}{change.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const BodySilhouette = ({
  measurements,
  changes,
  className = "",
}: BodySilhouetteProps) => {
  return (
    <div className={`relative w-full max-w-md mx-auto ${className}`}>
      {/* SVG Body Silhouette - Front View */}
      <svg
        viewBox="0 0 200 400"
        className="w-full h-auto"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="bodyGradient" x1="100" y1="0" x2="100" y2="400" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="bodyStroke" x1="100" y1="0" x2="100" y2="400" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Head */}
        <ellipse
          cx="100"
          cy="30"
          rx="22"
          ry="26"
          fill="url(#bodyGradient)"
          stroke="url(#bodyStroke)"
          strokeWidth="1.5"
        />

        {/* Neck */}
        <path
          d="M 90 54 L 90 65 Q 90 70 95 72 L 105 72 Q 110 70 110 65 L 110 54"
          fill="url(#bodyGradient)"
          stroke="url(#bodyStroke)"
          strokeWidth="1.5"
        />

        {/* Torso */}
        <path
          d="M 95 72
             Q 60 75 50 95
             L 45 130
             Q 42 145 45 160
             L 50 190
             Q 55 205 65 210
             L 75 215
             Q 90 220 100 220
             Q 110 220 125 215
             L 135 210
             Q 145 205 150 190
             L 155 160
             Q 158 145 155 130
             L 150 95
             Q 140 75 105 72
             Z"
          fill="url(#bodyGradient)"
          stroke="url(#bodyStroke)"
          strokeWidth="1.5"
        />

        {/* Left Arm */}
        <path
          d="M 50 95
             Q 35 100 28 120
             L 20 160
             Q 15 180 18 200
             L 22 230
             Q 25 245 30 255
             L 35 265
             Q 38 270 42 268
             L 45 265
             Q 48 260 45 250
             L 40 220
             Q 38 200 42 180
             L 48 150
             Q 52 130 50 110"
          fill="url(#bodyGradient)"
          stroke="url(#bodyStroke)"
          strokeWidth="1.5"
        />

        {/* Right Arm */}
        <path
          d="M 150 95
             Q 165 100 172 120
             L 180 160
             Q 185 180 182 200
             L 178 230
             Q 175 245 170 255
             L 165 265
             Q 162 270 158 268
             L 155 265
             Q 152 260 155 250
             L 160 220
             Q 162 200 158 180
             L 152 150
             Q 148 130 150 110"
          fill="url(#bodyGradient)"
          stroke="url(#bodyStroke)"
          strokeWidth="1.5"
        />

        {/* Hips/Pelvis */}
        <path
          d="M 65 210
             Q 55 225 55 245
             L 58 260
             Q 62 275 75 280
             L 100 285
             L 125 280
             Q 138 275 142 260
             L 145 245
             Q 145 225 135 210"
          fill="url(#bodyGradient)"
          stroke="url(#bodyStroke)"
          strokeWidth="1.5"
        />

        {/* Left Leg */}
        <path
          d="M 75 280
             Q 65 290 62 310
             L 58 350
             Q 55 370 58 385
             L 60 395
             Q 62 400 75 400
             L 85 398
             Q 90 395 88 385
             L 85 360
             Q 82 340 85 320
             L 90 295
             Q 92 285 100 285"
          fill="url(#bodyGradient)"
          stroke="url(#bodyStroke)"
          strokeWidth="1.5"
        />

        {/* Right Leg */}
        <path
          d="M 125 280
             Q 135 290 138 310
             L 142 350
             Q 145 370 142 385
             L 140 395
             Q 138 400 125 400
             L 115 398
             Q 110 395 112 385
             L 115 360
             Q 118 340 115 320
             L 110 295
             Q 108 285 100 285"
          fill="url(#bodyGradient)"
          stroke="url(#bodyStroke)"
          strokeWidth="1.5"
        />

        {/* Measurement indicator dots */}
        {measurements?.neck && (
          <circle cx="100" cy="62" r="3" fill="hsl(var(--primary))" className="animate-pulse" />
        )}
        {measurements?.chest && (
          <circle cx="100" cy="115" r="3" fill="hsl(var(--primary))" className="animate-pulse" />
        )}
        {measurements?.arms && (
          <>
            <circle cx="35" cy="160" r="3" fill="hsl(var(--primary))" className="animate-pulse" />
            <circle cx="165" cy="160" r="3" fill="hsl(var(--primary))" className="animate-pulse" />
          </>
        )}
        {measurements?.waist && (
          <circle cx="100" cy="175" r="3" fill="hsl(var(--primary))" className="animate-pulse" />
        )}
        {measurements?.hips && (
          <circle cx="100" cy="235" r="3" fill="hsl(var(--primary))" className="animate-pulse" />
        )}
        {measurements?.glutes && (
          <circle cx="100" cy="265" r="3" fill="hsl(var(--primary))" className="animate-pulse" />
        )}
        {measurements?.legs && (
          <>
            <circle cx="75" cy="340" r="3" fill="hsl(var(--primary))" className="animate-pulse" />
            <circle cx="125" cy="340" r="3" fill="hsl(var(--primary))" className="animate-pulse" />
          </>
        )}
      </svg>

      {/* Measurement Labels */}
      <MeasurementLabel
        label="Neck"
        value={measurements?.neck}
        change={changes?.neck}
        position="right"
        top="12%"
        lineLength={45}
      />
      <MeasurementLabel
        label="Chest"
        value={measurements?.chest}
        change={changes?.chest}
        position="left"
        top="26%"
        lineLength={55}
      />
      <MeasurementLabel
        label="Arms"
        value={measurements?.arms}
        change={changes?.arms}
        position="right"
        top="36%"
        lineLength={40}
      />
      <MeasurementLabel
        label="Waist"
        value={measurements?.waist}
        change={changes?.waist}
        position="left"
        top="42%"
        lineLength={50}
      />
      <MeasurementLabel
        label="Hips"
        value={measurements?.hips}
        change={changes?.hips}
        position="right"
        top="56%"
        lineLength={45}
      />
      <MeasurementLabel
        label="Glutes"
        value={measurements?.glutes}
        change={changes?.glutes}
        position="left"
        top="64%"
        lineLength={50}
      />
      <MeasurementLabel
        label="Thighs"
        value={measurements?.legs}
        change={changes?.legs}
        position="right"
        top="82%"
        lineLength={35}
      />

      {/* No data message */}
      {(!measurements || Object.values(measurements).every(v => !v)) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="glass rounded-2xl p-6 text-center">
            <p className="text-muted-foreground">No measurements recorded yet</p>
          </div>
        </div>
      )}
    </div>
  );
};
