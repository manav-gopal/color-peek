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

// K-means clustering algorithm for color clustering
const kMeansClustering = (colors: number[][], k: number) => {
  // Helper functions for K-means
  const getRandomCentroids = (colors: number[][], k: number) => {
    const centroids = [];
    for (let i = 0; i < k; i++) {
      const randomIndex = Math.floor(Math.random() * colors.length);
      centroids.push(colors[randomIndex]!);
    }
    return centroids;
  };

  const calculateDistance = (color1: number[], color2: number[]) => {
    return Math.sqrt(
      Math.pow(color1[0]! - color2[0]!, 2) +
      Math.pow(color1[1]! - color2[1]!, 2) +
      Math.pow(color1[2]! - color2[2]!, 2)
    );
  };

  const calculateMean = (cluster: number[][]) => {
    const mean = cluster.reduce(
      (acc, color) => [acc[0]! + color[0]!, acc[1]! + color[1]!, acc[2]! + color[2]!],
      [0, 0, 0]
    );
    return mean.map(sum => Math.round(sum / cluster.length)) as number[];
  };

  let centroids = getRandomCentroids(colors, k);
  let clusters = Array.from({ length: k }, () => []);
  let change = true;

  while (change) {
    clusters = Array.from({ length: k }, () => []);
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

    const newCentroids = clusters.map(calculateMean);
    change = !centroids.every((centroid, index) =>
      centroid.every((value, i) => value === newCentroids[index]![i])
    );
    centroids = newCentroids;
  }

  return centroids.map((centroid, index) => ({
    colorKey: centroid.join('-'),
    color: centroid,
    count: clusters[index]?.length ?? 0
  }));
};

// Image processing logic using K-means for color extraction
const processImageColors = (
  img: HTMLImageElement,
  canvas: HTMLCanvasElement,
  setColors: React.Dispatch<React.SetStateAction<colors[] | null>>,
  k = 5 // Set number of clusters
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

    const img = imgRef?.current || new Image();
    img.crossOrigin = 'Anonymous';

    if (src) {
      img.src = src;
    }

    const handleImageLoad = () => {
      const canvas = canvasRef.current;
      processImageColors(img, canvas, setColors);
    };

    img.onload = handleImageLoad;

    // Cleanup to prevent memory leaks
    return () => {
      img.onload = null;
    };
  }, [src, imgRef, imgRef?.current]);

  return colors;
};

export default useColorPalette;
