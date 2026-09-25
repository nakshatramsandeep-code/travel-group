/**
 * Fetches a few real photos for a destination from Wikipedia/Wikimedia.
 * No API key needed, and images come from an encyclopedic source rather
 * than an uncurated random-photo feed.
 */

const UA = "trip-planner-app (contact: none)";

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function isUsablePhoto(url: string, mime: string): boolean {
  if (!mime.startsWith("image/") || mime === "image/svg+xml") return false;
  return !/logo|icon|flag|coat_of_arms|symbol|_map\b|-map\.|disambig/i.test(
    url
  );
}

async function fallbackThumbnail(destination: string): Promise<string[]> {
  const data = (await fetchJson(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(destination)}`
  )) as { thumbnail?: { source?: string } } | null;
  const thumb = data?.thumbnail?.source;
  return thumb ? [thumb] : [];
}

export async function getDestinationImages(
  destination: string,
  limit = 3
): Promise<string[]> {
  const searchUrl =
    `https://en.wikipedia.org/w/api.php?action=query&generator=images&titles=` +
    `${encodeURIComponent(destination)}&gimlimit=25&prop=imageinfo` +
    `&iiprop=url|mime&iiurlwidth=400&format=json&origin=*`;

  const data = (await fetchJson(searchUrl)) as {
    query?: {
      pages?: Record<
        string,
        { imageinfo?: { url: string; thumburl?: string; mime: string }[] }
      >;
    };
  } | null;

  const pages = data?.query?.pages;
  if (!pages) return fallbackThumbnail(destination);

  const images: string[] = [];
  for (const page of Object.values(pages)) {
    const info = page.imageinfo?.[0];
    if (!info?.url) continue;
    if (!isUsablePhoto(info.url, info.mime ?? "")) continue;
    images.push(info.thumburl ?? info.url);
    if (images.length >= limit) break;
  }

  if (images.length === 0) return fallbackThumbnail(destination);
  return images;
}
