import { z } from 'zod';

export const SerpApiEngine = z.enum([
  'google',
  'google_light',
  'google_ai_mode',
  'google_ai_overview',
  'google_autocomplete',
  'google_related_questions',
  'google_images',
  'google_images_light',
  'google_reverse_image',
  'google_lens',
  'google_news',
  'google_news_light',
  'google_shopping',
  'google_shopping_light',
  'google_shopping_filters',
  'google_videos',
  'google_videos_light',
  'google_short_videos',
  'google_local',
  'google_local_services',
  'google_maps',
  'google_maps_reviews',
  'google_maps_directions',
  'google_maps_photos',
  'google_maps_posts',
  'google_maps_autocomplete',
  'google_jobs',
  'google_jobs_listing',
  'google_scholar',
  'google_scholar_author',
  'google_scholar_cite',
  'google_patents',
  'google_finance',
  'google_finance_markets',
  'google_flights',
  'google_flights_deals',
  'google_hotels',
  'google_trends',
  'google_trends_autocomplete',
  'google_trends_news',
  'google_trends_trending_now',
  'google_events',
  'google_play',
  'google_ads',
  'search_index',
]);
export type SerpApiEngine = z.infer<typeof SerpApiEngine>;

export const BaseSearchParams = z.object({
  engine: SerpApiEngine,
  q: z.string().optional(),
  location: z.string().optional(),
  gl: z.string().length(2).optional(),
  hl: z.string().length(2).optional(),
  google_domain: z.string().optional(),
  device: z.enum(['desktop', 'mobile', 'tablet']).optional(),
  num: z.number().int().positive().max(100).optional(),
  start: z.number().int().nonnegative().optional(),
  safe: z.enum(['active', 'off']).optional(),
  no_cache: z.boolean().optional(),
  async: z.boolean().optional(),
  api_key: z.string().optional(),
});
export type BaseSearchParams = z.infer<typeof BaseSearchParams>;

export const MapsSearchParams = BaseSearchParams.extend({
  engine: z.literal('google_maps'),
  q: z.string(),
  ll: z.string().optional(),
  type: z.enum(['search', 'place', 'directions']).optional(),
  place_id: z.string().optional(),
  data_id: z.string().optional(),
  data_cid: z.string().optional(),
});
export type MapsSearchParams = z.infer<typeof MapsSearchParams>;

export const ShoppingSearchParams = BaseSearchParams.extend({
  engine: z.union([z.literal('google_shopping'), z.literal('google_shopping_light')]),
  q: z.string(),
  direct_link: z.boolean().optional(),
});
export type ShoppingSearchParams = z.infer<typeof ShoppingSearchParams>;

export const JobsSearchParams = BaseSearchParams.extend({
  engine: z.literal('google_jobs'),
  q: z.string(),
  location: z.string(),
  chips: z.string().optional(),
  lrad: z.number().optional(),
  ltype: z.enum(['remote', 'onsite', 'hybrid']).optional(),
});
export type JobsSearchParams = z.infer<typeof JobsSearchParams>;

export const TrendsSearchParams = BaseSearchParams.extend({
  engine: z.union([z.literal('google_trends'), z.literal('google_trends_trending_now')]),
  q: z.string(),
  geo: z.string().optional(),
  date: z.string().optional(),
  cat: z.string().optional(),
  gprop: z.enum(['web', 'images', 'news', 'youtube', 'froogle']).optional(),
});
export type TrendsSearchParams = z.infer<typeof TrendsSearchParams>;

export const LensSearchParams = BaseSearchParams.extend({
  engine: z.literal('google_lens'),
  url: z.string().url().optional(),
  image_url: z.string().url().optional(),
});
export type LensSearchParams = z.infer<typeof LensSearchParams>;

export const AmazonProductSearchParams = BaseSearchParams.extend({
  engine: z.literal('amazon_product'),
  asin: z.string(),
});
export type AmazonProductSearchParams = z.infer<typeof AmazonProductSearchParams>;

export const SearchMetadata = z.object({
  id: z.string(),
  status: z.string(),
  json_endpoint: z.string().url(),
  created_at: z.string(),
  processed_at: z.string(),
  total_time_taken: z.number(),
});
export type SearchMetadata = z.infer<typeof SearchMetadata>;

export const SearchInformation = z.object({
  total_results: z.number().optional(),
  time_taken_displayed: z.number().optional(),
  query_displayed: z.string().optional(),
});
export type SearchInformation = z.infer<typeof SearchInformation>;

export const OrganicResult = z.object({
  position: z.number().optional(),
  title: z.string(),
  link: z.string().url(),
  displayed_link: z.string().optional(),
  snippet: z.string().optional(),
  rich_snippet: z.record(z.unknown()).optional(),
  source: z.string().optional(),
  date: z.string().optional(),
  thumbnail: z.string().url().optional(),
  favicon: z.string().url().optional(),
});
export type OrganicResult = z.infer<typeof OrganicResult>;

