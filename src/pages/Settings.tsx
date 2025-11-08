import { Sidebar } from "@/components/Navigation/Sidebar";
import { BottomNav } from "@/components/Navigation/BottomNav";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import gradientBg from "@/assets/gradient-bg.jpg";
import gradientBgDark from "@/assets/gradient-bg-dark.png";
import { NotificationBell } from "@/components/Notifications/NotificationBell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BusinessHoursSettings } from "@/components/Calendar/BusinessHoursSettings";
import { AvailabilitySettings } from "@/components/Calendar/AvailabilitySettings";
import { TimezoneSettings } from "@/components/Settings/TimezoneSettings";

const Settings = () => {
  const { theme, setTheme } = useTheme();

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
        <div className="container mx-auto px-4 lg:px-8 py-6 lg:py-10 max-w-5xl">
          {/* Header with Title and Theme Toggle */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold">Settings</h1>
            
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

          <Tabs defaultValue="availability" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="availability">Availability</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>

            <TabsContent value="availability" className="space-y-6">
              <BusinessHoursSettings />
              <AvailabilitySettings />
            </TabsContent>

            <TabsContent value="preferences" className="space-y-6">
              <TimezoneSettings />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Settings;
