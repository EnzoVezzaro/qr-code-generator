export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff';
  user_metadata?: { name?: string }; // Remove any index signature
}

export interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  max_participants: number;
  qr_usage_limit: number;
  check_in_logo_url: string | null;
  check_in_color: string | null;
  check_in_message: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  participant_count: number; // Added participant count
  registered_participants?: number; // Add registered_participants
  checked_in_participants?: number; // Add checked_in_participants
  revokedAccess: number; // Add revokedAccess
}

export interface Participant {
  id: string;
  event_id: string;
  name: string;
  email: string;
  identifier: string;
  qr_token: string;
  qr_usage_count: number;
  is_revoked: boolean;
  created_at: string;
  updated_at: string;
  isCheckedIn?: boolean; // Added check-in status
}

export interface CheckIn {
  id: string;
  event_id: string;
  participant_id: string;
  timestamp: string;
  ip_address: string;
  device_info: string;
  processed_by: string;
  participant?: Participant;
}

// Interface for event data used in select dropdowns
export interface EventSelectOption {
  id: string;
  name: string;
}

export interface EmailTemplate {
  id: string;
  event_id: string | null; // event_id can be null for global templates
  name: string;
  subject: string;
  body: string; // Changed from content to body
  created_at: string;
  updated_at: string;
  created_by: string;
  event_name?: string | null; // Added event name for display in list
}

export interface QRValidationResult {
  valid: boolean;
  message: string;
  participant?: Participant;
  event?: Event;
  usageCount?: number;
  usageLimit?: number;
}

export interface EventStats {
  totalParticipants: number;
  checkedIn: number;
  notCheckedIn: number;
  revokedAccess: number;
}

export interface CSVParticipant {
  name: string;
  email: string;
  identifier: string;
}
