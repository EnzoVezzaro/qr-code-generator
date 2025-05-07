import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom'; // Keep Link for other actions for now
import { Mail, Download, Plus, QrCode, Ban, RefreshCw, Edit } from 'lucide-react';
import Modal from '@/components/ui/Modal'; // Fixed casing
import ParticipantForm from './ParticipantForm';
import SendEmailModal from '../email/SendEmailModal'; // Import SendEmailModal
import { QRCodeSVG } from 'qrcode.react'; // Import QRCodeSVG
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { Participant, Event } from '@/types';

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

  const { fetchEventDetails, fetchParticipants, revokeParticipantAccess, restoreParticipantAccess } = useAuth();
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch event details
      const { data: eventData, error: eventError } = await fetchEventDetails(eventId);
      if (eventError) throw new Error(eventError);
      setEvent(eventData); 

      // Fetch participants for the event
      const { data: participantsData, error: participantsError } = await fetchParticipants(eventId);
      if (participantsError) throw new Error(participantsError);
      setParticipants(participantsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []); // Add dependencies

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
          p.is_revoked ? 'Revoked' : 'Active'
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
    return <div className="text-center p-8">Loading participants...</div>;
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
        </div>
        
        {
          eventId &&
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to={`/events/${eventId}/frontend-qr-checker`} target="_blank">
                Frontend
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleOpenAddModal}>
              <Plus className="mr-1 h-4 w-4" />
              Add Participant
            </Button>
            
            <Button asChild variant="outline" size="sm">
              {/* TODO: Implement Bulk Import Modal */}
              <Link to={`/events/${eventId}/participants/import`}>
                <Plus className="mr-1 h-4 w-4" />
                Bulk Import
              </Link>
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
      
      <div>
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
              <Button asChild variant="outline">
                 {/* TODO: Implement Bulk Import Modal */}
                <Link to={`/events/${eventId}/participants/import`}>
                  <Plus className="mr-1 h-4 w-4" />
                  Bulk Import
                </Link>
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
                        participant.is_revoked
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-success/10 text-success'
                      }`}>
                        {participant.is_revoked ? 'Revoked' : 'Active'}
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
              value={qrParticipant.identifier}
              size={256} // Adjust size as needed
              level="H"
              includeMargin={true}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ParticipantList;
