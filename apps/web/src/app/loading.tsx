import { Skeleton } from '@/components/ui/skeleton';

export default function GlobalLoading() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="flex w-full max-w-lg flex-col gap-4">
        <Skeleton variant="media" />
        <div className="space-y-3">
          <Skeleton lines={2} />
          <Skeleton lines={1} className="w-1/3" />
        </div>
        <Skeleton variant="card" />
        <Skeleton variant="card" />
      </div>
    </div>
  );
}
