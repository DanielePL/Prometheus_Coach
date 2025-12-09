import { useState } from "react";
import { Sidebar } from "@/components/Navigation/Sidebar";
import { BottomNav } from "@/components/Navigation/BottomNav";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import gradientBg from "@/assets/gradient-bg.jpg";
import gradientBgDark from "@/assets/gradient-bg-dark.png";
import bannerImg from "@/assets/gym-banner.jpg";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExercisesTab } from "@/components/Library/ExercisesTab";
import { WorkoutTemplatesTab } from "@/components/Library/WorkoutTemplatesTab";
import { ProgramTemplatesTab } from "@/components/Library/ProgramTemplatesTab";
import { useUserRole } from "@/hooks/useUserRole";

const Library = () => {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("exercises");
  const { isCoach } = useUserRole();

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
          {/* Banner Section with Theme Toggle */}
          <div className="relative w-full h-48 lg:h-56 rounded-3xl overflow-hidden mb-8">
            <img
              src={bannerImg}
              alt="Library"
              className="w-full h-full object-cover"
            />
            <div
              className={`absolute inset-0 ${
                theme === "dark"
                  ? "bg-black/50"
                  : "bg-gradient-to-r from-primary/80 to-orange-500/60"
              }`}
            />

            {/* Banner Content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <h1 className="text-3xl lg:text-4xl font-bold mb-2">Library</h1>
                <p className="text-white/80">
                  Exercises, Workouts & Programs
                </p>
              </div>
            </div>

            {/* Theme Toggle - Overlapping Image */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="absolute top-4 right-4 glass w-10 h-10 rounded-xl flex items-center justify-center transition-smooth hover:bg-primary hover:text-primary-foreground z-10"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="glass w-full md:w-auto flex-wrap">
              <TabsTrigger value="exercises" className="flex-1 md:flex-none">
                Exercises
              </TabsTrigger>
              <TabsTrigger value="workouts" className="flex-1 md:flex-none">
                Workouts
              </TabsTrigger>
              <TabsTrigger value="programs" className="flex-1 md:flex-none">
                Programs
              </TabsTrigger>
              {isCoach && (
                <>
                  <TabsTrigger value="my-workouts" className="flex-1 md:flex-none">
                    My Workouts
                  </TabsTrigger>
                  <TabsTrigger value="my-programs" className="flex-1 md:flex-none">
                    My Programs
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="exercises">
              <ExercisesTab />
            </TabsContent>

            <TabsContent value="workouts">
              <WorkoutTemplatesTab />
            </TabsContent>

            <TabsContent value="programs">
              <ProgramTemplatesTab />
            </TabsContent>

            {isCoach && (
              <>
                <TabsContent value="my-workouts">
                  <WorkoutTemplatesTab showMyWorkouts />
                </TabsContent>

                <TabsContent value="my-programs">
                  <ProgramTemplatesTab showMyPrograms />
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Library;
