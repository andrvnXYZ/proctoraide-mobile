import type { ExamStatus, IncidentStatus } from '@/types';

export function greeting(date = new Date()): string {
  const hour = date.getHours();

  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function todayLabel(date = new Date()): string {
  return date
    .toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    .toUpperCase();
}

export function initials(name?: string | null): string {
  if (!name) return 'S';

  return name
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export function firstName(user?: { first_name?: string | null; name?: string } | null): string {
  return user?.first_name?.trim() || user?.name?.split(' ')[0] || 'there';
}

export function formatTime(value?: string | null): string {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return `${date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })} · ${date.toLocaleTimeString('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

export function formatDate(value?: string | null): string {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function elapsedLabel(startedAt?: string | null, now = Date.now()): string {
  if (!startedAt) return '00:00';

  const start = new Date(startedAt).getTime();

  if (Number.isNaN(start)) return '00:00';

  const seconds = Math.max(0, Math.floor((now - start) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = seconds % 60;
  const pad = (value: number) => String(value).padStart(2, '0');

  return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(remaining)}` : `${pad(minutes)}:${pad(remaining)}`;
}

export function todayIso(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export const examStatusTone: Record<ExamStatus, { label: string; fg: string; bg: string; border: string; dot: string }> = {
  scheduled: { label: 'Upcoming', fg: '#8a6a1f', bg: '#fbf4e1', border: '#efe0b6', dot: '#c9a03f' },
  ongoing: { label: 'Live now', fg: '#1b7a52', bg: '#e8f5ee', border: '#c4e6d5', dot: '#2f9e6b' },
  completed: { label: 'Completed', fg: '#4b625d', bg: '#eef3f1', border: '#dbe7e3', dot: '#8aa39d' },
};

export const incidentStatusTone: Record<IncidentStatus, { label: string; fg: string; bg: string; border: string }> = {
  pending: { label: 'Pending', fg: '#8a6a1f', bg: '#fbf4e1', border: '#efe0b6' },
  reviewed: { label: 'Reviewed', fg: '#1b7a52', bg: '#e8f5ee', border: '#c4e6d5' },
  dismissed: { label: 'Dismissed', fg: '#4b625d', bg: '#eef3f1', border: '#dbe7e3' },
};

export function sessionStatusLabel(status?: 'in_progress' | 'completed' | null): string {
  if (status === 'in_progress') return 'In exam';
  if (status === 'completed') return 'Finished';
  return 'Joined';
}
