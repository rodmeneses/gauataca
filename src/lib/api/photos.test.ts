import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = vi.hoisted(() => ({
  upload: vi.fn(),
  remove: vi.fn(),
  getPublicUrl: vi.fn(),
  bucket: '',
}));
vi.mock('../supabase', () => ({
  supabase: { storage: { from: (b: string) => { storage.bucket = b; return storage; } } },
}));

import { removePhotos, uploadPhoto } from './photos';

const base = 'https://x.supabase.co/storage/v1/object/public';

beforeEach(() => {
  storage.upload.mockReset().mockResolvedValue({ error: null });
  storage.remove.mockReset().mockResolvedValue({ error: null });
  storage.getPublicUrl.mockReset().mockImplementation((p: string) => ({ data: { publicUrl: `${base}/b/${p}` } }));
});

describe('uploadPhoto', () => {
  it('uploads the image and its thumbnail with a long cache lifetime', async () => {
    const url = await uploadPhoto('event-photos', new Blob(['a']), new Blob(['t']));
    expect(url).toMatch(/\.jpg$/);
    expect(storage.upload).toHaveBeenCalledTimes(2);
    const [full, thumb] = storage.upload.mock.calls;
    expect(thumb[0]).toBe(full[0].replace('.jpg', '_t.jpg'));
    expect(full[2]).toMatchObject({ cacheControl: '31536000', upsert: false });
  });
  it('skips the thumbnail when there is none', async () => {
    await uploadPhoto('forum-photos', new Blob(['a']));
    expect(storage.upload).toHaveBeenCalledOnce();
  });
  it('throws when the full image fails to upload (and never uploads a thumb)', async () => {
    storage.upload.mockResolvedValueOnce({ error: new Error('quota') });
    await expect(uploadPhoto('forum-photos', new Blob(['a']), new Blob(['t']))).rejects.toThrow('quota');
    expect(storage.upload).toHaveBeenCalledOnce();
  });
});

describe('removePhotos', () => {
  it('removes each photo and its thumbnail, ignoring foreign URLs and other buckets', async () => {
    await removePhotos('event-photos', [`${base}/event-photos/a.jpg`, `${base}/forum-photos/b.jpg`, 'https://example.com/c.jpg']);
    expect(storage.remove).toHaveBeenCalledWith(['a.jpg', 'a_t.jpg']);
  });
  it('does nothing when no URL is ours', async () => {
    await removePhotos('event-photos', ['https://example.com/c.jpg']);
    expect(storage.remove).not.toHaveBeenCalled();
  });
});
