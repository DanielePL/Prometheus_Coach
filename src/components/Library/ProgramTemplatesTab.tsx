import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useProgramTemplates,
  useUserPrograms,
  useProgramTemplate,
  ProgramTemplate,
  UserProgram,
  getDifficultyDisplay,
  getSportDisplay,
  getGoalsDisplay,
} from "@/hooks/useProgramTemplates";
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
import {
  Search,
  Loader2,
  Calendar,
  Target,
  ChevronRight,
  Dumbbell,
  Clock,
  Trophy,
  Play,
  Pause,
  CheckCircle,
} from "lucide-react";

// Sport filter options
const sportFilters = [
  { value: "all", label: "All Sports" },
  { value: "weightlifting", label: "Weightlifting" },
  { value: "powerlifting", label: "Powerlifting" },
  { value: "general_strength", label: "General Strength" },
  { value: "crossfit", label: "CrossFit" },
  { value: "hyrox", label: "Hyrox" },
];

// Difficulty filter options
const difficultyFilters = [
  { value: "all", label: "All Levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

interface ProgramTemplatesTabProps {
  showMyPrograms?: boolean;
}

export const ProgramTemplatesTab = ({ showMyPrograms = false }: ProgramTemplatesTabProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSport, setSelectedSport] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  // Fetch program templates
  const { data: templates = [], isLoading: isLoadingTemplates } = useProgramTemplates({
    sportTypeId: selectedSport,
    difficulty: selectedDifficulty,
  });

  // Fetch user's programs (if showing my programs)
  const { data: userPrograms = [], isLoading: isLoadingUserPrograms } = useUserPrograms(
    showMyPrograms ? user?.id : undefined
  );

  // Fetch selected template details
  const { data: selectedTemplate, isLoading: isLoadingDetails } = useProgramTemplate(
    selectedTemplateId || undefined
  );

  const isLoading = isLoadingTemplates || isLoadingUserPrograms;

  // Filter templates by search query
  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (template.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Filter user programs by search query
  const filteredUserPrograms = userPrograms.filter((program) =>
    program.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTemplateClick = (template: ProgramTemplate) => {
    setSelectedTemplateId(template.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/50";
      case "completed":
        return "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/50";
      case "paused":
        return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/50";
      default:
        return "bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Play className="w-3 h-3" />;
      case "completed":
        return <CheckCircle className="w-3 h-3" />;
      case "paused":
        return <Pause className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            type="text"
            placeholder="Search programs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 glass"
          />
        </div>

        {!showMyPrograms && (
          <>
            {/* Sport Filters */}
            <div className="flex gap-2 flex-wrap items-center">
              <span className="text-sm text-muted-foreground font-medium mr-2">Sport:</span>
              {sportFilters.map((sport) => (
                <button
                  key={sport.value}
                  onClick={() => setSelectedSport(sport.value)}
                  className={`
                    px-4 py-2 rounded-full text-sm font-semibold
                    transition-smooth
                    ${selectedSport === sport.value
                      ? 'bg-gradient-to-r from-primary to-orange-500 text-white shadow-[0_0_20px_rgba(251,146,60,0.4)]'
                      : 'glass hover:bg-white/20 dark:hover:bg-black/30 border border-white/20'
                    }
                  `}
                >
                  {sport.label}
                </button>
              ))}
            </div>

            {/* Difficulty Filters */}
            <div className="flex gap-2 flex-wrap items-center">
              <span className="text-sm text-muted-foreground font-medium mr-2">Level:</span>
              {difficultyFilters.map((diff) => (
                <button
                  key={diff.value}
                  onClick={() => setSelectedDifficulty(diff.value)}
                  className={`
                    px-4 py-2 rounded-full text-sm font-semibold
                    transition-smooth
                    ${selectedDifficulty === diff.value
                      ? 'bg-gradient-to-r from-primary to-orange-500 text-white shadow-[0_0_20px_rgba(251,146,60,0.4)]'
                      : 'glass hover:bg-white/20 dark:hover:bg-black/30 border border-white/20'
                    }
                  `}
                >
                  {diff.label}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Results Count */}
        <div className="text-sm text-muted-foreground">
          <Trophy className="inline-block w-4 h-4 mr-1" />
          {showMyPrograms
            ? `${filteredUserPrograms.length} programs`
            : `${filteredTemplates.length} program templates found`}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : showMyPrograms ? (
        // User Programs
        filteredUserPrograms.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              No programs started yet. Browse templates to start a program.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUserPrograms.map((program) => (
              <UserProgramCard key={program.id} program={program} />
            ))}
          </div>
        )
      ) : (
        // Program Templates
        filteredTemplates.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              No program templates found. Try a different search or filter.
            </p>
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
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">
                      {template.name}
                    </h3>
                    {template.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {template.description}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 ml-2" />
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {template.duration_weeks} weeks
                  </span>
                  {template.days_per_week && (
                    <span className="flex items-center gap-1">
                      <Dumbbell className="w-4 h-4" />
                      {template.days_per_week}x/week
                    </span>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-none">
                    {getDifficultyDisplay(template.difficulty)}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {getSportDisplay(template.sport_type_id)}
                  </Badge>
                  {template.goal_tags && template.goal_tags.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {template.goal_tags[0].replace(/_/g, " ")}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Program Detail Dialog */}
      <Dialog open={!!selectedTemplateId} onOpenChange={(open) => !open && setSelectedTemplateId(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name || "Program Template"}</DialogTitle>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : selectedTemplate ? (
            <div className="space-y-4">
              {/* Description */}
              {selectedTemplate.description && (
                <p className="text-muted-foreground">{selectedTemplate.description}</p>
              )}

              {/* Program Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="glass rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Calendar className="w-4 h-4" />
                    Duration
                  </div>
                  <p className="font-semibold">{selectedTemplate.duration_weeks} weeks</p>
                </div>
                {selectedTemplate.days_per_week && (
                  <div className="glass rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Dumbbell className="w-4 h-4" />
                      Frequency
                    </div>
                    <p className="font-semibold">{selectedTemplate.days_per_week}x per week</p>
                  </div>
                )}
                <div className="glass rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Target className="w-4 h-4" />
                    Difficulty
                  </div>
                  <p className="font-semibold">{getDifficultyDisplay(selectedTemplate.difficulty)}</p>
                </div>
                <div className="glass rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Trophy className="w-4 h-4" />
                    Sport
                  </div>
                  <p className="font-semibold">{getSportDisplay(selectedTemplate.sport_type_id)}</p>
                </div>
              </div>

              {/* Goals */}
              {selectedTemplate.goal_tags && selectedTemplate.goal_tags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Goals</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.goal_tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Equipment Required */}
              {selectedTemplate.equipment_required && selectedTemplate.equipment_required.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Equipment Required</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.equipment_required.map((eq) => (
                      <Badge key={eq} variant="outline">
                        {eq}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Phases */}
              {selectedTemplate.phases && selectedTemplate.phases.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Training Phases</h4>
                  <div className="space-y-2">
                    {selectedTemplate.phases.map((phase) => (
                      <div key={phase.id} className="glass rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{phase.name}</span>
                          <span className="text-sm text-muted-foreground">
                            Week {phase.start_week} - {phase.start_week + phase.duration_weeks - 1}
                          </span>
                        </div>
                        {phase.description && (
                          <p className="text-sm text-muted-foreground mt-1">{phase.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                    // TODO: Implement "Start Program" functionality
                    setSelectedTemplateId(null);
                  }}
                  className="flex-1 bg-gradient-to-r from-primary to-orange-500"
                >
                  Start Program
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// User Program Card Component
const UserProgramCard = ({ program }: { program: UserProgram }) => {
  const progressPercentage = Math.round((program.current_week / program.duration_weeks) * 100);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-600 dark:text-green-400";
      case "completed":
        return "bg-blue-500/20 text-blue-600 dark:text-blue-400";
      case "paused":
        return "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400";
      default:
        return "bg-gray-500/20 text-gray-600";
    }
  };

  return (
    <div className="glass rounded-xl p-4 cursor-pointer hover:bg-accent/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg line-clamp-1">{program.name}</h3>
          <Badge className={`mt-1 ${getStatusColor(program.status)}`}>
            {program.status.charAt(0).toUpperCase() + program.status.slice(1)}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
        <span className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          Week {program.current_week} / {program.duration_weeks}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-accent/30 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-primary to-orange-500 h-2 rounded-full transition-all"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1">{progressPercentage}% complete</p>
    </div>
  );
};
