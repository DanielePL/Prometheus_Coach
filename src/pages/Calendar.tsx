import { Sidebar } from "@/components/Navigation/Sidebar";
import { BottomNav } from "@/components/Navigation/BottomNav";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import gradientBg from "@/assets/gradient-bg.jpg";
import gradientBgDark from "@/assets/gradient-bg-dark.png";
import { EventManager, type Event } from "@/components/ui/event-manager";
import { useEvents } from "@/hooks/useEvents";
import { useUserRole } from "@/hooks/useUserRole";
import { useClients } from "@/hooks/useClients";
import { supabase } from "@/integrations/supabase/client";
import { NotificationBell } from "@/components/Notifications/NotificationBell";
import { WorldClock } from "@/components/Calendar/WorldClock";

const Calendar = () => {
  const { theme, setTheme } = useTheme();
  const { events, isLoading, createEvent, updateEvent, deleteEvent } = useEvents();
  const { isCoach } = useUserRole();
  const { clients } = useClients();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  // Handle notification navigation
  useEffect(() => {
    const eventId = searchParams.get('eventId');
    if (eventId && events.length > 0) {
      setHighlightedEventId(eventId);
      // Clear the query param after a delay
      setTimeout(() => {
        setSearchParams({});
        setHighlightedEventId(null);
      }, 3000);
    }
  }, [searchParams, events, setSearchParams]);

  const handleEventCreate = async (event: Event) => {
    await createEvent(event);
  };

  const handleEventUpdate = async (id: string, event: Event) => {
    await updateEvent({ id, updates: event });
  };

  const handleEventDelete = async (id: string) => {
    await deleteEvent(id);
  };

  return (
    <div 
      className="min-h-screen flex w-full"
      style={{
        backgroundImage: `url(${theme === "dark" ? gradientBgDark : gradientBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <Sidebar />
      
      <main className="flex-1 lg:ml-20 pb-20 lg:pb-0">
        <div className="container mx-auto px-4 lg:px-8 py-6 lg:py-10 max-w-7xl">
          {/* Header with Title and Theme Toggle */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold">Calendar</h1>
            
            <div className="flex items-center gap-2">
              <NotificationBell />
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="glass w-10 h-10 rounded-xl flex items-center justify-center transition-smooth hover:bg-primary hover:text-primary-foreground"
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Layout with Calendar and World Clock */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6">
            {/* Calendar Content - EventManager */}
            <div>
              {isLoading ? (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading calendar...</p>
                  </div>
                </div>
              ) : (
                <EventManager
                  events={events}
                  onEventCreate={handleEventCreate}
                  onEventUpdate={handleEventUpdate}
                  onEventDelete={handleEventDelete}
                  categories={["session", "check-in", "personal", "other"]}
                  availableTags={["Important", "Urgent", "Session", "Check-in"]}
                  defaultView="month"
                  clients={clients}
                  isCoach={isCoach}
                  currentUserId={currentUserId}
                  highlightedEventId={highlightedEventId}
                />
              )}
            </div>

            {/* World Clock Sidebar - Hidden on mobile and tablet, visible on xl+ screens */}
            <div className="hidden xl:block">
              <div className="sticky top-6">
                <WorldClock />
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Calendar;
