import { Suspense } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { lazyNamed } from './lazyNamed';

describe('lazyNamed', () => {
  it('lazy-loads a named export', async () => {
    const Hello = () => <p>hello</p>;
    const Lazy = lazyNamed(async () => ({ Hello }), 'Hello');
    render(<Suspense fallback="loading"><Lazy /></Suspense>);
    expect(await screen.findByText('hello')).toBeTruthy();
  });
});
