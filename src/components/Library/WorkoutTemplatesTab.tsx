import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkoutTemplates, useWorkoutTemplate, WorkoutTemplate } from "@/hooks/useWorkoutTemplates";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Dumbbell, Loader2, Clock, Target, ChevronRight, Plus, User } from "lucide-react";

// Sports filter options
const sportFilters = ["all", "Weightlifting", "Powerlifting", "General Strength", "CrossFit", "Hyrox"] as const;

interface WorkoutTemplatesTabProps {
  showMyWorkouts?: boolean;
}

export const WorkoutTemplatesTab = ({ showMyWorkouts = false }: WorkoutTemplatesTabProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState("all");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Fetch templates - either user's templates or public templates
  const { data: templates = [], isLoading } = useWorkoutTemplates({
    userId: showMyWorkouts ? user?.id : undefined,
    includePublic: !showMyWorkouts,
    sport: selectedSport,
  });

  // Fetch selected template details
  const { data: selectedTemplate, isLoading: isLoadingDetails } = useWorkoutTemplate(
    selectedTemplateId || undefined
  );

  // Filter by search query
  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTemplateClick = (template: WorkoutTemplate) => {
    setSelectedTemplateId(template.id);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            type="text"
            placeholder="Search workout templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 glass"
          />
        </div>

        {/* Sport Filters */}
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-sm text-muted-foreground font-medium mr-2">Sport:</span>
          {sportFilters.map((sport) => (
            <button
              key={sport}
              onClick={() => setSelectedSport(sport)}
              className={`
                px-4 py-2 rounded-full text-sm font-semibold
                transition-smooth
                ${selectedSport === sport
                  ? 'bg-gradient-to-r from-primary to-orange-500 text-white shadow-[0_0_20px_rgba(251,146,60,0.4)]'
                  : 'glass hover:bg-white/20 dark:hover:bg-black/30 border border-white/20'
                }
              `}
            >
              {sport === "all" ? "All Sports" : sport}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <div className="text-sm text-muted-foreground">
          <Dumbbell className="inline-block w-4 h-4 mr-1" />
          {filteredTemplates.length} workout templates found
        </div>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center">
          <Dumbbell className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">
            {showMyWorkouts
              ? "No workout templates created yet."
              : "No workout templates found. Try a different search or filter."}
          </p>
          {showMyWorkouts && (
            <Button
              onClick={() => navigate("/routines/create")}
              className="bg-gradient-to-r from-primary to-orange-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Workout
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              onClick={() => handleTemplateClick(template)}
              className="glass rounded-xl p-4 cursor-pointer hover:bg-accent/50 transition-colors group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                    {template.name}
                  </h3>
                  {template.user_id && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <User className="w-3 h-3" />
                      Custom
                    </div>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>

              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  <Dumbbell className="w-4 h-4" />
                  {template.exercise_count || 0} exercises
                </span>
              </div>

              {/* Sports Tags */}
              {template.sports && template.sports.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {template.sports.slice(0, 3).map((sport) => (
                    <Badge
                      key={sport}
                      variant="secondary"
                      className="text-xs bg-primary/10 text-primary border-none"
                    >
                      {sport}
                    </Badge>
                  ))}
                  {template.sports.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{template.sports.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Template Detail Dialog */}
      <Dialog open={!!selectedTemplateId} onOpenChange={(open) => !open && setSelectedTemplateId(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name || "Workout Template"}</DialogTitle>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : selectedTemplate ? (
            <div className="space-y-4">
              {/* Template Info */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Dumbbell className="w-4 h-4" />
                  {selectedTemplate.exercise_count || 0} exercises
                </span>
                {selectedTemplate.sports && selectedTemplate.sports.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    {selectedTemplate.sports.join(", ")}
                  </span>
                )}
              </div>

              {/* Exercises List */}
              <div className="space-y-2">
                <h4 className="font-medium">Exercises</h4>
                {selectedTemplate.exercises && selectedTemplate.exercises.length > 0 ? (
                  <div className="space-y-2">
                    {selectedTemplate.exercises.map((te, index) => (
                      <div
                        key={te.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-accent/30"
                      >
                        {te.exercise?.thumbnail_url && (
                          <img
                            src={te.exercise.thumbnail_url}
                            alt={te.exercise.title}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{te.exercise?.title || "Unknown Exercise"}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {te.exercise?.primary_muscles || te.exercise?.category}
                          </p>
                        </div>
                        <span className="text-sm text-muted-foreground">#{index + 1}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No exercises in this template.</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setSelectedTemplateId(null)}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    // TODO: Implement "Use Template" functionality
                    // This could create a routine from the template or start a workout
                    setSelectedTemplateId(null);
                  }}
                  className="flex-1 bg-gradient-to-r from-primary to-orange-500"
                >
                  Use Template
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};
