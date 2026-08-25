export type CategoryType = 'CAMPAIGNS' | 'EVENTS' | 'SHOWS' | 'INFLUENCERS';
export type FormatType = 'CHART' | 'TABLE' | 'COMBINATION';

export type ComboMetricType =
  | 'contentFromQu'
  | 'buzzVolume'
  | 'qualifiedUser'
  | 'sentimentScore'
  | 'relevanceScore'
  | 'earnedMedia'
  | 'custom';

export interface BsiItem {
  rank: number;
  name: string;
  brandName?: string; // Brand name for CAMPAIGNS format (BRAND column)
  bsiScore: number;
  buzzVolume: number;
  qualifiedUser: number;
  contentFromQu: number;
  sentimentScore: number; // e.g. 0.95 or 95%
  relevanceScore: number;
  earnedMedia: number;
  comboLineValue?: number; // Custom value for bottom trendline in COMBINATION format
  imageUrl?: string;
  croppedImageData?: string; // base64 or blob URL of cropped circular image
}

export interface BsiReportMetadata {
  category: CategoryType;
  format: FormatType;
  month: string; // e.g. "06"
  year: string; // e.g. "2026"
  canvasResolution: '1920x1080' | '1280x1024';
  highDpiScale: number; // 2 for High-DPI export
  comboLineMetric?: ComboMetricType;
  comboLineTitle?: string;
}