export const LocalResult = z.object({
  position: z.number().optional(),
  title: z.string(),
  place_id: z.string().optional(),
  data_id: z.string().optional(),
  data_cid: z.string().optional(),
  rating: z.number().optional(),
  reviews: z.number().optional(),
  price_level: z.number().optional(),
  type: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  hours: z.record(z.string()).optional(),
  gps_coordinates: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
  thumbnail: z.string().url().optional(),
});
export type LocalResult = z.infer<typeof LocalResult>;

export const ShoppingResult = z.object({
  position: z.number().optional(),
  title: z.string(),
  product_link: z.string().url().optional(),
  source: z.string().optional(),
  price: z.string().optional(),
  extracted_price: z.number().optional(),
  rating: z.number().optional(),
  reviews: z.number().optional(),
  thumbnail: z.string().url().optional(),
  delivery: z.string().optional(),
  extensions: z.array(z.string()).optional(),
});
export type ShoppingResult = z.infer<typeof ShoppingResult>;

export const JobResult = z.object({
  job_id: z.string().optional(),
  title: z.string(),
  company_name: z.string(),
  location: z.string(),
  via: z.string().optional(),
  description: z.string().optional(),
  salary: z.string().optional(),
  job_type: z.array(z.string()).optional(),
  posted_at: z.string().optional(),
  apply_link: z.string().url().optional(),
  company_logo: z.string().url().optional(),
});
export type JobResult = z.infer<typeof JobResult>;

export const LensMatchResult = z.object({
  thumbnail: z.string().url().optional(),
  link: z.string().url().optional(),
  title: z.string().optional(),
  source: z.string().optional(),
});
export type LensMatchResult = z.infer<typeof LensMatchResult>;

export const LensSearchResult = z.object({
  exact_matches: z.array(LensMatchResult).optional(),
  visual_matches: z.array(LensMatchResult).optional(),
  text_results: z.array(z.object({
    text: z.string(),
    source: z.string().optional(),
    link: z.string().url().optional(),
  })).optional(),
  knowledge_graph: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    image_url: z.string().url().optional(),
  }).optional(),
});
export type LensSearchResult = z.infer<typeof LensSearchResult>;

export const AmazonProductResult = z.object({
  asin: z.string().optional(),
  title: z.string().optional(),
  price: z.string().optional(),
  extracted_price: z.number().optional(),
  rating: z.number().optional(),
  reviews: z.number().optional(),
  availability: z.string().optional(),
  images: z.array(z.string().url()).optional(),
  description: z.string().optional(),
  features: z.array(z.string()).optional(),
  brand: z.string().optional(),
  manufacturer: z.string().optional(),
  seller: z.string().optional(),
  product_link: z.string().url().optional(),
});
export type AmazonProductResult = z.infer<typeof AmazonProductResult>;

export const TrendsDataPoint = z.object({
  date: z.string(),
  values: z.array(z.number()),
});
export type TrendsDataPoint = z.infer<typeof TrendsDataPoint>;

export const SerpApiResponseSchema = z.object({
  search_metadata: SearchMetadata,
  search_parameters: BaseSearchParams,
  search_information: SearchInformation.optional(),
  organic_results: z.array(OrganicResult).optional(),
  local_results: z.array(LocalResult).optional(),
  place_results: LocalResult.optional(),
  shopping_results: z.array(ShoppingResult).optional(),
  jobs_results: z.array(JobResult).optional(),
  lens_results: LensSearchResult.optional(),
  amazon_product: AmazonProductResult.optional(),
  interest_over_time: z.object({
    timeline_data: z.array(TrendsDataPoint),
  }).optional(),
  interest_by_region: z.array(z.object({
    location: z.string(),
    value: z.number(),
  })).optional(),
  related_topics: z.array(z.object({
    topic: z.object({
      title: z.string(),
      type: z.string(),
    }),
    value: z.number(),
  })).optional(),
  related_queries: z.array(z.object({
    query: z.string(),
    value: z.number(),
  })).optional(),
  error: z.string().optional(),
}).passthrough();
export type SerpApiResponse<T = unknown> = z.infer<typeof SerpApiResponseSchema> & { data?: T };

export interface CachedResponse<T> {
  data: T;
  timestamp: number;
  ttl: number;
  engine: string;
  paramsHash: string;
}

export interface SerpApiClientOptions {
  apiKey: string;
  baseUrl?: string;
  defaultTimeout?: number;
  maxRetries?: number;
  cache?: CacheAdapter;
  fixtureMode?: boolean;
  fixturesPath?: string;
}

export interface CacheAdapter {
  get<T>(key: string): Promise<CachedResponse<T> | null>;
  set<T>(key: string, value: CachedResponse<T>): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface RequestDeduplicationEntry<T> {
  promise: Promise<SerpApiResponse<T>>;
  timestamp: number;
}

export interface CreditEstimate {
  estimatedCredits: number;
  engine: string;
  isAdvanced: boolean;
}