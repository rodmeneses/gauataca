import { afterEach, describe, expect, it, vi } from 'vitest';
import { compressImage } from './image';

const file = new File(['x'], 'p.jpg', { type: 'image/jpeg' });

function stubCanvas(opts: { ctx?: boolean; blob?: Blob | null } = {}) {
  const ctx = { drawImage: vi.fn() };
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => (opts.ctx === false ? null : ctx),
    toBlob: (cb: (b: Blob | null) => void) => cb(opts.blob === undefined ? new Blob(['j']) : opts.blob),
  };
  vi.spyOn(document, 'createElement').mockReturnValue(canvas as unknown as HTMLElement);
  return { canvas, ctx };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('compressImage', () => {
  it('downscales the longest side to maxDim and closes the bitmap', async () => {
    const close = vi.fn();
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 3200, height: 1600, close }));
    const { canvas, ctx } = stubCanvas();
    const blob = await compressImage(file, 1600);
    expect(blob).toBeInstanceOf(Blob);
    expect([canvas.width, canvas.height]).toEqual([1600, 800]);
    expect(ctx.drawImage).toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
  });

  it('never upscales small images', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 100, height: 50 }));
    const { canvas } = stubCanvas();
    await compressImage(file);
    expect([canvas.width, canvas.height]).toEqual([100, 50]);
  });

  it('throws when there is no 2d context', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 10, height: 10 }));
    stubCanvas({ ctx: false });
    await expect(compressImage(file)).rejects.toThrow('canvas 2d context unavailable');
  });

  it('throws when encoding yields no blob', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 10, height: 10 }));
    stubCanvas({ blob: null });
    await expect(compressImage(file)).rejects.toThrow('image encode failed');
  });

  describe('<img> fallback', () => {
    function stubImage(ok: boolean) {
      class FakeImage {
        naturalWidth = 40;
        naturalHeight = 20;
        decoding = '';
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(_: string) { queueMicrotask(() => (ok ? this.onload?.() : this.onerror?.())); }
      }
      vi.stubGlobal('Image', FakeImage);
      URL.createObjectURL = vi.fn(() => 'blob:x');
      URL.revokeObjectURL = vi.fn();
    }

    it('is used when createImageBitmap is missing', async () => {
      vi.stubGlobal('createImageBitmap', undefined);
      stubImage(true);
      const { canvas } = stubCanvas();
      await compressImage(file);
      expect([canvas.width, canvas.height]).toEqual([40, 20]);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:x');
    });

    it('is used when createImageBitmap rejects', async () => {
      vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('nope')));
      stubImage(true);
      stubCanvas();
      await expect(compressImage(file)).resolves.toBeInstanceOf(Blob);
    });

    it('rejects when the image fails to load', async () => {
      vi.stubGlobal('createImageBitmap', undefined);
      stubImage(false);
      await expect(compressImage(file)).rejects.toThrow('image load failed');
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });
  });
});
