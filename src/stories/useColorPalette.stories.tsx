import React, { useRef } from 'react';
import useColorPalette from '../getDominanteColor'; // Adjust the import path as necessary

export const ColorPaletteDemo = ({
  src,
  imgRef,
}: {
  src?: string;
  imgRef?: React.RefObject<HTMLImageElement>;
}) => {
  const start = performance.now();
  const colors = useColorPalette({
    src: src,
    imgRef: imgRef as React.RefObject<HTMLImageElement> | undefined,
  });
  const end = performance.now();
  console.log(`Time taken to get the color : ${(end - start).toFixed(2)} ms`);

  // Handle loading state
  if (colors === null) {
    return <p>Loading colors...</p>; // Show loading message while colors are being fetched
  }

  // Handle error state
  if (colors === undefined) {
    return <p>Error loading colors. Please check the image URL.</p>; // Error message
  }

  return (
    <div>
      {colors.length > 0 ? ( // Check if colors is not empty
        colors.map((colorObj, index) => (
          <div
            key={index}
            style={{
              backgroundColor: `rgb(${colorObj.color.join(',')})`,
              padding: '10px',
              margin: '5px',
            }}
          >
            {colorObj.colorKey} - Count: {colorObj.count}
          </div>
        ))
      ) : (
        <p>No colors found. Please check the image.</p> // Message for no colors
      )}
    </div>
  );
};

export default {
  title: 'Hooks/useColorPalette',
  component: ColorPaletteDemo,
  argTypes: {
    src: {
      control: {
        type: 'text', // Control type can be 'text', 'select', etc.
      },
      description: 'Enter the URL of the image to analyze for colors', // Optional: Add a description for clarity
    },
  },
};

export const ImageSrcDemo = ({ src }: { src?: string }) => {
  const defaultSrc =
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRmBWwjYER0gb_NLlL2GJrdd1uFyPs3aZWh2A&s';
  return (
    <>
      <img
        src={src || defaultSrc}
        alt="src Url - Not found"
        style={{ maxWidth: '100%', marginTop: '10px' }}
      />
      <ColorPaletteDemo src={src || defaultSrc} />;
    </>
  );
};

const ImageRefDemo = ({ src }: { src: string }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const defaultSrc =
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRGMAp-CnWGV9uGpzjnnjN5uPs1QZDa8q1BIQ&s';
  return (
    <>
      <img
        src={src || defaultSrc}
        alt="Reference Url - Not found"
        ref={imgRef}
        style={{ maxWidth: '100%', marginTop: '10px' }}
      />
      <ColorPaletteDemo imgRef={imgRef} />
    </>
  );
};

export const ImageReference = (args: { src: string }) => (
  <ImageRefDemo src={args.src} />
);
