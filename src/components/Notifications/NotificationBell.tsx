import { Bell, Calendar, MessageSquare, Users, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/useNotifications";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const getNotificationIcon = (message: string) => {
  if (message.toLowerCase().includes('event') || message.toLowerCase().includes('calendar') || message.toLowerCase().includes('session')) {
    return Calendar;
  }
  if (message.toLowerCase().includes('message') || message.toLowerCase().includes('inbox')) {
    return MessageSquare;
  }
  if (message.toLowerCase().includes('request') || message.toLowerCase().includes('connection') || message.toLowerCase().includes('client')) {
    return Users;
  }
  return Info;
};

export const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = async (id: string, eventId: string | null, read: boolean, message: string) => {
    if (!read) {
      await markAsRead(id);
    }
    
    // Navigate based on notification type
    if (eventId) {
      navigate(`/calendar?eventId=${eventId}`);
    } else if (message.toLowerCase().includes('message') || message.toLowerCase().includes('inbox')) {
      navigate('/inbox');
    } else if (message.toLowerCase().includes('request') || message.toLowerCase().includes('connection')) {
      navigate('/requests');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="glass rounded-xl relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary text-primary-foreground border-0"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] md:w-[400px] glass border-glass-border z-50">
        <div className="flex items-center justify-between p-4">
          <h3 className="font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                markAllAsRead();
              }}
              className="text-xs hover:bg-primary/10 hover:text-primary"
            >
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator className="bg-glass-border" />
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-2">🎉</div>
              <p className="text-sm font-medium text-foreground mb-1">No new notifications</p>
              <p className="text-xs text-muted-foreground">You're all caught up!</p>
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.message);
              return (
                <DropdownMenuItem
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification.id, notification.event_id, notification.read, notification.message)}
                  className={cn(
                    "flex items-start gap-3 p-4 cursor-pointer transition-smooth hover:bg-background/60 border-b border-glass-border last:border-0",
                    !notification.read && "bg-primary/5"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    !notification.read ? "bg-primary/10 text-primary" : "bg-background/50 text-muted-foreground"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm leading-relaxed",
                      !notification.read ? "text-foreground font-medium" : "text-muted-foreground"
                    )}>
                      {notification.message}
                    </p>
                    <span className="text-xs text-muted-foreground mt-1 block">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                  )}
                </DropdownMenuItem>
              );
            })
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
