import { LayoutDashboard, Compass, Bookmark, Users, Calendar, Mail, Settings, User, Upload, Dumbbell, TrendingUp } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  roleRequired?: string[];
}

const baseNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Compass, label: "Explore", path: "/explore" },
  { icon: Bookmark, label: "Saved", path: "/saved" },
  { icon: Upload, label: "Uploads", path: "/uploads", roleRequired: ["coach", "admin"] },
  { icon: Dumbbell, label: "My Workouts", path: "/my-workouts", roleRequired: ["client"] },
  { icon: TrendingUp, label: "My Progress", path: "/my-progress", roleRequired: ["client"] },
  { icon: Calendar, label: "Calendar", path: "/calendar" },
  { icon: Users, label: "Clients", path: "/clients", roleRequired: ["coach", "admin"] },
  { icon: Mail, label: "Inbox", path: "/inbox" },
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: User, label: "Account", path: "/account" },
];

export const BottomNav = () => {
  const location = useLocation();
  const { role } = useUserRole();
  
  // Filter nav items based on role
  const navItems = baseNavItems.filter(item => {
    if (!item.roleRequired) return true;
    return item.roleRequired.includes(role || "client");
  });

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass border-t border-glass-border z-50">
      <div className="flex items-center justify-around h-16 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`
                flex flex-col items-center justify-center gap-1 transition-smooth
                ${isActive 
                  ? 'text-primary' 
                  : 'dark:text-white text-muted-foreground'
                }
              `}
              aria-label={item.label}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'glow-orange' : ''}`} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
