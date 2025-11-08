import { useNavigate } from "react-router-dom";

interface EventMentionParserProps {
  content: string;
}

export const EventMentionParser = ({ content }: EventMentionParserProps) => {
  const navigate = useNavigate();

  // Parse the message to detect event assignments and extract event ID
  const parseContent = () => {
    // Check for event details format
    const eventDetailsPattern = /📅 New Event Assigned[\s\S]*?Event ID: ([a-f0-9-]+)/i;
    const detailsMatch = content.match(eventDetailsPattern);
    
    if (detailsMatch && detailsMatch[1]) {
      const eventId = detailsMatch[1];
      const lines = content.split('\n');
      
      return (
        <div className="space-y-3">
          {lines.map((line, idx) => {
            // Title line
            if (line.startsWith('📅')) {
              return (
                <div key={idx} className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span className="text-lg">📅</span>
                  <span>New Event Assigned</span>
                </div>
              );
            }
            
            // Event details
            if (line.startsWith('Event:')) {
              return (
                <div key={idx} className="text-base font-bold text-foreground">
                  {line.replace('Event:', '').trim()}
                </div>
              );
            }
            
            if (line.startsWith('Type:')) {
              return (
                <div key={idx} className="text-sm text-muted-foreground">
                  <span className="font-medium">Type:</span> {line.replace('Type:', '').trim()}
                </div>
              );
            }
            
            if (line.startsWith('Start:') || line.startsWith('End:')) {
              const [label, value] = line.split(':').map(s => s.trim());
              return (
                <div key={idx} className="text-sm text-muted-foreground">
                  <span className="font-medium">{label}:</span> {value}
                </div>
              );
            }
            
            if (line.startsWith('Description:')) {
              return (
                <div key={idx} className="text-sm text-muted-foreground mt-2">
                  <div className="font-medium mb-1">Description:</div>
                  <div className="italic">{line.replace('Description:', '').trim()}</div>
                </div>
              );
            }
            
            if (line.startsWith('🔁')) {
              return (
                <div key={idx} className="text-sm text-primary font-medium">
                  {line}
                </div>
              );
            }
            
            if (line.includes('View on Calendar')) {
              return (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/calendar?eventId=${eventId}`);
                  }}
                  className="mt-3 text-sm font-semibold text-primary hover:underline transition-colors flex items-center gap-1"
                >
                  👉 View on Calendar
                </button>
              );
            }
            
            if (line.includes('Event ID:')) {
              return null; // Hide the raw event ID
            }
            
            // Empty lines for spacing
            if (line.trim() === '') {
              return null;
            }
            
            return null;
          })}
        </div>
      );
    }

    // No event mentions found, return content as is
    return content.split('\n').map((line, idx) => (
      <div key={idx}>{line}</div>
    ));
  };

  return <div className="break-words">{parseContent()}</div>;
};
