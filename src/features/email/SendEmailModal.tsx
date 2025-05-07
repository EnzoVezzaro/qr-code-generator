import React, { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/Checkbox'; // Fixed casing
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'; // Fixed casing
import { supabase } from '@/lib/supabase';
import { Participant, EmailTemplate } from '@/types'; // Assuming Participant and EmailTemplate types exist

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
}

const SendEmailModal: React.FC<SendEmailModalProps> = ({ isOpen, onClose, eventId }) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch participants for the event
        const { data: participantsData, error: participantsError } = await supabase
          .from('participants')
          .select('*')
          .eq('event_id', eventId);

        if (participantsError) throw participantsError;
        setParticipants(participantsData || []);

        // Fetch email templates (global and event-specific)
        const { data: templatesData, error: templatesError } = await supabase
          .from('email_templates')
          .select('*')
          .or(`event_id.is.null,event_id.eq.${eventId}`); // Fetch global or event-specific templates

        if (templatesError) throw templatesError;
        setTemplates(templatesData || []);

      } catch (error: unknown) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError('An unknown error occurred while fetching data');
        }
        console.error('Error fetching data for send email modal:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) { // Fetch data only when the modal is open
      fetchData();
    }
  }, [isOpen, eventId]); // Refetch when modal opens or eventId changes

  const handleParticipantSelect = (participantId: string, isChecked: boolean) => {
    setSelectedParticipants(prevSelected =>
      isChecked
        ? [...prevSelected, participantId]
        : prevSelected.filter(id => id !== participantId)
    );
  };

  const handleSendEmails = async () => {
    if (!selectedTemplateId || selectedParticipants.length === 0) {
      setSendStatus('Please select at least one participant and an email template.');
      return;
    }

    setIsSending(true);
    setSendStatus('Sending emails...');

    // TODO: Call Supabase function to send emails asynchronously
    console.log('Sending emails to participants:', selectedParticipants, 'using template:', selectedTemplateId);

    // Placeholder for Supabase function call
    // const { data, error } = await supabase.functions.invoke('send-emails', {
    //   body: { participantIds: selectedParticipants, templateId: selectedTemplateId, eventId: eventId },
    // });

    // if (error) {
    //   setSendStatus(`Error sending emails: ${error.message}`);
    //   console.error('Error invoking send-emails function:', error);
    // } else {
    //   setSendStatus('Emails queued for sending.');
    //   console.log('Send email function invoked:', data);
    //   // TODO: Implement status tracking
    // }

    // Simulate sending for now
    setTimeout(() => {
      setSendStatus('Emails queued for sending (simulated).');
      setIsSending(false);
      // onClose(); // Close modal after queuing
    }, 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send Emails">
      <div className="space-y-4">
        {loading ? (
          <div>Loading participants and templates...</div>
        ) : error ? (
          <div className="text-red-500">Error: {error}</div>
        ) : (
          <>
            <div>
              <Label htmlFor="template">Select Email Template</Label>
              <Select onValueChange={setSelectedTemplateId} value={selectedTemplateId || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label>Select Participants ({selectedParticipants.length} selected)</Label>
                {participants.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all-participants"
                      checked={selectedParticipants.length === participants.length && participants.length > 0}
                      onCheckedChange={(isChecked: boolean) => {
                        if (isChecked) {
                          setSelectedParticipants(participants.map(p => p.id));
                        } else {
                          setSelectedParticipants([]);
                        }
                      }}
                    />
                    <Label htmlFor="select-all-participants">Select All</Label>
                  </div>
                )}
              </div>
              <div className="border rounded-md h-40 overflow-y-auto">
                {participants.length === 0 ? (
                  <p className="p-4 text-muted-foreground">No participants found for this event.</p>
                ) : (
                  participants.map(participant => (
                    <div key={participant.id} className="flex items-center space-x-2 p-2 border-b last:border-b-0">
                      <Checkbox
                        id={`participant-${participant.id}`}
                        checked={selectedParticipants.includes(participant.id)}
                        onCheckedChange={(isChecked: boolean) => handleParticipantSelect(participant.id, isChecked)}
                      />
                      <Label htmlFor={`participant-${participant.id}`}>
                        {participant.name} ({participant.email})
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>

            {sendStatus && <p className="text-sm">{sendStatus}</p>}

            <Button onClick={handleSendEmails} disabled={isSending || selectedParticipants.length === 0 || !selectedTemplateId}>
              {isSending ? 'Sending...' : 'Send Emails'}
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
};

export default SendEmailModal;
