import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { QrCode, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Event, QRValidationResult, Participant } from '@/types';
import { deviceInfo } from '@/lib/utils';
import Webcam from 'react-webcam';
import { BrowserQRCodeReader, DecodeHintType } from '@zxing/library';
import Modal from '@/components/ui/Modal'; // Assuming a Modal component exists
import { useAuth } from '@/context/AuthContext';

interface CheckInScannerProps {
  eventId?: string; // Make eventId prop optional
}

const CheckInScanner: React.FC<CheckInScannerProps> = ({ eventId: eventIdProp }) => {
  // const { eventId: eventIdParam } = useParams<{ eventId: string }>();
  // const eventId = eventIdProp || eventIdParam; // Use prop if provided, otherwise use param
  const { eventId } = useParams<{ eventId: string }>(); // Get eventId from URL

  const { user } = useAuth();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [scanResult, setScanResult] = useState<QRValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const codeReader = useRef<BrowserQRCodeReader | null>(null);

  const [processing, setProcessing] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [participantToConfirm, setParticipantToConfirm] = useState<Participant | null>(null);
  const [isScanningActive, setIsScanningActive] = useState(false); // New state to control scanning

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

  useEffect(() => {
    if (!isScanningActive || !webcamRef.current || scanResult || isConfirmModalOpen) return; // Added !isScanningActive condition

    codeReader.current = new BrowserQRCodeReader();
    const hints = new Map();
    hints.set(DecodeHintType.ASSUME_GS1, true);

    const startScanning = async () => {
      try {
        // Use the instance to list devices
        const videoInputDevices = await codeReader.current?.listVideoInputDevices();
        if (!videoInputDevices || videoInputDevices.length === 0) {
           setScanResult({ valid: false, message: 'No video input devices found.' });
           return;
        }
        const selectedDeviceId = videoInputDevices[0].deviceId; // Use the first available camera

        codeReader.current?.decodeFromConstraints(
          { video: { deviceId: selectedDeviceId } },
          webcamRef.current?.video as HTMLVideoElement,
          (result, error) => {
            if (result) { 
              console.log('QR Code detected:', result.getText()); // Added logging
              handleScan(result.getText());
              codeReader.current?.reset(); // Stop scanning after a successful scan
            }
            if (error) {
              // Log all errors, including 'No QR code found' for debugging
              console.error('QR scan error:', error); // Modified logging
              // Optionally set a scanResult for scan errors
            }
          }
        );
      } catch (error) {
        console.error('Camera access error:', error);
        setScanResult({ valid: false, message: 'Failed to access camera. Please ensure permissions are granted.' });
      }
    };

    startScanning();

    return () => {
      codeReader.current?.reset();
    };
  }, [webcamRef, scanResult, isConfirmModalOpen, isScanningActive]); // Added isScanningActive to dependencies

  const handleScan = async (data: string) => {
    if (!data || loading || !eventId) return;

    setLoading(true);
    setScanResult(null); // Clear previous scan result
    setParticipantToConfirm(null); // Clear previous participant to confirm

    try {
      console.log('here: ', data);
      
      // Extract QR token from scanned URL
      const token = data;

      // Validate the token
      const { data: participant, error } = await supabase
        .from('participants')
        .select('*, events!inner(*)')
        .eq('qr_token', token)
        .eq('events.id', eventId)
        .single();

      console.log('getting info: ', participant, token, eventId);
      
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

      // Valid QR code, store participant and open confirmation modal
      setParticipantToConfirm(participant);
      setIsConfirmModalOpen(true);

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
    if (!participantToConfirm || !event || processing) return; // Use participantToConfirm and event state

    setProcessing(true);

    try {
      // 1. Record the check-in
      const { error: checkInError } = await supabase
        .from('check_ins')
        .insert({
          event_id: eventId, // Use the determined eventId
          participant_id: participantToConfirm.id, // Use participantToConfirm
          ip_address: '127.0.0.1', // This would be the real IP in production
          device_info: deviceInfo(),
          processed_by: user?.id,
          checked_in_at: new Date()
        });

      if (checkInError) throw checkInError;

      // 2. Increment the QR usage count
      const { error: updateError } = await supabase
        .from('participants')
        .update({
          qr_usage_count: participantToConfirm.qr_usage_count + 1, // Use participantToConfirm
        })
        .eq('id', participantToConfirm.id); // Use participantToConfirm

      if (updateError) throw updateError;

      // 3. Update the scan result to show success
      setScanResult({
        valid: true,
        message: 'Check-in recorded successfully',
        participant: participantToConfirm, // Use participantToConfirm
        event: event, // Use event state
        usageCount: participantToConfirm.qr_usage_count + 1, // Use participantToConfirm
        usageLimit: event.qr_usage_limit, // Use event state
      });

      setIsConfirmModalOpen(false); // Close modal on success
      setParticipantToConfirm(null); // Clear participant to confirm

    } catch (error) {
      console.error('Error recording check-in:', error);
      setScanResult({
        valid: false,
        message: 'Error recording check-in',
        participant: participantToConfirm, // Keep participant info on error
        event: event, // Keep event info on error
        usageCount: participantToConfirm?.qr_usage_count,
        usageLimit: event?.qr_usage_limit,
      });
      setIsConfirmModalOpen(false); // Close modal on error
      setParticipantToConfirm(null); // Clear participant to confirm
    } finally {
      setProcessing(false);
    }
  };

  const resetScan = () => {
    setScanResult(null);
    setIsConfirmModalOpen(false);
    setParticipantToConfirm(null);
    setIsScanningActive(false); // Stop scanning when resetting
    // The useEffect will restart the scanner automatically when isScanningActive becomes true again
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
          {loading ? (
            <div className="flex flex-col items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p>Processing QR code...</p>
            </div>
          ) : scanResult ? (
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

                {/* The Confirm Check-in button is now in the modal */}
              </div>
            </div>
          ) : isScanningActive ? ( // Show webcam and mask when scanning is active
            <div>
              <div className="flex flex-col items-center relative w-full max-w-sm mx-auto overflow-hidden rounded-md"> {/* Added relative positioning, max-width, and overflow hidden */}
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  videoConstraints={{ facingMode: 'environment' }} // Use rear camera
                  style={{ width: '100%', height: 'auto' }} // Ensure no blur on webcam feed
                />
                {/* Visual QR code filter (dashed border) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"> {/* Added pointer-events-none and higher z-index */}
                  <div className="w-64 h-64 border-4 border-dashed border-primary opacity-50 rounded-md"></div> {/* Adjust size and styling as needed */}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Scanning for QR codes...
              </p>
              <Button variant="outline" onClick={() => setIsScanningActive(false)} className="mt-4 w-full">Cancel Scan</Button> {/* Button to cancel scanning */}
            </div>
          ) : ( // Show button when not scanning and no result
            <div className="flex flex-col items-center">
              <div className="w-full max-w-sm h-64 bg-black/5 rounded-lg flex items-center justify-center mb-4 border-2 border-dashed">
                <QrCode className="h-16 w-16 text-muted-foreground/50" />
              </div>
              <Button onClick={() => setIsScanningActive(true)}>Scan QR Code</Button> {/* Button to start scanning */}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Confirmation Modal */}
      {isConfirmModalOpen && participantToConfirm && event && (
        <Modal
          isOpen={isConfirmModalOpen}
          onClose={resetScan} // Close modal and reset state
          title="Confirm Check-in"
        >
          <div className="p-4">
            <p className="mb-2">
              Confirm check-in for:
            </p>
            <div className="p-3 bg-background rounded border mb-4">
              <p className="font-medium">{participantToConfirm.name}</p>
              <p className="text-sm">{participantToConfirm.email}</p>
              <p className="text-sm text-muted-foreground">ID: {participantToConfirm.identifier}</p>
              {participantToConfirm.qr_usage_count !== undefined && event.qr_usage_limit !== undefined && (
                <div className="mt-2 text-sm">
                  <span>Usage: </span>
                  <span className={participantToConfirm.qr_usage_count >= event.qr_usage_limit ? 'text-destructive' : ''}>
                    {participantToConfirm.qr_usage_count} / {event.qr_usage_limit}
                  </span>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetScan}> {/* Use resetScan */}
                Cancel
              </Button>
              <Button onClick={handleConfirmCheckIn} disabled={processing}>
                {processing ? 'Checking In...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CheckInScanner;
