import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock('@/hooks', () => ({
  useCommunities: () => ({
    communities: [
      { slug: 'valorant', name: 'Valorant' },
      { slug: 'fortnite', name: 'Fortnite' },
    ],
  }),
}));
vi.mock('@/components/ui/toast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));
vi.mock('@/components/ui/input', () => ({
  Input: ({ label, ...props }: any) => (
    <div>
      <label>{label}</label>
      <input {...props} />
    </div>
  ),
  Textarea: ({ label, ...props }: any) => (
    <div>
      <label>{label}</label>
      <textarea {...props} />
    </div>
  ),
}));
vi.mock('@/components/post/game-tag-picker', () => ({
  GameTagPicker: () => <div data-testid="game-tag-picker" />,
}));
vi.mock('@/lib/client', () => ({
  uploadWithProgress: vi.fn(),
}));
vi.mock('@gamingclips/shared', async () => {
  const actual = await vi.importActual('@gamingclips/shared');
  return { ...actual };
});

describe('UploadForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the upload form', async () => {
    const { UploadForm } = await import('@/components/upload/upload-form');
    render(<UploadForm />);
    expect(screen.getByText('Upload a clip or image')).toBeDefined();
  });

  it('renders file input', async () => {
    const { UploadForm } = await import('@/components/upload/upload-form');
    render(<UploadForm />);
    expect(screen.getByLabelText('Choose file')).toBeDefined();
  });

  it('renders title input', async () => {
    const { UploadForm } = await import('@/components/upload/upload-form');
    render(<UploadForm />);
    expect(screen.getByText('Title')).toBeDefined();
  });

  it('renders community selector', async () => {
    const { UploadForm } = await import('@/components/upload/upload-form');
    render(<UploadForm />);
    expect(screen.getByText('Community')).toBeDefined();
    expect(screen.getByText('Valorant')).toBeDefined();
    expect(screen.getByText('Fortnite')).toBeDefined();
  });

  it('renders game tag picker', async () => {
    const { UploadForm } = await import('@/components/upload/upload-form');
    render(<UploadForm />);
    expect(screen.getByTestId('game-tag-picker')).toBeDefined();
  });

  it('renders submit button', async () => {
    const { UploadForm } = await import('@/components/upload/upload-form');
    render(<UploadForm />);
    expect(screen.getByRole('button', { name: 'Post' })).toBeDefined();
  });

  it('submit button is disabled initially', async () => {
    const { UploadForm } = await import('@/components/upload/upload-form');
    render(<UploadForm />);
    const btn = screen.getByRole('button', { name: 'Post' });
    expect(btn.getAttribute('disabled')).not.toBeNull();
  });

  it('shows storage quota display', async () => {
    const { UploadForm } = await import('@/components/upload/upload-form');
    render(<UploadForm />);
    expect(screen.getByText('Storage used')).toBeDefined();
  });

  it('accepts drag and drop hint text', async () => {
    const { UploadForm } = await import('@/components/upload/upload-form');
    render(<UploadForm />);
    expect(screen.getByText(/Drag/)).toBeDefined();
  });
});
