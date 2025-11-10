import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Sidebar } from "@/components/Navigation/Sidebar";
import { BottomNav } from "@/components/Navigation/BottomNav";
import { useTheme } from "next-themes";
import gradientBg from "@/assets/gradient-bg.jpg";
import gradientBgDark from "@/assets/gradient-bg-dark.png";
import { NotificationBell } from "@/components/Notifications/NotificationBell";
import { SettingsSidebar } from "@/components/Settings/SettingsSidebar";
import { ProfileSettings } from "@/components/Settings/ProfileSettings";
import { AccountSettings } from "@/components/Settings/AccountSettings";
import { NotificationSettings } from "@/components/Settings/NotificationSettings";
import { PrivacySettings } from "@/components/Settings/PrivacySettings";
import { AppearanceSettings } from "@/components/Settings/AppearanceSettings";
import { BusinessHoursSettings } from "@/components/Calendar/BusinessHoursSettings";
import { AvailabilitySettings } from "@/components/Calendar/AvailabilitySettings";
import { BookingLinksSettings } from "@/components/Calendar/BookingLinksSettings";
import { useUserRole } from "@/hooks/useUserRole";

const Settings = () => {
  const { theme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isCoach } = useUserRole();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "profile");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileSettings />;
      case "account":
        return <AccountSettings />;
      case "notifications":
        return <NotificationSettings />;
      case "business-hours":
        return isCoach ? (
          <div className="space-y-6">
            <BusinessHoursSettings />
            <AvailabilitySettings />
          </div>
        ) : null;
      case "booking":
        return isCoach ? <BookingLinksSettings /> : null;
      case "privacy":
        return <PrivacySettings />;
      case "appearance":
        return <AppearanceSettings />;
      default:
        return <ProfileSettings />;
    }
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
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold">Settings</h1>
            <NotificationBell />
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            <SettingsSidebar isCoach={isCoach} />
            
            <div className="flex-1 min-w-0">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Settings;
