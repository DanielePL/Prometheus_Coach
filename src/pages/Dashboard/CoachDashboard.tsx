import { useState, useEffect } from "react";
import { Calendar, Users, Bell, TrendingUp, Mail, Target, Search, Moon, Sun, Plus, Trash2 } from "lucide-react";
import { InfoCard } from "@/components/Exercise/InfoCard";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Button } from "@/components/ui/button";
import { ShinyButton } from "@/components/ui/shiny-button";
import { NotificationBell } from "@/components/Notifications/NotificationBell";
import { useUnreadMessageParticipants } from "@/hooks/useUnreadMessageParticipants";
import { useConnectedClients } from "@/hooks/useConnectedClients";
import { usePendingRequestParticipants } from "@/hooks/usePendingRequestParticipants";
import { ClientProgressWidget } from "@/components/Dashboard/ClientProgressWidget";
import { useCoachGoals, useAddCoachGoal, useUpdateCoachGoal, useDeleteCoachGoal } from "@/hooks/useCoachGoals";
import { useTodaySchedule, useWeeklySessionCount, useRecentExercises } from "@/hooks/useDashboardData";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export const CoachDashboard = () => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const { pendingRequests, activeClients, isLoading } = useDashboardStats();
  const { participants: unreadMessageUsers } = useUnreadMessageParticipants();
  const { clients: connectedClients } = useConnectedClients();
  const { participants: pendingRequestUsers } = usePendingRequestParticipants();

  // Real data hooks
  const { data: goals = [], isLoading: goalsLoading } = useCoachGoals();
  const { data: todaySchedule = [], isLoading: scheduleLoading } = useTodaySchedule();
  const { data: weeklySessionCount = 0, isLoading: sessionsLoading } = useWeeklySessionCount();
  const { data: recentExercises = [], isLoading: exercisesLoading } = useRecentExercises(2);

  const addGoal = useAddCoachGoal();
  const updateGoal = useUpdateCoachGoal();
  const deleteGoal = useDeleteCoachGoal();

  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingGoalText, setEditingGoalText] = useState("");

  const firstName = profile?.full_name?.split(' ')[0] || 'Coach';

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const toggleGoal = (goalId: string, currentCompleted: boolean) => {
    updateGoal.mutate({ id: goalId, completed: !currentCompleted });
  };

  const addNewGoal = async () => {
    const result = await addGoal.mutateAsync({ text: "New goal" });
    if (result) {
      setEditingGoalId(result.id);
      setEditingGoalText("New goal");
    }
  };

  const handleDeleteGoal = (goalId: string) => {
    deleteGoal.mutate(goalId);
  };

  const startEditingGoal = (goalId: string, currentText: string) => {
    setEditingGoalId(goalId);
    setEditingGoalText(currentText);
  };

  const saveGoalEdit = (goalId: string) => {
    if (editingGoalText.trim()) {
      updateGoal.mutate({ id: goalId, text: editingGoalText });
    }
    setEditingGoalId(null);
    setEditingGoalText("");
  };

  const cancelGoalEdit = () => {
    setEditingGoalId(null);
    setEditingGoalText("");
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const formatEventTime = (dateStr: string) => {
    return format(new Date(dateStr), "h:mm a");
  };

  return (
    <main className="lg:ml-20 pb-20 lg:pb-8 pt-8 px-4 lg:px-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">
            {getGreeting()}, <span className="text-black dark:text-white">{firstName}</span>
          </h1>
          <p className="text-muted-foreground text-lg">Ready to elevate your athletes today?</p>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="glass rounded-xl"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          <Button variant="ghost" size="icon" className="glass rounded-xl">
            <Search className="w-5 h-5" />
          </Button>

          <NotificationBell />

          <div className="glass rounded-2xl px-6 py-3 hidden lg:block">
            <div className="text-right">
              <p className="text-4xl font-bold">{formatTime(currentTime)}</p>
              <p className="text-lg text-primary">{formatDate(currentTime)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Time Display */}
      <div className="glass rounded-2xl p-4 mb-6 lg:hidden">
        <div className="text-center">
          <p className="text-3xl font-bold">{formatTime(currentTime)}</p>
          <p className="text-base text-primary">{formatDate(currentTime)}</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-1 glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Today's Schedule</h2>
              <p className="text-sm text-muted-foreground">
                {scheduleLoading ? "..." : `${todaySchedule.length} sessions`}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {scheduleLoading ? (
              <>
                <Skeleton className="h-14 rounded-xl" />
                <Skeleton className="h-14 rounded-xl" />
                <Skeleton className="h-14 rounded-xl" />
              </>
            ) : todaySchedule.length > 0 ? (
              todaySchedule.map((event: any) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-background/50 dark:border dark:border-primary cursor-pointer hover:bg-background/70 transition-colors"
                  onClick={() => navigate('/calendar')}
                >
                  <span className="text-primary font-semibold text-sm whitespace-nowrap">
                    {formatEventTime(event.start_time)}
                  </span>
                  <div className="flex-1">
                    <span className="text-foreground text-sm">{event.title}</span>
                    {event.profiles?.full_name && (
                      <p className="text-xs text-muted-foreground">{event.profiles.full_name}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No sessions scheduled today</p>
                <Button
                  variant="link"
                  className="text-primary p-0 h-auto mt-1"
                  onClick={() => navigate('/calendar')}
                >
                  Add session
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <div className="glass rounded-2xl p-5 transition-smooth cursor-pointer hover:shadow-[0_0_50px_rgba(var(--primary-rgb),0.7)] relative group hover:bg-white/70 dark:hover:bg-black/60">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary text-primary-foreground">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-xl font-medium text-foreground dark:text-primary mb-2 dark:group-hover:text-white transition-smooth">This Week's Sessions</p>
                <div className="text-3xl lg:text-4xl font-bold text-foreground group-hover:text-primary transition-smooth">
                  {sessionsLoading ? "..." : weeklySessionCount}
                </div>
              </div>
            </div>
            <ShinyButton
              className="w-full font-poppins dark:border dark:border-primary"
              onClick={() => navigate('/calendar')}
            >
              View Calendar
            </ShinyButton>
          </div>
          <InfoCard
            icon={Mail}
            label="Unread Messages"
            value={unreadMessageUsers.length.toString()}
            variant="accent"
            users={unreadMessageUsers}
            onClick={() => navigate('/inbox')}
          />
          <InfoCard
            icon={Users}
            label="Active Clients"
            value={isLoading ? "..." : activeClients.toString()}
            variant="accent"
            users={connectedClients.map(client => ({
              id: client.id,
              full_name: client.full_name,
              avatar_url: client.avatar_url,
            }))}
            onClick={() => navigate('/clients')}
          />
          <InfoCard
            icon={Bell}
            label="Pending Requests"
            value={isLoading ? "..." : pendingRequests.toString()}
            variant="accent"
            users={pendingRequestUsers}
            onClick={() => navigate('/requests')}
          />
        </div>
      </div>

      {/* Exercises, Goals, and Client Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Exercises */}
        <div className="lg:col-span-1">
          <h2 className="text-2xl font-bold mb-4">Recent Exercises</h2>
          <div className="grid grid-cols-1 gap-4">
            {exercisesLoading ? (
              <>
                <Skeleton className="h-64 rounded-2xl" />
                <Skeleton className="h-64 rounded-2xl" />
              </>
            ) : recentExercises.length > 0 ? (
              recentExercises.map((exercise: any) => (
                <div
                  key={exercise.id}
                  className="glass rounded-2xl overflow-hidden group cursor-pointer transition-smooth glass-hover"
                  onClick={() => navigate(`/exercises/${exercise.id}`)}
                >
                  <div className="relative h-48 overflow-hidden">
                    {exercise.thumbnail_url ? (
                      <img
                        src={exercise.thumbnail_url}
                        alt={exercise.title}
                        className="w-full h-full object-cover transition-all duration-500 group-hover:grayscale group-hover:scale-125"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <span className="text-4xl font-bold text-primary/30">
                          {exercise.title?.charAt(0) || "E"}
                        </span>
                      </div>
                    )}
                    {exercise.category && (
                      <div className="absolute top-3 left-3">
                        <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                          {exercise.category}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg">{exercise.title}</h3>
                  </div>
                </div>
              ))
            ) : (
              <div className="glass rounded-2xl p-8 text-center">
                <p className="text-muted-foreground mb-2">No recent exercises</p>
                <Button
                  variant="link"
                  className="text-primary"
                  onClick={() => navigate('/exercises')}
                >
                  Browse Exercises
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Today's Goals */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <Target className="w-6 h-6 text-primary-foreground" />
              </div>
              <h2 className="text-xl font-bold">Today's Goals</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {goalsLoading ? "..." : `${goals.filter((g: any) => g.completed).length} of ${goals.length}`}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={addNewGoal}
                disabled={addGoal.isPending}
                className="w-8 h-8 rounded-lg bg-primary/10 hover:bg-primary/20"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {goalsLoading ? (
              <>
                <Skeleton className="h-12 rounded-xl" />
                <Skeleton className="h-12 rounded-xl" />
                <Skeleton className="h-12 rounded-xl" />
              </>
            ) : goals.length > 0 ? (
              goals.map((goal: any) => (
                <div
                  key={goal.id}
                  className="group flex items-start gap-3 p-3 rounded-xl bg-background/50 hover:bg-background/70 transition-smooth"
                >
                  <div
                    onClick={() => toggleGoal(goal.id, goal.completed)}
                    className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer
                      ${goal.completed
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground'
                      }
                    `}>
                    {goal.completed && (
                      <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>

                  {editingGoalId === goal.id ? (
                    <input
                      type="text"
                      value={editingGoalText}
                      onChange={(e) => setEditingGoalText(e.target.value)}
                      onBlur={() => saveGoalEdit(goal.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveGoalEdit(goal.id);
                        if (e.key === 'Escape') cancelGoalEdit();
                      }}
                      autoFocus
                      className="flex-1 text-sm bg-transparent border-b border-primary focus:outline-none text-foreground"
                    />
                  ) : (
                    <>
                      <span
                        onClick={() => startEditingGoal(goal.id, goal.text)}
                        className={`flex-1 text-sm cursor-pointer ${goal.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                      >
                        {goal.text}
                      </span>

                      {goal.completed && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No goals for today</p>
                <Button
                  variant="link"
                  className="text-primary p-0 h-auto mt-1"
                  onClick={addNewGoal}
                >
                  Add your first goal
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Client Progress Widget */}
        <ClientProgressWidget />
      </div>
    </main>
  );
};
