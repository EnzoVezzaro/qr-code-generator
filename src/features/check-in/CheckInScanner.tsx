import React, { useState, useEffect } from 'react';
import { QrCode, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Event, QRValidationResult } from '@/types';
import { deviceInfo } from '@/lib/utils';

// We're using a placeholder for the QR scanner due to camera permissions in browser environments
// In a real implementation, you would use react-qr-reader or a similar library
const QRScanner: React.FC<{ onScan: (data: string) => void }> = ({ onScan }) => {
  // Mock scanning a QR code for demo purposes
  const handleMockScan = () => {
    const mockQRData = `https://example.com/check-in/${crypto.randomUUID()}`;
    onScan(mockQRData);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-sm h-64 bg-black/5 rounded-lg flex items-center justify-center mb-4 border-2 border-dashed">
        <QrCode className="h-16 w-16 text-muted-foreground/50" />
      </div>
      <Button onClick={handleMockScan}>Simulate QR Scan</Button>
      <p className="text-xs text-muted-foreground mt-2">
        In a real environment, this would access your camera to scan QR codes
      </p>
    </div>
  );
};

interface CheckInScannerProps {
  eventId: string;
}

const CheckInScanner: React.FC<CheckInScannerProps> = ({ eventId }) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [scanResult, setScanResult] = useState<QRValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single();
        
        if (error) throw error;
        setEvent(data as Event);
      } catch (error) {
        console.error('Error fetching event:', error);
      }
    };

    fetchEvent();
  }, [eventId]);

  const handleScan = async (data: string) => {
    if (!data || loading) return;
    
    setLoading(true);
    setScanResult(null);
    
    try {
      // Extract QR token from scanned URL
      const url = new URL(data);
      const pathParts = url.pathname.split('/');
      const token = pathParts[pathParts.length - 1];
      
      // Validate the token
      const { data: participant, error } = await supabase
        .from('participants')
        .select('*, events!inner(*)')
        .eq('qr_token', token)
        .eq('events.id', eventId)
        .single();
      
      if (error) {
        setScanResult({
          valid: false,
          message: 'Invalid QR code or not registered for this event',
        });
        return;
      }
      
      // Check if the QR code is revoked
      if (participant.is_revoked) {
        setScanResult({
          valid: false,
          message: 'This QR code has been revoked',
          participant,
          event: participant.events,
        });
        return;
      }
      
      // Check if the QR code has reached its usage limit
      if (participant.qr_usage_count >= participant.events.qr_usage_limit) {
        setScanResult({
          valid: false,
          message: `QR code usage limit reached (${participant.qr_usage_count}/${participant.events.qr_usage_limit})`,
          participant,
          event: participant.events,
          usageCount: participant.qr_usage_count,
          usageLimit: participant.events.qr_usage_limit,
        });
        return;
      }
      
      // Valid QR code, proceed with check-in
      setScanResult({
        valid: true,
        message: 'Valid QR code, check-in successful',
        participant,
        event: participant.events,
        usageCount: participant.qr_usage_count,
        usageLimit: participant.events.qr_usage_limit,
      });
      
    } catch (error) {
      console.error('Error processing QR code:', error);
      setScanResult({
        valid: false,
        message: 'Error processing QR code',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCheckIn = async () => {
    if (!scanResult?.valid || !scanResult.participant || processing) return;
    
    setProcessing(true);
    
    try {
      // 1. Record the check-in
      const { error: checkInError } = await supabase
        .from('check_ins')
        .insert({
          event_id: eventId,
          participant_id: scanResult.participant.id,
          ip_address: '127.0.0.1', // This would be the real IP in production
          device_info: deviceInfo(),
          processed_by: 'current-user-id', // This would be the actual user ID
        });
      
      if (checkInError) throw checkInError;
      
      // 2. Increment the QR usage count
      const { error: updateError } = await supabase
        .from('participants')
        .update({
          qr_usage_count: scanResult.participant.qr_usage_count + 1,
        })
        .eq('id', scanResult.participant.id);
      
      if (updateError) throw updateError;
      
      // 3. Update the scan result to show success
      setScanResult({
        ...scanResult,
        message: 'Check-in recorded successfully',
        usageCount: scanResult.usageCount! + 1,
      });
      
    } catch (error) {
      console.error('Error recording check-in:', error);
      setScanResult({
        ...scanResult,
        message: 'Error recording check-in',
      });
    } finally {
      setProcessing(false);
    }
  };

  const resetScan = () => {
    setScanResult(null);
  };

  return (
    <div className="mx-auto max-w-md">
      <h2 className="text-2xl font-bold mb-4">Check-In Scanner</h2>
      
      {event && (
        <div className="mb-6">
          <p className="font-medium">{event.name}</p>
          <p className="text-sm text-muted-foreground">{event.location}</p>
        </div>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Scan QR Code</CardTitle>
          <CardDescription>
            Position the QR code within the scanner frame
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!scanResult ? (
            loading ? (
              <div className="flex flex-col items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p>Processing QR code...</p>
              </div>
            ) : (
              <QRScanner onScan={handleScan} />
            )
          ) : (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${
                scanResult.valid 
                  ? 'bg-success/10 text-success animate-pulse-success' 
                  : 'bg-destructive/10 text-destructive animate-pulse-error'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {scanResult.valid ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                  <span className="font-medium">
                    {scanResult.valid ? 'Valid QR Code' : 'Invalid QR Code'}
                  </span>
                </div>
                <p>{scanResult.message}</p>
                
                {scanResult.participant && (
                  <div className="mt-4 p-3 bg-background rounded border">
                    <p className="font-medium">{scanResult.participant.name}</p>
                    <p className="text-sm">{scanResult.participant.email}</p>
                    <p className="text-sm text-muted-foreground">ID: {scanResult.participant.identifier}</p>
                    {scanResult.usageCount !== undefined && scanResult.usageLimit !== undefined && (
                      <div className="mt-2 text-sm">
                        <span>Usage: </span>
                        <span className={scanResult.usageCount >= scanResult.usageLimit ? 'text-destructive' : ''}>
                          {scanResult.usageCount} / {scanResult.usageLimit}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={resetScan}
                >
                  Scan Another
                </Button>
                
                {scanResult.valid && scanResult.participant && scanResult.usageCount !== undefined && 
                 scanResult.usageLimit !== undefined && scanResult.usageCount < scanResult.usageLimit && (
                  <Button 
                    className="flex-1" 
                    onClick={handleConfirmCheckIn}
                    disabled={processing}
                  >
                    {processing ? 'Processing...' : 'Confirm Check-in'}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckInScanner;