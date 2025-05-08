import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Participant } from '@/types';
import { QRCodeSVG } from 'qrcode.react';
import { getQRCheckInUrl } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import ReactDOM from 'react-dom';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';

interface Event {
  id: string;
  name: string;
  date: string; // Assuming date is a string, adjust if it's a Date object
  location: string;
}

interface QRCodeResult {
  identifier: string;
  filename: string;
  svgBlob: Blob;
  pngBlob: Blob | null;
  pngDataUrl: string;
}

const QRCodeDownloader = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isViewQrModalOpen, setIsViewQrModalOpen] = useState(false);
  const [qrCodeValue, setQrCodeValue] = useState<string | null>(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchParticipantsAndEvent = async () => {
      try {
        if (!eventId) return;

        // Fetch participants
        const { data: participantsData, error: participantsError } = await supabase
          .from('participants')
          .select('*')
          .eq('event_id', eventId)
          .not('qr_token', 'is', null);

        if (participantsError) throw participantsError;
        setParticipants(participantsData as Participant[]);

        // Fetch event details
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single();

        if (eventError) throw eventError;
        setEvent(eventData as Event);
      } catch (error: any) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchParticipantsAndEvent();
  }, [eventId]);

  const handleOpenViewQrModal = (value: string) => {
    setQrCodeValue(value);
    setIsViewQrModalOpen(true);
  };

  const handleCloseViewQrModal = () => {
    setIsViewQrModalOpen(false);
    setQrCodeValue(null);
  };

  // Function to create SVG and convert to PNG data URL
  const createQRCodeDataURLs = async (participant: Participant, svgSize: number): Promise<QRCodeResult | null> => {
    if (!participant.qr_token) return null;
    
    const qrValue = getQRCheckInUrl(participant.qr_token);
    const filename = (participant.name || participant.identifier).replace(/\s+/g, '_');
    
    // Create temporary div for SVG rendering
    const tempDiv = document.createElement('div');
    ReactDOM.render(
      <QRCodeSVG value={qrValue} size={svgSize} level="H" includeMargin={true} />,
      tempDiv
    );
    
    // Get SVG content
    const svgElement = tempDiv.querySelector('svg');
    if (!svgElement) {
      throw new Error('Failed to generate SVG element.');
    }
    const svgString = new XMLSerializer().serializeToString(svgElement);
    
    // Clean up DOM
    ReactDOM.unmountComponentAtNode(tempDiv);
    tempDiv.remove();
    
    // Create SVG blob
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    
    // Convert SVG to PNG using Canvas
    return new Promise((resolve: (result: QRCodeResult | null) => void) => {
      const canvas = document.createElement('canvas');
      canvas.width = svgSize;
      canvas.height = svgSize;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, svgSize, svgSize);
          const pngDataUrl = canvas.toDataURL('image/png');
          
          canvas.toBlob((blob) => {
            resolve({
              identifier: participant.identifier,
              filename,
              svgBlob,
              pngBlob: blob,
              pngDataUrl
            });
          }, 'image/png');
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
      } else {
        resolve(null);
      }
    });
  };

  const handleDownloadAll = async () => {
    if (!participants || participants.length === 0 || !event) return;

    setIsDownloadingAll(true);
    setError(null);

    try {
      const zip = new JSZip();
      const svgSize = 512;
      
      // Process all QR codes in parallel
      const qrPromises = participants.map((participant: Participant) => 
        createQRCodeDataURLs(participant, svgSize)
      );
      
      // Wait for all QR codes to be processed
      const qrResults: (QRCodeResult | null)[] = await Promise.all(qrPromises);
      const validResults = qrResults.filter(Boolean) as QRCodeResult[];
      
      // Add files to zip
      validResults.forEach((result: QRCodeResult) => {
        if (result) {
          zip.file(`${result.filename}.svg`, result.svgBlob);
          if (result.pngBlob) {
            zip.file(`${result.filename}.png`, result.pngBlob);
          }
        }
      });

      // Generate PDF
      const pdf = new jsPDF();
      let yOffset = 10;

      // Add event info to PDF
      pdf.setFontSize(16);
      pdf.text(`Event: ${event.name}`, 10, yOffset);
      yOffset += 10;
      pdf.setFontSize(12);
      pdf.text(`Date: ${event.date}`, 10, yOffset);
      yOffset += 10;
      pdf.text(`Location: ${event.location}`, 10, yOffset);
      yOffset += 20;

      // Add participants and QR codes to PDF
      pdf.setFontSize(14);
      pdf.text('Participants:', 10, yOffset);
      yOffset += 10;

      for (const result of validResults) {
        if (result && result.pngDataUrl) {
          const participant = participants.find(p => p.identifier === result.identifier);
          if (!participant) continue;
          
          // Add participant info
          pdf.setFontSize(12);
          const textX = 20;
          const qrImageSize = 40;
          const qrImageX = textX + 80; // Adjust this value to position the QR code next to the text
          const textY = yOffset;

          pdf.text(`Name: ${participant.name}`, textX, textY);
          pdf.text(`Identifier: ${participant.identifier}`, textX, textY + 7); // Position identifier below name

          // Add QR code image next to the text
          pdf.addImage(result.pngDataUrl, 'PNG', qrImageX, textY, qrImageSize, qrImageSize);

          // Update yOffset for the next participant, considering the height of the QR code or text, whichever is greater
          yOffset += Math.max(qrImageSize, 14) + 10; // 14 is roughly the height of two lines of text

          // Add new page if needed
          if (yOffset > pdf.internal.pageSize.height - 20) {
            pdf.addPage();
            yOffset = 10;
          }
        }
      }

      // Add PDF to zip
      const pdfBlob = pdf.output('blob');
      zip.file('participant_list.pdf', pdfBlob);

      // Generate and download the zip file
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'qr_codes.zip');
    } catch (error: any) {
      console.error('Error generating QR codes:', error);
      setError('Failed to generate QR codes. Please try again.');
    } finally {
      setIsDownloadingAll(false);
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading QR codes...</div>;
  }

  if (participants.length === 0) {
    return (
      <div className="text-center p-8">
        No participants with QR codes found for this event. Generate them first.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link to={`/events/${eventId}/participants`}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Participants
          </Link>
        </Button>
      </div>

      <h1 className="text-2xl font-bold mb-4">Download QR Codes</h1>
      <p className="text-muted-foreground mb-6">
        Click on individual QR codes to view them larger, or use the button below to download all.
      </p>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Download All Button */}
      <div className="mb-6">
         <Button onClick={handleDownloadAll} disabled={isDownloadingAll}>
           {isDownloadingAll ? 'Downloading...' : 'Download All QR Codes'}
         </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {participants.map((participant: Participant) => (
          <Card key={participant.id} className="flex flex-col items-center text-center">
            <CardHeader className='pb-0'>
              <CardTitle className="text-lg truncate w-full">{participant.name}</CardTitle>
              <CardDescription className="truncate w-full">{participant.identifier}</CardDescription>
            </CardHeader>
            <CardContent
              className="flex justify-center p-4 pt-0 cursor-pointer"
              onClick={() => participant.qr_token && handleOpenViewQrModal(getQRCheckInUrl(participant.qr_token))}
            >
              {participant.qr_token ? (
                <div className="p-2 bg-white rounded-md">
                  <QRCodeSVG
                    value={getQRCheckInUrl(participant.qr_token)}
                    size={160}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              ) : (
                <div className="text-muted-foreground">QR not generated</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View QR Modal */}
      {qrCodeValue && (
        <Modal
          isOpen={isViewQrModalOpen}
          onClose={handleCloseViewQrModal}
          title="QR Code"
        >
          <div className="p-4 flex justify-center">
            <QRCodeSVG
              value={qrCodeValue}
              size={256}
              level="H"
              includeMargin={true}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default QRCodeDownloader;
