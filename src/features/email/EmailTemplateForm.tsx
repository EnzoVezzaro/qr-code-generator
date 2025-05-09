import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { EventSelectOption } from '@/types'; // Import EventSelectOption type

const templateSchema = z.object({
  name: z.string().min(3, 'Template name must be at least 3 characters'),
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  content: z.string().min(10, 'Email content must be at least 10 characters'),
  eventId: z.string().min(1, 'Event is required'), // Make eventId mandatory
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface EmailTemplateFormProps {
  isEditing?: boolean;
}

const EmailTemplateForm: React.FC<EmailTemplateFormProps> = ({ isEditing = false }) => {
  const { templateId } = useParams<{ templateId: string }>(); // Get templateId from URL
  const navigate = useNavigate();
  const { eventId: routeEventId } = useParams<{ eventId: string }>(); // Rename route eventId
  const { user } = useAuth();

  const [events, setEvents] = useState<EventSelectOption[]>([]); // Changed type to EventSelectOption[]
  const [eventsLoading, setEventsLoading] = useState(true);
  const [templateLoading, setTemplateLoading] = useState(isEditing); // Set loading state for template fetching
  const [templateError, setTemplateError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false); // State to toggle between edit and preview

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset, // Get reset function from useForm
    watch, // Get watch function from useForm
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '',
      subject: '',
      content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Invitation</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f9; }
    .email-container { max-width: 600px; margin: 40px auto; background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
    .header { text-align: center; padding-bottom: 20px; }
    .header h1 { color: #2c3e50; font-size: 24px; margin: 0; }
    .content { font-size: 16px; line-height: 1.6; color: #333333; }
    .qr-container { text-align: center; margin-top: 20px; }
    .qr-container img { max-width: 200px; }
    .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #777777; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Welcome to {{event}}!</h1>
    </div>
    <div class="content">
      <p>Dear {{name}},</p>
      <p>We're excited to have you join us for {{event}}!</p>
      <p>Your personal QR code is attached to this email. Please bring it with you to the event for quick check-in.</p>
      <div class="qr-container">
        {{qr_image}}
      </div>
    </div>
    <div class="footer">
      <p>See you there!</p>
      <p>Best regards,<br>The Event Team</p>
    </div>
  </div>
</body>
</html>`,
      eventId: routeEventId || '', // Set default eventId from route if exists
    },
  });

  useEffect(() => {
    const fetchEvents = async () => {
      setEventsLoading(true);
      try {
        const { data, error } = await supabase
          .from('events')
          .select('id, name')
          .order('date', { ascending: false });

        if (error) throw error;
        setEvents(data || []);
      } catch (error) {
        console.error('Error fetching events:', error);
        // TODO: Add proper error handling/notification
      } finally {
        setEventsLoading(false);
      }
    };

    fetchEvents();
  }, []); // Fetch events on component mount

  useEffect(() => {
    const fetchTemplate = async () => {
      if (isEditing && templateId) {
        setTemplateLoading(true);
        setTemplateError(null);
        try {
          const { data, error } = await supabase
            .from('email_templates')
            .select('*')
            .eq('id', templateId)
            .single();

          if (error) throw error;

          if (data) {
            reset({ // Use reset to populate form with fetched data
              name: data.name,
              subject: data.subject,
              content: data.body,
              eventId: data.event_id || '',
            });
          }
        } catch (error: unknown) {
          if (error instanceof Error) {
            setTemplateError(error.message);
          } else {
            setTemplateError('An unknown error occurred while fetching template');
          }
          console.error('Error fetching template:', error);
        } finally {
          setTemplateLoading(false);
        }
      }
    };

    fetchTemplate();
  }, [isEditing, templateId, reset]); // Refetch when isEditing or templateId changes

  useEffect(() => {
    if (showPreview) {
      const iframe = document.getElementById('email-preview-iframe') as HTMLIFrameElement;
      if (iframe && iframe.contentDocument) {
        iframe.contentDocument.open();
        iframe.contentDocument.write(watch('content'));
        iframe.contentDocument.close();
      }
    }
  }, [watch('content'), showPreview]); // Update iframe content when content or showPreview changes

  const onSubmit = async (data: TemplateFormData) => {
    try {
      if (!user) {
        throw new Error('You must be logged in to create or edit email templates');
      }

      if (isEditing && templateId) { // Use templateId for update
        // Update existing template
        const { error } = await supabase
          .from('email_templates')
          .update({
            name: data.name,
            subject: data.subject,
            body: data.content,
            event_id: data.eventId, // eventId is now mandatory
          })
          .eq('id', templateId); // Use templateId for update

        if (error) throw error;
      } else {
        // Create new template
        const { error } = await supabase
          .from('email_templates')
          .insert({
            event_id: data.eventId, // eventId is now mandatory
            name: data.name,
            subject: data.subject,
            body: data.content,
            created_by: user.id,
          });

        if (error) throw error;
      }

      navigate('/email-templates');
    } catch (error) {
      console.error('Error saving template:', error);
      // TODO: Add proper error handling/notification
    }
  };

  if (templateLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading template...</div>
      </div>
    );
  }

  if (templateError) {
    return <div className="p-4 text-red-500">Error loading template: {templateError}</div>;
  }


  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Email Template' : 'Create Email Template'}</CardTitle>
        <CardDescription>
          {isEditing
            ? 'Update your email template below'
            : 'Create a template for sending emails to participants'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              placeholder="Enter template name"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Email Subject</Label>
            <Input
              id="subject"
              placeholder="Enter email subject"
              {...register('subject')}
            />
            {errors.subject && (
              <p className="text-sm text-destructive">{errors.subject.message}</p>
            )}
          </div>

          {/* Event Select Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="eventId">Associate with Event</Label>
            <select
              id="eventId"
              {...register('eventId')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={eventsLoading || isEditing} // Disable dropdown when editing
            >
              <option value="">-- Select an Event --</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>{event.name}</option>
              ))}
            </select>
            {eventsLoading && <p className="text-sm text-muted-foreground">Loading events...</p>}
            {errors.eventId && (
              <p className="text-sm text-destructive">{errors.eventId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Email Content (HTML)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? 'Show Editor' : 'Show Preview'}
              </Button>
            </div>

            {showPreview ? (
              <iframe
                className="border rounded-md bg-background w-full"
                style={{ height: '300px' }}
                title="Email Preview"
                id="email-preview-iframe"
              ></iframe>
            ) : (
              <div>
                <textarea
                  id="content"
                  rows={10}
                  className="w-full p-3 text-sm border rounded-md bg-background focus:outline-none"
                  placeholder="Enter email content"
                  {...register('content')}
                ></textarea>
                {errors.content && (
                  <p className="text-sm text-destructive">{errors.content.message}</p>
                )}
              </div>
            )}

            <div className="p-3 bg-muted rounded-md mt-2">
              <p className="text-sm font-medium mb-1">Available variables:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li><code className="bg-muted-foreground/20 px-1 rounded">{'{{name}}'}</code> - Participant's name</li>
                <li><code className="bg-muted-foreground/20 px-1 rounded">{'{{event}}'}</code> - Event name</li>
                <li><code className="bg-muted-foreground/20 px-1 rounded">{'{{qr_image}}'}</code> - Link to participant's QR code</li>
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(routeEventId ? `/events/${routeEventId}/emails` : '/email-templates')} // Use routeEventId for cancel
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Template' : 'Create Template'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default EmailTemplateForm;
