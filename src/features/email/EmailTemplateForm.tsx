import React from 'react';
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
import { EmailTemplate } from '@/types';

const templateSchema = z.object({
  name: z.string().min(3, 'Template name must be at least 3 characters'),
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  content: z.string().min(10, 'Email content must be at least 10 characters'),
});

type TemplateFormData = z.infer<typeof templateSchema>;

interface EmailTemplateFormProps {
  template?: EmailTemplate;
  isEditing?: boolean;
}

const EmailTemplateForm: React.FC<EmailTemplateFormProps> = ({ template, isEditing = false }) => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: template
      ? {
          name: template.name,
          subject: template.subject,
          content: template.content,
        }
      : {
          name: '',
          subject: '',
          content: `Dear {name},

We're excited to have you join us for {event}!

Your personal QR code is attached to this email. Please bring it with you to the event for quick check-in.

You can also access your QR code at any time by visiting: {qr_link}

See you there!

Best regards,
The Event Team`,
        },
  });

  const onSubmit = async (data: TemplateFormData) => {
    try {
      if (!user) {
        throw new Error('You must be logged in to create or edit email templates');
      }

      if (!eventId) {
        throw new Error('Event ID is required');
      }

      if (isEditing && template) {
        // Update existing template
        const { error } = await supabase
          .from('email_templates')
          .update({
            name: data.name,
            subject: data.subject,
            content: data.content,
            updated_at: new Date().toISOString(),
          })
          .eq('id', template.id);

        if (error) throw error;
      } else {
        // Create new template
        const { error } = await supabase
          .from('email_templates')
          .insert({
            event_id: eventId,
            name: data.name,
            subject: data.subject,
            content: data.content,
            created_by: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      navigate(`/events/${eventId}/emails`);
    } catch (error) {
      console.error('Error saving template:', error);
      // TODO: Add proper error handling/notification
    }
  };

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

          <div className="space-y-2">
            <Label htmlFor="content">Email Content</Label>
            <div className="border rounded-md bg-background">
              <textarea
                id="content"
                rows={10}
                className="w-full p-3 text-sm bg-transparent focus:outline-none"
                placeholder="Enter email content"
                {...register('content')}
              ></textarea>
            </div>
            {errors.content && (
              <p className="text-sm text-destructive">{errors.content.message}</p>
            )}
            
            <div className="p-3 bg-muted rounded-md mt-2">
              <p className="text-sm font-medium mb-1">Available variables:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li><code className="bg-muted-foreground/20 px-1 rounded">{'{name}'}</code> - Participant's name</li>
                <li><code className="bg-muted-foreground/20 px-1 rounded">{'{event}'}</code> - Event name</li>
                <li><code className="bg-muted-foreground/20 px-1 rounded">{'{qr_link}'}</code> - Link to participant's QR code</li>
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/events/${eventId}/emails`)}
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