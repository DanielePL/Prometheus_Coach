import { useState, useEffect } from "react";
import { Calendar, TrendingUp, Mail, Target, Search, Moon, Sun, Plus, Trash2, Dumbbell, MessageSquare, Flame } from "lucide-react";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ShinyButton } from "@/components/ui/shiny-button";
import { UserAvatar } from "@/components/ui/user-avatar";

export const ClientDashboard = () => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  const firstName = profile?.full_name?.split(' ')[0] || 'User';

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const upcomingSessions = [
    { time: "Tomorrow, 9:00 AM", title: "Strength Training Session" },
    { time: "Thursday, 2:00 PM", title: "Cardio & Core Workout" },
  ];

  const assignedWorkouts = [
    { id: 1, title: "Upper Body Strength", exercises: 8, completed: 5 },
    { id: 2, title: "Lower Body Power", exercises: 6, completed: 0 },
    { id: 3, title: "Core & Stability", exercises: 10, completed: 10 },
  ];

  const [goals, setGoals] = useState([
    { id: 1, text: "Complete 3 workouts this week", completed: true },
    { id: 2, text: "Log weight daily", completed: false },
    { id: 3, text: "Hit 10,000 steps today", completed: false },
  ]);
  const [editingGoalId, setEditingGoalId] = useState<number | null>(null);
  const [editingGoalText, setEditingGoalText] = useState("");

  const toggleGoal = (goalId: number) => {
    setGoals(goals.map(goal => 
      goal.id === goalId ? { ...goal, completed: !goal.completed } : goal
    ));
  };

  const addNewGoal = () => {
    const newGoal = {
      id: goals.length + 1,
      text: "New goal",
      completed: false
    };
    setGoals([...goals, newGoal]);
    setEditingGoalId(newGoal.id);
    setEditingGoalText(newGoal.text);
  };

  const deleteGoal = (goalId: number) => {
    setGoals(goals.filter(goal => goal.id !== goalId));
  };

  const startEditingGoal = (goalId: number, currentText: string) => {
    setEditingGoalId(goalId);
    setEditingGoalText(currentText);
  };

  const saveGoalEdit = (goalId: number) => {
    if (editingGoalText.trim()) {
      setGoals(goals.map(goal => 
        goal.id === goalId ? { ...goal, text: editingGoalText } : goal
      ));
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

  return (
    <main className="lg:ml-20 pb-20 lg:pb-8 pt-8 px-4 lg:px-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">
            {getGreeting()}, <span className="text-black dark:text-white">{firstName}</span>
          </h1>
          <p className="text-muted-foreground text-lg">Let's crush your goals today! 💪</p>
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
        {/* Progress Summary */}
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Progress Summary</h2>
              <p className="text-sm text-muted-foreground">This week</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-background/50">
              <div className="flex items-center gap-3">
                <Flame className="w-5 h-5 text-primary" />
                <span className="text-sm text-foreground">Streak</span>
              </div>
              <span className="text-xl font-bold text-primary">5 days</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-xl bg-background/50">
              <div className="flex items-center gap-3">
                <Dumbbell className="w-5 h-5 text-primary" />
                <span className="text-sm text-foreground">Workouts</span>
              </div>
              <span className="text-xl font-bold text-foreground">3/4</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-xl bg-background/50">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="text-sm text-foreground">Weight</span>
              </div>
              <span className="text-xl font-bold text-foreground">-2 kg</span>
            </div>
          </div>
          
          <ShinyButton 
            className="w-full mt-4 font-poppins dark:border dark:border-primary"
            onClick={() => navigate('/my-progress')}
          >
            View Full Progress
          </ShinyButton>
        </div>

        {/* Stats and Sessions */}
        <div className="lg:col-span-2 space-y-4">
          {/* Upcoming Sessions */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Upcoming Sessions</h2>
                  <p className="text-sm text-muted-foreground">{upcomingSessions.length} scheduled</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => navigate('/calendar')}>
                View All
              </Button>
            </div>
            
            <div className="space-y-3">
              {upcomingSessions.map((session, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-background/50 dark:border dark:border-primary">
                  <Calendar className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-foreground font-medium">{session.title}</p>
                    <p className="text-sm text-muted-foreground">{session.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Coach Card */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <UserAvatar 
                  userId="coach-placeholder"
                  fullName="Coach Dan"
                  className="h-16 w-16"
                />
                <div>
                  <h3 className="text-lg font-bold">Coach Dan</h3>
                  <p className="text-sm text-muted-foreground">Your personal trainer</p>
                </div>
              </div>
              <Button 
                variant="default" 
                onClick={() => navigate('/inbox')}
                className="flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Message
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Workouts and Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Workouts */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">My Workouts</h2>
            <Button variant="outline" onClick={() => navigate('/my-workouts')}>
              View All
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedWorkouts.slice(0, 2).map((workout) => (
              <div 
                key={workout.id}
                className="glass rounded-2xl p-6 cursor-pointer transition-smooth glass-hover"
                onClick={() => navigate('/my-workouts')}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg mb-1">{workout.title}</h3>
                    <p className="text-sm text-muted-foreground">{workout.exercises} exercises</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Dumbbell className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold">{workout.completed}/{workout.exercises}</span>
                  </div>
                  <div className="w-full bg-background/50 rounded-full h-2">
                    <div 
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${(workout.completed / workout.exercises) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
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
                {goals.filter(g => g.completed).length}/{goals.length}
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
          
          <div className="space-y-3">
            {goals.map((goal) => (
              <div 
                key={goal.id} 
                className="group flex items-start gap-3 p-3 rounded-xl bg-background/50 hover:bg-background/70 transition-smooth"
              >
                <div 
                  onClick={() => toggleGoal(goal.id)}
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
          </div>
        </div>
      </div>
    </main>
  );
};
