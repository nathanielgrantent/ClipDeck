import Link from 'next/link';
import { EmptyState } from '@/components/ui/empty-state';

export default function NotFound() {
  return (
    <EmptyState
      icon="🔍"
      title="Page not found"
      description="The page you are looking for does not exist or has been moved."
    />
  );
}
