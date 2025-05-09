import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom'; // Keep Link for other actions for now
import { Mail, Download, Plus, QrCode, Ban, RefreshCw, Edit } from 'lucide-react';
import Modal from '@/components/ui/Modal'; // Fixed casing
import ParticipantForm from './ParticipantForm';
import SendEmailModal from '../email/SendEmailModal'; // Import SendEmailModal
import { QRCodeSVG } from 'qrcode.react'; // Import QRCodeSVG
import BulkImportModal from './BulkImportModal'; // Import BulkImportModal
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { Participant, Event, CheckIn } from '@/types'; // Import CheckIn type
import { supabase } from '@/lib/supabase'; // Import supabase

const ParticipantList: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [isSendEmailModalOpen, setIsSendEmailModalOpen] = useState(false); // State for Send Email modal
  const [isViewQrModalOpen, setIsViewQrModalOpen] = useState(false); // State for View QR modal
  const [qrParticipant, setQrParticipant] = useState<Participant | null>(null); // State for participant whose QR is being viewed
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false); // State for Bulk Import modal

  const { fetchEventDetails, fetchParticipants, revokeParticipantAccess, restoreParticipantAccess } = useAuth();
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch event details
      const { data: eventData, error: eventError } = await fetchEventDetails(eventId);
      if (eventError) throw new Error(eventError); // Use error.message
      setEvent(eventData); 

      // Fetch participants for the event
      const { data: participantsData, error: participantsError } = await fetchParticipants(eventId);
      if (participantsError) throw new Error(participantsError);
      
      // Fetch check-ins for the event
      let checkInsData = null;
      let checkInsError = null;

      if (eventId) {
        const { data, error } = await supabase
          .from('check_ins')
          .select('participant_id')
          .eq('event_id', eventId);

        checkInsData = data;
        checkInsError = error;
      } else {
        const { data, error } = await supabase
          .from('check_ins')
          .select('participant_id')

        checkInsData = data;
        checkInsError = error;
      }

      if (checkInsError) throw new Error(checkInsError.message);

      // Create a set of participant IDs who have checked in
      const checkedInParticipantIds = new Set(checkInsData?.map((checkIn: Pick<CheckIn, 'participant_id'>) => checkIn.participant_id)); // Explicitly type checkIn

      // Add isCheckedIn property to participants
      const participantsWithCheckInStatus = participantsData?.map(participant => ({
        ...participant,
        isCheckedIn: checkedInParticipantIds.has(participant.id),
      })) || [];

      setParticipants(participantsWithCheckInStatus);

    } catch (error: unknown) { // Handle error as unknown
      console.error('Error fetching data:', error);
      // Use a type guard to check if error is an Error and has a message property
      if (error instanceof Error && error.message) {
        console.error('Error message:', error.message);
      } else if (typeof error === 'string') {
        console.error('Error message:', error); // Log the string directly
      } else {
        console.error('Unknown error:', error); // Handle other unknown error types
      }
      setParticipants([]); // Set participants to empty on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [eventId]); // Add eventId to dependencies

  const handleOpenAddModal = () => {
    setEditingParticipant(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (participant: Participant) => {
    setEditingParticipant(participant);
    setIsAddModalOpen(true); // Re-use the same modal for editing
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingParticipant(null);
  };

  const handleOpenSendEmailModal = () => {
    setIsSendEmailModalOpen(true);
  };

  const handleOpenBulkImportModal = () => {
    setIsBulkImportModalOpen(true);
  };

  const handleCloseBulkImportModal = () => {
    setIsBulkImportModalOpen(false);
  };

  const handleOpenViewQrModal = (participant: Participant) => {
    setQrParticipant(participant);
    setIsViewQrModalOpen(true);
  };

  const handleCloseViewQrModal = () => {
    setIsViewQrModalOpen(false);
    setQrParticipant(null);
  };

  const handleCloseSendEmailModal = () => {
    setIsSendEmailModalOpen(false);
  };

  const handleSaveParticipant = (savedParticipant: Participant) => {
    if (editingParticipant) {
      // Update existing participant in the list
      setParticipants(participants.map(p => p.id === savedParticipant.id ? savedParticipant : p));
    } else {
      // Add new participant to the list
      setParticipants([...participants, savedParticipant].sort((a, b) => a.name.localeCompare(b.name)));
    }
    handleCloseModal();
    // Optionally, re-fetch all participants to ensure data consistency:
    // fetchParticipants(); 
  };

  const handleRevokeAccess = async (participantId: string) => {
    try {
      const { success, error } = await revokeParticipantAccess(participantId);
      if (error) throw new Error(error);
      
      if (success) {
        // Update the local state
        setParticipants(participants.map(p => 
          p.id === participantId ? { ...p, is_revoked: true } : p
        ));
      }
    } catch (error) {
      console.error('Error revoking access:', error);
    }
  };

  const handleRestoreAccess = async (participantId: string) => {
    try {
      const { success, error } = await restoreParticipantAccess(participantId);
      if (error) throw new Error(error);

      if (success) {
        // Update the local state
        setParticipants(participants.map(p => 
          p.id === participantId ? { ...p, is_revoked: false } : p
        ));
      }
    } catch (error) {
      console.error('Error restoring access:', error);
    }
  };

  const exportParticipantsCSV = () => {
    // Create CSV content
    const headers = ['Name', 'Email', 'Identifier', 'QR Usage Count', 'Status'];
    const csvContent = [
      headers.join(','),
      ...participants.map(p => 
        [
          p.name,
          p.email,
          p.identifier,
          p.qr_usage_count,
          p.isCheckedIn ? 'Checked In' : (p.is_revoked ? 'Revoked' : 'Registered'),
        ].join(',')
      )
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const now = new Date();
    
    link.setAttribute('href', url);
    link.setAttribute('download', `participants-${event?.name.replace(/\s+/g, '-')}-${now.toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredParticipants = participants.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    p.identifier.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) { 
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading participants...</div>
      </div>
    )
  }

  return (
    <div className="">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Participants</h1>
          {event && eventId && (
            <p className="text-muted-foreground">
              For event: {event.name} ({formatDate(event.date)})
            </p>
          )}
          {
            eventId &&
            <div className='mt-2 mb-2'>
              <Button asChild variant="outline" size="sm" className='mr-2'>
                <Link to={`/events/${eventId}/register`} target="_blank">
                  Self Registration
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to={`/events/${eventId}/frontend-qr-checker`} target="_blank">
                  Self Check-in
                </Link>
              </Button>
            </div>
          }
        </div>
        
        {
          eventId &&
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleOpenAddModal}>
              <Plus className="mr-1 h-4 w-4" />
              Add Participant
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleOpenBulkImportModal}>
              <Plus className="mr-1 h-4 w-4" />
              Bulk Import
            </Button>
            
            <Button variant="outline" size="sm" onClick={exportParticipantsCSV}>
              <Download className="mr-1 h-4 w-4" />
              Export CSV
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleOpenSendEmailModal}> {/* Updated onClick */}
              <Mail className="mr-1 h-4 w-4" />
              Send Emails
            </Button>
            
            <Button asChild variant="outline" size="sm">
              <Link to={`/events/${eventId}/qr-codes`}>
                <QrCode className="mr-1 h-4 w-4" />
                Generate QR Codes
              </Link>
            </Button>
          </div>
        }
      </div>
      
      <div className='mt-4 mb-4'>
        <Input
          placeholder="Search by name, email, or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>
      
      {filteredParticipants.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No participants found</CardTitle>
            <CardDescription>
              {search ? 'No results matching your search' : 'Add participants to get started'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleOpenAddModal}>
                <Plus className="mr-1 h-4 w-4" />
                Add Participant
              </Button>
              <Button variant="outline" onClick={handleOpenBulkImportModal}>
                <Plus className="mr-1 h-4 w-4" />
                Bulk Import
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-border">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Identifier</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">QR Usage</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredParticipants.map((participant) => (
                  <tr key={participant.id} className="hover:bg-muted/25">
                    <td className="px-4 py-3 text-sm">{participant.name}</td>
                    <td className="px-4 py-3 text-sm">{participant.email}</td>
                    <td className="px-4 py-3 text-sm">{participant.identifier}</td>
                    <td className="px-4 py-3 text-sm">
                      {participant.qr_usage_count} of {event?.qr_usage_limit}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        participant.isCheckedIn
                          ? 'bg-success/10 text-success' // Style for checked in (inverted)
                          : participant.is_revoked
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-primary/10 text-primary' // Style for registered (not revoked, not checked in) (inverted)
                      }`}>
                        {participant.isCheckedIn ? 'Checked In' : (participant.is_revoked ? 'Revoked' : 'Registered')} {/* Updated status text */}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEditModal(participant)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleOpenViewQrModal(participant)}>
                          <QrCode className="h-4 w-4" />
                          <span className="sr-only">View QR</span>
                        </Button>
                        
                        {participant.is_revoked ? (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleRestoreAccess(participant.id)}
                            title="Restore Access"
                          >
                            <RefreshCw className="h-4 w-4 text-success" />
                            <span className="sr-only">Restore Access</span>
                          </Button>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleRevokeAccess(participant.id)}
                            title="Revoke Access"
                          >
                            <Ban className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Revoke Access</span>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Participant Modal */}
      {(eventId || editingParticipant?.id) && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={handleCloseModal}
          title={editingParticipant ? 'Edit Participant' : 'Add New Participant'}
        >
          <ParticipantForm
            eventId={eventId || editingParticipant?.event_id || ''}
            participant={editingParticipant}
            onSave={handleSaveParticipant}
            onCancel={handleCloseModal}
          />
        </Modal>
      )}

      {/* Send Email Modal */}
      {eventId && (
        <SendEmailModal
          isOpen={isSendEmailModalOpen}
          onClose={handleCloseSendEmailModal}
          eventId={eventId}
        />
      )}

      {/* View QR Modal */}
      {qrParticipant && (
        <Modal
          isOpen={isViewQrModalOpen}
          onClose={handleCloseViewQrModal}
          title={`QR Code for ${qrParticipant.name}`}
        >
          <div className="p-4 flex justify-center">
            <QRCodeSVG
              value={qrParticipant.qr_token}
              size={256} // Adjust size as needed
              level="H"
              includeMargin={true}
            />
          </div>
        </Modal>
      )}

      {/* Bulk Import Modal */}
      {eventId && (
        <Modal
          isOpen={isBulkImportModalOpen}
          onClose={handleCloseBulkImportModal}
          title="Bulk Import Participants"
        >
          <BulkImportModal
            eventId={eventId || ''} // Pass eventId
            onClose={handleCloseBulkImportModal} // Pass close handler
            onImportSuccess={fetchData} // Pass success handler to refresh list
          />
        </Modal>
      )}
    </div>
  );
};

export default ParticipantList;
