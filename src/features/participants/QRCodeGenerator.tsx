import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Download, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { generateQRToken } from '@/lib/utils';
import { Event, Participant } from '@/types';

const QRCodeGenerator: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!eventId) return;

        // Fetch event details
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single();
        
        if (eventError) throw eventError;
        setEvent(eventData as Event);

        // Fetch participants without QR codes
        const { data: participantsData, error: participantsError } = await supabase
          .from('participants')
          .select('*')
          .eq('event_id', eventId)
          .is('qr_token', null);
        
        if (participantsError) throw participantsError;
        setParticipants(participantsData as Participant[]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId]);

  const generateQRCodes = async () => {
    if (!eventId || participants.length === 0) return;
    
    setGenerating(true);
    
    try {
      // Generate QR tokens for participants who don't have one
      const updates = participants.map(participant => ({
        ...participant,
        qr_token: generateQRToken(),
      }));
      
      // Update participants in batches
      const batchSize = 50;
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        const { error } = await supabase.from('participants').upsert(batch);
        console.log('aqui_ ', error);
        
        if (error) throw error;
      }
      
      // Fetch all participants with their new QR codes
      const { data: updatedParticipants, error } = await supabase
        .from('participants')
        .select('*')
        .eq('event_id', eventId);
      
      if (error) throw error;
      
      // Set participants to empty to indicate all have QR codes now
      setParticipants([]);
      
      // Redirect to download page
      window.location.href = `/events/${eventId}/qr-codes/download`;
    } catch (error) {
      console.error('Error generating QR codes:', error);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link to={`/events/${eventId}/participants`}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Participants
          </Link>
        </Button>
      </div>
      
      <div>
        <h1 className="text-2xl font-bold mb-1">QR Code Generator</h1>
        {event && (
          <p className="text-muted-foreground">For event: {event.name}</p>
        )}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Generate QR Codes</CardTitle>
        </CardHeader>
        <CardContent>
          {participants.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-5 w-5" />
                <span>
                  {participants.length} participant{participants.length !== 1 ? 's' : ''} need{participants.length !== 1 ? '' : 's'} QR codes
                </span>
              </div>
              
              <div className="border rounded-md p-4 bg-muted/20">
                <p className="text-sm">
                  Each participant will receive a unique QR code containing a secure token. 
                  These codes can be scanned at the event entrance for validation.
                </p>
              </div>
              
              <div className="flex items-center justify-center p-4">
                <div className="p-4 bg-white rounded-md">
                  <QRCodeSVG 
                    value="https://example.com/sample-qr" 
                    size={180} 
                    level="H"
                    includeMargin={true}
                    className="mx-auto"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-4">
              <p className="text-muted-foreground">
                All participants already have QR codes generated.
              </p>
              <div className="mt-4">
                <Button asChild variant="outline">
                  <Link to={`/events/${eventId}/qr-codes/download`}>
                    <Download className="mr-2 h-4 w-4" />
                    Download QR Codes
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        {participants.length > 0 && (
          <CardFooter className="justify-between">
            <Button variant="outline" asChild>
              <Link to={`/events/${eventId}/participants`}>Cancel</Link>
            </Button>
            <Button onClick={generateQRCodes} disabled={generating}>
              {generating ? 'Generating...' : 'Generate QR Codes'}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default QRCodeGenerator;
