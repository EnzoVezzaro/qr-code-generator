import React from 'react';
import { useParams } from 'react-router-dom';
import CheckInScanner from '@/features/check-in/CheckInScanner';

const FrontendQrCheckerPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">QR Code Checker</h1>
      {eventId ? (
        <CheckInScanner eventId={eventId} />
      ) : (
        <p>Event ID not provided.</p>
      )}
    </div>
  );
};

export default FrontendQrCheckerPage;
