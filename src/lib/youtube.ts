/**
 * Utility to extract YouTube Video ID from any YouTube URL format
 */
export function extractYouTubeId(url: string | undefined | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // Direct 11-character video ID
  if (/^[\w-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Handle youtu.be/ID
  const youtuBeMatch = trimmed.match(/youtu\.be\/([\w-]{11})/i);
  if (youtuBeMatch && youtuBeMatch[1]) {
    return youtuBeMatch[1];
  }

  // Handle embed or shorts or v
  const pathMatch = trimmed.match(/(?:embed|shorts|v)\/([\w-]{11})/i);
  if (pathMatch && pathMatch[1]) {
    return pathMatch[1];
  }

  // Handle ?v=ID or &v=ID
  const paramMatch = trimmed.match(/[?&]v=([\w-]{11})/i);
  if (paramMatch && paramMatch[1]) {
    return paramMatch[1];
  }

  return null;
}
