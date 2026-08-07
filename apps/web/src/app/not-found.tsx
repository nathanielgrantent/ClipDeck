import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <div className="text-6xl font-bold text-text-muted">404</div>
      <h1 className="text-xl font-semibold text-text-primary">Page not found</h1>
      <p className="text-sm text-text-secondary">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link href="/" className="btn-primary mt-2">
        Back to Home
      </Link>
    </div>
  );
}
