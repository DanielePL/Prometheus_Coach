import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  avatarUrl?: string | null;
  fullName: string;
  userId?: string;
  className?: string;
  onClick?: () => void;
}

// Generate consistent color based on user ID or name
const getAvatarColor = (seed: string) => {
  const colors = [
    "bg-orange-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-yellow-500",
    "bg-teal-500",
    "bg-red-500",
  ];
  
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const UserAvatar = ({ 
  avatarUrl, 
  fullName, 
  userId, 
  className,
  onClick 
}: UserAvatarProps) => {
  const initials = getInitials(fullName);
  const colorClass = getAvatarColor(userId || fullName);

  return (
    <Avatar 
      className={cn(
        "transition-smooth cursor-pointer",
        onClick && "hover:ring-2 hover:ring-primary hover:ring-offset-2",
        className
      )}
      onClick={onClick}
    >
      <AvatarImage src={avatarUrl || undefined} alt={fullName} />
      <AvatarFallback className={cn(colorClass, "text-white font-bold")}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};
