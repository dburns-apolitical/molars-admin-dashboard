export type PostStatus = 'pending' | 'posted' | 'failed' | 'scheduled';

export interface PostWithDetails {
  id: number;
  instagram_post_id: string | null;
  views: number | null;
  status: PostStatus;
  created_at: Date;
  updated_at: Date;
  video: {
    id: number;
    title: string;
  };
  hook: {
    id: number;
    text: string;
  };
  caption: {
    id: number;
    text: string;
  };
  hashtags: string[];
}

export interface RankedItem {
  id: number;
  text: string;
  postCount: number;
  totalViews: number;
  avgViews: number;
}

export interface ViewsMetrics {
  allTime: number;
  last28Days: number;
  previous28Days: number;
  deltaPercent: number | null;
}

export interface DashboardStats {
  topPosts: PostWithDetails[];
  mostRecentPost: PostWithDetails | null;
  viewsMetrics: ViewsMetrics;
  topCaptions: RankedItem[];
  topHooks: RankedItem[];
  topHashtagCombinations: RankedItem[];
  topVideos: RankedItem[];
}
