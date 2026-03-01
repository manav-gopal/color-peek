// Helper function to resize the image and draw on canvas
const resizeImage = (
  img: HTMLImageElement,
  canvas: HTMLCanvasElement,
  maxWidth: number,
  maxHeight: number
) => {
  const ctx = canvas.getContext('2d');
  let { width, height } = img;

  if (width > height) {
    if (width > maxWidth) {
      height *= Math.round(maxWidth / width);
      // fallback in case of rounding zeroes
      if (height === 0) height = 1;
      width = maxWidth;
    }
  } else {
    if (height > maxHeight) {
      width *= Math.round(maxHeight / height);
      if (width === 0) width = 1;
      height = maxHeight;
    }
  }

  canvas.width = width;
  canvas.height = height;
  ctx?.drawImage(img, 0, 0, width, height);
};

// Helper functions for K-means
const calculateDistance = (color1: number[], color2: number[]) => {
  return Math.sqrt(
    Math.pow(color1[0]! - color2[0]!, 2) +
      Math.pow(color1[1]! - color2[1]!, 2) +
      Math.pow(color1[2]! - color2[2]!, 2)
  );
};

const calculateMean = (cluster: number[][]) => {
  const mean = cluster.reduce(
    (acc, color) => [
      acc[0]! + color[0]!,
      acc[1]! + color[1]!,
      acc[2]! + color[2]!,
    ],
    [0, 0, 0]
  );
  return mean.map(sum => Math.round(sum / cluster.length)) as number[];
};

// Deterministic centroid initialization (Maxmin distance approach for consistent results)
const getDeterministicCentroids = (colors: number[][], k: number) => {
  const centroids: number[][] = [];
  if (colors.length === 0) return centroids;

  // 1. Pick the first sampled color as the first centroid
  centroids.push(colors[0]!);

  // 2. Pick the remaining k-1 centroids by maximizing the minimum distance to existing centroids
  for (let i = 1; i < k; i++) {
    let maxDist = -1;
    let bestColor = colors[0]!;

    for (const color of colors) {
      let minDist = Infinity;
      for (const centroid of centroids) {
        const dist = calculateDistance(color, centroid);
        if (dist < minDist) minDist = dist;
      }
      if (minDist > maxDist) {
        maxDist = minDist;
        bestColor = color;
      }
    }
    centroids.push(bestColor);
  }

  return centroids;
};

// K-means clustering algorithm for color clustering
const kMeansClustering = (colors: number[][], k: number) => {
  let centroids = getDeterministicCentroids(colors, k);
  let clusters: number[][][] = Array.from({ length: k }, () => []);
  let change = true;
  let iterations = 0;
  const maxIterations = 20;

  while (change && iterations < maxIterations) {
    clusters = Array.from({ length: k }, () => []);

    // Assign colors to the closest centroid
    for (let c = 0; c < colors.length; c++) {
      const color = colors[c]!;
      let minDistance = Infinity;
      let closestCentroid = 0;
      for (let i = 0; i < centroids.length; i++) {
        const distance = calculateDistance(color, centroids[i]!);
        if (distance < minDistance) {
          minDistance = distance;
          closestCentroid = i;
        }
      }
      clusters[closestCentroid]!.push(color);
    }

    // Calculate new centroids
    const newCentroids: number[][] = [];
    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i]!;
      if (cluster.length === 0) {
        newCentroids.push(centroids[i]!);
      } else {
        newCentroids.push(calculateMean(cluster));
      }
    }

    // Check for convergence
    change = false;
    for (let i = 0; i < centroids.length; i++) {
      const centroid = centroids[i]!;
      const newCentroid = newCentroids[i]!;
      for (let j = 0; j < centroid.length; j++) {
        if (centroid[j] !== newCentroid[j]) {
          change = true;
          break;
        }
      }
      if (change) break;
    }
    centroids = newCentroids;
    iterations++;
  }

  // Map to the required output format
  return centroids.map((centroid, index) => ({
    colorKey: centroid.join('-'),
    color: centroid,
    count: clusters[index]?.length ?? 0,
  }));
};

// Internal synchronous logic using K-means for color extraction off a loaded image buffer
const extractColorsFromImage = (
  img: HTMLImageElement,
  k = 3 // Set number of clusters
): ColorsType[] => {
  const canvas = document.createElement('canvas');
  resizeImage(img, canvas, 100, 100); // Resize image to fit into 100x100

  const ctx = canvas.getContext('2d');
  const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData?.data;
  const colors: number[][] = [];
  const step = 10; // Sample every 10th pixel for performance

  if (data) {
    for (let i = 0; i < data.length; i += 4 * step) {
      colors.push([data[i]!, data[i + 1]!, data[i + 2]!]);
    }
  }

  const clusteredColors = kMeansClustering(colors, k);
  return clusteredColors.sort((a, b) => b.count - a.count);
};

export interface ColorsType {
  colorKey: string;
  color: number[];
  count: number;
}

export interface ColorPaletteOptionsType {
  src?: string;
  imgElement?: HTMLImageElement | null;
}

/**
 * Extracts a dominant color palette from an image using deterministic K-Means clustering.
 *
 * @param options Object containing either an image `src` URL to fetch, or an active `imgElement` DOM node.
 * @returns A Promise resolving to an array of Colors containing RGB arrays and bucket densities.
 */
export const getColorPalette = async (
  options: ColorPaletteOptionsType
): Promise<ColorsType[]> => {
  const { src, imgElement } = options;

  if (!src && !imgElement) {
    return Promise.reject(
      new Error(
        'Please provide either a source URL or an image element reference.'
      )
    );
  }

  const targetSrc = src || imgElement?.src;

  if (!targetSrc) {
    return Promise.reject(new Error('No valid image src found.'));
  }

  return new Promise((resolve, reject) => {
    let isProxyTried = false;
    let objectUrl: string | null = null;

    const img = new Image();
    img.crossOrigin = 'Anonymous';

    const handleSuccessCleanup = () => {
      img.onload = null;
      img.onerror = null;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };

    img.onload = () => {
      try {
        const colors = extractColorsFromImage(img);
        handleSuccessCleanup();
        resolve(colors);
      } catch (err) {
        handleSuccessCleanup();
        reject(err);
      }
    };

    img.onerror = () => {
      // Browsers physically block JavaScript from reading pixels of cross-origin images
      // without CORS headers (like Freepik) for security. We cannot bypass this natively.
      // As a free, unlimited workaround, we route the image through a public image CDN proxy (images.weserv.nl).
      if (!isProxyTried && targetSrc.startsWith('http')) {
        isProxyTried = true;
        img.src = `https://images.weserv.nl/?url=${encodeURIComponent(
          targetSrc
        )}`;
      } else {
        handleSuccessCleanup();
        reject(
          new Error(
            `Failed to load image for color extraction from source: ${targetSrc}`
          )
        );
      }
    };

    img.src = targetSrc;
  });
};
