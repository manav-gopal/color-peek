import { renderHook, act, waitFor } from '@testing-library/react';
import { useColorPalette } from '../src/useColorPalette';
import * as getDominanteColor from '../src/getDominanteColor';

jest.mock('../src/getDominanteColor', () => ({
  getColorPalette: jest.fn(),
}));

describe('useColorPalette Hook Wrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default empty state', () => {
    const { result } = renderHook(() => useColorPalette());

    expect(result.current.colors).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should set colors on successful extraction', async () => {
    const mockColors = [{ colorKey: '255-0-0', color: [255, 0, 0], count: 1 }];
    (getDominanteColor.getColorPalette as jest.Mock).mockResolvedValue(
      mockColors
    );

    const { result } = renderHook(() => useColorPalette());

    act(() => {
      result.current.extract({ src: 'test.jpg' });
    });

    // Should immediately set loading to true
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.colors).toEqual(mockColors);
  });

  it('should set error on failed extraction', async () => {
    const errorMessage = 'Simulated Image Load Error';
    (getDominanteColor.getColorPalette as jest.Mock).mockRejectedValue(
      new Error(errorMessage)
    );

    const { result } = renderHook(() => useColorPalette());

    act(() => {
      result.current.extract({ src: 'test.jpg' });
    });

    // Should immediately set loading to true
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.colors).toBeNull();
    expect(result.current.error).toBe(errorMessage);
  });
});
