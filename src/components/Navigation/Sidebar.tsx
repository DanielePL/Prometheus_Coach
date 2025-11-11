import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, Compass, Bookmark, Calendar, Users, Mail, Settings, LogOut, Upload, Dumbbell, TrendingUp, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import logoFull from "@/assets/logo-full.png";
import logo from "@/assets/logo.png";
import logoWhite from "@/assets/logo-white.png";
import { ProfilePhotoUpload } from "@/components/Profile/ProfilePhotoUpload";
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "../ui/user-avatar";
import { useUserRole } from "@/hooks/useUserRole";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
];

export const Sidebar = () => {
  const location = useLocation();
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [photoUploadOpen, setPhotoUploadOpen] = useState(false);
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { user, profile, signOut } = useAuth();
  const { role } = useUserRole();

  // Filter nav items based on role
  const navItems = baseNavItems.filter(item => {
    if (!item.roleRequired) return true;
    return item.roleRequired.includes(role || "client");
  });

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
      setSignOutDialogOpen(false);
    }
  };


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
          src={open ? (theme === "dark" ? logoWhite : logoFull) : logo}
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
          onClick={() => setSignOutDialogOpen(true)}
          disabled={isSigningOut}
          className={`
            flex items-center gap-3 px-3 py-3 rounded-xl transition-smooth w-full
            dark:text-white text-muted-foreground dark:hover:bg-background/60 hover:text-black hover:bg-white/50 hover:glow-orange
            hover:animate-pulse disabled:opacity-50 disabled:cursor-not-allowed
          `}
          aria-label="Sign Out"
        >
          {isSigningOut ? (
            <Loader2 className="w-5 h-5 flex-shrink-0 animate-spin" />
          ) : (
            <LogOut className="w-5 h-5 flex-shrink-0" />
          )}
          <motion.span
            animate={{
              opacity: open ? 1 : 0,
              display: open ? "inline-block" : "none",
            }}
            className="text-sm font-medium whitespace-nowrap"
          >
            {isSigningOut ? "Signing out..." : "Sign Out"}
          </motion.span>
        </button>
      </div>

      {/* Profile Photo Upload Dialog */}
      <ProfilePhotoUpload open={photoUploadOpen} onOpenChange={setPhotoUploadOpen} />

      {/* Sign Out Confirmation Dialog */}
      <AlertDialog open={signOutDialogOpen} onOpenChange={setSignOutDialogOpen}>
        <AlertDialogContent className="animate-in slide-in-from-bottom-4 duration-300 border-primary/20 shadow-[0_0_30px_rgba(255,107,53,0.15)]">
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out of your account?</AlertDialogTitle>
            <AlertDialogDescription>
              You will be redirected to the login page. Any unsaved changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSigningOut}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="bg-primary hover:bg-primary/90"
            >
              {isSigningOut ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing out...
                </>
              ) : (
                "Sign out"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.aside>
  );
};
