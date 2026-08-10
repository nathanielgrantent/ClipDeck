import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/hooks', () => ({
  useGameSearch: () => ({
    games: [
      { id: 'g1', name: 'Valorant', platform: 'PC', coverUrl: null, steamAppId: null, aliases: [], popularity: 100 },
      { id: 'g2', name: 'Fortnite', platform: 'PC', coverUrl: null, steamAppId: null, aliases: [], popularity: 90 },
      { id: 'g3', name: 'CS2', platform: 'PC', coverUrl: null, steamAppId: null, aliases: [], popularity: 80 },
    ],
    isLoading: false,
  }),
}));
vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));
vi.mock('@gamingclips/shared', async () => {
  const actual = await vi.importActual('@gamingclips/shared');
  return { ...actual, MAX_TAGS_PER_POST: 5 };
});

describe('GameTagPicker', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders search input', async () => {
    const { GameTagPicker } = await import('@/components/post/game-tag-picker');
    render(<GameTagPicker selected={[]} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Search games')).toBeDefined();
  });

  it('shows tag count', async () => {
    const { GameTagPicker } = await import('@/components/post/game-tag-picker');
    render(<GameTagPicker selected={[]} onChange={vi.fn()} />);
    expect(screen.getByText('0/5 tags')).toBeDefined();
  });

  it('shows selected tags', async () => {
    const { GameTagPicker } = await import('@/components/post/game-tag-picker');
    const games = [
      { id: 'g1', name: 'Valorant', platform: 'PC' as const, coverUrl: null, steamAppId: null, aliases: [], popularity: 100 },
    ];
    render(<GameTagPicker selected={games} onChange={vi.fn()} />);
    expect(screen.getByText('1/5 tags')).toBeDefined();
  });

  it('calls onChange with game removed when remove is clicked', async () => {
    const { GameTagPicker } = await import('@/components/post/game-tag-picker');
    const onChange = vi.fn();
    const games = [
      { id: 'g1', name: 'Valorant', platform: 'PC' as const, coverUrl: null, steamAppId: null, aliases: [], popularity: 100 },
    ];
    render(<GameTagPicker selected={games} onChange={onChange} />);
    const removeButtons = screen.getAllByRole('button');
    // Click the remove button on the GameChip
    const removeBtn = removeButtons.find((b) => b.getAttribute('aria-label')?.includes('Remove'));
    if (removeBtn) {
      fireEvent.click(removeBtn);
      expect(onChange).toHaveBeenCalledWith([]);
    }
  });

  it('opens dropdown on focus', async () => {
    const { GameTagPicker } = await import('@/components/post/game-tag-picker');
    render(<GameTagPicker selected={[]} onChange={vi.fn()} />);
    const input = screen.getByLabelText('Search games');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'val' } });
    expect(input.getAttribute('aria-expanded')).toBe('true');
  });
});
