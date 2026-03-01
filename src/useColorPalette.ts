import { useState, useCallback } from 'react';
import {
  getColorPalette,
  ColorsType,
  ColorPaletteOptionsType,
} from './getDominanteColor';

export const useColorPalette = () => {
  const [colors, setColors] = useState<ColorsType[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extract = useCallback(async (options: ColorPaletteOptionsType) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getColorPalette(options);
      setColors(data);
    } catch (err) {
      setError((err as Error).message || 'Failed to extract colors');
    } finally {
      setLoading(false);
    }
  }, []);

  return { colors, loading, error, extract };
};
