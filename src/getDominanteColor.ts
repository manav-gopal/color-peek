import { useEffect, useRef, useState } from 'react';

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
      height *= maxWidth / width;
      width = maxWidth;
    }
  } else {
    if (height > maxHeight) {
      width *= maxHeight / height;
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
    colors.forEach(color => {
      let minDistance = Infinity;
      let closestCentroid = 0;
      centroids.forEach((centroid, index) => {
        const distance = calculateDistance(color, centroid);
        if (distance < minDistance) {
          minDistance = distance;
          closestCentroid = index;
        }
      });
      clusters[closestCentroid]!.push(color);
    });

    // Calculate new centroids
    const newCentroids = clusters.map((cluster, index) => {
      if (cluster.length === 0) return centroids[index]!;
      return calculateMean(cluster);
    });
    
    // Check for convergence
    change = !centroids.every((centroid, index) =>
      centroid.every((value, i) => value === newCentroids[index]![i])
    );
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

// Image processing logic using K-means for color extraction
const processImageColors = (
  img: HTMLImageElement,
  canvas: HTMLCanvasElement,
  setColors: React.Dispatch<React.SetStateAction<colors[] | null>>,
  k = 3 // Set number of clusters
) => {
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
  setColors(clusteredColors.sort((a, b) => b.count - a.count));
};

// The main hook to extract colors using K-means clustering
interface colors {
  colorKey: string;
  color: number[];
  count: number;
}

const useColorPalette = ({
  src = undefined,
  imgRef = undefined,
}: {
  src?: string;
  imgRef?: React.RefObject<HTMLImageElement>;
}) => {
  const [colors, setColors] = useState<colors[] | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));

  useEffect(() => {
    if (!src && !imgRef) {
      console.error('Please provide either a source URL or an image reference');
      return;
    }

    const imageSrc = src || imgRef?.current?.src;
    if (!imageSrc) return;

    let isProxyTried = false;
    let objectUrl: string | null = null;
    const img = new Image();
    img.crossOrigin = 'Anonymous';

    const handleImageLoad = () => {
      const canvas = canvasRef.current;
      processImageColors(img, canvas, setColors);
    };

    const handleImageError = () => {
      // Browsers physically block JavaScript from reading pixels of cross-origin images 
      // without CORS headers (like Freepik) for security. We cannot bypass this natively.
      // As a free, unlimited workaround, we route the image through a public image 
      // processing CDN (images.weserv.nl) which attaches valid CORS headers for our canvas.
      if (!isProxyTried && imageSrc.startsWith('http')) {
        isProxyTried = true;
        img.src = `https://images.weserv.nl/?url=${encodeURIComponent(imageSrc)}`;
      } else {
        console.error('Failed to load image for color extraction across origins');
        setColors([]);
      }
    };

    img.onload = handleImageLoad;
    img.onerror = handleImageError;
    img.src = imageSrc;

    // Cleanup to prevent memory leaks and clear object URL
    return () => {
      img.onload = null;
      img.onerror = null;
      if (objectUrl) {
          URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src, imgRef, imgRef?.current]);

  return colors;
};

export default useColorPalette;
