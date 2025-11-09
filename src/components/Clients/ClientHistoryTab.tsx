import { Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClientHistoryTabProps {
  clientId: string;
}

export const ClientHistoryTab = ({ clientId }: ClientHistoryTabProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Training History</h2>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="glass rounded-2xl p-12 text-center">
        <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-bold mb-2">No training history yet</h3>
        <p className="text-muted-foreground">
          Workout logs will appear here as the client completes sessions
        </p>
      </div>
    </div>
  );
};
