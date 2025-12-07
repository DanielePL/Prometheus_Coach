import { MessageSquare, Calendar, Dumbbell, MoreVertical, TrendingUp, TrendingDown, Minus, Flame, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useClientProgress } from "@/hooks/useClientProgress";
import { useClientVideoLink } from "@/hooks/useClientVideoLink";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ClientCardProps {
  client: {
    id: string;
    full_name: string;
    avatar_url?: string | null;
    connected_at: string;
  };
}

export const ClientCard = ({ client }: ClientCardProps) => {
  const navigate = useNavigate();
  const { data: progress } = useClientProgress(client.id);
  const { data: videoEvent } = useClientVideoLink(client.id);

  const handleVideoCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoEvent?.video_link) {
      window.open(videoEvent.video_link, "_blank");
    } else {
      toast.info("No upcoming video call scheduled", {
        description: "Create a calendar event with a video link for this client.",
        action: {
          label: "Go to Calendar",
          onClick: () => navigate("/calendar"),
        },
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const WeightTrendIcon = () => {
    if (!progress?.weightTrend) return null;
    
    const IconComponent = 
      progress.weightTrend.direction === "up" ? TrendingUp :
      progress.weightTrend.direction === "down" ? TrendingDown :
      Minus;
    
    const color = 
      progress.weightTrend.direction === "up" ? "text-green-500" :
      progress.weightTrend.direction === "down" ? "text-orange-500" :
      "text-gray-500";

    return (
      <div className={`flex items-center gap-1 text-xs ${color}`}>
        <IconComponent className="w-3 h-3" />
        {progress.weightTrend.direction === "up" && `+${progress.weightTrend.change}kg`}
        {progress.weightTrend.direction === "down" && `-${progress.weightTrend.change}kg`}
        {progress.weightTrend.direction === "stable" && "maintained"}
      </div>
    );
  };

  return (
    <div
      className="glass rounded-2xl p-6 transition-smooth hover:shadow-[0_0_50px_rgba(var(--primary-rgb),0.7)] group cursor-pointer"
      onClick={() => navigate(`/clients/${client.id}`)}
    >
      {/* Client Avatar & Name */}
      <div className="flex flex-col items-center mb-4">
        <UserAvatar
          avatarUrl={client.avatar_url}
          fullName={client.full_name}
          userId={client.id}
          className="w-20 h-20 mb-3 border-2 border-primary/50 text-xl"
        />
        <h3 className="text-lg font-bold text-center">{client.full_name}</h3>
        <Badge className="mt-2 bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/50">
          Active
        </Badge>
      </div>

      {/* Progress Stats */}
      <div className="space-y-2 mb-4 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Completion:</span>
          <span className="font-medium text-primary">{progress?.workoutCompletionRate || 0}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Weight Trend:</span>
          <WeightTrendIcon />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Last Workout:</span>
          <span className="font-medium">
            {progress?.lastWorkoutDate ? formatDate(progress.lastWorkoutDate) : "Never"}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Streak:</span>
          <div className="flex items-center gap-1 font-medium text-orange-500">
            {progress?.currentStreak || 0 > 0 && <Flame className="w-4 h-4" />}
            {progress?.currentStreak || 0} days
          </div>
        </div>
      </div>

      {/* Quick Actions - 2 Rows */}
      <div className="pt-4 border-t border-border/50 space-y-2">
        {/* Row 1: Communication (Chat & Video) */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 h-10 bg-primary/10 hover:bg-primary/20 text-primary gap-2"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/inbox?userId=${client.id}`);
            }}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-xs">Chat</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className={`flex-1 h-10 gap-2 ${
              videoEvent?.video_link
                ? "bg-green-500/20 hover:bg-green-500/30 text-green-500"
                : "bg-green-500/10 hover:bg-green-500/20 text-green-500/60"
            }`}
            onClick={handleVideoCall}
            title={videoEvent?.video_link ? `Join: ${videoEvent.title}` : "No video call scheduled"}
          >
            <Video className="w-4 h-4" />
            <span className="text-xs">Video</span>
            {videoEvent?.video_link && (
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
          </Button>
        </div>

        {/* Row 2: Management (Calendar, Training, More) */}
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="flex-1 h-9 bg-primary/10 hover:bg-primary/20 text-primary"
            onClick={(e) => {
              e.stopPropagation();
              navigate("/calendar");
            }}
          >
            <Calendar className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="flex-1 h-9 bg-primary/10 hover:bg-primary/20 text-primary"
            onClick={(e) => {
              e.stopPropagation();
              navigate("/explore");
            }}
          >
            <Dumbbell className="w-4 h-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                size="icon"
                variant="ghost"
                className="flex-1 h-9 bg-primary/10 hover:bg-primary/20 text-primary"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass">
              <DropdownMenuItem onClick={() => navigate(`/clients/${client.id}`)}>
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem>View Progress</DropdownMenuItem>
              <DropdownMenuItem>Session History</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                Disconnect Client
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
