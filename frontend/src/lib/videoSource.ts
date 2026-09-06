export type VideoType = 'youtube' | 'vimeo' | 'direct' | 'iframe';

export interface YouTubeIdInfo {
  id: string;
  start?: number;
}

export function parseYouTube(url: string): YouTubeIdInfo | null {
  if (!url) return null;
  const patterns = [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{6,})(?:&.*?t=([0-9]+))?/i,
    /youtu\.be\/([a-zA-Z0-9_-]{6,})(?:[?&]t=([0-9]+))?/i,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})(?:[?&]start=([0-9]+))?/i,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/i,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return { id: m[1], start: m[2] ? parseInt(m[2], 10) : undefined };
  }
  return null;
}

export function parseVimeo(url: string): string | null {
  if (!url) return null;
  const m = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/i);
  return m ? m[1] : null;
}

export function getVideoType(url: string): VideoType {
  if (!url) return 'iframe';
  if (parseYouTube(url)) return 'youtube';
  if (parseVimeo(url)) return 'vimeo';
  if (/\.(mp4|webm|ogg|ogv|m4v|mov)(\?.*)?$/i.test(url)) return 'direct';
  return 'iframe';
}

export function isDirectFile(url: string): boolean {
  return getVideoType(url) === 'direct';
}
