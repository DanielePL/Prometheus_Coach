import { Sidebar } from "@/components/Navigation/Sidebar";
import { BottomNav } from "@/components/Navigation/BottomNav";
import { useTheme } from "next-themes";
import gradientBg from "@/assets/gradient-bg.jpg";
import gradientBgDark from "@/assets/gradient-bg-dark.png";
import { useUserRole } from "@/hooks/useUserRole";
import { CoachDashboard } from "./Dashboard/CoachDashboard";
import { ClientDashboard } from "./Dashboard/ClientDashboard";

const Dashboard = () => {
  const { theme } = useTheme();
  const { role, isLoading } = useUserRole();

  if (isLoading) {
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
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
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

      {role === "client" ? <ClientDashboard /> : <CoachDashboard />}
    </div>
  );
};

export default Dashboard;
