import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sun, Moon, Check, X, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BottomNav } from "@/components/Navigation/BottomNav";
import { SendRequestDialog } from "@/components/Requests/SendRequestDialog";
import { useCoachClientConnections } from "@/hooks/useCoachClientConnections";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import gradientBg from "@/assets/gradient-bg.jpg";
import gradientBgDark from "@/assets/gradient-bg-dark.png";

const Requests = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { role, isCoach } = useUserRole();
  const { connections, isLoading, acceptRequest, declineRequest } = useCoachClientConnections();
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current user ID
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  // Filter connections based on role
  const pendingRequests = connections.filter(c => 
    c.status === "pending" && (isCoach ? c.coach_id === currentUserId : c.client_id === currentUserId)
  );
  const acceptedConnections = connections.filter(c => c.status === "accepted");
  const declinedConnections = connections.filter(c => c.status === "declined" && isCoach);

  const handleAccept = async (connectionId: string, name: string) => {
    await acceptRequest(connectionId);
  };

  const handleDecline = async (connectionId: string) => {
    await declineRequest(connectionId);
  };

  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundImage: `url(${theme === "dark" ? gradientBgDark : gradientBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <BottomNav />
      
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <h1 className="text-2xl font-bold text-foreground">
              {isCoach ? "Client Connections" : "Coach Requests"}
            </h1>

            <div className="flex gap-2">
              {isCoach && (
                <Button
                  variant="default"
                  size="icon"
                  onClick={() => setShowSendDialog(true)}
                  className="hover:opacity-90"
                >
                  <UserPlus className="h-5 w-5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="hover:bg-white/10"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 pb-24">
        <div className="max-w-2xl mx-auto space-y-6">
          {isLoading ? (
            <div className="glass rounded-2xl p-8 text-center">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : (
            <>
              {/* Pending Requests Section */}
              {pendingRequests.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-foreground">
                    {isCoach ? "Pending Requests" : "New Requests"}
                    <Badge variant="secondary" className="ml-2">{pendingRequests.length}</Badge>
                  </h2>
                  {pendingRequests.map((connection) => {
                    const displayUser = isCoach ? connection.client : connection.coach;
                    return (
                      <div
                        key={connection.id}
                        className="glass rounded-2xl p-6 transition-smooth hover:shadow-[0_0_30px_rgba(255,107,53,0.3)] hover:bg-white/70 dark:hover:bg-black/60"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-14 w-14">
                              <AvatarImage 
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${displayUser?.id}`} 
                                alt={displayUser?.full_name} 
                              />
                              <AvatarFallback>
                                {displayUser?.full_name?.split(" ").map(n => n[0]).join("") || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-lg font-medium text-foreground">
                                {displayUser?.full_name || "Unknown"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(connection.requested_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          
                          {!isCoach && (
                            <div className="flex gap-2">
                              <Button
                                size="icon"
                                variant="default"
                                onClick={() => handleAccept(connection.id, displayUser?.full_name || "")}
                                className="h-10 w-10 bg-green-600 hover:bg-green-700"
                              >
                                <Check className="h-5 w-5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="destructive"
                                onClick={() => handleDecline(connection.id)}
                                className="h-10 w-10"
                              >
                                <X className="h-5 w-5" />
                              </Button>
                            </div>
                          )}
                          
                          {isCoach && (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Accepted Connections Section */}
              {acceptedConnections.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-foreground">
                    Active Connections
                    <Badge variant="secondary" className="ml-2">{acceptedConnections.length}</Badge>
                  </h2>
                  {acceptedConnections.map((connection) => {
                    const displayUser = isCoach ? connection.client : connection.coach;
                    return (
                      <div
                        key={connection.id}
                        className="glass rounded-2xl p-6 border border-green-500/20"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-14 w-14">
                              <AvatarImage 
                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${displayUser?.id}`}
                                alt={displayUser?.full_name}
                              />
                              <AvatarFallback>
                                {displayUser?.full_name?.split(" ").map(n => n[0]).join("") || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-lg font-medium text-foreground">
                                {displayUser?.full_name || "Unknown"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Connected {formatDistanceToNow(new Date(connection.responded_at || connection.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-green-600 hover:bg-green-700">Connected</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Empty State */}
              {pendingRequests.length === 0 && acceptedConnections.length === 0 && (
                <div className="glass rounded-2xl p-8 text-center">
                  <p className="text-muted-foreground text-lg">
                    {isCoach ? "No client connections yet" : "No pending requests"}
                  </p>
                  {isCoach && (
                    <Button
                      variant="default"
                      className="mt-4"
                      onClick={() => setShowSendDialog(true)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Send Connection Request
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <SendRequestDialog open={showSendDialog} onOpenChange={setShowSendDialog} />
    </div>
  );
};

export default Requests;
