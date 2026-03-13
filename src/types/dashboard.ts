export type PostStatus = 'pending' | 'posted' | 'failed' | 'scheduled' | 'success';

export interface PostWithDetails {
  id: number;
  instagram_post_id: string | null;
  views: number | null;
  status: PostStatus;
  account_id: number | null;
  account_name: string | null;
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

export interface PostCountMetrics {
  allTime: number;
  last28Days: number;
  last7Days: number;
}

export interface Evaluation {
  id: number;
  response: string;
  model: string;
  input_tokens: number | null;
  output_tokens: number | null;
  triggered_by: string;
  created_at: string;
}

export interface DashboardStats {
  topPosts: PostWithDetails[];
  mostRecentPost: PostWithDetails | null;
  viewsMetrics: ViewsMetrics;
  postCountMetrics: PostCountMetrics;
  topCaptions: RankedItem[];
  topHooks: RankedItem[];
  topHashtagCombinations: RankedItem[];
  topVideos: RankedItem[];
  userLeaderboard: { name: string; posts: number }[];
  userViewsPerVideo: { name: string; viewsPerVideo: number }[];
  latestEvaluation: Evaluation | null;
}

export interface Account {
  id: number;
  name: string;
  ig_access_token: string;
  ig_user_id: string;
  gcs_bucket_name: string;
}

export interface ContentItem {
  id: number;
  text: string;
  enabled: boolean;
  created_at: string;
  accounts: { id: number; name: string }[];
}

export interface DailyViewsEntry {
  day: string;
  views: number;
  postCount: number;
}

export interface ViewsHistoryData {
  dailyViews: DailyViewsEntry[];
  last28DaysTotal: number;
  previous28DaysTotal: number;
  deltaPercent: number | null;
}
