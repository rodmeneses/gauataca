import { afterEach, describe, expect, it, vi } from 'vitest';
import { compressImage, preparePhoto, storageRef, thumbPath, thumbUrl, THUMB_DIM } from './image';

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

describe('preparePhoto', () => {
  it('returns a full image and a smaller thumbnail', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 3200, height: 1600 }));
    const { canvas } = stubCanvas();
    const out = await preparePhoto(file);
    expect(out.full).toBeInstanceOf(Blob);
    expect(out.thumb).toBeInstanceOf(Blob);
    expect([canvas.width, canvas.height]).toEqual([THUMB_DIM, THUMB_DIM / 2]);
  });

  it('uploads the original, without a thumbnail, when compression fails', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 10, height: 10 }));
    stubCanvas({ blob: null });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await preparePhoto(file)).toEqual({ full: file, thumb: null });
  });

  it('keeps the full image when only the thumbnail fails', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValueOnce({ width: 10, height: 10 }).mockRejectedValueOnce(new Error('x')));
    vi.stubGlobal('Image', class { set src(_: string) { throw new Error('no image'); } });
    stubCanvas();
    const out = await preparePhoto(file);
    expect(out.full).toBeInstanceOf(Blob);
    expect(out.thumb).toBeNull();
  });
});

describe('photo URLs', () => {
  const full = 'https://x.supabase.co/storage/v1/object/public/event-photos/abc-123.jpg';
  it('derives the thumbnail path and URL', () => {
    expect(thumbPath('abc.jpg')).toBe('abc_t.jpg');
    expect(thumbUrl(full)).toBe('https://x.supabase.co/storage/v1/object/public/event-photos/abc-123_t.jpg');
  });
  it('leaves external links and existing thumbnails alone', () => {
    expect(thumbUrl('https://example.com/pic.jpg')).toBe('https://example.com/pic.jpg');
    const t = full.replace('.jpg', '_t.jpg');
    expect(thumbUrl(t)).toBe(t);
  });
  it('parses bucket and path from a storage URL', () => {
    expect(storageRef(full)).toEqual({ bucket: 'event-photos', path: 'abc-123.jpg' });
    expect(storageRef('https://example.com/a.jpg')).toBeNull();
  });
});
