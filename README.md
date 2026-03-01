# Color Peek 🎨

[![Live Demo color-analyzer](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/p/sandbox/color-picker-ts-fyl2dh)

A lightweight, highly accurate custom JavaScript package (`getColorPalette` and `useColorPalette`) for asynchronously extracting the dominant color palette from any image using deterministic K-Means clustering.

Built to be **framework-agnostic**: use `getColorPalette` in Vue, Angular, Node, or Vanilla JS. Or use the built-in React hook `useColorPalette` for seamless state management! Works perfectly with cross-origin images by automatically routing CORS-blocked requests through a secure `images.weserv.nl` proxy fallback.

## Installation

You can install the package via npm or yarn:

```bash
npm install color-peek
# or
yarn add color-peek
```

## Features

- **Blazing Fast**: Uses dynamic image downscaling (100x100 pixels) before extracting data, preventing browser lock-ups even on massive 4K images.
- **Highly Accurate deterministic K-Means**: Implements Max-Min distance initialization instead of raw Math.random(), guaranteeing identical, beautiful color extraction results on every execution for the same image.
- **Cross-Origin Resilient**: Natively attempts to canvas-read standard URLs. If the browser blocks it due to strict CORS (e.g., Unsplash, Freepik), it automatically intercepts the rejection and routes it through a free `images.weserv.nl` CDN proxy to resolve the colors seamlessly without backend configuration.
- **Flexible Inputs**: Pass either a raw image URL string (`src`) or a reference to an existing `<img />` DOM element.

## Usage

### 1. Typical Asynchronous Parsing

Simply call the promise-based function with any image URL.

```ts
import { getColorPalette } from 'color-peek';

const getDashboardColors = async () => {
  try {
    const colors = await getColorPalette({
      src: 'https://images.unsplash.com/photo-1549490349-8643362247b5',
    });

    console.log('Dominant Colors:', colors);
    // colors[0].colorKey -> "255-128-0"
  } catch (error) {
    console.error(error);
  }
};
```

### 2. React Usage with DOM References

If you are already rendering an image on the screen, you can pass a reference to that active element to avoid fetching the URL multiple times over the network!

```tsx
import React, { useRef, useState } from 'react';
import { getColorPalette, Colors } from 'color-peek';

const ImageCard = () => {
  const imageRef = useRef<HTMLImageElement>(null);
  const [palette, setPalette] = useState<Colors[] | null>(null);

  const extractColors = async () => {
    // Pass the actual DOM element reference
    const colors = await getColorPalette({ imgElement: imageRef.current });
    setPalette(colors);
  };

  return (
    <div>
      <img
        ref={imageRef}
        src="https://img.freepik.com/free-vector/demo.jpg"
        onLoad={extractColors} // Extract as soon as it organically loads!
        crossOrigin="Anonymous"
        width="300"
      />

      {palette && (
        <div style={{ display: 'flex', marginTop: '10px' }}>
          {palette.map(c => (
            <div
              key={c.colorKey}
              style={{
                backgroundColor: `rgb(${c.color.join(',')})`,
                flex: 1,
                height: '20px',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
```

### 3. React Hook Usage (`useColorPalette`)

For the best experience in React, you can use the built-in hook which manages loading, extracted colors, and error states internally for you!

```tsx
import React, { useEffect } from 'react';
import { useColorPalette } from 'color-peek';

export const ColorPaletteDemo = ({ src }) => {
  const { colors, loading, error, extract } = useColorPalette();

  useEffect(() => {
    extract({ src });
  }, [src, extract]);

  if (loading) return <p>Loading colors...</p>;
  if (error) return <p>Error loading colors: {error}</p>;
  if (!colors || colors.length === 0) return <p>No colors found.</p>;

  return (
    <div style={{ display: 'flex', gap: '10px' }}>
      {colors.map((c, index) => (
        <div
          key={index}
          style={{
            width: '50px',
            height: '50px',
            backgroundColor: `rgb(${c.color.join(',')})`,
          }}
        />
      ))}
    </div>
  );
};
```

## API

### `getColorPalette(options: ColorPaletteOptions): Promise<Colors[]>`

**Options**
| Property | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `src` | `string` | No* | The URL string of the image you want to extract colors from. |
| `imgElement` | `HTMLImageElement \| null` | No* | An active `<img>` DOM node element. |

_\*You must provide **either** `src` or `imgElement`. Providing both will prioritize `src`._

**Returns**
The function asynchronously returns a `Promise` that resolves to a sorted array of color bucket objects (sorted by pixel density):

```ts
type Colors = {
  colorKey: string; // The raw RGB string e.g "255-0-0"
  color: number[]; // The parsed array e.g [255, 0, 0]
  count: number; // The density/volume of pixels grouped into this cluster
}[];
```
