import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock modules that VoteControls depends on
vi.mock('@/lib/client', () => ({
  apiPost: vi.fn(),
}));
vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));
vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

describe('VoteControls', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders score', async () => {
    const { VoteControls } = await import('@/components/post/vote-controls');
    render(<VoteControls postId="p1" initialScore={42} />);
    expect(screen.getByText('42')).toBeDefined();
  });

  it('renders with initial user vote highlighted', async () => {
    const { VoteControls } = await import('@/components/post/vote-controls');
    render(<VoteControls postId="p1" initialScore={10} initialUserVote={1} />);
    const upvoteBtn = screen.getByLabelText('Upvote');
    expect(upvoteBtn.getAttribute('aria-pressed')).toBe('true');
  });

  it('toggles upvote off when clicking upvote again', async () => {
    const { VoteControls } = await import('@/components/post/vote-controls');
    const onScoreChange = vi.fn();
    render(
      <VoteControls
        postId="p1"
        initialScore={10}
        initialUserVote={1}
        onScoreChange={onScoreChange}
      />,
    );
    const upvoteBtn = screen.getByLabelText('Upvote');
    fireEvent.click(upvoteBtn);
    await waitFor(() => {
      expect(onScoreChange).toHaveBeenCalledWith(9, 0);
    });
  });

  it('switches from upvote to downvote', async () => {
    const { VoteControls } = await import('@/components/post/vote-controls');
    const onScoreChange = vi.fn();
    render(
      <VoteControls
        postId="p1"
        initialScore={10}
        initialUserVote={1}
        onScoreChange={onScoreChange}
      />,
    );
    const downvoteBtn = screen.getByLabelText('Downvote');
    fireEvent.click(downvoteBtn);
    await waitFor(() => {
      expect(onScoreChange).toHaveBeenCalledWith(8, -1);
    });
  });

  it('upvotes from neutral state', async () => {
    const { VoteControls } = await import('@/components/post/vote-controls');
    const onScoreChange = vi.fn();
    render(
      <VoteControls postId="p1" initialScore={5} initialUserVote={0} onScoreChange={onScoreChange} />,
    );
    const upvoteBtn = screen.getByLabelText('Upvote');
    fireEvent.click(upvoteBtn);
    await waitFor(() => {
      expect(onScoreChange).toHaveBeenCalledWith(6, 1);
    });
  });

  it('renders compact mode', async () => {
    const { VoteControls } = await import('@/components/post/vote-controls');
    const { container } = render(
      <VoteControls postId="p1" initialScore={5} compact={true} />,
    );
    expect(container.querySelector('[role="group"]')).toBeDefined();
  });
});
