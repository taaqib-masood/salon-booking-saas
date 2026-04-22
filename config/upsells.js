/**
 * Upsell rules — matched against booked service name (case-insensitive).
 * Add new rules here without touching any other file.
 */
export const UPSELL_RULES = [
  {
    match: ['blowout', 'blowdry', 'blow dry', 'haircut'],
    message:
      '✨ While you\'re here — add a *Beard Trim* for just AED 50? Our stylist can do it right after. Just say yes and I\'ll add it!',
  },
  {
    match: ['facial', 'caviar', 'hydra'],
    message:
      '✨ Pair your facial with our *Hydrafacial Boost* for AED 150 — deeply hydrating, your skin will love it 🌿 Interested?',
  },
  {
    match: ['manicure', 'nail'],
    message:
      '✨ Complete the look with a *Classic Pedicure* for AED 80 — same visit, no extra wait 💅 Want me to add it?',
  },
  {
    match: ['balayage', 'color', 'colour', 'highlight', 'keratin', 'treatment'],
    message:
      '✨ Protect your look with an *Olaplex Treatment* for AED 120 — keeps color vibrant 3× longer 🌈 Want to include it?',
  },
  {
    match: ['massage', 'spa'],
    message:
      '✨ Extend your relaxation with our *Aromatherapy Add-on* for AED 70 — pure bliss 🕯️ Shall I add it?',
  },
];

/**
 * Returns an upsell message if the service name matches any rule.
 * Returns null if no match.
 */
export function getUpsell(serviceName) {
  if (!serviceName) return null;
  const lower = serviceName.toLowerCase();
  for (const rule of UPSELL_RULES) {
    if (rule.match.some(kw => lower.includes(kw))) return rule.message;
  }
  return null;
}
