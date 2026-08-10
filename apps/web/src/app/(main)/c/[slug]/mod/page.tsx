'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCommunity, usePosts } from '@/hooks';
import { AppShell } from '@/components/layout/app-shell';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn, timeAgo } from '@/lib/utils';
import { apiPost, apiGet, apiPatch } from '@/lib/client';
import Link from 'next/link';
import type { ModQueueItem, Report, AutomodRule } from '@gamingclips/shared';

const TABS = ['Queue', 'Reports', 'Rules', 'ModLog'] as const;
type Tab = (typeof TABS)[number];

function QueueTab({ slug }: { slug: string }) {
  const [items, setItems] = useState<ModQueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<ModQueueItem[]>(`/api/mod/queue?community=${slug}`)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleAction(id: string, action: 'approve' | 'remove') {
    try {
      await apiPost(`/api/mod/queue/${id}`, { action });
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      // silent
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} variant="card" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="text-4xl">✨</div>
        <p className="mt-3 text-sm text-text-secondary">Queue is clear!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="card p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <span className="chip bg-amber-500/10 text-amber-400 text-[10px]">{item.kind}</span>
              {item.categories.length > 0 && (
                <span className="ml-2 chip bg-red-500/10 text-red-400 text-[10px]">
                  {item.categories.join(', ')}
                </span>
              )}
              <div className="mt-2 text-sm text-text-primary">
                {'title' in item.target ? (item.target as { title: string }).title : (item.target as { body: string }).body.slice(0, 100)}
              </div>
              <div className="mt-1 text-xs text-text-muted">
                {item.rules.length > 0 && (
                  <span>Rules: {item.rules.join(', ')} · </span>
                )}
                {timeAgo(item.createdAt)}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="primary" onClick={() => handleAction(item.id, 'approve')}>
                Approve
              </Button>
              <Button size="sm" variant="danger" onClick={() => handleAction(item.id, 'remove')}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReportsTab({ slug }: { slug: string }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<Report[]>(`/api/mod/reports?community=${slug}`)
      .then(setReports)
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} variant="card" />
        ))}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="text-4xl">📋</div>
        <p className="mt-3 text-sm text-text-secondary">No reports to review.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <div key={report.id} className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="chip bg-sidebar-hover text-text-secondary text-[10px]">
                {report.targetType}
              </span>
              <span className={cn(
                'ml-2 chip text-[10px]',
                report.status === 'OPEN' ? 'bg-amber-500/10 text-amber-400' : 'bg-green-500/10 text-green-400',
              )}>
                {report.status}
              </span>
              <p className="mt-2 text-sm text-text-primary">{report.reason}</p>
              <p className="mt-1 text-xs text-text-muted">
                Reported by {report.reporter.username} · {timeAgo(report.createdAt)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RulesTab({ slug }: { slug: string }) {
  const [rules, setRules] = useState<AutomodRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newKeywords, setNewKeywords] = useState('');

  useEffect(() => {
    apiGet<AutomodRule[]>(`/api/mod/rules?community=${slug}`)
      .then(setRules)
      .catch(() => setRules([]))
      .finally(() => setLoading(false));
  }, [slug]);

  async function toggleRule(id: string, enabled: boolean) {
    try {
      await apiPatch(`/api/mod/rules/${id}`, { enabled: !enabled });
      setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !enabled } : r)));
    } catch {
      // silent
    }
  }

  async function createRule(e: React.FormEvent) {
    e.preventDefault();
    try {
      const rule = await apiPost<AutomodRule>(`/api/mod/rules`, {
        name: newName,
        scope: 'COMMUNITY',
        communitySlug: slug,
        enabled: true,
        priority: 10,
        conditions: {
          keywords: newKeywords.split(',').map((k) => k.trim()).filter(Boolean),
        },
        actions: [{ action: 'FILTER', reason: 'Automated filter', category: 'SPAM', weight: 1 }],
      });
      setRules((prev) => [...prev, rule]);
      setNewName('');
      setNewKeywords('');
      setShowForm(false);
    } catch {
      // silent
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} variant="card" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">Automod Rules</h3>
        <Button size="sm" variant="primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New Rule'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={createRule} className="card space-y-3 p-4">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Rule name"
            className="input"
            required
          />
          <input
            type="text"
            value={newKeywords}
            onChange={(e) => setNewKeywords(e.target.value)}
            placeholder="Keywords (comma separated)"
            className="input"
          />
          <Button type="submit" size="sm" variant="primary">
            Create Rule
          </Button>
        </form>
      )}

      {rules.length === 0 ? (
        <div className="py-12 text-center">
          <div className="text-4xl">🤖</div>
          <p className="mt-3 text-sm text-text-secondary">No automod rules yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((rule) => (
            <div key={rule.id} className="card flex items-center justify-between p-4">
              <div>
                <span className="text-sm font-medium text-text-primary">{rule.name}</span>
                {rule.conditions.keywords && rule.conditions.keywords.length > 0 && (
                  <p className="mt-1 text-xs text-text-muted">
                    Keywords: {rule.conditions.keywords.join(', ')}
                  </p>
                )}
              </div>
              <button
                onClick={() => toggleRule(rule.id, rule.enabled)}
                role="switch"
                aria-checked={rule.enabled}
                aria-label={`Toggle rule ${rule.name}`}
                className={cn(
                  'relative h-6 w-11 rounded-full transition-colors',
                  rule.enabled ? 'bg-accent' : 'bg-sidebar-hover',
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                    rule.enabled && 'translate-x-5',
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ModLogTab({ slug }: { slug: string }) {
  const [log, setLog] = useState<{ id: string; action: string; actor: { username: string }; targetType: string; targetId: string; reason: string | null; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<typeof log>(`/api/mod/log?community=${slug}`)
      .then(setLog)
      .catch(() => setLog([]))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} variant="card" />
        ))}
      </div>
    );
  }

  if (log.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="text-4xl">📜</div>
        <p className="mt-3 text-sm text-text-secondary">No mod actions recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {log.map((entry) => (
        <div key={entry.id} className="card flex items-center gap-3 p-3">
          <div className="shrink-0 text-xs font-medium text-accent">{entry.action}</div>
          <div className="flex-1 min-w-0">
            <span className="text-sm text-text-primary">{entry.actor.username}</span>
            <span className="text-sm text-text-secondary">
              {' '}{entry.action.toLowerCase()}d a {entry.targetType.toLowerCase()}
            </span>
            {entry.reason && (
              <span className="text-xs text-text-muted"> — {entry.reason}</span>
            )}
          </div>
          <span className="shrink-0 text-xs text-text-muted">{timeAgo(entry.createdAt)}</span>
        </div>
      ))}
    </div>
  );
}

export default function ModPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { status } = useSession();
  const { community, isLoading } = useCommunity(slug);
  const [activeTab, setActiveTab] = useState<Tab>('Queue');
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  useEffect(() => {
    if (!isLoading && community && !community.isModerator) {
      router.replace(`/c/${slug}`);
    }
  }, [isLoading, community, slug, router]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <Skeleton lines={1} className="w-48 mb-6" />
        <Skeleton variant="card" />
      </div>
    );
  }

  return (
    <AppShell activeSlug={slug}>
      <div className="p-4 sm:p-6">
        <div className="mb-6">
          <Link href={`/c/${slug}`} className="text-xs text-text-muted hover:text-text-secondary">
            ← Back to {community?.name ?? slug}
          </Link>
          <h1 className="mt-2 text-xl font-bold text-text-primary">Moderation Dashboard</h1>
        </div>

        <div className="mb-6 flex gap-1 rounded-btn bg-sidebar p-0.5">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'rounded-btn px-3 py-1.5 text-xs font-medium transition-colors',
                activeTab === tab ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary',
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Queue' && <QueueTab slug={slug} />}
        {activeTab === 'Reports' && <ReportsTab slug={slug} />}
        {activeTab === 'Rules' && <RulesTab slug={slug} />}
        {activeTab === 'ModLog' && <ModLogTab slug={slug} />}
      </div>
    </AppShell>
  );
}
