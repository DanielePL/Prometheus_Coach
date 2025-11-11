import { LayoutDashboard, Compass, Bookmark, Users, Calendar, Mail, Settings, LogOut, Upload, Dumbbell, TrendingUp, Loader2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
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

export const BottomNav = () => {
  const location = useLocation();
  const { role } = useUserRole();
  const { signOut } = useAuth();
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  
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
    <>
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
          
          {/* Sign Out Button */}
          <button
            onClick={() => setSignOutDialogOpen(true)}
            disabled={isSigningOut}
            className="flex flex-col items-center justify-center gap-1 transition-smooth dark:text-white text-muted-foreground disabled:opacity-50"
            aria-label="Sign Out"
          >
            {isSigningOut ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <LogOut className="w-5 h-5" />
            )}
          </button>
        </div>
      </nav>

      {/* Sign Out Confirmation Dialog */}
      <AlertDialog open={signOutDialogOpen} onOpenChange={setSignOutDialogOpen}>
        <AlertDialogContent>
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
    </>
  );
};
