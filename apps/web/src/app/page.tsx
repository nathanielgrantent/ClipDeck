import { AppShell } from '@/components/layout/app-shell';
import { MasonryGallery } from '@/components/posts/masonry-gallery';
import { HomeFeed } from '@/components/posts/home-feed';
import { TopCommunities } from '@/components/posts/top-communities';

export const metadata = { title: 'Home' };

export default function HomePage() {
  return (
    <AppShell
      activeSlug="home"
      rightPane={
        <div className="flex h-full flex-col gap-3 overflow-y-auto p-3">
          <TopCommunities />
        </div>
      }
    >
      <HomeFeed />
    </AppShell>
  );
}

export { MasonryGallery };
