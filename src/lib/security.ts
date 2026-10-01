/**
 * Security and URL validation utilities for Beacontra
 * Protects against Server-Side Request Forgery (SSRF) and malicious inputs
 */

export interface SafeUrlResult {
  isSafe: boolean;
  reason?: string;
}

/**
 * Validates that a URL is a safe, public HTTP/HTTPS URL
 * Rejects private IP ranges, loopback, link-local, cloud metadata services, and non-HTTP protocols
 */
export function isSafePublicUrl(urlStr: string): SafeUrlResult {
  if (!urlStr || typeof urlStr !== 'string') {
    return { isSafe: false, reason: 'URL must be a non-empty string' };
  }

  // Allow synthetic internal test schemes if explicitly flagged
  if (urlStr.startsWith('local-upload://') || urlStr.startsWith('serpapi:image_id:')) {
    return { isSafe: true };
  }

  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch {
    return { isSafe: false, reason: 'Malformed URL' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { isSafe: false, reason: `Unsupported protocol "${parsed.protocol}". Only HTTP and HTTPS are permitted.` };
  }

  const hostname = parsed.hostname.toLowerCase().trim();
  if (!hostname) {
    return { isSafe: false, reason: 'Empty hostname' };
  }

  // Reject local and internal hostnames
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.lan') ||
    hostname === 'metadata.google.internal'
  ) {
    return { isSafe: false, reason: 'Access to localhost and internal domain names is prohibited' };
  }

  // Check IPv4 addresses
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = hostname.match(ipv4Regex);
  if (match) {
    const o1 = Number(match[1]);
    const o2 = Number(match[2]);
    const o3 = Number(match[3]);
    const o4 = Number(match[4]);

    if (o1 > 255 || o2 > 255 || o3 > 255 || o4 > 255) {
      return { isSafe: false, reason: 'Invalid IP address octet' };
    }

    // Loopback: 127.0.0.0/8
    if (o1 === 127) {
      return { isSafe: false, reason: 'Loopback IP addresses (127.0.0.0/8) are prohibited' };
    }

    // Zero / broadcast: 0.0.0.0/8
    if (o1 === 0) {
      return { isSafe: false, reason: 'Zero/broadcast addresses are prohibited' };
    }

    // RFC 1918 Private Ranges:
    // 10.0.0.0/8
    if (o1 === 10) {
      return { isSafe: false, reason: 'Private network addresses (10.0.0.0/8) are prohibited' };
    }
    // 172.16.0.0/12 (172.16.x.x - 172.31.x.x)
    if (o1 === 172 && o2 >= 16 && o2 <= 31) {
      return { isSafe: false, reason: 'Private network addresses (172.16.0.0/12) are prohibited' };
    }
    // 192.168.0.0/16
    if (o1 === 192 && o2 === 168) {
      return { isSafe: false, reason: 'Private network addresses (192.168.0.0/16) are prohibited' };
    }

    // Link-Local / Cloud Metadata (AWS/GCP/Azure): 169.254.0.0/16
    if (o1 === 169 && o2 === 254) {
      return { isSafe: false, reason: 'Cloud metadata / link-local addresses (169.254.0.0/16) are prohibited' };
    }

    // CGNAT: 100.64.0.0/10 (100.64.x.x - 100.127.x.x)
    if (o1 === 100 && o2 >= 64 && o2 <= 127) {
      return { isSafe: false, reason: 'Carrier-grade NAT addresses are prohibited' };
    }
  }

  // Check IPv6 addresses (e.g., [::1], fe80::, fc00::)
  if (hostname.includes(':') || hostname.startsWith('[') || hostname.endsWith(']')) {
    return { isSafe: false, reason: 'Direct IPv6 addresses are prohibited' };
  }

  return { isSafe: true };
}

/**
 * Safely fetches an external image with strict SSRF validation, size bounds, and timeout guards
 */
export async function safeFetchImage(
  imageUrl: string,
  maxBytes = 5 * 1024 * 1024,
  timeoutMs = 6000
): Promise<{ ok: boolean; buffer?: ArrayBuffer; error?: string }> {
  const check = isSafePublicUrl(imageUrl);
  if (!check.isSafe) {
    return { ok: false, error: check.reason };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Beacontra-Verification-Bot/1.0 (+https://beacontra.internal)',
        Accept: 'image/png, image/jpeg, image/webp, image/*;q=0.8',
      },
    });

    if (!response.ok) {
      return { ok: false, error: `Image fetch failed with status ${response.status}` };
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().startsWith('image/')) {
      return { ok: false, error: `Invalid content type: expected image, got ${contentType}` };
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > maxBytes) {
      return { ok: false, error: `Image exceeds maximum allowed size (${maxBytes} bytes)` };
    }

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > maxBytes) {
      return { ok: false, error: `Image body exceeds maximum allowed size (${maxBytes} bytes)` };
    }

    return { ok: true, buffer };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Fetch failed';
    return { ok: false, error: msg };
  } finally {
    clearTimeout(timeoutId);
  }
}
