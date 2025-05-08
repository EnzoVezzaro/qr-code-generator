import React, { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/Checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { supabase } from '@/lib/supabase';
import { Participant, EmailTemplate } from '@/types';

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
          .or(`event_id.is.null,event_id.eq.${eventId}`);

        if (templatesError) throw templatesError;
        setTemplates(templatesData || []);

      } catch (error: any) {
        const errorMessage = error.message || 'An unknown error occurred while fetching data';
        setError(errorMessage);
        console.error('Error fetching data for send email modal:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen, eventId]);

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

    try {
      // Ensure we're sending a valid JSON object
      const payload = {
        participantIds: selectedParticipants,
        templateId: selectedTemplateId,
        eventId: eventId
      };

      console.log('Sending request with payload:', JSON.stringify(payload));

      // Make sure we're using the correct format for the supabase function call
      const { data, error } = await supabase.functions.invoke('send-emails', {
        body: payload
      })

      if (error) {
        throw error;
      }

      console.log('Function response:', data);
      setSendStatus('Emails queued for sending successfully.');
      
      // Optional: close modal after a delay
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error('Error invoking send-emails function:', error);
      setSendStatus(`Error sending emails: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSending(false);
    }
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