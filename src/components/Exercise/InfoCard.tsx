import { LucideIcon } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";

interface UserData {
  id: string;
  full_name: string;
  avatar_url?: string | null;
}

interface InfoCardProps {
  icon?: LucideIcon;
  label: string;
  value: string | React.ReactNode;
  variant?: "default" | "accent";
  users?: UserData[];
  onClick?: () => void;
}

export const InfoCard = ({ icon: Icon, label, value, variant = "default", users, onClick }: InfoCardProps) => {
  const displayUsers = users?.slice(0, 5) || [];
  const remainingCount = (users?.length || 0) - 5;

  return (
    <div 
      onClick={onClick}
      className="glass rounded-2xl p-5 transition-smooth cursor-pointer hover:shadow-[0_0_50px_rgba(var(--primary-rgb),0.7)] relative group hover:bg-white/70 dark:hover:bg-black/60"
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
            ${variant === "accent" ? "bg-primary text-primary-foreground" : "bg-secondary"}
          `}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="flex-1">
          <p className="text-xl font-medium text-foreground dark:text-primary mb-2 dark:group-hover:text-white transition-smooth">{label}</p>
          <div className="text-3xl lg:text-4xl font-bold text-foreground group-hover:text-primary transition-smooth">
            {value}
          </div>
        </div>
      </div>
      
      {users && users.length > 0 && (
        <div className="flex items-center justify-end mt-4 gap-1">
          {displayUsers.map((user, index) => (
            <div
              key={user.id}
              style={{ marginLeft: index > 0 ? '-10px' : '0' }}
            >
              <UserAvatar
                avatarUrl={user.avatar_url}
                fullName={user.full_name}
                userId={user.id}
                className="w-8 h-8 border-2 border-white dark:border-border"
              />
            </div>
          ))}
          {remainingCount > 0 && (
            <div 
              className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs font-bold border-2 border-white dark:border-border"
              style={{ marginLeft: '-10px' }}
            >
              +{remainingCount}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
