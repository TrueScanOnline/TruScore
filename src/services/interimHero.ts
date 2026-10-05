import AsyncStorage from '@react-native-async-storage/async-storage';

const META_KEY = '@rveel_interim_hero_v1';

type InterimMeta = Record<string, { contributedUrl?: string }>;

async function readMeta(): Promise<InterimMeta> {
  const raw = await AsyncStorage.getItem(META_KEY);
  if (!raw) return {};
  const parsed = JSON.parse(raw) as InterimMeta;
  return parsed && typeof parsed === 'object' ? parsed : {};
}

async function writeMeta(meta: InterimMeta): Promise<void> {
  await AsyncStorage.setItem(META_KEY, JSON.stringify(meta));
}

function interimPath(cacheDirectory: string | null, barcode: string): string {
  return `${cacheDirectory}truescan/${barcode}.interim-hero.jpg`;
}

/** Copy the selected photo into the existing image cache. This is not a product-media repository. */
export async function rememberInterimHero(barcode: string, sourceUri: string): Promise<string | null> {
  const fs = await import('expo-file-system');
  if (!fs.cacheDirectory || !sourceUri) return null;
  const directory = `${fs.cacheDirectory}truescan/`;
  const destination = interimPath(fs.cacheDirectory, barcode);
  await fs.makeDirectoryAsync(directory, { intermediates: true });
  if (sourceUri !== destination) {
    await fs.copyAsync({ from: sourceUri, to: destination });
  }
  return destination;
}

export async function readInterimHero(barcode: string): Promise<string | null> {
  const fs = await import('expo-file-system');
  if (!fs.cacheDirectory) return null;
  const destination = interimPath(fs.cacheDirectory, barcode);
  const info = await fs.getInfoAsync(destination);
  return info.exists ? destination : null;
}

export async function rememberContributedHeroUrl(barcode: string, url: string): Promise<void> {
  const meta = await readMeta();
  meta[barcode] = { ...meta[barcode], contributedUrl: url };
  await writeMeta(meta);
}

export async function readContributedHeroUrl(barcode: string): Promise<string | null> {
  const meta = await readMeta();
  const url = meta[barcode]?.contributedUrl?.trim() || '';
  return url || null;
}
