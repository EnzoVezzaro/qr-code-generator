import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), "PPP");
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "PPp");
}

export function generateQRToken(): string {
  return crypto.randomUUID();
}

export function getBaseUrl(): string {
  return window.location.origin;
}

export function getQRCheckInUrl(token: string): string {
  return `${getBaseUrl()}/check-in/${token}`;
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