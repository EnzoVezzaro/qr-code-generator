import React from 'react';
import { useParams, Link } from 'react-router-dom'; // Import Link
import CheckInScanner from '@/features/check-in/CheckInScanner';
import { useAuth } from '@/context/AuthContext'; // Import useAuth
import { Button } from '@/components/ui/button'; // Import Button
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Import Card components

const FrontendQrCheckerPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user, loading } = useAuth(); // Get user and loading state

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-screen">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <CardTitle>Station Not Activated</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>This station needs to be activated by a logged-in user.</p>
            <Button asChild>
              <Link to="/login">Login to Activate</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4"></h1>
      {eventId ? (
        <CheckInScanner title={'Self Check-in Scanner'} />
      ) : (
        <p>Event ID not provided.</p>
      )}
    </div>
  );
};

export default FrontendQrCheckerPage;
