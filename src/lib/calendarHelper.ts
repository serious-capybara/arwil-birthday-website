/**
 * Generates an .ics iCalendar file and triggers download
 */
export function downloadICSFile() {
  const event = {
    title: 'Meow Yoga Birthday',
    description: 'Celebrate Meow Yoga Birthday! Please bring your own yoga mat. Attire: Pastel pink or lavender active wear.',
    location: 'The Almonds Boutique Aparthotel, SerenityCore Wellness Hub Palette, Hon. Tudtud Road, Cebu City',
    start: '20261120T184000', // Nov 20, 2026, 6:40 PM (Asia/Manila)
    end: '20261120T220000',
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Meow Yoga Birthday//Invitation//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description}`,
    `LOCATION:${event.location}`,
    `DTSTART:${event.start}`,
    `DTEND:${event.end}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'DESCRIPTION:Meow Yoga Birthday starts in 2 hours!',
    'ACTION:DISPLAY',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'meow-yoga-birthday.ics');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Returns a direct Google Calendar web link for instant 1-click addition
 */
export function getGoogleCalendarUrl(): string {
  const title = encodeURIComponent('Meow Yoga Birthday');
  const details = encodeURIComponent(
    'Celebrate Meow Yoga Birthday! Please bring your own yoga mat. Attire: Pastel pink or lavender active wear.'
  );
  const location = encodeURIComponent(
    'The Almonds Boutique Aparthotel, SerenityCore Wellness Hub Palette, Hon. Tudtud Road, Cebu City'
  );
  // Nov 20, 2026, 18:40 to 22:00 in Manila Time (UTC+8) -> UTC is 10:40 to 14:00
  const dates = '20261120T104000Z/20261120T140000Z';

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${dates}`;
}
