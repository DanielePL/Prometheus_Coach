import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRoutines, useDeleteRoutine } from "@/hooks/useRoutines";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Search, Edit, Trash2, Users, Loader2 } from "lucide-react";
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

export default function Routines() {
  const navigate = useNavigate();
  const { data: routines, isLoading } = useRoutines();
  const deleteRoutine = useDeleteRoutine();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [routineToDelete, setRoutineToDelete] = useState<string | null>(null);

  const filteredRoutines = routines?.filter((routine) =>
    routine.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (id: string) => {
    setRoutineToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (routineToDelete) {
      await deleteRoutine.mutateAsync(routineToDelete);
      setDeleteDialogOpen(false);
      setRoutineToDelete(null);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Routines</h1>
          <p className="text-muted-foreground mt-1">Create and manage workout routines</p>
        </div>
        <Button
          onClick={() => navigate("/routines/create")}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Create New Routine
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search routines..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Routines Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredRoutines && filteredRoutines.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoutines.map((routine) => (
            <Card
              key={routine.id}
              className="p-6 bg-card border-border hover:border-primary/50 transition-all cursor-pointer group"
              onClick={() => navigate(`/routines/${routine.id}`)}
            >
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                    {routine.name}
                  </h3>
                  {routine.description && (
                    <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                      {routine.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    exercises
                  </span>
                  <span>
                    {new Date(routine.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/routines/${routine.id}/edit`)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {/* TODO: Open assign modal */}}
                  >
                    <Users className="w-4 h-4 mr-1" />
                    Assign
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(routine.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <p className="text-muted-foreground mb-4">
            {searchQuery ? "No routines found matching your search" : "No routines yet. Create your first routine to get started!"}
          </p>
          <Button onClick={() => navigate("/routines/create")}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Routine
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Routine</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this routine? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
