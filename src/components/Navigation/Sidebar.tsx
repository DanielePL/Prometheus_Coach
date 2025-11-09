import { useState } from "react";
import { LayoutDashboard, Compass, Bookmark, Users, UserPlus, Calendar, Mail, Settings, LogOut, Upload } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ProfilePhotoUpload } from "@/components/Profile/ProfilePhotoUpload";
import logoIcon from "@/assets/logo.png";
import logoFull from "@/assets/logo-full.png";
import logoWhite from "@/assets/logo-white.png";

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
  { icon: Users, label: "Clients", path: "/clients" },
  { icon: Calendar, label: "Calendar", path: "/calendar" },
  { icon: UserPlus, label: "Requests", path: "/requests" },
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: Mail, label: "Inbox", path: "/inbox" },
];

export const Sidebar = () => {
  const [open, setOpen] = useState(false);
  const [photoUploadOpen, setPhotoUploadOpen] = useState(false);
  const { theme } = useTheme();
  const location = useLocation();
  const { profile, signOut, user } = useAuth();
  
  // Get user role from metadata
  const userRole = user?.user_metadata?.role;
  
  // Debug logging
  console.log('Sidebar - User role:', userRole);
  console.log('Sidebar - User metadata:', user?.user_metadata);
  
  // Filter nav items based on role
  const navItems = baseNavItems.filter(item => {
    if (!item.roleRequired) return true;
    const hasRole = item.roleRequired.includes(userRole);
    if (item.label === 'Uploads') {
      console.log('Uploads visibility check:', { userRole, roleRequired: item.roleRequired, hasRole });
    }
    return hasRole;
  });


  return (
    <motion.aside
      className="hidden lg:flex flex-col glass border-r border-glass-border fixed left-0 top-0 h-screen py-6 z-50"
      animate={{
        width: open ? "240px" : "80px",
      }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Logo */}
      <div className="flex items-center px-6 mb-8 overflow-hidden">
        <motion.img
          src={open ? (theme === "dark" ? logoWhite : logoFull) : logoIcon}
          alt="Prometheus Coach"
          animate={{
            width: open ? "160px" : "40px",
          }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
          }}
          className="h-auto object-contain"
        />
      </div>
      
      {/* Navigation Icons */}
      <nav className="flex flex-col gap-2 flex-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`
                flex items-center gap-3 px-3 py-3 rounded-xl transition-smooth
                ${isActive 
                  ? 'bg-primary text-primary-foreground glow-orange' 
                  : 'dark:text-white text-muted-foreground dark:hover:bg-background/60 hover:text-black hover:bg-white/50 hover:text-base hover:glow-orange'
                }
              `}
              aria-label={item.label}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <motion.span
                animate={{
                  opacity: open ? 1 : 0,
                  display: open ? "inline-block" : "none",
                }}
                className="text-sm font-medium whitespace-nowrap"
              >
                {item.label}
              </motion.span>
            </Link>
          );
        })}
      </nav>

      {/* Profile Section */}
      <div className="px-3 space-y-2">
        <div
          className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-smooth dark:text-white text-muted-foreground ${open ? 'glass' : ''} cursor-pointer hover:bg-background/60`}
          onClick={() => setPhotoUploadOpen(true)}
        >
          <UserAvatar
            avatarUrl={profile?.avatar_url}
            fullName={profile?.full_name || 'User'}
            userId={user?.id}
            className="w-10 h-10 flex-shrink-0"
          />
          <motion.div
            animate={{
              opacity: open ? 1 : 0,
              display: open ? "flex" : "none",
            }}
            className="flex flex-col items-start"
          >
            <span className="text-sm font-medium whitespace-nowrap">{profile?.full_name || 'User'}</span>
            <span className="text-xs text-muted-foreground">My Account</span>
          </motion.div>
        </div>

        <button
          onClick={signOut}
          className={`
            flex items-center gap-3 px-3 py-3 rounded-xl transition-smooth w-full
            dark:text-white text-muted-foreground dark:hover:bg-background/60 hover:text-black hover:bg-white/50 hover:glow-orange
          `}
          aria-label="Sign Out"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <motion.span
            animate={{
              opacity: open ? 1 : 0,
              display: open ? "inline-block" : "none",
            }}
            className="text-sm font-medium whitespace-nowrap"
          >
            Sign Out
          </motion.span>
        </button>
      </div>

      {/* Profile Photo Upload Dialog */}
      <ProfilePhotoUpload open={photoUploadOpen} onOpenChange={setPhotoUploadOpen} />
    </motion.aside>
  );
};
