import { Skeleton } from '@/components/ui/skeleton';

export default function MainLoading() {
  return (
    <div className="p-4 sm:p-6">
      <div className="space-y-4">
        <Skeleton variant="media" />
        <Skeleton lines={1} className="w-3/4 !h-6" />
        <div className="flex items-center gap-3">
          <Skeleton variant="avatar" />
          <Skeleton lines={1} className="w-24" />
        </div>
        <Skeleton lines={3} />
        <Skeleton variant="card" />
        <Skeleton variant="card" />
      </div>
    </div>
  );
}
