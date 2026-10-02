import { describe, it, expect } from 'vitest';
import { isSafePublicUrl, safeFetchImage } from '../src/lib/security';

describe('Security - SSRF & URL Validation', () => {
  it('should accept valid public HTTPS and HTTP URLs', () => {
    expect(isSafePublicUrl('https://images.unsplash.com/photo-123.jpg').isSafe).toBe(true);
    expect(isSafePublicUrl('http://cdn.example.com/products/image.png').isSafe).toBe(true);
    expect(isSafePublicUrl('https://m.media-amazon.com/images/I/71xyz.jpg').isSafe).toBe(true);
  });

  it('should accept internal synthetic upload schemes', () => {
    expect(isSafePublicUrl('local-upload://sample.jpg').isSafe).toBe(true);
    expect(isSafePublicUrl('serpapi:image_id:abc123xyz').isSafe).toBe(true);
  });

  it('should reject loopback and localhost addresses', () => {
    expect(isSafePublicUrl('http://localhost:8787/secret').isSafe).toBe(false);
    expect(isSafePublicUrl('http://localhost/image.jpg').isSafe).toBe(false);
    expect(isSafePublicUrl('http://127.0.0.1/admin').isSafe).toBe(false);
    expect(isSafePublicUrl('http://127.0.0.100:3000').isSafe).toBe(false);
  });

  it('should reject cloud metadata service endpoints (AWS/GCP/Azure)', () => {
    expect(isSafePublicUrl('http://169.254.169.254/latest/meta-data/').isSafe).toBe(false);
    expect(isSafePublicUrl('http://metadata.google.internal/computeMetadata/v1/').isSafe).toBe(false);
  });

  it('should reject RFC 1918 private network ranges', () => {
    expect(isSafePublicUrl('http://10.0.0.1/internal.jpg').isSafe).toBe(false);
    expect(isSafePublicUrl('http://172.16.0.5/private.png').isSafe).toBe(false);
    expect(isSafePublicUrl('http://172.31.255.255/image.png').isSafe).toBe(false);
    expect(isSafePublicUrl('http://192.168.1.1/router.jpg').isSafe).toBe(false);
    expect(isSafePublicUrl('http://192.168.0.254/').isSafe).toBe(false);
  });

  it('should reject non-HTTP protocols (file, ftp, javascript)', () => {
    expect(isSafePublicUrl('file:///etc/passwd').isSafe).toBe(false);
    expect(isSafePublicUrl('ftp://ftp.example.com/file.jpg').isSafe).toBe(false);
    expect(isSafePublicUrl('javascript:alert(1)').isSafe).toBe(false);
  });

  it('should reject malformed and empty URLs', () => {
    expect(isSafePublicUrl('').isSafe).toBe(false);
    expect(isSafePublicUrl('not a url').isSafe).toBe(false);
  });

  it('should reject alternative IP encodings (decimal integer, hex, octal, short-form)', () => {
    // Decimal IP 2130706433 is 127.0.0.1
    expect(isSafePublicUrl('http://2130706433/image.jpg').isSafe).toBe(false);
    // Hex IP 0x7f000001 is 127.0.0.1
    expect(isSafePublicUrl('http://0x7f000001/admin.png').isSafe).toBe(false);
    // Dotted hex 0x7f.0.0.1
    expect(isSafePublicUrl('http://0x7f.0.0.1/').isSafe).toBe(false);
    // Octal IP 0177.0.0.1 is 127.0.0.1
    expect(isSafePublicUrl('http://0177.0.0.1/logo.png').isSafe).toBe(false);
    // Short IP notation 127.1 is 127.0.0.1
    expect(isSafePublicUrl('http://127.1/').isSafe).toBe(false);
    // Decimal private 10.0.0.1 = 167772161
    expect(isSafePublicUrl('http://167772161/').isSafe).toBe(false);
  });

  it('should reject DNS rebinding wildcard domains resolving to internal IPs', () => {
    expect(isSafePublicUrl('http://127.0.0.1.nip.io/photo.jpg').isSafe).toBe(false);
    expect(isSafePublicUrl('http://metadata.169.254.169.254.nip.io/').isSafe).toBe(false);
    expect(isSafePublicUrl('http://10.0.0.1.sslip.io/').isSafe).toBe(false);
    expect(isSafePublicUrl('http://app.localtest.me/').isSafe).toBe(false);
  });

  it('should reject dangerous non-web ports', () => {
    expect(isSafePublicUrl('http://example.com:22/img.png').isSafe).toBe(false); // SSH
    expect(isSafePublicUrl('http://example.com:25/img.png').isSafe).toBe(false); // SMTP
    expect(isSafePublicUrl('http://example.com:6379/img.png').isSafe).toBe(false); // Redis
    expect(isSafePublicUrl('http://example.com:9200/img.png').isSafe).toBe(false); // Elasticsearch
    // Safe ports should pass
    expect(isSafePublicUrl('https://example.com:443/img.png').isSafe).toBe(true);
    expect(isSafePublicUrl('http://example.com:8080/img.png').isSafe).toBe(true);
  });

  it('should reject unsafe URLs in safeFetchImage without initiating network traffic', async () => {
    const res = await safeFetchImage('http://169.254.169.254/latest/meta-data/');
    expect(res.ok).toBe(false);
    expect(res.error).toBeDefined();
  });
});
