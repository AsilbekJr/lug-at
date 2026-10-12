import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const UZ_MONTHS = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr',
];

/**
 * Format date in clean editorial Uzbek style (e.g. 10-oktabr, 2026)
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const day = d.getDate();
  const month = UZ_MONTHS[d.getMonth()] || '';
  const year = d.getFullYear();
  return `${day}-${month}, ${year}`;
}

/**
 * Format relative duration / next interval
 */
export function formatInterval(days: number): string {
  if (days < 1 / 24) {
    const mins = Math.max(1, Math.round(days * 24 * 60));
    return `${mins} daq`;
  }
  if (days < 1) {
    const hours = Math.round(days * 24);
    return `${hours} soat`;
  }
  if (days < 30) {
    const d = Math.round(days);
    return `${d} kun`;
  }
  if (days < 365) {
    const months = (days / 30).toFixed(1);
    return `${months} oy`;
  }
  const years = (days / 365).toFixed(1);
  return `${years} yil`;
}
