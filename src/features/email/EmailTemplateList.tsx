import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { EmailTemplate } from '@/types';

const EmailTemplateList: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        // Fetch all email templates, including global and event-specific
        const { data, error } = await supabase
          .from('email_templates')
          .select('*')
          .order('created_at', { ascending: false });

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
  }, []);

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

  if (loading) {
    return <div className="text-center p-8">Loading email templates...</div>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Email Templates</h1>
        <Button asChild size="sm">
          <Link to="/email-templates/new">
            <Plus className="mr-1 h-4 w-4" />
            Create New Template
          </Link>
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No email templates found</CardTitle>
            <CardDescription>
              Create your first email template to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/email-templates/new">
                <Plus className="mr-1 h-4 w-4" />
                Create New Template
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <CardTitle>{template.name}</CardTitle>
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
