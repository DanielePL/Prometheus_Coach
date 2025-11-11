import { useState, useEffect } from "react";
import { Calendar, TrendingUp, Target, Search, Moon, Sun, Plus, Trash2, Dumbbell, MessageSquare, Flame, Clock, Video, Camera, Weight } from "lucide-react";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ShinyButton } from "@/components/ui/shiny-button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { NotificationBell } from "@/components/Notifications/NotificationBell";
import { useClientCoach } from "@/hooks/useClientCoach";
import { useClientUpcomingSessions } from "@/hooks/useClientUpcomingSessions";
import { useClientWeeklyStats } from "@/hooks/useClientWeeklyStats";
import { useClientRecentActivity } from "@/hooks/useClientRecentActivity";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useUnreadMessageParticipants } from "@/hooks/useUnreadMessageParticipants";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

export const ClientDashboard = () => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Fetch real data
  const { coach, hasCoach } = useClientCoach();
  const { sessions } = useClientUpcomingSessions();
  const { stats } = useClientWeeklyStats();
  const { activities } = useClientRecentActivity();
  const { pendingRequests } = useDashboardStats();
  const { participants: unreadParticipants } = useUnreadMessageParticipants();

  // Fetch workouts for current user
  const { data: workouts = [] } = useQuery({
    queryKey: ["client-workouts-dashboard", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("client_workouts")
        .select("*")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const firstName = profile?.full_name?.split(' ')[0] || 'User';

  // Goals state
  const { data: dbGoals = [], refetch: refetchGoals } = useQuery({
    queryKey: ["client-goals"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      return data || [];
    },
  });

  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingGoalText, setEditingGoalText] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const toggleGoal = async (goalId: string, currentCompleted: boolean) => {
    await supabase
      .from("goals")
      .update({ completed: !currentCompleted })
      .eq("id", goalId);
    refetchGoals();
  };

  const addNewGoal = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("goals")
      .insert({ user_id: user.id, text: "New goal", completed: false })
      .select()
      .single();

    if (data) {
      setEditingGoalId(data.id);
      setEditingGoalText(data.text);
      refetchGoals();
    }
  };

  const deleteGoal = async (goalId: string) => {
    await supabase.from("goals").delete().eq("id", goalId);
    refetchGoals();
  };

  const saveGoalEdit = async (goalId: string) => {
    if (editingGoalText.trim()) {
      await supabase
        .from("goals")
        .update({ text: editingGoalText })
        .eq("id", goalId);
      refetchGoals();
    }
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

  const formatSessionTime = (startTime: string) => {
    const date = new Date(startTime);
    const now = new Date();
    const diffDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    if (diffDays === 1) return `Tomorrow, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    return `${date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'workout': return <Dumbbell className="w-4 h-4" />;
      case 'session': return <Video className="w-4 h-4" />;
      case 'weight': return <Weight className="w-4 h-4" />;
      case 'assignment': return <Target className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Today's workouts (workouts assigned for today or incomplete)
  const todayWorkouts = workouts.filter(w => w.status !== 'completed').slice(0, 3);

  return (
    <main className="lg:ml-20 pb-20 lg:pb-8 pt-8 px-4 lg:px-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">
            {getGreeting()}, <span className="text-foreground">{firstName}</span>
          </h1>
          <p className="text-muted-foreground text-lg">Ready to crush your goals today? 💪</p>
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

      {/* Quick Actions Bar - Mobile Floating */}
      <div className="fixed bottom-20 left-0 right-0 lg:hidden px-4 z-10">
        <div className="glass rounded-2xl p-3 flex items-center justify-around">
          <Button variant="ghost" size="sm" onClick={() => navigate('/my-progress')} className="flex flex-col items-center gap-1">
            <Weight className="w-5 h-5 text-primary" />
            <span className="text-xs">Log Weight</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/my-workouts')} className="flex flex-col items-center gap-1">
            <Dumbbell className="w-5 h-5 text-primary" />
            <span className="text-xs">Workout</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/my-progress')} className="flex flex-col items-center gap-1">
            <Camera className="w-5 h-5 text-primary" />
            <span className="text-xs">Photo</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/inbox')} className="flex flex-col items-center gap-1">
            <MessageSquare className="w-5 h-5 text-primary" />
            <span className="text-xs">Message</span>
          </Button>
        </div>
      </div>

      {/* Main Grid - Top Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* My Coach Card */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">My Coach</h2>
          
          {hasCoach && coach ? (
            <>
              <div className="flex items-center gap-4 mb-4">
                <UserAvatar 
                  userId={coach.id}
                  fullName={coach.full_name}
                  avatarUrl={coach.avatar_url}
                  className="h-16 w-16"
                />
                <div>
                  <h3 className="text-lg font-bold">{coach.full_name}</h3>
                  <p className="text-sm text-muted-foreground">Your personal trainer</p>
                </div>
              </div>
              
              <div className="flex flex-col gap-2 mb-4">
                <Button 
                  variant="default" 
                  onClick={() => navigate('/inbox')}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Message Coach
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/calendar')}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Book Session
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground text-center">
                Connected since {new Date(coach.connected_since).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Connect with a coach to get started!</p>
              <ShinyButton onClick={() => navigate('/requests')} className="dark:border dark:border-primary">
                Find a Coach
              </ShinyButton>
            </div>
          )}
        </div>

        {/* Weekly Summary */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold">This Week</h2>
              <p className="text-sm text-muted-foreground">Your progress</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-background/50">
              <div className="flex items-center gap-3">
                <Flame className="w-5 h-5 text-primary" />
                <span className="text-sm text-foreground">Streak</span>
              </div>
              <span className="text-xl font-bold text-primary">{stats.currentStreak} days</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-xl bg-background/50">
              <div className="flex items-center gap-3">
                <Dumbbell className="w-5 h-5 text-primary" />
                <span className="text-sm text-foreground">Workouts</span>
              </div>
              <span className="text-xl font-bold text-foreground">{stats.workoutsCompleted}/{stats.totalWorkouts}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-xl bg-background/50">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <span className="text-sm text-foreground">Time</span>
              </div>
              <span className="text-xl font-bold text-foreground">{stats.totalMinutes} min</span>
            </div>
            
            {stats.weightChange !== null && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-background/50">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span className="text-sm text-foreground">Weight</span>
                </div>
                <span className={`text-xl font-bold ${stats.weightChange < 0 ? 'text-green-500' : 'text-foreground'}`}>
                  {stats.weightChange > 0 ? '+' : ''}{stats.weightChange.toFixed(1)} kg
                </span>
              </div>
            )}
          </div>
          
          <ShinyButton 
            className="w-full mt-4 font-poppins dark:border dark:border-primary"
            onClick={() => navigate('/my-progress')}
          >
            View Full Progress
          </ShinyButton>
        </div>

        {/* Unread Messages */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Messages</h2>
                <p className="text-sm text-muted-foreground">{unreadParticipants.length} unread</p>
              </div>
            </div>
          </div>
          
          {unreadParticipants.length > 0 ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                {unreadParticipants.slice(0, 5).map((participant) => (
                  <UserAvatar
                    key={participant.id}
                    userId={participant.id}
                    fullName={participant.full_name}
                    avatarUrl={participant.avatar_url}
                    className="h-10 w-10 border-2 border-background"
                  />
                ))}
                {unreadParticipants.length > 5 && (
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                    +{unreadParticipants.length - 5}
                  </div>
                )}
              </div>
              
              <Button 
                variant="default"
                onClick={() => navigate('/inbox')}
                className="w-full"
              >
                Open Inbox
              </Button>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No unread messages</p>
            </div>
          )}
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Upcoming Sessions */}
        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Upcoming Sessions</h2>
                <p className="text-sm text-muted-foreground">{sessions.length} scheduled</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/calendar')}>
              View All
            </Button>
          </div>
          
          {sessions.length > 0 ? (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div 
                  key={session.id} 
                  className="flex items-start gap-3 p-4 rounded-xl bg-background/50 dark:border dark:border-primary/30 cursor-pointer hover:bg-background/70 transition-smooth"
                  onClick={() => navigate(`/calendar?event=${session.id}`)}
                >
                  <Calendar className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-foreground font-medium">{session.title}</p>
                    <p className="text-sm text-muted-foreground">{formatSessionTime(session.start_time)}</p>
                  </div>
                </div>
              ))}
              
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => navigate('/calendar')}
              >
                Book Another Session
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No sessions scheduled</p>
              <ShinyButton onClick={() => navigate('/calendar')} className="dark:border dark:border-primary">
                Schedule Your First Session
              </ShinyButton>
            </div>
          )}
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
                {dbGoals.filter((g: any) => g.completed).length}/{dbGoals.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={addNewGoal}
                className="w-8 h-8 rounded-lg bg-primary/10 hover:bg-primary/20"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {dbGoals.map((goal: any) => (
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
                      if (e.key === 'Escape') setEditingGoalId(null);
                    }}
                    autoFocus
                    className="flex-1 text-sm bg-transparent border-b border-primary focus:outline-none text-foreground"
                  />
                ) : (
                  <>
                    <span 
                      onClick={() => {
                        setEditingGoalId(goal.id);
                        setEditingGoalText(goal.text);
                      }}
                      className={`flex-1 text-sm cursor-pointer ${goal.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                    >
                      {goal.text}
                    </span>
                    
                    {goal.completed && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteGoal(goal.id)}
                        className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            ))}
            
            {dbGoals.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No goals yet. Add one to get started!</p>
            )}
          </div>
        </div>
      </div>

      {/* Third Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Workouts */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Today's Workouts</h2>
            <Button variant="outline" onClick={() => navigate('/my-workouts')}>
              View All
            </Button>
          </div>
          
          {todayWorkouts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {todayWorkouts.map((workout) => {
                const exercises = Array.isArray(workout.exercises) ? workout.exercises : [];
                const completed = exercises.filter((e: any) => e.completed).length;
                
                return (
                  <div 
                    key={workout.id}
                    className="glass rounded-2xl p-6 cursor-pointer transition-smooth glass-hover"
                    onClick={() => navigate('/my-workouts')}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg mb-1">{workout.title}</h3>
                        <p className="text-sm text-muted-foreground">{exercises.length} exercises</p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Dumbbell className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold">{completed}/{exercises.length}</span>
                      </div>
                      <div className="w-full bg-background/50 rounded-full h-2">
                        <div 
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{ width: exercises.length > 0 ? `${(completed / exercises.length) * 100}%` : '0%' }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass rounded-2xl p-12 text-center">
              <p className="text-muted-foreground mb-4">No workouts assigned for today</p>
              <p className="text-sm text-muted-foreground">Take a rest day! 💪</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Clock className="w-6 h-6 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-bold">Recent Activity</h2>
          </div>
          
          {activities.length > 0 ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {activities.map((activity) => (
                <div 
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-background/50 hover:bg-background/70 transition-smooth"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};
