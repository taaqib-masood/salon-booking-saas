import React from 'react';

const IcalLink = ({ appointment }) => {
  const { service, stylist, branchAddress, dateTime } = appointment;

  const start = new Date(dateTime);
  const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour default

  const pad = (n) => String(n).padStart(2, '0');
  const formatDate = (d) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART:${formatDate(start)}`,
    `DTEND:${formatDate(end)}`,
    `SUMMARY:${service} with ${stylist}`,
    `LOCATION:${branchAddress}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);

  return (
    <a href={url} download="appointment.ics">
      Add to Calendar
    </a>
  );
};

export default IcalLink;
