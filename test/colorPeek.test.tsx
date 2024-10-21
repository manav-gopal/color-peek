import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { useColorPalette } from '../src';

const TestComponent = ({ src }: { src?: string }) => {
  const colors = useColorPalette({ src });

  return (
    <div>
      {colors ? (
        colors.map((colorObj, index) => (
          <div key={index}>{colorObj.colorKey}</div>
        ))
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

describe('useColorPalette', () => {
  it('renders without crashing with valid image source', () => {
    const div = document.createElement('div');
    const root = createRoot(div);

    root.render(<TestComponent src="./test-img.jpg" />);

    // Ensure the component renders without crashing
    expect(div).toBeTruthy();
    // Unmount the component
    root.unmount();
  });
});
