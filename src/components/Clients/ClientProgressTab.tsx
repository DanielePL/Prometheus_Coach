import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Plus, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWeightLogs } from "@/hooks/useWeightLogs";
import { Skeleton } from "@/components/ui/skeleton";

interface ClientProgressTabProps {
  clientId: string;
}

export const ClientProgressTab = ({ clientId }: ClientProgressTabProps) => {
  const { data: weightLogs, isLoading } = useWeightLogs(clientId);

  const chartData = weightLogs?.map((log) => ({
    date: new Date(log.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    weight: Number(log.weight),
  }));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Weight Chart */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Weight Tracking</h2>
              <p className="text-sm text-muted-foreground">
                {weightLogs && weightLogs.length > 0
                  ? `${weightLogs.length} measurements recorded`
                  : "No measurements yet"}
              </p>
            </div>
          </div>
          <Button size="sm" className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Add Entry
          </Button>
        </div>

        {chartData && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                domain={["dataMin - 5", "dataMax + 5"]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ fill: "hsl(var(--primary))", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No weight data to display
          </div>
        )}
      </div>

      {/* Body Measurements */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Body Measurements</h3>
          <Button size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Measurements
          </Button>
        </div>
        <p className="text-muted-foreground">No measurements recorded yet</p>
      </div>

      {/* Progress Photos */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">Progress Photos</h3>
          <Button size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Upload Photo
          </Button>
        </div>
        <p className="text-muted-foreground">No progress photos uploaded yet</p>
      </div>
    </div>
  );
};
