/**
 * Helper to generate QR code URLs and data representations
 */

export const qrCodeUtils = {
  /**
   * Generates a high-quality QR code image URL for verification
   * Uses SVG/URL fallback with clear high-resolution rendering
   */
  getQrCodeImageUrl(text: string, size = 200): string {
    const encoded = encodeURIComponent(text);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&margin=2&color=0-32-96`;
  },

  /**
   * Generates verification link
   */
  getVerificationUrl(certificateNumber: string): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://epkl.smkn13bdg.sch.id';
    return `${origin}/verify/${encodeURIComponent(certificateNumber)}`;
  }
};
