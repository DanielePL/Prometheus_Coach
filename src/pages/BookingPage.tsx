import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format, addMinutes, startOfDay, endOfDay, parseISO } from "date-fns";
import { Clock, User } from "lucide-react";

interface BookingLink {
  id: string;
  user_id: string;
  title: string;
  duration_minutes: number;
}

interface TimeSlot {
  start: Date;
  end: Date;
  formatted: string;
}

export default function BookingPage() {
  const { slug } = useParams();
  const [bookingLink, setBookingLink] = useState<BookingLink | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBookingLink();
  }, [slug]);

  useEffect(() => {
    if (selectedDate && bookingLink) {
      fetchAvailableSlots();
    }
  }, [selectedDate, bookingLink]);

  const fetchBookingLink = async () => {
    try {
      const { data, error } = await supabase
        .from("booking_links")
        .select("*")
        .eq("slug", slug)
        .eq("is_enabled", true)
        .single();

      if (error) throw error;
      setBookingLink(data);
    } catch (error) {
      console.error("Error fetching booking link:", error);
      toast({
        title: "Error",
        description: "Booking link not found or is disabled",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedDate || !bookingLink) return;

    try {
      const dayOfWeek = selectedDate.getDay();

      // Fetch business hours for selected day
      const { data: businessHours, error: bhError } = await supabase
        .from("business_hours")
        .select("*")
        .eq("user_id", bookingLink.user_id)
        .eq("day_of_week", dayOfWeek)
        .eq("is_enabled", true)
        .single();

      if (bhError || !businessHours) {
        setAvailableSlots([]);
        return;
      }

      // Fetch blocked time slots for selected date
      const dayStart = startOfDay(selectedDate);
      const dayEnd = endOfDay(selectedDate);

      const { data: blockedSlots, error: bsError } = await supabase
        .from("blocked_time_slots")
        .select("*")
        .eq("user_id", bookingLink.user_id)
        .gte("start_time", dayStart.toISOString())
        .lte("end_time", dayEnd.toISOString());

      if (bsError) throw bsError;

      // Fetch existing events for selected date
      const { data: events, error: evError } = await supabase
        .from("events")
        .select("*")
        .eq("created_by", bookingLink.user_id)
        .gte("start_time", dayStart.toISOString())
        .lte("end_time", dayEnd.toISOString());

      if (evError) throw evError;

      // Generate time slots
      const slots: TimeSlot[] = [];
      const [startHour, startMinute] = businessHours.start_time.split(":").map(Number);
      const [endHour, endMinute] = businessHours.end_time.split(":").map(Number);

      let currentTime = new Date(selectedDate);
      currentTime.setHours(startHour, startMinute, 0, 0);

      const endTime = new Date(selectedDate);
      endTime.setHours(endHour, endMinute, 0, 0);

      while (currentTime < endTime) {
        const slotEnd = addMinutes(currentTime, bookingLink.duration_minutes);
        
        if (slotEnd <= endTime) {
          // Check if slot is blocked or occupied
          const isBlocked = blockedSlots?.some(
            (bs) =>
              new Date(bs.start_time) < slotEnd &&
              new Date(bs.end_time) > currentTime
          );

          const isOccupied = events?.some(
            (ev) =>
              new Date(ev.start_time) < slotEnd &&
              new Date(ev.end_time) > currentTime
          );

          // Only add if in the future
          const isPast = currentTime < new Date();

          if (!isBlocked && !isOccupied && !isPast) {
            slots.push({
              start: new Date(currentTime),
              end: new Date(slotEnd),
              formatted: format(currentTime, "h:mm a"),
            });
          }
        }

        currentTime = addMinutes(currentTime, 30); // 30-minute increments
      }

      setAvailableSlots(slots);
    } catch (error) {
      console.error("Error fetching available slots:", error);
      toast({
        title: "Error",
        description: "Failed to load available time slots",
        variant: "destructive",
      });
    }
  };

  const handleBooking = async () => {
    if (!selectedSlot || !name || !email || !bookingLink) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsBooking(true);
    try {
      const { error } = await supabase.from("events").insert({
        title: `${bookingLink.title} - ${name}`,
        description: `Booked by: ${email}\n\nNotes: ${notes || "None"}`,
        start_time: selectedSlot.start.toISOString(),
        end_time: selectedSlot.end.toISOString(),
        event_type: "session",
        color: "blue",
        created_by: bookingLink.user_id,
        is_recurring: false,
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your booking has been confirmed. You'll receive a confirmation shortly.",
      });

      // Reset form
      setSelectedSlot(null);
      setName("");
      setEmail("");
      setNotes("");
      fetchAvailableSlots();
    } catch (error: any) {
      console.error("Error creating booking:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create booking",
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!bookingLink) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Booking Link Not Found</h2>
          <p className="text-muted-foreground">
            This booking link is not available or has been disabled.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <Card className="p-8 glass">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{bookingLink.title}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm">{bookingLink.duration_minutes} minutes</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <Label className="text-base font-semibold mb-4 block">Select a Date</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date() || date.getDay() === 0}
                className="rounded-md border"
              />
            </div>

            <div className="space-y-6">
              {selectedDate && (
                <>
                  <div>
                    <Label className="text-base font-semibold mb-3 block">
                      Available Times - {format(selectedDate, "MMMM d, yyyy")}
                    </Label>
                    {availableSlots.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No available time slots for this date.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                        {availableSlots.map((slot, idx) => (
                          <Button
                            key={idx}
                            variant={selectedSlot === slot ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedSlot(slot)}
                            className="justify-center"
                          >
                            {slot.formatted}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedSlot && (
                    <div className="space-y-4 pt-4 border-t">
                      <Label className="text-base font-semibold block">Your Information</Label>
                      <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          placeholder="John Doe"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Additional Notes</Label>
                        <Textarea
                          id="notes"
                          placeholder="Any specific topics or questions?"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <Button
                        onClick={handleBooking}
                        disabled={isBooking}
                        className="w-full"
                        size="lg"
                      >
                        {isBooking ? "Booking..." : "Confirm Booking"}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
