import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft } from 'lucide-react';

const ParticipantRegistrationPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!eventId) {
      setMessage({ type: 'error', text: 'Event ID is missing.' });
      setLoading(false);
      return;
    }

    try {
      // Check if a participant with the same identifier or email already exists for this event
      const { data: existingParticipant, error: fetchError } = await supabase
        .from('participants')
        .select('id')
        .eq('event_id', eventId)
        .or(`identifier.eq.${identifier},email.eq.${email}`); // Use .or() directly with a string

      if (fetchError) throw fetchError;

      if (existingParticipant && existingParticipant.length > 0) {
        setMessage({ type: 'error', text: 'A participant with this email or identifier already exists for this event.' });
        setLoading(false);
        return;
      }

      // Generate a simple QR token (you might want a more robust method)
      const qrToken = `${eventId}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

      const { error } = await supabase
        .from('participants')
        .insert({
          event_id: eventId,
          name,
          email,
          identifier,
          qr_token: qrToken,
          qr_usage_count: 0,
          is_revoked: false,
        });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Registration successful!' });
      setName('');
      setEmail('');
      setIdentifier('');

    } catch (error: unknown) { // Use unknown for caught errors
      console.error('Error registering participant:', error);
      setMessage({ type: 'error', text: `Registration failed: ${error instanceof Error ? error.message : String(error)}` });
    } finally {
      setLoading(false);
    }
  };

  if (!eventId) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-screen">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <CardTitle>Event Not Specified</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Please provide a valid Event ID in the URL to register participants.</p>
             <Button asChild>
              <Link to="/events">Back to Events</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-screen">
       <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Register Participant</CardTitle>
          <CardDescription>Register a new participant for this event.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                />
            </div>
             <div>
              <Label htmlFor="identifier">Identifier</Label>
              <Input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
            {message && (
              <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {message.text}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ParticipantRegistrationPage;
