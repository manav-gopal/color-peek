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

// custom logger for colorful test output
const ANSI = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  CYAN: '\x1b[36m',
  RESET: '\x1b[0m',
};

const testLogger = {
  success: (msg: string) =>
    console.log(`${ANSI.GREEN}✅ [SUCCESS]${ANSI.RESET}: ${msg}`),
  info: (msg: string) =>
    console.log(`${ANSI.CYAN}ℹ️ [INFO]${ANSI.RESET}: ${msg}`),
  warn: (msg: string) =>
    console.log(`\n${ANSI.YELLOW}⚠️ [WARNING]${ANSI.RESET}: ${msg}`),
  error: (msg: string) =>
    console.log(`\n${ANSI.RED}⛔️ [ERROR]${ANSI.RESET}: ${msg}`),
};

// Mock Image using a class to avoid duplicate 'src' properties
class MockImage {
  crossOrigin: string = '';
  onload: (() => void) | null = null;
  private _src: string = '';

  set src(value: string) {
    this._src = value;
    // Simulate image loading asynchronously
    setTimeout(() => {
      testLogger.success(`Mock image successfully loaded -> ${value}`);
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
    // The new deterministic K-Means groups the RGBA array correctly
    // The new kMeans function outputs the actual RGB values as the string key!
    expect(colorsText).toContain('255-128-0');
    expect(colorsText).toContain('0-255-0');
    expect(colorsText).toContain('0-0-255');

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
    const { getByTestId, rerender } = render(<TestComponent />);

    // Simulate the hook's internal new Image() loading by mocking the window fetch or simply invoking the internal onload
    // In getDominanteColor.ts, it reads imgRef?.current?.src, creates a `new Image()`, assigns its src, and waits for its onload to fire.
    // Our MockImage class already simulates `setTimeout(() => this.onload(), 0)` when `src` is set.
    // So we just need to provide a `src` to the imgRef so the hook picks it up during its useEffect render.
    act(() => {
      // Create a valid element with a src
      const mockImgElement = document.createElement('img');
      mockImgElement.src = 'valid-image-src';
      imgRef.current = mockImgElement as HTMLImageElement;
    });

    // We must re-render the component so the `useEffect` fires knowing the imgRef has a valid element now
    rerender(<TestComponent />);

    // Wait for colors to be updated
    await waitFor(() => {
      expect(getByTestId('colors').textContent).not.toBe('Loading');
    });

    // Assertions
    const colorsText = getByTestId('colors').textContent;
    expect(colorsText).toContain('255-0-0'); // Red
    expect(colorsText).toContain('0-255-0'); // Green

    // Clean up mocks
    createElementSpy.mockRestore();
    (global as any).Image = originalImage;
  });

  it('should route image through proxy fallback if CORS error occurs', async () => {
    // Mock the global Image constructor with a slight tweak just for this test
    // We want to physically simulate an onerror rather than an onload initially
    class ErrorImageMock {
      crossOrigin: string = '';
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      private _src: string = '';

      public proxyAttempts = 0;

      set src(value: string) {
        this._src = value;
        // Simulate image loading asynchronously
        setTimeout(() => {
          // If the src is not the proxy yet, simulate a CORS failure
          if (!value.includes('images.weserv.nl')) {
            testLogger.error(
              `Mocking Cross-Origin refusal for original request:\n   -> ${value}`
            );
            if (this.onerror) this.onerror();
          } else {
            // Otherwise, it successfully reached the proxy step, simulate load success!
            testLogger.warn(
              `Intercepted failure and successfully re-routed through proxy:\n   -> ${value}\n`
            );
            this.proxyAttempts++;
            if (this.onload) this.onload();
          }
        }, 0);
      }

      get src() {
        return this._src;
      }
    }

    (global as any).Image = ErrorImageMock;

    // Mock canvas and context
    const getContextMock = jest.fn();
    const canvasMock = {
      getContext: getContextMock,
      width: 0,
      height: 0,
    };

    const createElementSpy = jest
      .spyOn(document, 'createElement')
      .mockImplementation(element => {
        if (element === 'canvas') {
          return (canvasMock as unknown) as HTMLCanvasElement;
        }
        return originalCreateElement.call(document, element);
      });

    const data = new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255]);
    getContextMock.mockReturnValue({
      drawImage: jest.fn(),
      getImageData: jest.fn(() => ({ data })),
    });

    const targetUrl =
      'https://img.freepik.com/free-vector/colourful-abstract-shapes_78370-1451.jpg';

    // Test Component
    const TestComponent = ({ src }: { src: string }) => {
      const colors = useColorPalette({ src });
      return (
        <div data-testid="colors-proxy">{colors ? 'Loaded' : 'Loading'}</div>
      );
    };

    const { getByTestId } = render(<TestComponent src={targetUrl} />);

    // Wait until it loads completely (the proxy retry must succeed)
    await waitFor(() => {
      expect(getByTestId('colors-proxy').textContent).toBe('Loaded');
    });

    // We verify the hook didn't bomb out completely
    expect(getByTestId('colors-proxy').textContent).toBe('Loaded');

    // Clean up mocks
    createElementSpy.mockRestore();
    (global as any).Image = originalImage;
  });
});
