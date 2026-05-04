// Perceptual Hash (Average Hash) for duplicate photo detection
// Pure client-side, no external dependencies

export interface DuplicateGroup {
  ids: string[];
  hashes: string[];
  distances: number[];
}

/**
 * Compute a 64-bit average hash from a base64 image
 * Steps: resize to 8x8 -> grayscale -> compute mean -> hash bits
 */
export function computeHash(imageBase64: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = 8;
      canvas.height = 8;
      ctx.drawImage(img, 0, 0, 8, 8);

      const data = ctx.getImageData(0, 0, 8, 8).data;
      const grayscale: number[] = [];
      let total = 0;

      for (let i = 0; i < data.length; i += 4) {
        // luminance formula
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        grayscale.push(gray);
        total += gray;
      }

      const mean = total / 64;
      let hash = '';
      for (let i = 0; i < 64; i++) {
        hash += grayscale[i] >= mean ? '1' : '0';
      }
      resolve(hash);
    };
    img.onerror = reject;
    img.src = imageBase64;
  });
}

/**
 * Compute hamming distance between two binary hash strings
 */
export function hammingDistance(a: string, b: string): number {
  let dist = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) dist++;
  }
  return dist;
}

/**
 * Find duplicate/similar photo groups from a list of photos
 * Uses thumbnail for speed, threshold = 8 (very similar), 15 (somewhat similar)
 */
export async function findDuplicates(
  photos: { id: string; thumbnail: string }[],
  threshold = 10
): Promise<DuplicateGroup[]> {
  const hashes: { id: string; hash: string }[] = [];

  // Compute hashes in batches to avoid blocking UI
  const batchSize = 5;
  for (let i = 0; i < photos.length; i += batchSize) {
    const batch = photos.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (p) => ({
        id: p.id,
        hash: await computeHash(p.thumbnail),
      }))
    );
    hashes.push(...results);
    // yield to event loop
    await new Promise((r) => setTimeout(r, 0));
  }

  const groups: DuplicateGroup[] = [];
  const used = new Set<string>();

  for (let i = 0; i < hashes.length; i++) {
    if (used.has(hashes[i].id)) continue;
    const group: DuplicateGroup = {
      ids: [hashes[i].id],
      hashes: [hashes[i].hash],
      distances: [0],
    };

    for (let j = i + 1; j < hashes.length; j++) {
      if (used.has(hashes[j].id)) continue;
      const dist = hammingDistance(hashes[i].hash, hashes[j].hash);
      if (dist <= threshold) {
        group.ids.push(hashes[j].id);
        group.hashes.push(hashes[j].hash);
        group.distances.push(dist);
        used.add(hashes[j].id);
      }
    }

    if (group.ids.length > 1) {
      groups.push(group);
    }
  }

  return groups;
}
