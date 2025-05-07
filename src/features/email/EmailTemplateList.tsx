import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom'; // Import useParams
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { EmailTemplate } from '@/types';

const EmailTemplateList: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>(); // Get eventId from URL
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('email_templates')
          .select('*')
          .order('created_at', { ascending: false });

        // Filter by event_id if eventId is present in the URL
        if (eventId) {
          query = query.eq('event_id', eventId);
        } else {
          // Optionally, filter for global templates if no eventId is present
          // query = query.is('event_id', null);
          // For now, we'll show all templates if no eventId is in the URL
        }

        const { data, error } = await query;

        if (error) throw error;
        setTemplates(data || []);
      } catch (error) {
        console.error('Error fetching email templates:', error);
        // TODO: Add proper error handling/notification
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [eventId]); // Refetch templates when eventId changes

  const handleDeleteTemplate = async (templateId: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        const { error } = await supabase
          .from('email_templates')
          .delete()
          .eq('id', templateId);

        if (error) throw error;

        // Remove the deleted template from the local state
        setTemplates(templates.filter(template => template.id !== templateId));
      } catch (error) {
        console.error('Error deleting template:', error);
        // TODO: Add proper error handling/notification
      }
    }
  };

  // Determine the correct link for creating a new template
  const createTemplateLink = eventId
    ? `/events/${eventId}/emails/templates/new`
    // Determine the correct link for creating a new template
    : '/email-templates/new';

  return (
    <div className="space-y-6 p-4"> {/* Added space-y-6 and p-4 */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6"> {/* Improved header styling */}
        <h1 className="text-3xl font-bold"> {/* Increased font size */}
          {eventId ? 'Event Email Templates' : 'All Email Templates'}
        </h1>
        <Button asChild size="sm">
          <Link to={createTemplateLink}>
            <Plus className="mr-1 h-4 w-4" />
            Create New Template
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"> {/* Centered loading text */}
          <div className="animate-pulse text-muted-foreground">Loading email templates...</div>
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No email templates found</CardTitle>
            <CardDescription>
              Create your first email template to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to={createTemplateLink}>
                <Plus className="mr-1 h-4 w-4" />
                Create New Template
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"> {/* Adjusted grid gap */}
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow duration-300"> {/* Added hover effect */}
              <CardHeader>
                <CardTitle className="text-xl">{template.name}</CardTitle> {/* Increased font size */}
                <CardDescription>{template.subject}</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/email-templates/${template.id}/edit`}>
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Link>
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteTemplate(template.id)}>
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmailTemplateList;
