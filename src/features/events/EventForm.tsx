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
import { Event } from '@/types';
import { normalizeToUTCMidnight } from '@/lib/utils';

const eventSchema = z.object({
  name: z.string().min(3, 'Event name must be at least 3 characters'),
  date: z.string().min(1, 'Date is required'),
  location: z.string().min(3, 'Location must be at least 3 characters'),
  max_participants: z.coerce
    .number()
    .min(1, 'At least 1 participant is required')
    .max(1000, 'Maximum 1000 participants allowed'),
  qr_usage_limit: z.coerce
    .number()
    .min(1, 'QR usage limit must be at least 1')
    .max(10, 'QR usage limit cannot exceed 10'),
  check_in_message: z.string().optional(),
  check_in_color: z.string().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventFormProps {
  // event prop is no longer needed as data is fetched internally
  isEditing?: boolean;
}

const EventForm: React.FC<EventFormProps> = ({ isEditing = false }) => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>(); // Get eventId from URL
  const { user } = useAuth();

  const [eventData, setEventData] = useState<Event | null>(null);
  const [loading, setLoading] = useState(isEditing); // Set loading initially if editing

  useEffect(() => {
    if (isEditing && eventId) {
      const fetchEvent = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();

          if (error) throw error;
          setEventData(data as Event);
        } catch (error) {
          console.error('Error fetching event:', error);
          // TODO: Add proper error handling/notification
        } finally {
          setLoading(false);
        }
      };

      fetchEvent();
    }
  }, [isEditing, eventId]); // Fetch when isEditing or eventId changes

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset, // Import reset function
    setValue, // Destructure setValue
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: { // Set default values based on fetched eventData or initial values
      name: eventData?.name || '',
      date: eventData?.date.split('T')[0] || '', // Format for date input
      location: eventData?.location || '',
      max_participants: eventData?.max_participants || 100,
      qr_usage_limit: eventData?.qr_usage_limit || 1,
      check_in_message: eventData?.check_in_message ?? '',
      check_in_color: eventData?.check_in_color ?? '#7C3AED',
    },
  });

  // Reset form with fetched data when eventData changes
  useEffect(() => {
    if (eventData) {
      reset({
        name: eventData.name,
        date: eventData.date.split('T')[0],
        location: eventData.location,
        max_participants: eventData.max_participants,
        qr_usage_limit: eventData.qr_usage_limit,
        check_in_message: eventData.check_in_message ?? '',
        check_in_color: eventData.check_in_color ?? '',
      });
    }
  }, [eventData, reset]);

  const onSubmit = async (data: EventFormData) => {
    try {
      if (!user) {
        throw new Error('You must be logged in to create or edit events');
      }

      if (isEditing && eventId) { // Use eventId from useParams
        // console.log('Updating event with ID:', eventId);
        // console.log('Update data:', data);
        // Update existing event
        const { error } = await supabase
          .from('events')
          .update({
            name: data.name,
            date: normalizeToUTCMidnight(data.date),
            location: data.location,
            max_participants: data.max_participants,
            qr_usage_limit: data.qr_usage_limit,
            check_in_message: data.check_in_message || null,
            check_in_color: data.check_in_color || null,
          })
          .eq('id', eventId); // Use eventId from useParams

        if (error) throw error;
        
        navigate(`/events/${eventId}`); // Use eventId from useParams
      } else {
        // Create new event
        const { data: newEvent, error } = await supabase
          .from('events')
          .insert({
            name: data.name,
            date: normalizeToUTCMidnight(data.date),
            location: data.location,
            max_participants: data.max_participants,
            qr_usage_limit: data.qr_usage_limit,
            check_in_message: data.check_in_message || null,
            check_in_color: data.check_in_color || null,
            created_by: user.id, // Add created_by field
          })
          .select()
          .single();

        if (error) throw error;
        
        navigate(`/events/${newEvent.id}`);
      }
    } catch (error) {
      console.error('Error saving event:', error);
      // TODO: Add proper error handling/notification
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading event details...</div>;
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Event' : 'Create New Event'}</CardTitle>
        <CardDescription>
          {isEditing
            ? 'Update your event details below'
            : 'Enter the details for your new event'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Event Name</Label>
            <Input
              id="name"
              placeholder="Enter event name"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Event Date</Label>
            <Input
              id="date"
              type="date"
              {...register('date')}
            />
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="Enter event location"
              {...register('location')}
            />
            {errors.location && (
              <p className="text-sm text-destructive">{errors.location.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_participants">Max Participants (1-1000)</Label>
              <Input
                id="max_participants"
                type="number"
                min="1"
                max="1000"
                {...register('max_participants')}
              />
              {errors.max_participants && (
                <p className="text-sm text-destructive">
                  {errors.max_participants.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="qr_usage_limit">QR Usage Limit</Label>
              <Input
                id="qr_usage_limit"
                type="number"
                min="1"
                max="10"
                {...register('qr_usage_limit')}
              />
              {errors.qr_usage_limit && (
                <p className="text-sm text-destructive">
                  {errors.qr_usage_limit.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="check_in_message">Check-in Message (Optional)</Label>
            <Input
              id="check_in_message"
              placeholder="Welcome message for check-in page"
              {...register('check_in_message')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="check_in_color">
              Check-in Theme Color (Optional)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="check_in_color"
                type="color"
                className="w-12 h-10 p-1"
                {...register('check_in_color')}
                onChange={(e) => setValue('check_in_color', e.target.value)} // Add onChange to update text field
              />
              <Input
                type="text"
                placeholder="#000000"
                className="flex-1"
                {...register('check_in_color')}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Event' : 'Create Event'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default EventForm;
