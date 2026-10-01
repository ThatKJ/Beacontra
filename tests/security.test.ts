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

  it('should reject unsafe URLs in safeFetchImage without initiating network traffic', async () => {
    const res = await safeFetchImage('http://169.254.169.254/latest/meta-data/');
    expect(res.ok).toBe(false);
    expect(res.error).toBeDefined();
  });
});
