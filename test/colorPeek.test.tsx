// useColorPalette.test.tsx
import React from 'react';
import { render, waitFor, act } from '@testing-library/react';
import useColorPalette from '../src/getDominanteColor'; // Adjust the import path as necessary
import 'jest-canvas-mock';

// Define the Colors interface if not exported from the hook
interface Colors {
  colorKey: string;
  color: number[];
  count: number;
}

// Mock Image using a class to avoid duplicate 'src' properties
class MockImage {
  crossOrigin: string = '';
  onload: (() => void) | null = null;
  private _src: string = '';

  set src(value: string) {
    this._src = value;
    // Simulate image loading asynchronously
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 0);
  }

  get src() {
    return this._src;
  }
}

describe('useColorPalette Hook', () => {
  let originalCreateElement: typeof document.createElement;
  let originalImage: typeof global.Image;

  beforeAll(() => {
    // Store the original createElement and Image constructors
    originalCreateElement = document.createElement;
    originalImage = (global as any).Image;
  });

  afterAll(() => {
    // Restore the original createElement and Image constructors
    document.createElement = originalCreateElement;
    (global as any).Image = originalImage;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return colors when provided with a valid image src', async () => {
    // Mock the global Image constructor
    (global as any).Image = MockImage;

    // Mock canvas and context
    const getContextMock = jest.fn();
    const canvasMock = {
      getContext: getContextMock,
      width: 0,
      height: 0,
    };

    // Spy on document.createElement and provide mock for 'canvas'
    const createElementSpy = jest
      .spyOn(document, 'createElement')
      .mockImplementation(element => {
        if (element === 'canvas') {
          return (canvasMock as unknown) as HTMLCanvasElement;
        }
        return originalCreateElement.call(document, element); // Call the original method to avoid recursion
      });

    // Generate sufficient pixel data
    const redPixel = [255, 0, 0, 255];
    const greenPixel = [0, 255, 0, 255];
    const bluePixel = [0, 0, 255, 255];
    const yellowPixel = [255, 255, 0, 255];

    const pixels: Array<number> = [];

    for (let i = 0; i < 40; i++) {
      pixels.push(...redPixel);
    }
    for (let i = 0; i < 40; i++) {
      pixels.push(...greenPixel);
    }
    for (let i = 0; i < 40; i++) {
      pixels.push(...bluePixel);
    }
    for (let i = 0; i < 40; i++) {
      pixels.push(...yellowPixel);
    }

    const data = new Uint8ClampedArray(pixels);

    // Mock the canvas context methods
    const drawImageMock = jest.fn();
    const getImageDataMock = jest.fn(() => ({
      data,
    }));
    getContextMock.mockReturnValue({
      drawImage: drawImageMock,
      getImageData: getImageDataMock,
    });

    // Test Component
    const TestComponent = ({ src }: { src: string }) => {
      const colors = useColorPalette({ src });
      return (
        <div data-testid="colors">
          {colors
            ? colors.map((colorObj: Colors) => colorObj.colorKey).join(',')
            : 'Loading'}
        </div>
      );
    };

    // Render the component with a valid image source
    const { getByTestId } = render(<TestComponent src="valid-image-src" />);

    // Wait for colors to be updated
    await waitFor(() => {
      expect(getByTestId('colors').textContent).not.toBe('Loading');
    });

    // Assertions
    const colorsText = getByTestId('colors').textContent;
    expect(colorsText).toContain('13-0-0'); // Example: Red
    expect(colorsText).toContain('0-13-0'); // Example: Green
    expect(colorsText).toContain('0-0-13'); // Example: Blue
    expect(colorsText).toContain('13-13-0'); // Example: Yellow

    // Clean up mocks
    createElementSpy.mockRestore();
    (global as any).Image = originalImage;
  });

  it('should log an error and set colors to null when no src or imgRef is provided', () => {
    // Spy on console.error
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    // Test Component
    const TestComponent = () => {
      const colors = useColorPalette({});
      return (
        <div data-testid="colors">{colors === null ? 'null' : 'not null'}</div>
      );
    };

    // Render the component without src or imgRef
    const { getByTestId } = render(<TestComponent />);

    // Assertions
    expect(getByTestId('colors').textContent).toBe('null');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Please provide either a source URL or an image reference'
    );

    // Clean up mocks
    consoleErrorSpy.mockRestore();
  });

  it('should return colors when provided with an imgRef', async () => {
    // Mock the global Image constructor
    (global as any).Image = MockImage;

    // Mock canvas and context
    const getContextMock = jest.fn();
    const canvasMock = {
      getContext: getContextMock,
      width: 0,
      height: 0,
    };

    // Spy on document.createElement and provide mock for 'canvas'
    const createElementSpy = jest
      .spyOn(document, 'createElement')
      .mockImplementation(element => {
        if (element === 'canvas') {
          return (canvasMock as unknown) as HTMLCanvasElement;
        }
        return originalCreateElement.call(document, element); // Call the original method to avoid recursion
      });

    // Use the same pixel data as before
    const redPixel = [255, 0, 0, 255];
    const greenPixel = [0, 255, 0, 255];
    const pixels: Array<number> = [];

    for (let i = 0; i < 40; i++) {
      pixels.push(...redPixel);
    }
    for (let i = 0; i < 40; i++) {
      pixels.push(...greenPixel);
    }

    const data = new Uint8ClampedArray(pixels);

    // Mock the canvas context methods
    const drawImageMock = jest.fn();
    const getImageDataMock = jest.fn(() => ({
      data,
    }));
    getContextMock.mockReturnValue({
      drawImage: drawImageMock,
      getImageData: getImageDataMock,
    });

    // Create a mock imgRef as MutableRefObject
    const imgRef: React.MutableRefObject<HTMLImageElement> = {
      current: (new MockImage() as unknown) as HTMLImageElement,
    };

    // Test Component
    const TestComponent = () => {
      const colors = useColorPalette({ imgRef });
      return (
        <div data-testid="colors">
          {colors
            ? colors.map((colorObj: Colors) => colorObj.colorKey).join(',')
            : 'Loading'}
        </div>
      );
    };

    // Render the component with imgRef
    const { getByTestId } = render(<TestComponent />);

    // Simulate image load by setting src which triggers onload
    act(() => {
      if (imgRef.current) {
        imgRef.current.src = 'valid-image-src';
      }
    });

    // Wait for colors to be updated
    await waitFor(() => {
      expect(getByTestId('colors').textContent).not.toBe('Loading');
    });

    // Assertions
    const colorsText = getByTestId('colors').textContent;
    expect(colorsText).toContain('13-0-0'); // Example: Red
    expect(colorsText).toContain('0-13-0'); // Example: Green

    // Clean up mocks
    createElementSpy.mockRestore();
    (global as any).Image = originalImage;
  });
});
