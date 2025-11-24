import { TrendingUp, Weight, Camera, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useClientProgressUpdates } from "@/hooks/useClientProgressUpdates";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export const ClientProgressWidget = () => {
  const navigate = useNavigate();
  const { updates, isLoading } = useClientProgressUpdates();

  const getIcon = (type: string) => {
    switch (type) {
      case 'pr':
        return <Award className="w-4 h-4 text-primary" />;
      case 'weight':
        return <Weight className="w-4 h-4 text-primary" />;
      case 'photo':
        return <Camera className="w-4 h-4 text-primary" />;
      default:
        return <TrendingUp className="w-4 h-4 text-primary" />;
    }
  };

  const getTitle = (type: string) => {
    switch (type) {
      case 'pr':
        return 'New PR';
      case 'weight':
        return 'Weight Update';
      case 'photo':
        return 'Progress Photo';
      default:
        return 'Update';
    }
  };

  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Client Progress</h2>
            <p className="text-sm text-muted-foreground">Recent updates</p>
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Client Progress</h2>
          <p className="text-sm text-muted-foreground">
            {updates.length} recent {updates.length === 1 ? 'update' : 'updates'}
          </p>
        </div>
      </div>

      {updates.length === 0 ? (
        <div className="text-center py-8">
          <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">No recent progress updates</p>
          <p className="text-sm text-muted-foreground mt-1">
            Updates will appear when clients log PRs, weight changes, or photos
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin">
          {updates.map((update) => (
            <div
              key={update.id}
              onClick={() => navigate(`/clients/${update.clientId}`)}
              className="flex items-start gap-3 p-3 rounded-xl bg-background/50 hover:bg-background/70 transition-smooth cursor-pointer group"
            >
              <Avatar className="w-10 h-10 flex-shrink-0">
                <AvatarImage src={update.clientAvatar || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  {update.clientName?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getIcon(update.type)}
                  <span className="text-xs font-semibold text-primary">
                    {getTitle(update.type)}
                  </span>
                  {update.type === 'pr' && (
                    <span className="text-xs text-muted-foreground">🎉</span>
                  )}
                </div>
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-smooth truncate">
                  {update.clientName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {update.exerciseName && `${update.exerciseName}: `}
                  {update.details}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(update.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
