// colorPeek.test.ts
import { getColorPalette, Colors } from '../src/getDominanteColor'; // Adjust the import path as necessary
import 'jest-canvas-mock';

// Define the Colors interface if not exported from the hook (Removed: imported from src)

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

    const pixels: Array<number> = [];

    for (let i = 0; i < 40; i++) pixels.push(...redPixel);
    for (let i = 0; i < 40; i++) pixels.push(...greenPixel);
    for (let i = 0; i < 40; i++) pixels.push(...bluePixel);

    const data = new Uint8ClampedArray(pixels);

    // Mock the canvas context methods
    getContextMock.mockReturnValue({
      drawImage: jest.fn(),
      getImageData: jest.fn(() => ({ data })),
    });

    // Directly invoke the asynchronous JavaScript utility
    const colors = await getColorPalette({ src: 'valid-image-src' });

    // Assertions
    const extractedKeys = colors.map((c: Colors) => c.colorKey);
    expect(extractedKeys).toContain('255-0-0');
    expect(extractedKeys).toContain('0-255-0');
    expect(extractedKeys).toContain('0-0-255');

    // Clean up mocks
    createElementSpy.mockRestore();
    (global as any).Image = originalImage;
  });

  it('should reject with an error when no src or imgElement is provided', async () => {
    await expect(getColorPalette({})).rejects.toThrow(
      'Please provide either a source URL or an image element reference.'
    );
  });

  it('should return colors when provided with an existing imgElement', async () => {
    // Mock the global Image constructor
    (global as any).Image = MockImage;

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

    // Use pixel data
    const redPixel = [255, 0, 0, 255];
    const greenPixel = [0, 255, 0, 255];
    const pixels: Array<number> = [];

    for (let i = 0; i < 40; i++) pixels.push(...redPixel);
    for (let i = 0; i < 40; i++) pixels.push(...greenPixel);

    const data = new Uint8ClampedArray(pixels);

    getContextMock.mockReturnValue({
      drawImage: jest.fn(),
      getImageData: jest.fn(() => ({ data })),
    });

    // Create a generic HTMLImageElement mock
    const mockImgElement = document.createElement('img');
    mockImgElement.src = 'valid-image-src';

    // Directly invoke the Promise-based utility
    const colors = await getColorPalette({ imgElement: mockImgElement });

    // Assertions
    const extractedKeys = colors.map((c: Colors) => c.colorKey);
    expect(extractedKeys).toContain('255-0-0');
    expect(extractedKeys).toContain('0-255-0');

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

    // Wait until it loads completely (the proxy retry must succeed)
    // We can just await the getColorPalette promise!
    const colors = await getColorPalette({ src: targetUrl });

    // Assertions
    expect(colors).not.toBeNull();
    expect(colors.length).toBeGreaterThan(0);

    // Clean up mocks
    createElementSpy.mockRestore();
    (global as any).Image = originalImage;
  });
});
