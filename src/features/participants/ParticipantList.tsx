import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Mail, Download, Plus, QrCode, Ban, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { Participant, Event } from '@/types';

const ParticipantList: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        // Fetch event details
        if (eventId) {
          const { data: eventData, error: eventError } = await supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();
          
          if (eventError) throw eventError;
          setEvent(eventData as Event);
          
          // Fetch participants for the event
          const { data: participantsData, error: participantsError } = await supabase
            .from('participants')
            .select('*')
            .eq('event_id', eventId)
            .order('name');
          
          if (participantsError) throw participantsError;
          setParticipants(participantsData as Participant[]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId]);

  const handleRevokeAccess = async (participantId: string) => {
    try {
      // Update the participant's is_revoked status
      await supabase
        .from('participants')
        .update({ is_revoked: true })
        .eq('id', participantId);
      
      // Update the local state
      setParticipants(participants.map(p => 
        p.id === participantId ? { ...p, is_revoked: true } : p
      ));
    } catch (error) {
      console.error('Error revoking access:', error);
    }
  };

  const handleRestoreAccess = async (participantId: string) => {
    try {
      // Update the participant's is_revoked status
      await supabase
        .from('participants')
        .update({ is_revoked: false })
        .eq('id', participantId);
      
      // Update the local state
      setParticipants(participants.map(p => 
        p.id === participantId ? { ...p, is_revoked: false } : p
      ));
    } catch (error) {
      console.error('Error restoring access:', error);
    }
  };

  const exportParticipantsCSV = () => {
    // Create CSV content
    const headers = ['Name', 'Email', 'Identifier', 'QR Usage Count', 'Status'];
    const csvContent = [
      headers.join(','),
      ...participants.map(p => 
        [
          p.name,
          p.email,
          p.identifier,
          p.qr_usage_count,
          p.is_revoked ? 'Revoked' : 'Active'
        ].join(',')
      )
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const now = new Date();
    
    link.setAttribute('href', url);
    link.setAttribute('download', `participants-${event?.name.replace(/\s+/g, '-')}-${now.toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredParticipants = participants.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    p.identifier.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="text-center p-8">Loading participants...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Participants</h1>
          {event && (
            <p className="text-muted-foreground">
              For event: {event.name} ({formatDate(event.date)})
            </p>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to={`/events/${eventId}/participants/add`}>
              <Plus className="mr-1 h-4 w-4" />
              Add Participant
            </Link>
          </Button>
          
          <Button asChild variant="outline" size="sm">
            <Link to={`/events/${eventId}/participants/import`}>
              <Plus className="mr-1 h-4 w-4" />
              Bulk Import
            </Link>
          </Button>
          
          <Button variant="outline" size="sm" onClick={exportParticipantsCSV}>
            <Download className="mr-1 h-4 w-4" />
            Export CSV
          </Button>
          
          <Button asChild variant="outline" size="sm">
            <Link to={`/events/${eventId}/emails`}>
              <Mail className="mr-1 h-4 w-4" />
              Send Emails
            </Link>
          </Button>
          
          <Button asChild variant="outline" size="sm">
            <Link to={`/events/${eventId}/qr-codes`}>
              <QrCode className="mr-1 h-4 w-4" />
              Generate QR Codes
            </Link>
          </Button>
        </div>
      </div>
      
      <div>
        <Input
          placeholder="Search by name, email, or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>
      
      {filteredParticipants.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No participants found</CardTitle>
            <CardDescription>
              {search ? 'No results matching your search' : 'Add participants to get started'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to={`/events/${eventId}/participants/add`}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add Participant
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to={`/events/${eventId}/participants/import`}>
                  <Plus className="mr-1 h-4 w-4" />
                  Bulk Import
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-border">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Identifier</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">QR Usage</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredParticipants.map((participant) => (
                  <tr key={participant.id} className="hover:bg-muted/25">
                    <td className="px-4 py-3 text-sm">{participant.name}</td>
                    <td className="px-4 py-3 text-sm">{participant.email}</td>
                    <td className="px-4 py-3 text-sm">{participant.identifier}</td>
                    <td className="px-4 py-3 text-sm">
                      {participant.qr_usage_count} of {event?.qr_usage_limit}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        participant.is_revoked
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-success/10 text-success'
                      }`}>
                        {participant.is_revoked ? 'Revoked' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/events/${eventId}/participants/${participant.id}`}>
                            <QrCode className="h-4 w-4" />
                            <span className="sr-only">View QR</span>
                          </Link>
                        </Button>
                        
                        {participant.is_revoked ? (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleRestoreAccess(participant.id)}
                          >
                            <RefreshCw className="h-4 w-4 text-success" />
                            <span className="sr-only">Restore Access</span>
                          </Button>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleRevokeAccess(participant.id)}
                          >
                            <Ban className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Revoke Access</span>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantList;