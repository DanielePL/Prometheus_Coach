import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Navigation/Sidebar";
import { BottomNav } from "@/components/Navigation/BottomNav";
import { Calendar, Users, Bell, TrendingUp, Mail, Target, Search, Moon, Sun, Plus } from "lucide-react";
import { InfoCard } from "@/components/Exercise/InfoCard";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import gradientBg from "@/assets/gradient-bg.jpg";
import gradientBgDark from "@/assets/gradient-bg-dark.png";
import legcurlImg from "@/assets/legcurl.jpg";
import highkneesImg from "@/assets/highknees.jpg";
import { Button } from "@/components/ui/button";
import { ShinyButton } from "@/components/ui/shiny-button";
import sarahJohnsonImg from "@/assets/sarah-johnson.jpg";
import jessicaTaylorImg from "@/assets/jessica-taylor.jpg";
import alexMartinezImg from "@/assets/alex-martinez.jpg";
import mikeChenImg from "@/assets/mike-chen.jpg";
import rachelKimImg from "@/assets/rachel-kim.jpg";

const Dashboard = () => {
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

  const scheduleItems = [
    { time: "9:00 AM", title: "Client Session - John D." },
    { time: "11:30 AM", title: "Team Meeting" },
    { time: "2:00 PM", title: "Client Session - Sarah M." },
    { time: "4:00 PM", title: "Client Session - Jessica T." },
  ];

  const [goals, setGoals] = useState([
    { id: 1, text: "Review 3 client progress reports", completed: true },
    { id: 2, text: "Update training programs for Team Alpha", completed: false },
    { id: 3, text: "Follow up with new client onboarding", completed: false },
    { id: 4, text: "Record new exercise demonstration video", completed: false },
  ]);

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
            
            <Button variant="ghost" size="icon" className="glass rounded-xl relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
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
          {/* Today's Schedule */}
          <div className="lg:col-span-1 glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Today's Schedule</h2>
                <p className="text-sm text-muted-foreground">{scheduleItems.length} entries</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {scheduleItems.map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-background/50 dark:border dark:border-primary">
                  <span className="text-primary font-semibold text-sm whitespace-nowrap">{item.time}</span>
                  <span className="text-foreground text-sm">{item.title}</span>
                </div>
              ))}
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
                    42
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
              value="3"
              variant="accent"
              avatars={[rachelKimImg, sarahJohnsonImg, jessicaTaylorImg]}
              onClick={() => navigate('/inbox')}
            />
            <InfoCard
              icon={Users}
              label="Active Clients"
              value="24"
              variant="accent"
              avatars={[sarahJohnsonImg, jessicaTaylorImg, alexMartinezImg, mikeChenImg]}
              onClick={() => navigate('/clients')}
            />
            <InfoCard
              icon={Bell}
              label="Pending Requests"
              value="7"
              variant="accent"
              avatars={[alexMartinezImg, mikeChenImg, rachelKimImg, sarahJohnsonImg]}
              onClick={() => navigate('/requests')}
            />
          </div>
        </div>

        {/* Exercises and Goals */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Exercises */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-4">Exercises</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass rounded-2xl overflow-hidden group cursor-pointer transition-smooth glass-hover">
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={legcurlImg} 
                    alt="Leg Curl Machine - Lying"
                    className="w-full h-full object-cover transition-all duration-500 group-hover:grayscale group-hover:scale-125"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                      bodybuilding
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg">Leg Curl Machine - Lying</h3>
                </div>
              </div>

              <div className="glass rounded-2xl overflow-hidden group cursor-pointer transition-smooth glass-hover">
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={highkneesImg} 
                    alt="Walking High Knees"
                    className="w-full h-full object-cover transition-all duration-500 group-hover:grayscale group-hover:scale-125"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                      crossfit
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg">Walking High Knees</h3>
                </div>
              </div>
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
                  {goals.filter(g => g.completed).length} of {goals.length} completed
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
                  onClick={() => toggleGoal(goal.id)}
                  className="flex items-start gap-3 p-3 rounded-xl bg-background/50 cursor-pointer hover:bg-background/70 transition-smooth"
                >
                  <div className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5
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
                  <span className={`text-sm ${goal.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {goal.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
