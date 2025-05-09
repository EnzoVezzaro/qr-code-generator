import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, QrCode, Edit, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Event } from '@/types';

const EventList: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*, participants(count)') // Select events and count of participants
          .order('date', { ascending: true });
        
        if (error) throw error;
        
        // Map the data to include the participant count directly in the event object
        const eventsWithParticipantCount = data.map(event => ({
          ...event,
          participant_count: event.participants.length > 0 ? event.participants[0].count : 0,
        }));

        setEvents(eventsWithParticipantCount as Event[]);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading events...</div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="mb-4">
          <Calendar className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No events found</h3>
        <p className="text-muted-foreground mb-4">Create your first event to get started</p>
        <Button asChild>
          <Link to="/events/new">Create Event</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <Card key={event.id} className="group hover:shadow-md transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="truncate">{event.name}</span>
            </CardTitle>
            <CardDescription className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(event.date)}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-1 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>Max participants: {event.max_participants}</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
            <QrCode className="h-4 w-4 text-muted-foreground" />
            <span>QR usage limit: {event.qr_usage_limit}</span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>Current participants: {event.participant_count}</span>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between flex-wrap gap-2"> {/* Added flex-wrap and gap for better layout on small screens */}
            <Button asChild variant="outline" size="sm">
              <Link to={`/events/${event.id}`}>
                <span>View Details</span>
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to={`/events/${event.id}/edit`}>
                <Edit className="mr-1 h-4 w-4" />
                <span>Edit</span>
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default EventList;
