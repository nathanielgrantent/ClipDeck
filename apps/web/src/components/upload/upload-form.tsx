'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { GameTagPicker } from '@/components/post/game-tag-picker';
import { useCommunities, useMe } from '@/hooks';
import { uploadWithProgress } from '@/lib/client';
import { cn } from '@/lib/utils';
import { formatBytes } from '@gamingclips/shared';
import { useToast } from '@/components/ui/toast';
import { MAX_UPLOAD_BYTES, MAX_POST_TITLE_LENGTH } from '@gamingclips/shared';
import type { Game, UploadSession } from '@gamingclips/shared';

const ALLOWED_VIDEO_TYPES = ['video/mp4'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export function UploadForm() {
  const router = useRouter();
  const { communities } = useCommunities();
  const { me } = useMe();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [communitySlug, setCommunitySlug] = useState('');
  const [games, setGames] = useState<Game[]>([]);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const storageUsed = me?.storageUsedBytes ?? 0;
  const storageQuota = me?.storageQuotaBytes ?? 500 * 1024 * 1024;

  const isVideo = file?.type.startsWith('video/');
  const isImage = file?.type.startsWith('image/');
  const isValidType = isVideo || isImage;
  const isOverSize = file ? file.size > MAX_UPLOAD_BYTES : false;

  const handleFile = useCallback((f: File) => {
    setError(null);
    if (!ALLOWED_VIDEO_TYPES.includes(f.type) && !ALLOWED_IMAGE_TYPES.includes(f.type)) {
      setError('Invalid file type. Upload mp4, jpg, png, gif, or webp.');
      return;
    }
    if (f.size > MAX_UPLOAD_BYTES) {
      setError(`File too large. Maximum size is ${formatBytes(MAX_UPLOAD_BYTES)}.`);
      return;
    }
    setFile(f);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setDragging(false), []);

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!file || !title.trim() || !communitySlug) return;

      setUploading(true);
      setProgress(0);
      setError(null);

      try {
        // Step 1: Get upload session
        const sessionRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileSize: file.size,
            contentType: file.type,
          }),
        });
        if (!sessionRes.ok) {
          const err = await sessionRes.json().catch(() => null);
          throw new Error(err?.error ?? 'Failed to start upload');
        }
        const session: UploadSession = await sessionRes.json();

        // Step 2: Upload file with progress
        await uploadWithProgress(session.uploadUrl, file, setProgress);

        // Step 3: Create post
        const postRes = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            communitySlug,
            title: title.trim(),
            body: body.trim() || undefined,
            type: isVideo ? 'CLIP' : 'IMAGE',
            assetId: session.assetId,
            gameIds: games.map((g) => g.id),
          }),
        });
        if (!postRes.ok) {
          const err = await postRes.json().catch(() => null);
          throw new Error(err?.error ?? 'Failed to create post');
        }

        addToast('success', 'Post created!');
        router.push('/');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        setError(msg);
        addToast('error', msg);
      } finally {
        setUploading(false);
      }
    },
    [file, title, body, communitySlug, games, isVideo, router, addToast],
  );

  return (
    <form onSubmit={submit} className="max-w-2xl mx-auto space-y-6 p-4 sm:p-6">
      <h2 className="text-xl font-bold text-text-primary">Upload a clip or image</h2>

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center rounded-card border-2 border-dashed p-8 text-center cursor-pointer transition-colors',
          dragging ? 'border-accent bg-accent/5' : 'border-white/10 hover:border-white/20',
          file && 'border-green-500/40 bg-green-500/5',
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,image/jpeg,image/png,image/gif,image/webp"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
          className="hidden"
          aria-label="Choose file"
        />
        {file ? (
          <div className="space-y-2">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400 mx-auto">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-sm text-text-primary font-medium">{file.name}</p>
            <p className="text-xs text-text-muted">{formatBytes(file.size)}</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Remove file
            </button>
          </div>
        ) : (
          <>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted mb-3">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-sm text-text-secondary mb-1">
              Drag &amp; drop or <span className="text-accent">browse</span>
            </p>
            <p className="text-xs text-text-muted">
              MP4, JPG, PNG, GIF, WebP &middot; Max {formatBytes(MAX_UPLOAD_BYTES)}
            </p>
          </>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* Upload progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-surface overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Quota */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>Storage used</span>
          <span>{formatBytes(storageUsed)} / {formatBytes(storageQuota)}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-surface overflow-hidden">
          <div
            className="h-full rounded-full bg-accent/60 transition-all"
            style={{ width: `${Math.min((storageUsed / storageQuota) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Title */}
      <Input
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Give your clip a title..."
        maxLength={MAX_POST_TITLE_LENGTH}
        required
      />

      {/* Body */}
      <Textarea
        label="Description (optional)"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Add context about your clip..."
        rows={3}
      />

      {/* Community */}
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
          Community
        </span>
        <select
          value={communitySlug}
          onChange={(e) => setCommunitySlug(e.target.value)}
          className="input appearance-none"
          required
        >
          <option value="">Select a community</option>
          {communities.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      {/* Game tags */}
      <div>
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-muted">
          Game Tags
        </span>
        <GameTagPicker selected={games} onChange={setGames} />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={uploading}
        disabled={!file || !title.trim() || !communitySlug || uploading}
        className="w-full"
      >
        Post
      </Button>
    </form>
  );
}
