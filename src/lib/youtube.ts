/**
 * Utility to extract YouTube Video ID from any YouTube URL format
 * Supports: youtube.com/watch?v=, youtu.be/, youtube.com/shorts/, youtube.com/embed/,
 * youtube.com/live/, music.youtube.com/watch?v=, m.youtube.com/watch?v=, or raw 11-char ID
 */
export function extractYouTubeId(url: string | undefined | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Direct 11-character video ID
  if (/^[\w-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Handle youtu.be/ID
  const youtuBeMatch = trimmed.match(/youtu\.be\/([\w-]{11})/i);
  if (youtuBeMatch && youtuBeMatch[1]) {
    return youtuBeMatch[1];
  }

  // Handle embed, shorts, live, or v
  const pathMatch = trimmed.match(/(?:embed|shorts|live|v)\/([\w-]{11})/i);
  if (pathMatch && pathMatch[1]) {
    return pathMatch[1];
  }

  // Handle ?v=ID or &v=ID (including music.youtube.com and m.youtube.com)
  const paramMatch = trimmed.match(/[?&]v=([\w-]{11})/i);
  if (paramMatch && paramMatch[1]) {
    return paramMatch[1];
  }

  return null;
}
