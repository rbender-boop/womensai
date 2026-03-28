// Autonomous spam/bot detection for signups
// Runs server-side on every signup attempt. Zero manual intervention.

// Known spam email domains — expand as needed
const BLOCKED_DOMAINS = new Set([
  // Confirmed spam infrastructure
  'bdcimail.com', 'guerrillamail.com', 'guerrillamailblock.com', 'grr.la',
  'sharklasers.com', 'guerrillamail.info', 'guerrillamail.net', 'guerrillamail.org',
  // Disposable email services
  'mailinator.com', 'yopmail.com', 'tempmail.com', 'throwaway.email',
  'temp-mail.org', 'fakeinbox.com', 'mailnesia.com', 'trashmail.com',
  'trashmail.me', 'trashmail.net', 'dispostable.com', 'maildrop.cc',
  'getairmail.com', 'getnada.com', 'mohmal.com', 'emailondeck.com',
  'tempinbox.com', 'burnermail.io', 'tempr.email', 'tempail.com',
  'harakirimail.com', 'discard.email', 'discardmail.com', 'discardmail.de',
  'mailcatch.com', 'mintemail.com', 'meltmail.com', 'spamgourmet.com',
  'mytemp.email', 'throwam.com', 'tmail.com', 'tmpmail.net', 'tmpmail.org',
  'binkmail.com', 'safetymail.info', 'filzmail.com', 'inboxalias.com',
  'jetable.org', 'mailexpire.com', 'mailmoat.com', 'mailnull.com',
  'mailzilla.com', 'nomail.xl.cx', 'spamfree24.org', 'spamhereplease.com',
  'tempomail.fr', 'trash-mail.at', 'uggsrock.com', 'yopmail.fr',
  'cuvox.de', 'dayrep.com', 'einrot.com', 'fleckens.hu', 'gustr.com',
  'jourrapide.com', 'rhyta.com', 'superrito.com', 'teleworm.us',
  'armyspy.com', 'cuvox.de', 'dayrep.com', 'einrot.com', 'fleckens.hu',
  // Catch-all spam providers
  'mailnator.com', 'guerrillamail.de', 'spam4.me', 'byom.de',
  'trbvm.com', 'zzrgg.com', 'xojxe.com', 'zwoho.com',
]);

// Patterns that indicate bot-generated email addresses
const SUSPICIOUS_PATTERNS = [
  /^[a-z]+\d{2,}@/i,           // name + 2+ digits like imogene37@
  /^[a-z]+\.[a-z]+\d{2,}@/i,   // first.last99@
  /^[a-z]{1,3}\d{5,}@/i,       // ab12345@
  /^test\d*@/i,                 // test, test1, test123
  /^user\d+@/i,                 // user123@
  /^admin\d*@/i,                // admin, admin1
  /^info\d+@/i,                 // info123@
];

export interface SpamCheckResult {
  isSpam: boolean;
  reason?: string;
}

export function checkEmailForSpam(email: string): SpamCheckResult {
  const normalized = email.toLowerCase().trim();
  const domain = normalized.split('@')[1];

  if (!domain) {
    return { isSpam: true, reason: 'invalid_email' };
  }

  // Check blocked domains
  if (BLOCKED_DOMAINS.has(domain)) {
    return { isSpam: true, reason: `blocked_domain:${domain}` };
  }

  // Check for suspicious TLDs commonly used by spam
  const tld = domain.split('.').slice(-1)[0];
  const suspiciousTlds = new Set(['xyz', 'top', 'click', 'buzz', 'gq', 'ml', 'cf', 'tk', 'ga']);
  if (suspiciousTlds.has(tld)) {
    return { isSpam: true, reason: `suspicious_tld:.${tld}` };
  }

  // Check suspicious local-part patterns
  const localPart = normalized.split('@')[0];
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(normalized)) {
      // Only flag if domain is also uncommon (don't block gmail users with numbers)
      const trustedDomains = new Set(['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com', 'protonmail.com', 'pm.me', 'live.com', 'msn.com', 'comcast.net', 'verizon.net', 'att.net', 'me.com', 'mac.com']);
      if (!trustedDomains.has(domain)) {
        return { isSpam: true, reason: `suspicious_pattern:${pattern.source}` };
      }
    }
  }

  // Check for excessively long local parts (bot-generated)
  if (localPart.length > 40) {
    return { isSpam: true, reason: 'local_part_too_long' };
  }

  return { isSpam: false };
}

// Honeypot field check — bots fill hidden fields, humans don't
export function isHoneypotTriggered(honeypotValue?: string): boolean {
  return !!honeypotValue && honeypotValue.trim().length > 0;
}
