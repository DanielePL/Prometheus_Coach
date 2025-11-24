import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useSaveMeasurement } from "@/hooks/useBodyMeasurements";

interface LogMeasurementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogMeasurementDialog({ open, onOpenChange }: LogMeasurementDialogProps) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [chest, setChest] = useState("");
  const [waist, setWaist] = useState("");
  const [hips, setHips] = useState("");
  const [arms, setArms] = useState("");
  const [legs, setLegs] = useState("");
  const saveMeasurement = useSaveMeasurement();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await saveMeasurement.mutateAsync({
      date,
      chest: chest ? parseFloat(chest) : undefined,
      waist: waist ? parseFloat(waist) : undefined,
      hips: hips ? parseFloat(hips) : undefined,
      arms: arms ? parseFloat(arms) : undefined,
      legs: legs ? parseFloat(legs) : undefined,
    });

    // Reset form
    setDate(new Date().toISOString().split("T")[0]);
    setChest("");
    setWaist("");
    setHips("");
    setArms("");
    setLegs("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Body Measurements</DialogTitle>
          <DialogDescription>
            Record your body measurements to track changes over time (all measurements in cm)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="chest">Chest (cm)</Label>
              <Input
                id="chest"
                type="number"
                step="0.1"
                placeholder="98.5"
                value={chest}
                onChange={(e) => setChest(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="waist">Waist (cm)</Label>
              <Input
                id="waist"
                type="number"
                step="0.1"
                placeholder="85.0"
                value={waist}
                onChange={(e) => setWaist(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hips">Hips (cm)</Label>
              <Input
                id="hips"
                type="number"
                step="0.1"
                placeholder="95.0"
                value={hips}
                onChange={(e) => setHips(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="arms">Arms (cm)</Label>
              <Input
                id="arms"
                type="number"
                step="0.1"
                placeholder="35.0"
                value={arms}
                onChange={(e) => setArms(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="legs">Legs (cm)</Label>
              <Input
                id="legs"
                type="number"
                step="0.1"
                placeholder="60.0"
                value={legs}
                onChange={(e) => setLegs(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saveMeasurement.isPending}
              className="flex-1"
            >
              {saveMeasurement.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
