import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Navigation/Sidebar";
import { BottomNav } from "@/components/Navigation/BottomNav";
import { useTheme } from "next-themes";
import { ArrowLeft, MessageSquare, Calendar, Dumbbell, MessageSquareOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useConnectedClients } from "@/hooks/useConnectedClients";
import { useToggleClientChat } from "@/hooks/useToggleClientChat";
import gradientBg from "@/assets/gradient-bg.jpg";
import gradientBgDark from "@/assets/gradient-bg-dark.png";
import { ClientOverviewTab } from "@/components/Clients/ClientOverviewTab";
import { ClientWorkoutsTab } from "@/components/Clients/ClientWorkoutsTab";
import { ClientProgressTab } from "@/components/Clients/ClientProgressTab";
import { ClientNotesTab } from "@/components/Clients/ClientNotesTab";
import { ClientHistoryTab } from "@/components/Clients/ClientHistoryTab";
import { ClientVBTTab } from "@/components/Clients/ClientVBTTab";
import { ClientNutritionTab } from "@/components/Clients/ClientNutritionTab";
import { ClientLoadLabTab } from "@/components/Clients/ClientLoadLabTab";
import { ClientPRsTab } from "@/components/Clients/ClientPRsTab";
import { ClientInsightsTab } from "@/components/Clients/ClientInsightsTab";
import { ClientExerciseStatsTab } from "@/components/Clients/ClientExerciseStatsTab";

const ClientDetail = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("overview");
  const { clients } = useConnectedClients();
  const { chatEnabled, toggleChat, isToggling } = useToggleClientChat(clientId);

  const client = clients.find((c) => c.id === clientId);

  if (!client) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center"
        style={{
          backgroundImage: `url(${theme === "dark" ? gradientBgDark : gradientBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="glass rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Client not found</h2>
          <Button onClick={() => navigate("/clients")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Clients
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full"
      style={{
        backgroundImage: `url(${theme === "dark" ? gradientBgDark : gradientBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <Sidebar />
      <BottomNav />

      <main className="lg:ml-20 pb-20 lg:pb-8 pt-8 px-4 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/clients")}
            className="mb-4 glass"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Clients
          </Button>

          <div className="glass rounded-2xl p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <UserAvatar
                avatarUrl={client.avatar_url}
                fullName={client.full_name}
                userId={client.id}
                className="w-24 h-24 text-3xl"
              />

              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{client.full_name}</h1>
                <div className="flex items-center gap-3 mb-4">
                  <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/50">
                    Active
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Connected {new Date(client.connected_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => navigate(`/inbox?userId=${client.id}`)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate("/calendar")}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate("/explore")}
                  >
                    <Dumbbell className="w-4 h-4 mr-2" />
                    Assign Workout
                  </Button>
                </div>

                {/* Chat Settings */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {chatEnabled ? (
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <MessageSquareOff className="w-4 h-4 text-muted-foreground" />
                      )}
                      <Label htmlFor="chat-toggle" className="text-sm font-medium cursor-pointer">
                        Allow Client Messaging
                      </Label>
                    </div>
                    <Switch
                      id="chat-toggle"
                      checked={chatEnabled}
                      onCheckedChange={toggleChat}
                      disabled={isToggling}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 ml-6">
                    {chatEnabled 
                      ? "Client can send you messages" 
                      : "Client cannot send messages (you can still message them)"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="glass w-full md:w-auto flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="workouts">Workouts</TabsTrigger>
            <TabsTrigger value="vbt">VBT</TabsTrigger>
            <TabsTrigger value="loadlab">Load Lab</TabsTrigger>
            <TabsTrigger value="prs">PRs</TabsTrigger>
            <TabsTrigger value="exercises">Exercises</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <ClientOverviewTab clientId={client.id} />
          </TabsContent>

          <TabsContent value="workouts">
            <ClientWorkoutsTab clientId={client.id} />
          </TabsContent>

          <TabsContent value="vbt">
            <ClientVBTTab clientId={client.id} />
          </TabsContent>

          <TabsContent value="loadlab">
            <ClientLoadLabTab clientId={client.id} />
          </TabsContent>

          <TabsContent value="prs">
            <ClientPRsTab clientId={client.id} />
          </TabsContent>

          <TabsContent value="exercises">
            <ClientExerciseStatsTab clientId={client.id} />
          </TabsContent>

          <TabsContent value="insights">
            <ClientInsightsTab clientId={client.id} />
          </TabsContent>

          <TabsContent value="nutrition">
            <ClientNutritionTab clientId={client.id} />
          </TabsContent>

          <TabsContent value="progress">
            <ClientProgressTab clientId={client.id} />
          </TabsContent>

          <TabsContent value="notes">
            <ClientNotesTab clientId={client.id} />
          </TabsContent>

          <TabsContent value="history">
            <ClientHistoryTab clientId={client.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ClientDetail;
