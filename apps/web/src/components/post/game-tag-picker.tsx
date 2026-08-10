'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameSearch } from '@/hooks';
import { cn } from '@/lib/utils';
import { GameChip } from '@/components/game/game-chip';
import { MAX_TAGS_PER_POST } from '@gamingclips/shared';
import type { Game } from '@gamingclips/shared';

export function GameTagPicker({
  selected,
  onChange,
}: {
  selected: Game[];
  onChange: (games: Game[]) => void;
}) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { games, isLoading } = useGameSearch(debouncedQuery);

  const filtered = games.filter(
    (g) => !selected.some((s) => s.id === g.id),
  );

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const select = useCallback(
    (game: Game) => {
      if (selected.length >= MAX_TAGS_PER_POST) return;
      onChange([...selected, game]);
      setQuery('');
      setDebouncedQuery('');
    },
    [selected, onChange],
  );

  const remove = useCallback(
    (gameId: string) => {
      onChange(selected.filter((g) => g.id !== gameId));
    },
    [selected, onChange],
  );

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((game) => (
            <GameChip
              key={game.id}
              game={game}
              removable
              onRemove={() => remove(game.id)}
            />
          ))}
        </div>
      )}

      {selected.length < MAX_TAGS_PER_POST && (
        <div ref={ref} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search games..."
            className="input"
            aria-label="Search games"
            aria-autocomplete="list"
            aria-expanded={open}
          />

          {open && debouncedQuery.trim() && (
            <div
              className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-card bg-surface-overlay border border-black/30 shadow-xl animate-fade-in"
              role="listbox"
            >
              {isLoading ? (
                <div className="px-3 py-4 text-center text-sm text-text-muted">Searching...</div>
              ) : filtered.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-text-muted">No games found</div>
              ) : (
                filtered.map((game) => (
                  <button
                    key={game.id}
                    type="button"
                    onClick={() => select(game)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-sidebar-hover"
                    role="option"
                  >
                    {game.coverUrl ? (
                      <img
                        src={game.coverUrl}
                        alt=""
                        className="h-8 w-8 rounded object-cover shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded bg-sidebar-hover shrink-0 flex items-center justify-center text-xs text-text-muted">
                        {game.name[0]}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-text-primary">{game.name}</div>
                      <div className="text-xs text-text-muted">{game.platform}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-text-muted">
        {selected.length}/{MAX_TAGS_PER_POST} tags
      </p>
    </div>
  );
}
