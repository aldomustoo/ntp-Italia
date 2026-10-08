/**
 * Time utility functions for Europe/Rome timezone and DST calculations.
 */

export interface ItalianTimeInfo {
  isoString: string;
  utcTimeFormatted: string;
  italyTimeFormatted: string;
  italyDateFormatted: string;
  timeZoneName: string; // CET or CEST
  timeZoneFullName: string; // Ora Solare (CET, UTC+1) o Ora Legale (CEST, UTC+2)
  isDaylightSaving: boolean;
  offsetHours: number;
  offsetString: string; // "+01:00" or "+02:00"
  nextTransition: {
    type: 'to_cest' | 'to_cet';
    label: string;
    targetDate: Date;
    formattedDate: string;
    description: string;
    remainingMs: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  };
}

/**
 * Finds the last Sunday of a given month and year.
 */
export function getLastSundayOfMonth(year: number, month: number, hourUtc: number): Date {
  // month: 0-indexed (2 = March, 9 = October)
  const lastDay = new Date(Date.UTC(year, month + 1, 0, hourUtc, 0, 0));
  const dayOfWeek = lastDay.getUTCDay(); // 0 is Sunday
  const lastSundayDate = lastDay.getUTCDate() - dayOfWeek;
  return new Date(Date.UTC(year, month, lastSundayDate, hourUtc, 0, 0));
}

/**
 * Computes Italian time, DST status and upcoming transition.
 */
export function getItalianTimeInfo(referenceDate = new Date()): ItalianTimeInfo {
  const year = referenceDate.getUTCFullYear();

  // In Europe/Rome:
  // Starts CEST: Last Sunday of March at 01:00 UTC (02:00 CET -> 03:00 CEST)
  // Ends CEST: Last Sunday of October at 01:00 UTC (03:00 CEST -> 02:00 CET)
  const marchTransition = getLastSundayOfMonth(year, 2, 1);
  const octoberTransition = getLastSundayOfMonth(year, 9, 1);

  const isDaylightSaving = referenceDate >= marchTransition && referenceDate < octoberTransition;
  const offsetHours = isDaylightSaving ? 2 : 1;
  const timeZoneName = isDaylightSaving ? 'CEST' : 'CET';
  const timeZoneFullName = isDaylightSaving 
    ? 'Ora Legale (CEST, UTC+2)' 
    : 'Ora Solare (CET, UTC+1)';

  // Determine next transition
  let nextType: 'to_cest' | 'to_cet';
  let targetDate: Date;
  let label: string;
  let description: string;

  if (referenceDate < marchTransition) {
    nextType = 'to_cest';
    targetDate = marchTransition;
    label = 'Passaggio a Ora Legale (CEST)';
    description = 'Le lancette si sposteranno avanti di 1 ora (+1h, UTC+2)';
  } else if (referenceDate < octoberTransition) {
    nextType = 'to_cet';
    targetDate = octoberTransition;
    label = 'Ritorno a Ora Solare (CET)';
    description = 'Le lancette si sposteranno indietro di 1 ora (-1h, UTC+1)';
  } else {
    // Past October transition this year -> next is March of next year
    const nextMarch = getLastSundayOfMonth(year + 1, 2, 1);
    nextType = 'to_cest';
    targetDate = nextMarch;
    label = 'Passaggio a Ora Legale (CEST)';
    description = 'Le lancette si sposteranno avanti di 1 ora (+1h, UTC+2)';
  }

  const remainingMs = Math.max(0, targetDate.getTime() - referenceDate.getTime());
  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Formatting
  const pad = (n: number) => n.toString().padStart(2, '0');
  const offsetString = `+${pad(offsetHours)}:00`;

  // Format Rome Time
  const italyTimeFormatted = new Intl.DateTimeFormat('it-IT', {
    timeZone: 'Europe/Rome',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(referenceDate);

  const italyDateFormatted = new Intl.DateTimeFormat('it-IT', {
    timeZone: 'Europe/Rome',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(referenceDate);

  const utcTimeFormatted = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(referenceDate) + ' UTC';

  const transitionFormatted = new Intl.DateTimeFormat('it-IT', {
    timeZone: 'Europe/Rome',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(targetDate) + ' (02:00/03:00 locale)';

  return {
    isoString: referenceDate.toISOString(),
    utcTimeFormatted,
    italyTimeFormatted,
    italyDateFormatted,
    timeZoneName,
    timeZoneFullName,
    isDaylightSaving,
    offsetHours,
    offsetString,
    nextTransition: {
      type: nextType,
      label,
      targetDate,
      formattedDate: transitionFormatted,
      description,
      remainingMs,
      days,
      hours,
      minutes,
      seconds
    }
  };
}
