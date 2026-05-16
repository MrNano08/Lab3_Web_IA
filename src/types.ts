export type ContentType = "movies" | "books" | "both";

export type Mood =
  | "light"
  | "deep"
  | "exciting"
  | "sad"
  | "thoughtful"
  | "family"
  | "any";

export type Period = "recent" | "classic" | "any";

export type LengthPreference = "short" | "medium" | "long" | "any";

export interface UserPreferences {
  contentType: ContentType;
  genre: string;
  creator: string;
  mood: Mood;
  length: LengthPreference;
  period: Period;
}

export interface Recommendation {
  id: string;
  type: "movie" | "book";
  title: string;
  creator: string;
  year: string;
  genre: string;
  description: string;
  reason: string;
  imageUrl?: string;
  score?: number;
}

export interface AIResponse {
  recommendations: Recommendation[];
}

export type RecommendationSource = "ai" | "local";

export interface RecommendationResult {
  source: RecommendationSource;
  message: string;
  recommendations: Recommendation[];
}