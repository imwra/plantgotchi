import '../src/styles/global.css';
import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'plantgotchi',
      values: [
        { name: 'plantgotchi', value: '#f0ead6' },
        { name: 'white', value: '#ffffff' },
      ],
    },
    viewport: {
      viewports: {
        mobile: { name: 'Mobile', styles: { width: '375px', height: '812px' } },
        tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' } },
        desktop: { name: 'Desktop', styles: { width: '1024px', height: '768px' } },
      },
    },
  },
};

export default preview;
