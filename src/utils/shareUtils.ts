import { WartaItem } from '../types/church';

export interface SharePayload {
  title: string;
  text: string;
  url?: string;
}

export type WebShareOutcome =
  | { status: 'shared' }
  | { status: 'cancelled' }
  | { status: 'fallback' };

export function supportsNativeWebShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

export async function triggerWebShare(payload: SharePayload): Promise<WebShareOutcome> {
  if (!supportsNativeWebShare()) {
    return { status: 'fallback' };
  }

  const shareData: ShareData = {
    title: payload.title,
    text: payload.text,
    url: payload.url || (typeof window !== 'undefined' ? window.location.origin : undefined),
  };

  try {
    if (typeof navigator.canShare === 'function' && !navigator.canShare(shareData)) {
      await navigator.share({
        title: payload.title,
        text: `${payload.text}${shareData.url ? `\n${shareData.url}` : ''}`,
      });
    } else {
      await navigator.share(shareData);
    }
    return { status: 'shared' };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { status: 'cancelled' };
    }
    return { status: 'fallback' };
  }
}

export function buildBibleVerseSharePayload(
  reference: string,
  verseText: string,
  churchName: string
): SharePayload {
  const cleanText = verseText.replace(/^["“]|["”]$/g, '').trim();
  const url = typeof window !== 'undefined' ? window.location.origin : '';
  return {
    title: `${reference} — ${churchName}`,
    text: `📖 ${reference} (Alkitab TB)\n"${cleanText}"\n\n— Portal ${churchName}`,
    url,
  };
}

export function buildWartaSharePayload(warta: WartaItem, churchName: string): SharePayload {
  const url = typeof window !== 'undefined' ? window.location.origin : '';
  const highlights = warta.announcements
    .slice(0, 3)
    .map((ann, idx) => `${idx + 1}. ${ann}`)
    .join('\n');

  const lines = [
    `📢 WARTA JEMAAT ${churchName}`,
    `${warta.edition} · ${warta.date}`,
    `${warta.title}`,
    '',
    warta.summary,
  ];

  if (highlights) {
    lines.push('', 'Pokok Pengumuman:', highlights);
  }

  return {
    title: `${warta.title} (${warta.edition}) — ${churchName}`,
    text: lines.join('\n'),
    url,
  };
}
