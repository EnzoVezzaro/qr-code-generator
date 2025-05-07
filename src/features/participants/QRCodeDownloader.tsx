import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Participant } from '@/types';
import { QRCodeSVG } from 'qrcode.react';
import { getQRCheckInUrl } from '@/lib/utils';

const QRCodeDownloader: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        if (!eventId) return;

        const { data, error } = await supabase
          .from('participants')
          .select('*')
          .eq('event_id', eventId)
          .not('qr_token', 'is', null);

        if (error) throw error;
        setParticipants(data as Participant[]);
      } catch (error) {
        console.error('Error fetching participants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchParticipants();
  }, [eventId]);

  if (loading) {
    return <div>Loading participants...</div>;
  }

  if (participants.length === 0) {
    return <div>No participants with QR codes found for this event.</div>;
  }

  return (
    <div>
      <h1>Download QR Codes</h1>
      <div>
        {participants.map(participant => (
          <div key={participant.id}>
            <p>{participant.name}</p>
            {participant.qr_token && (
              <QRCodeSVG
                value={getQRCheckInUrl(participant.qr_token)}
                size={128}
                level="H"
                includeMargin={true}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default QRCodeDownloader;
