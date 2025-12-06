import { useState } from "react";
import { Trophy, Calendar, Medal, Dumbbell, Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  useClientMobilePRs,
  useUpdateClientPR,
  useDeleteClientPR,
  FormattedPR,
} from "@/hooks/useClientMobilePRs";
import { format, formatDistanceToNow } from "date-fns";

interface ClientPRsTabProps {
  clientId: string;
}

const SPORTS = [
  "Powerlifting",
  "Olympic Weightlifting",
  "Bodybuilding",
  "CrossFit",
  "Strongman",
  "General Fitness",
];

const UNITS = ["kg", "lbs", "reps", "seconds", "meters"];

export const ClientPRsTab = ({ clientId }: ClientPRsTabProps) => {
  const { data, isLoading, error } = useClientMobilePRs(clientId);
  const updatePR = useUpdateClientPR(clientId);
  const deletePR = useDeleteClientPR(clientId);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPR, setSelectedPR] = useState<FormattedPR | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    exerciseName: "",
    value: "",
    unit: "kg",
    sport: "Powerlifting",
  });

  const handleEdit = (pr: FormattedPR) => {
    setSelectedPR(pr);
    setFormData({
      exerciseName: pr.exerciseName,
      value: pr.value.toString(),
      unit: pr.unit,
      sport: pr.sport,
    });
    setIsAddingNew(false);
    setEditDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedPR(null);
    setFormData({
      exerciseName: "",
      value: "",
      unit: "kg",
      sport: "Powerlifting",
    });
    setIsAddingNew(true);
    setEditDialogOpen(true);
  };

  const handleDelete = (pr: FormattedPR) => {
    setSelectedPR(pr);
    setDeleteDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.exerciseName || !formData.value) return;

    updatePR.mutate(
      {
        exerciseName: formData.exerciseName,
        value: parseFloat(formData.value),
        unit: formData.unit,
        sport: formData.sport,
      },
      {
        onSuccess: () => {
          setEditDialogOpen(false);
        },
      }
    );
  };

  const handleConfirmDelete = () => {
    if (!selectedPR) return;

    deletePR.mutate(selectedPR.exerciseName, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setSelectedPR(null);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (error) {
    console.error("PR loading error:", error);
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <p className="text-red-500">Error loading PR data</p>
        <p className="text-sm text-muted-foreground mt-2">{String(error)}</p>
      </div>
    );
  }

  const { prs, totalPRs } = data || { prs: [], totalPRs: 0 };

  if (totalPRs === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-xl font-bold mb-2">No Personal Records Yet</h3>
        <p className="text-muted-foreground mb-6">
          Add your client's personal records to track their progress.
        </p>
        <Button onClick={handleAddNew}>
          <Plus className="w-4 h-4 mr-2" />
          Add First PR
        </Button>
      </div>
    );
  }

  // Find most recent PR
  const mostRecentPR = prs.reduce((latest, pr) =>
    pr.achievedAt > latest.achievedAt ? pr : latest
  );

  // Find highest value PR (assuming kg for weight-based)
  const highestPR = prs.reduce((highest, pr) =>
    pr.value > highest.value ? pr : highest
  );

  // Group by sport
  const prsBySport = prs.reduce((acc, pr) => {
    const sport = pr.sport || "Other";
    acc.set(sport, (acc.get(sport) || 0) + 1);
    return acc;
  }, new Map<string, number>());

  const summaryStats = [
    {
      icon: Trophy,
      label: "Total PRs",
      value: totalPRs,
      color: "text-yellow-500",
    },
    {
      icon: Dumbbell,
      label: "Highest PR",
      value: `${highestPR.value} ${highestPR.unit}`,
      color: "text-primary",
    },
    {
      icon: Calendar,
      label: "Latest PR",
      value: formatDistanceToNow(mostRecentPR.achievedAt, { addSuffix: true }),
      color: "text-green-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {summaryStats.map((stat) => (
          <div key={stat.label} className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center ${stat.color}`}
              >
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
            <p className="text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Most Recent PR Highlight */}
      <div className="glass rounded-2xl p-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-yellow-500/20 flex items-center justify-center">
            <Trophy className="w-7 h-7 text-yellow-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Most Recent PR</p>
            <h3 className="text-xl font-bold">{mostRecentPR.exerciseName}</h3>
            <div className="flex items-center gap-4 mt-1">
              <Badge
                variant="outline"
                className="bg-yellow-500/10 text-yellow-600 border-yellow-500/50"
              >
                {mostRecentPR.value} {mostRecentPR.unit}
              </Badge>
              <Badge variant="outline">{mostRecentPR.sport}</Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              {format(mostRecentPR.achievedAt, "MMM d, yyyy")}
            </p>
          </div>
        </div>
      </div>

      {/* PRs by Sport */}
      {prsBySport.size > 0 && (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">PRs by Sport</h2>
              <p className="text-sm text-muted-foreground">
                Distribution of personal records
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {Array.from(prsBySport.entries()).map(([sport, count]) => (
              <Badge key={sport} variant="outline" className="text-base px-4 py-2">
                {sport}: {count}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* All PRs List */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Medal className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">All Personal Records</h2>
              <p className="text-sm text-muted-foreground">
                From {data?.profile?.name || "client"}'s profile
              </p>
            </div>
          </div>
          <Button onClick={handleAddNew} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add PR
          </Button>
        </div>

        <div className="space-y-3">
          {prs.map((pr, i) => (
            <div
              key={pr.exerciseName}
              className="p-4 rounded-xl bg-background/50 border border-border/50 hover:border-primary/30 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      i === 0
                        ? "bg-yellow-500/20 text-yellow-500"
                        : i === 1
                        ? "bg-gray-400/20 text-gray-400"
                        : i === 2
                        ? "bg-orange-500/20 text-orange-500"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold">{pr.exerciseName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {pr.sport} · {format(pr.achievedAt, "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-bold text-lg">
                    {pr.value} {pr.unit}
                  </p>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEdit(pr)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(pr)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit/Add Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isAddingNew ? "Add New PR" : "Edit PR"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="exerciseName">Exercise Name</Label>
              <Input
                id="exerciseName"
                value={formData.exerciseName}
                onChange={(e) =>
                  setFormData({ ...formData, exerciseName: e.target.value })
                }
                placeholder="e.g., Squat, Bench Press, Deadlift"
                disabled={!isAddingNew}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value">Value</Label>
                <Input
                  id="value"
                  type="number"
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
                  placeholder="e.g., 100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) =>
                    setFormData({ ...formData, unit: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sport">Sport</Label>
              <Select
                value={formData.sport}
                onValueChange={(value) =>
                  setFormData({ ...formData, sport: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPORTS.map((sport) => (
                    <SelectItem key={sport} value={sport}>
                      {sport}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.exerciseName || !formData.value || updatePR.isPending}
            >
              {updatePR.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete PR?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the PR for "{selectedPR?.exerciseName}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePR.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
