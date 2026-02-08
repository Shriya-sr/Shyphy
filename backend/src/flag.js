import crypto from 'crypto';

// Generate a short rotating flag based on 10-second windows
export function getRotatingFlag(secret = 'shi_default_secret') {
  const now = Date.now();
  const windowSeconds = 10;
  const windowStart = Math.floor(now / 1000 / windowSeconds) * windowSeconds; // epoch seconds
  const secondsElapsed = Math.floor(now / 1000) - windowStart;
  const secondsRemaining = windowSeconds - secondsElapsed;

  const hmac = crypto.createHmac('sha256', secret).update(String(windowStart)).digest('hex');
  // Convert to base36 and take 6 chars for compact flag
  const base36 = BigInt('0x' + hmac).toString(36).toUpperCase();
  const code = base36.replace(/[^A-Z0-9]/g, '').substring(0, 6).padEnd(6, 'X');

  const flag = `SHI{${code}}`;
  return { flag, secondsRemaining };
}
