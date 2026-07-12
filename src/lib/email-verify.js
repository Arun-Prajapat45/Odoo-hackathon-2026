import dns from 'dns/promises';

/**
 * Known disposable and temporary email domains blocklist
 */
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  '10minutemail.com',
  'guerrillamail.com',
  'tempmail.com',
  'yopmail.com',
  'trashmail.com',
  'getairmail.com',
  'sharklasers.com',
  'dispostable.com',
  'fakeinbox.com',
  'maildrop.cc',
  'inboxkitten.com',
  'temp-mail.org',
  'nada.ltd',
  'throwawaymail.com',
  'tempmailaddress.com',
  'mohmal.com',
  'crazymailing.com',
  'burnermail.io'
]);

/**
 * 3-Tier Real Email Verification
 * Checks syntax, disposable domain blocklist, and live DNS MX records.
 * @param {string} email
 * @returns {Promise<{ valid: boolean, error?: string }>}
 */
export async function verifyRealEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email address is required.' };
  }

  const cleanEmail = email.trim().toLowerCase();
  const parts = cleanEmail.split('@');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { valid: false, error: 'Invalid email format.' };
  }

  const [localPart, domain] = parts;

  // Check disposable domain blocklist
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      valid: false,
      error: `Disposable or temporary email service (@${domain}) is not permitted. Please use your permanent organization or personal email.`
    };
  }

  // Check basic domain structure
  if (!domain.includes('.') || domain.startsWith('.') || domain.endsWith('.')) {
    return { valid: false, error: 'Invalid email domain structure.' };
  }

  // Check live DNS MX (Mail Exchange) records to verify real mail server
  try {
    const mxRecords = await dns.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return {
        valid: false,
        error: `The domain "@${domain}" does not have active mail server records (MX records). Please verify the email domain.`
      };
    }
  } catch (err) {
    // If DNS query returns ENOTFOUND or ENODATA, domain cannot receive mail
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA' || err.code === 'EREFUSED') {
      return {
        valid: false,
        error: `The email domain "@${domain}" does not exist or has no mail servers configured.`
      };
    }
    // If DNS query times out or fails network-wise during dev/testing, we log warning but don't hard block legitimate known domains (e.g. gmail.com, yahoo.com, outlook.com)
    const knownReliableDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'transitops.com'];
    if (!knownReliableDomains.includes(domain)) {
      return {
        valid: false,
        error: `Could not verify mail server for "@${domain}". Please use a valid, active email address.`
      };
    }
  }

  return { valid: true };
}
