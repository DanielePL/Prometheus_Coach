import { useNavigate } from "react-router-dom";

interface EventMentionParserProps {
  content: string;
}

export const EventMentionParser = ({ content }: EventMentionParserProps) => {
  const navigate = useNavigate();

  // Parse the message to detect event assignments and extract event ID
  const parseContent = () => {
    // Pattern to match event assignment messages
    const eventPattern = /Event ID: ([a-f0-9-]+)/i;
    const match = content.match(eventPattern);

    if (match && match[1]) {
      const eventId = match[1];
      
      // Split the content by the event ID to create clickable sections
      const parts = content.split(eventId);
      
      return (
        <>
          {parts[0]}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/calendar?eventId=${eventId}`);
            }}
            className="text-primary hover:underline font-semibold mx-0.5 transition-colors"
          >
            {eventId}
          </button>
          {parts[1]}
        </>
      );
    }

    // Check for event details format and make entire event section clickable
    const eventDetailsPattern = /📅 New Event Assigned[\s\S]*?Event ID: ([a-f0-9-]+)/i;
    const detailsMatch = content.match(eventDetailsPattern);
    
    if (detailsMatch && detailsMatch[1]) {
      const eventId = detailsMatch[1];
      
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/calendar?eventId=${eventId}`);
          }}
          className="text-left hover:opacity-80 transition-opacity w-full"
        >
          <div className="space-y-1">
            {content.split('\n').map((line, idx) => (
              <div key={idx} className={line.startsWith('📅') ? 'font-semibold' : ''}>
                {line}
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-primary font-semibold">
            Click to view event on calendar →
          </div>
        </button>
      );
    }

    // No event mentions found, return content as is
    return content.split('\n').map((line, idx) => (
      <div key={idx}>{line}</div>
    ));
  };

  return <div className="break-words">{parseContent()}</div>;
};
