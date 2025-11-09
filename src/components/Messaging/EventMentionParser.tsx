import { useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";

interface EventMentionParserProps {
  content: string;
}

export const EventMentionParser = ({ content }: EventMentionParserProps) => {
  const navigate = useNavigate();

  // Parse the message to detect calendar event notifications
  const parseContent = () => {
    // Check for new calendar event notification format
    if (content.startsWith('📅 CALENDAR_EVENT_NOTIFICATION')) {
      const lines = content.split('\n');
      const eventData: Record<string, string> = {};
      
      // Parse all key-value pairs
      lines.forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim();
          const value = line.substring(colonIndex + 1).trim();
          eventData[key] = value;
        }
      });

      const title = eventData['title'] || 'Event';
      const eventType = eventData['type'] || '';
      const startTime = eventData['start'] || '';
      const endTime = eventData['end'] || '';
      const assignedBy = eventData['assigned_by'] || '';
      const description = eventData['description'] || '';
      const recurring = eventData['recurring'] || '';
      const eventId = eventData['event_id'] || '';

      // Format date and time nicely
      const formatDateTime = (dateStr: string) => {
        if (!dateStr) return { date: '', time: '' };
        try {
          const date = new Date(dateStr);
          const dateFormatted = date.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
          });
          const timeFormatted = date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          });
          return { date: dateFormatted, time: timeFormatted };
        } catch {
          return { date: dateStr, time: '' };
        }
      };

      const startFormatted = formatDateTime(startTime);
      const endFormatted = formatDateTime(endTime);

      return (
        <div className="glass rounded-2xl p-6 space-y-4 border border-border/50">
          {/* Header with icon */}
          <div className="flex items-center gap-3 pb-3 border-b border-border/50">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">New Event Assigned</h3>
              {assignedBy && (
                <p className="text-xs text-muted-foreground">by {assignedBy}</p>
              )}
            </div>
          </div>

          {/* Event title */}
          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">{title}</h2>
            {eventType && (
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                {eventType}
              </span>
            )}
          </div>

          {/* Date and time */}
          <div className="space-y-2">
            {startFormatted.date && (
              <div className="flex items-start gap-2">
                <span className="text-sm font-medium text-foreground min-w-[60px]">Date:</span>
                <span className="text-sm text-muted-foreground">{startFormatted.date}</span>
              </div>
            )}
            {startFormatted.time && (
              <div className="flex items-start gap-2">
                <span className="text-sm font-medium text-foreground min-w-[60px]">Time:</span>
                <span className="text-sm text-muted-foreground">
                  {startFormatted.time} - {endFormatted.time}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          {description && (
            <div className="pt-2 border-t border-border/30">
              <p className="text-sm font-medium text-foreground mb-1">Description:</p>
              <p className="text-sm text-muted-foreground italic">{description}</p>
            </div>
          )}

          {/* Recurring badge */}
          {recurring && (
            <div className="flex items-center gap-2 text-sm text-primary font-medium">
              <span>🔁</span>
              <span>Recurring: {recurring}</span>
            </div>
          )}

          {/* Action button */}
          {eventId && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Navigating to calendar with eventId:', eventId);
                navigate(`/calendar?eventId=${eventId}`);
              }}
              className="w-full mt-4 px-4 py-3 rounded-xl font-semibold text-primary-foreground bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all shadow-sm hover:shadow-md cursor-pointer relative z-10"
            >
              View Event on Calendar
            </button>
          )}
        </div>
      );
    }

    // Regular message - return as is
    return content.split('\n').map((line, idx) => (
      <div key={idx}>{line}</div>
    ));
  };

  return <div className="break-words">{parseContent()}</div>;
};
