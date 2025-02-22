import { test, expect, beforeAll } from 'vitest';
import { http, passthrough } from 'msw';
import { setupServer } from 'msw/node';
import { MockServerRequest, tryMock } from '../../src';

let inboundHeaders: Record<string, string> = {};

beforeAll(() => {
  setupMswHandler(() => inboundHeaders);
});

test('mock response', async () => {
  const msr = new MockServerRequest();
  msr.onChange = (headers) => (inboundHeaders = headers);

  await msr.addMock('https://jsonplaceholder.typicode.com/users', {
    body: JSON.stringify([{ id: 1, name: 'John Smith' }]),
  });

  const res = await fetch('https://jsonplaceholder.typicode.com/users').then((r) => r.json());
  expect(res[0]).toEqual({ id: 1, name: 'John Smith' });
});

test('patch response', async () => {
  const msr = new MockServerRequest();
  msr.onChange = (headers) => (inboundHeaders = headers);

  await msr.addMock('https://jsonplaceholder.typicode.com/users', {
    bodyPatch: {
      '[0].name': 'John Smith',
    },
  });

  const res = await fetch('https://jsonplaceholder.typicode.com/users').then((r) => r.json());
  expect(res[0].name).toEqual('John Smith');
});

function setupMswHandler(getHeaders: () => Record<string, string>) {
  const server = setupServer(
    http.get('*', async ({ request }) => {
      const inboundHeaders = getHeaders();
      const mockedResponse = await tryMock(request, inboundHeaders);
      return mockedResponse || passthrough();
    }),
  );
  server.listen();
}
