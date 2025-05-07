import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar, Users } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';

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

  const handleDownloadPdf = async () => {
    const reportElement = document.getElementById('event-reports');
    if (reportElement) {
      const canvas = await html2canvas(reportElement);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save('event-reports.pdf');
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
        <Button onClick={handleDownloadPdf}>Download PDF</Button>
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
