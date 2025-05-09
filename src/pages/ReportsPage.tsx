import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar, Users } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';
import ReactDOM from 'react-dom'; // Import ReactDOM

interface EventReport {
  id: string;
  name: string;
  date: string;
  max_participants: number;
  registered_participants: number;
  checked_in_participants: number;
}

const ReportsPage: React.FC = () => {
  const [eventReports, setEventReports] = useState<EventReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: events, error: eventsError } = await supabase
          .from('events')
          .select('id, name, date, max_participants');

        if (eventsError) {
          throw eventsError;
        }

        const reports: EventReport[] = [];
        for (const event of events) {
          const { count: registeredCount, error: participantsError } = await supabase
            .from('participants')
            .select('id', { count: 'exact' })
            .eq('event_id', event.id);

          if (participantsError) {
            throw participantsError;
          }

          const { count: checkInCount, error: checkInsError } = await supabase
            .from('check_ins')
            .select('id', { count: 'exact' })
            .eq('event_id', event.id);

          if (checkInsError) {
            throw checkInsError;
          }

          reports.push({
            id: event.id,
            name: event.name,
            date: event.date,
            max_participants: event.max_participants,
            registered_participants: registeredCount ?? 0,
            checked_in_participants: checkInCount ?? 0,
          });
        }
        setEventReports(reports);
      } catch (error: unknown) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  // Function to generate QR code data URL from QRCodeSVG
  const generateQRCodeDataUrl = async (token: string): Promise<string> => {
    const qrCodeUrl = `${window.location.origin}/check-in?token=${token}`;
    const qrContainer = document.createElement('div');
    qrContainer.style.position = 'absolute';
    qrContainer.style.left = '-9999px';
    document.body.appendChild(qrContainer);

    return new Promise((resolve, reject) => {
      try {
        // Use ReactDOM.render to render the QRCodeSVG component
        ReactDOM.render(
          <QRCodeSVG value={qrCodeUrl} size={50} level="H" />,
          qrContainer,
          () => {
            // Use html2canvas to capture the rendered SVG
            html2canvas(qrContainer, { scale: 2 }).then(canvas => {
              const dataUrl = canvas.toDataURL('image/png');
              document.body.removeChild(qrContainer);
              resolve(dataUrl);
            }).catch(err => {
              document.body.removeChild(qrContainer);
              reject(err);
            });
          }
        );
      } catch (err) {
        document.body.removeChild(qrContainer);
        reject(err);
      }
    });
  };


  // Function for downloading a single event report
  const handleDownloadEventReport = async (report: EventReport) => {
    try {
      const pdf = new jsPDF();

      pdf.setFontSize(18);
      pdf.text(`Event Report: ${report.name}`, 10, 10);

      pdf.setFontSize(12);
      let yOffset = 20;
      pdf.text(`Date: ${formatDate(report.date)}`, 10, yOffset);
      yOffset += 10;
      pdf.text(`Max Participants: ${report.max_participants}`, 10, yOffset);
      yOffset += 10;
      pdf.text(`Registered Participants: ${report.registered_participants}`, 10, yOffset);
      yOffset += 10;
      pdf.text(`Checked In Participants: ${report.checked_in_participants}`, 10, yOffset);
      yOffset += 20; // Add extra space before participant list

      // Fetch all participants for this event, including qr_token
      const { data: participants, error: participantsError } = await supabase
        .from('participants')
        .select('id, name, email, qr_token')
        .eq('event_id', report.id);

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        pdf.text('Error fetching participants.', 10, yOffset);
        pdf.save(`event-report-${report.name.replace(/\s+/g, '-')}.pdf`);
        return;
      }

      // Fetch check-ins for this event
      const { data: checkIns, error: checkInsError } = await supabase
        .from('check_ins')
        .select('participant_id')
        .eq('event_id', report.id);

      if (checkInsError) {
        console.error('Error fetching check-ins:', checkInsError);
        pdf.text('Error fetching check-ins.', 10, yOffset);
        pdf.save(`event-report-${report.name.replace(/\s+/g, '-')}.pdf`);
        return;
      }

      const checkedInParticipantIds = new Set(checkIns.map(ci => ci.participant_id));

      const checkedInParticipants = participants.filter(p => checkedInParticipantIds.has(p.id));
      const notCheckedInParticipants = participants.filter(p => !checkedInParticipantIds.has(p.id));

      // Add checked-in participants to PDF
      pdf.setFontSize(14);
      pdf.text('Checked In Participants:', 10, yOffset);
      yOffset += 10;

      if (checkedInParticipants.length > 0) {
        pdf.setFontSize(10);
        for (const p of checkedInParticipants) {
          let qrCodeDataUrl = '';
          if (p.qr_token) {
            try {
              qrCodeDataUrl = await generateQRCodeDataUrl(p.qr_token);
            } catch (err) {
              console.error('Error generating QR code for participant:', p.id, err);
            }
          }

          if (qrCodeDataUrl) {
            pdf.addImage(qrCodeDataUrl, 'PNG', 10, yOffset, 15, 15); // Adjust position and size as needed
            pdf.text(`- ${p.name} (${p.email})`, 30, yOffset + 7); // Adjust text position
            yOffset += 20; // Adjust yOffset to make space for QR code and text
          } else {
            pdf.text(`- ${p.name} (${p.email})`, 10, yOffset);
            yOffset += 7;
          }

          // Check if we need to add a new page
          if (yOffset > 280) {
            pdf.addPage();
            yOffset = 20;
          }
        }
      } else {
        pdf.setFontSize(10);
        pdf.text('No participants checked in.', 10, yOffset);
        yOffset += 7;
      }

      yOffset += 10; // Add space between sections

      // Add not checked-in participants to PDF
      pdf.setFontSize(14);

      // Check if we need to add a new page
      if (yOffset > 260) {
        pdf.addPage();
        yOffset = 20;
      }

      pdf.text('Not Checked In Participants:', 10, yOffset);
      yOffset += 10;

      if (notCheckedInParticipants.length > 0) {
        pdf.setFontSize(10);
        for (const p of notCheckedInParticipants) {
          let qrCodeDataUrl = '';
          if (p.qr_token) {
            try {
              qrCodeDataUrl = await generateQRCodeDataUrl(p.qr_token);
            } catch (err) {
              console.error('Error generating QR code for participant:', p.id, err);
            }
          }

          if (qrCodeDataUrl) {
            pdf.addImage(qrCodeDataUrl, 'PNG', 10, yOffset, 15, 15); // Adjust position and size as needed
            pdf.text(`- ${p.name} (${p.email})`, 30, yOffset + 7); // Adjust text position
            yOffset += 20; // Adjust yOffset to make space for QR code and text
          } else {
            pdf.text(`- ${p.name} (${p.email})`, 10, yOffset);
            yOffset += 7;
          }

          // Check if we need to add a new page
          if (yOffset > 280) {
            pdf.addPage();
            yOffset = 20;
          }
        }
      } else {
        pdf.setFontSize(10);
        pdf.text('All registered participants are checked in.', 10, yOffset);
        yOffset += 7;
      }

      pdf.save(`event-report-${report.name.replace(/\s+/g, '-')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF report. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading reports...</div>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-red-500">Error loading reports: {error}</div>;
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold">Event Reports</h1>
      </div>

      {eventReports.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Reports Available</CardTitle>
            <CardDescription>
              There is no event data to generate reports.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div id="event-reports" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {eventReports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow duration-300">
              <CardHeader>
                <CardTitle className="text-xl">{report.name}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(report.date)}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-muted/50 rounded-md text-center">
                      <div className="text-2xl font-semibold">
                        {report.registered_participants}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Registered
                      </div>
                    </div>
                    <div className="p-2 bg-success/10 rounded-md text-center">
                      <div className="text-2xl font-semibold text-success">
                        {report.checked_in_participants}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Checked In
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-muted/30 rounded-md">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-accent" />
                      <span className="text-sm">Max Participants: {report.max_participants}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <div className="p-4 border-t">
                <Button onClick={() => handleDownloadEventReport(report)} className="w-full">
                  Download Report
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
