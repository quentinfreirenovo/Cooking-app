/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

declare const global: any;
global.jest = global.jest || {};

global.fetch = jest.fn(async (input: RequestInfo) => {
  const url = typeof input === 'string' ? input : input.url;

  return {
    ok: true,
    json: async () => {
      if (url.endsWith('/recipes')) {
        return [];
      }
      if (url.endsWith('/selections')) {
        return [];
      }
      if (url.endsWith('/shoppinglist')) {
        return [];
      }
      return [];
    },
  };
});

import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
