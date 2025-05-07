import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, QrCode, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import { Event, EventStats } from '@/types';

const CheckInManagerPage: React.FC = () => {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventStats, setEventStats] = useState<Record<string, EventStats>>({});

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch upcoming events (events with dates >= today)
        const today = new Date().toISOString();
        console.log('get events ....');
        const { data: events, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .gte('date', today)
          .order('date')
          .limit(5);
        
        console.log('events: ', events);
          
        if (eventsError) throw eventsError;
        setUpcomingEvents(events as Event[]);
        
        // Fetch stats for upcoming events
        const stats: Record<string, EventStats> = {};
        
        for (const event of events) {
          // Count total participants
          const { count: totalParticipants, error: countError } = await supabase
            .from('participants')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id);
          
          if (countError) throw countError;
          
          // Count checked-in participants (participants with check-ins)
          const { data: checkedInData, error: checkedInError } = await supabase
            .from('check_ins')
            .select('participant_id')
            .eq('event_id', event.id);
          
          if (checkedInError) throw checkedInError;
          
          // Count unique checked-in participants
          const uniqueCheckedIn = new Set(checkedInData.map(ci => ci.participant_id)).size;
          
          // Count revoked participants
          const { count: revokedCount, error: revokedError } = await supabase
            .from('participants')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id)
            .eq('is_revoked', true);
          
          if (revokedError) throw revokedError;
          
          stats[event.id] = {
            totalParticipants: totalParticipants || 0,
            checkedIn: uniqueCheckedIn,
            notCheckedIn: (totalParticipants || 0) - uniqueCheckedIn,
            revokedAccess: revokedCount || 0,
          };
        }
        
        setEventStats(stats);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading upcoming events...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Check-in Manager</h1>

      {upcomingEvents.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Upcoming Events</CardTitle>
            <CardDescription>
              There are no upcoming events for check-in.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <h2 className="text-xl font-semibold">Upcoming Events</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents.map((event) => (
              <Card key={event.id} className="hover:shadow-md transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="text-xl">{event.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(event.date)}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-muted/50 rounded-md text-center">
                        <div className="text-2xl font-semibold">
                          {eventStats[event.id]?.totalParticipants || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Participants
                        </div>
                      </div>
                      <div className="p-2 bg-success/10 rounded-md text-center">
                        <div className="text-2xl font-semibold text-success">
                          {eventStats[event.id]?.checkedIn || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Checked In
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                      <div className="flex items-center gap-2">
                        <QrCode className="h-4 w-4 text-accent" />
                        <span className="text-sm">QR Usage Limit: {event.qr_usage_limit}</span>
                      </div>
                      
                      {eventStats[event.id]?.revokedAccess > 0 && (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-4 w-4 text-destructive" />
                          <span className="text-xs text-destructive">
                            {eventStats[event.id].revokedAccess} Revoked
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                <div className="px-6 pb-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/events/${event.id}`}>
                        View Details
                      </Link>
                    </Button>
                    <Button asChild size="sm">
                      <Link to={`/events/${event.id}/check-in`}>
                        Check-in Station
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default CheckInManagerPage;
