import { useState } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface Goal {
  id: string;
  text: string;
  completed: boolean;
}

interface GoalItemProps {
  goal: Goal;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const GoalItem = ({ goal, onToggle, onEdit, onDelete }: GoalItemProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="flex items-start gap-3 p-3 rounded-xl bg-background/50 hover:bg-background/70 transition-smooth group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        onClick={onToggle}
        className={`
          w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer
          ${goal.completed 
            ? 'bg-primary border-primary' 
            : 'border-muted-foreground'
          }
        `}
      >
        {goal.completed && (
          <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      
      <span 
        onClick={onToggle}
        className={`flex-1 text-sm cursor-pointer ${goal.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}
      >
        {goal.text}
      </span>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-smooth ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="glass border-primary/20 z-50">
          <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
            <Pencil className="mr-2 h-4 w-4" />
            <span>Edit</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="cursor-pointer text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
