import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { formatInTimeZone } from 'date-fns-tz';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const dateParsed = typeof date === 'string' ? parseISO(date) : date;
  
  // Format in UTC to ensure consistency
  return formatInTimeZone(dateParsed, 'UTC', 'MMMM d, yyyy');
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "PPp");
}

/**
 * Normalizes a date input to UTC midnight (00:00:00)
 * This removes time components and timezone issues by storing all dates at UTC midnight
 * 
 * @param dateInput The date from user input (string or Date)
 * @returns ISO string for midnight UTC on the intended date
 */
export function normalizeToUTCMidnight(dateInput: string | Date): string {
  if (typeof dateInput === 'string') {
    // If it's already an ISO string with timezone info, use it directly
    if (dateInput.match(/[+-]\d{2}:?\d{2}$/) || dateInput.endsWith('Z')) {
      return dateInput;
    }
    
    // Otherwise, preserve it as-is by adding a timezone designator
    // This assumes the date is specified in UTC if no timezone is provided
    return `${dateInput.replace(/\s/g, 'T').replace(/Z$/, '')}+00:00`;
  }
  
  // If it's a Date object, convert to ISO with timezone info
  return dateInput.toISOString().replace('Z', '+00:00');
}

export function generateQRToken(): string {
  return crypto.randomUUID();
}

export function getBaseUrl(): string {
  return window.location.origin;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function deviceInfo(): string {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  return JSON.stringify({ userAgent, platform });
}

export function parseCSVData<T>(text: string): T[] {
  const lines = text.split('\n');
  const headers = lines[0].split(',').map(header => header.trim());
  
  return lines.slice(1).map(line => {
    if (!line.trim()) return null;
    
    const values = line.split(',').map(value => value.trim());
    const obj: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    
    return obj as unknown as T;
  }).filter(Boolean) as T[];
}

export function interpolateTemplate(
  template: string, 
  data: Record<string, string>
): string {
  return template.replace(/{([^}]+)}/g, (_, key) => {
    return data[key] || `{${key}}`;
  });
}