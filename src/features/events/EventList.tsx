import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, QrCode, Edit, ChevronRight, AlertCircle, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Event } from '@/types';
import { useAuth } from '@/context/AuthContext'; // Import useAuth

const EventList: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth(); // Get the current user

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        if (!user) {
          // If user is not logged in, don't fetch events
          setEvents([]);
          setLoading(false);
          return;
        }

        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('*') // Select all event fields
          .eq('created_by', user.id) // Filter by created_by
          .order('date', { ascending: true });

        if (eventsError) {
          throw eventsError;
        }

        const eventsWithCounts = [];
        for (const event of eventsData) {
          const { count: registeredCount, error: participantsError } = await supabase
            .from('participants')
            .select('id', { count: 'exact' })
            .eq('event_id', event.id);

          if (participantsError) {
            throw participantsError;
          }

          const { count: checkInCount, error: checkInsError } = await supabase
            .from('check_ins')
            .select('id', { count: 'exact' })
            .eq('event_id', event.id);

          if (checkInsError) {
            throw checkInsError;
          }

          // Count revoked participants
          const { count: revokedCount, error: revokedError } = await supabase
            .from('participants')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id)
            .eq('is_revoked', true);

          if (revokedError) {
            throw revokedError;
          }

          eventsWithCounts.push({
            ...event,
            registered_participants: registeredCount ?? 0,
            checked_in_participants: checkInCount ?? 0,
            participant_count: registeredCount ?? 0, // Assuming participant_count is total registered
            revokedAccess: revokedCount ?? 0, // Include revokedAccess
          });
        }

        setEvents(eventsWithCounts as Event[]);
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
    <div className="space-y-6 p-4"> {/* Added space-y-6 and p-4 */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6"> {/* Improved header styling */}
        <h1 className="text-3xl font-bold"> {/* Increased font size */}
          {'All Events'}
        </h1> 
        <Button asChild size="sm">
          <Link to={'/events/new'}>
            <Plus className="mr-1 h-4 w-4" />
            Create New Event
          </Link>
        </Button> 
      </div>
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <Card key={event.id} className="group hover:shadow-md transition-shadow duration-300">
            <CardHeader className='pb-4'>
              <CardTitle className="flex items-center justify-between">
                <span className="truncate">{event.name}</span>
              </CardTitle>
              <CardDescription className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(event.date)}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className='mb-6'>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-muted/50 rounded-md text-center">
                    <div className="text-2xl font-semibold">
                      {event.registered_participants}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Registered
                    </div>
                  </div>
                  <div className="p-2 bg-success/10 rounded-md text-center">
                    <div className="text-2xl font-semibold text-success">
                      {event.checked_in_participants}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Checked In
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>Location: {event.location}</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Max participants: {event.max_participants}</span>
              </div>
              <div className="flex items-center gap-1 text-sm justify-between">
                <div className="flex items-center gap-1 text-sm">
                  <QrCode className="h-4 w-4 text-muted-foreground" />
                  <span>QR usage limit: {event.qr_usage_limit}</span>
                </div>

                {event?.revokedAccess > 0 && (
                  <div className="flex items-center gap-1">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <span className="text-xs text-destructive">
                      {event.revokedAccess} Revoked
                    </span>
                  </div>
                )}
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
    </div>
  );
};

export default EventList;
