import React, { useEffect, useRef } from 'react';
import { ColorsType } from '../getDominanteColor';
import { useColorPalette } from '../useColorPalette';

export const ColorPaletteDemo = ({
  src,
  imgRef,
}: {
  src?: string;
  imgRef?: React.RefObject<HTMLImageElement>;
}) => {
  const { colors, loading, error, extract } = useColorPalette();

  useEffect(() => {
    extract({ src, imgElement: imgRef ? imgRef.current : undefined });
  }, [src, imgRef, extract]);

  // Handle loading state
  if (loading) {
    return <p>Loading colors...</p>;
  }

  // Handle error state
  if (error) {
    return <p>Error loading colors: {error}</p>;
  }

  // Handle empty state
  if (!colors || colors.length === 0) {
    return <p>No colors found. Please check the image.</p>;
  }

  return (
    <div>
      <h3>Dominant Colors</h3>
      <div style={{ display: 'flex', gap: '10px' }}>
        {colors.map((colorObj: ColorsType, index: number) => (
          <div key={index} style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '50px',
                height: '50px',
                backgroundColor: `rgb(${colorObj.color.join(',')})`,
                borderRadius: '8px',
                border: '1px solid #ddd',
              }}
              title={colorObj.colorKey} // Tooltip to show the color tuple
            />
            <p style={{ fontSize: '12px', marginTop: '5px' }}>
              {colorObj.colorKey}
            </p>
          </div>
        ))}
      </div>
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
  const defaultSrc1 =
    'https://img.freepik.com/free-vector/colourful-abstract-shapes_78370-1451.jpg';
  return (
    <>
      <img
        src={src || defaultSrc}
        alt="src Url - Not found"
        style={{ maxWidth: '200px', marginTop: '10px' }}
      />
      <ColorPaletteDemo src={src || defaultSrc} />;
      <img
        src={defaultSrc1}
        alt="src Url - Not found"
        style={{ maxWidth: '200px', marginTop: '10px' }}
      />
      <ColorPaletteDemo src={defaultSrc1} />;
    </>
  );
};

const ImageRefDemo = ({ src }: { src: string }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const imgRef1 = useRef<HTMLImageElement>(null);
  const defaultSrc =
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRGMAp-CnWGV9uGpzjnnjN5uPs1QZDa8q1BIQ&s';
  const defaultSrc1 =
    'https://img.freepik.com/free-vector/colourful-abstract-shapes_78370-1451.jpg';
  return (
    <>
      <img
        src={src || defaultSrc}
        alt="Reference Url - Not found"
        ref={imgRef}
        style={{ maxWidth: '100%', marginTop: '10px' }}
      />
      <ColorPaletteDemo imgRef={imgRef} />
      <img
        src={defaultSrc1}
        alt="Reference Url - Not found"
        ref={imgRef1}
        style={{ maxWidth: '100%', marginTop: '10px' }}
      />
      <ColorPaletteDemo imgRef={imgRef1} />
    </>
  );
};

export const ImageReference = (args: { src: string }) => (
  <ImageRefDemo src={args.src} />
);
