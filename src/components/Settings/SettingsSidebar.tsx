import { NavLink } from "@/components/NavLink";
import { User, Shield, Bell, Clock, Calendar, Lock, Palette, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsSidebarProps {
  isCoach: boolean;
}

export function SettingsSidebar({ isCoach }: SettingsSidebarProps) {
  const tabs = [
    { id: "profile", label: "Profile", icon: User, visible: true },
    { id: "account", label: "Account", icon: Shield, visible: true },
    { id: "subscription", label: "Subscription", icon: CreditCard, visible: isCoach },
    { id: "notifications", label: "Notifications", icon: Bell, visible: true },
    { id: "business-hours", label: "Business Hours", icon: Clock, visible: isCoach },
    { id: "booking", label: "Booking Settings", icon: Calendar, visible: isCoach },
    { id: "privacy", label: "Privacy", icon: Lock, visible: true },
    { id: "appearance", label: "Appearance", icon: Palette, visible: true },
  ];

  return (
    <aside className="w-full lg:w-64 glass rounded-xl p-4 lg:sticky lg:top-6 lg:h-fit">
      <nav className="space-y-1">
        {tabs.filter(tab => tab.visible).map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.id}
              to={`/settings?tab=${tab.id}`}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                "hover:bg-primary/10 text-foreground/70 hover:text-foreground"
              )}
              activeClassName="bg-primary/20 text-primary font-medium"
            >
              <Icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
