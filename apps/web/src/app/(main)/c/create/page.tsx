'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Input, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { apiPost } from '@/lib/client';
import { slugify } from '@/lib/utils';
import Link from 'next/link';

export default function CreateCommunityPage() {
  const { status } = useSession();
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [sfw, setSfw] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugEdited) {
      setSlug(slugify(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlugEdited(true);
    setSlug(slugify(value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Community name is required');
      return;
    }
    setLoading(true);
    try {
      const community = await apiPost<{ slug: string }>('/api/communities', {
        name: name.trim(),
        slug: slug.trim() || slugify(name),
        description: description.trim() || undefined,
        rules: rules
          .split('\n')
          .map((r) => r.trim())
          .filter(Boolean),
      });
      router.push(`/c/${community.slug}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create community';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg p-4 sm:p-6">
      <div className="mb-6">
        <Link href="/" className="text-xs text-text-muted hover:text-text-secondary">
          ← Back
        </Link>
      </div>

      <h1 className="mb-6 text-xl font-bold text-text-primary">Create a Community</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Community Name"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="e.g. Valorant Clips"
          required
          maxLength={60}
        />

        <Input
          label="Slug"
          value={slug}
          onChange={(e) => handleSlugChange(e.target.value)}
          placeholder="auto-generated-from-name"
          maxLength={60}
        />

        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this community about?"
          rows={3}
          maxLength={500}
        />

        <Textarea
          label="Community Rules"
          value={rules}
          onChange={(e) => setRules(e.target.value)}
          placeholder="One rule per line, e.g.&#10;Be respectful&#10;No spam&#10;Tag your posts"
          rows={4}
        />

        <label className="flex items-center gap-3 rounded-btn bg-surface border border-black/20 px-4 py-3">
          <input
            type="checkbox"
            checked={sfw}
            onChange={(e) => setSfw(e.target.checked)}
            className="h-4 w-4 rounded accent-accent"
          />
          <span className="text-sm text-text-primary">Safe for work (SFW)</span>
        </label>

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Link href="/" className="btn-secondary flex-1">
            Cancel
          </Link>
          <Button type="submit" variant="primary" loading={loading} className="flex-1">
            Create Community
          </Button>
        </div>
      </form>
    </div>
  );
}
