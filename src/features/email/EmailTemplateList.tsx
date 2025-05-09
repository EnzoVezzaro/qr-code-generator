import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom'; // Import useParams
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
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
          .select('*, events(name)') // Select template fields and related event name
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
        // Map the data to include the event name directly in the template object
        const templatesWithEventName = data.map(template => ({
          ...template,
          event_name: template.events ? template.events.name : null,
        }));

        setTemplates(templatesWithEventName as EmailTemplate[]); // Cast to EmailTemplate[] (assuming EmailTemplate type is extended or flexible)
      } catch (error: unknown) { // Use unknown for caught errors
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
      } catch (error: unknown) { // Use unknown for caught errors
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
        <div className="flex flex-col items-center justify-center h-64 text-center"> {/* Centered and styled */}
          <div className="mb-4">
            {/* Using a relevant icon, e.g., Mail or FileText */}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12 text-muted-foreground mx-auto"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">No email templates found</h3> {/* Increased font size */}
          <p className="text-muted-foreground mb-4">Create your first email template to get started</p> {/* Styled description */}
          <Button asChild>
            <Link to={createTemplateLink}>Create Template</Link> {/* Simplified button text */}
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3"> {/* Adjusted grid gap and added sm:grid-cols-1 */}
          {templates.map((template) => (
            <Card key={template.id} className="group hover:shadow-md transition-shadow duration-300"> {/* Added group class for potential future group-hover effects */}
              <CardHeader>
                <CardTitle className="text-xl truncate">{template.name}</CardTitle> {/* Increased font size and added truncate */}
                <CardDescription className="truncate">{template.subject}</CardDescription> {/* Added truncate */}
              </CardHeader>
              <CardContent className="space-y-2 text-sm"> {/* Added spacing and text size */}
                <div className="flex items-center gap-1"> {/* Flex container for icon and text */}
                  {/* Using a relevant icon, e.g., Clock or Calendar */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span>Created: {template.created_at ? new Date(template.created_at).toLocaleDateString() : 'N/A'}</span> {/* Display creation date */}
                </div>
                {template.event_name && ( // Display event name if available
                  <div className="flex items-center gap-1"> {/* Flex container for icon and text */}
                    {/* Using a relevant icon, e.g., Calendar or Tag */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                    <span>Event: {template.event_name}</span> {/* Display event name */}
                  </div>
                )}
                {/* Add more details here if available in EmailTemplate type, e.g., content type */}
              </CardContent>
              <CardFooter className="flex justify-end gap-2"> {/* Moved buttons to CardFooter */}
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/email-templates/${template.id}/edit`}>
                    <Edit className="h-4 w-4 mr-1" /> {/* Added mr-1 for spacing */}
                    <span>Edit</span> {/* Explicit span for text */}
                  </Link>
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteTemplate(template.id)}>
                  <Trash2 className="h-4 w-4 mr-1" /> {/* Added mr-1 for spacing */}
                  <span>Delete</span> {/* Explicit span for text */}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmailTemplateList;
