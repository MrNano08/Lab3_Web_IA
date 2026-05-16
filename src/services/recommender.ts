import type {
  Recommendation,
  RecommendationResult,
  UserPreferences,
} from "../types";
import { searchBooks } from "./books";
import { searchMovies } from "./movies";
import { getAIRecommendations } from "./openai";

function getYear(item: Recommendation): number {
  return Number.parseInt(item.year, 10);
}

function matchesContentType(
  item: Recommendation,
  preferences: UserPreferences
): boolean {
  if (preferences.contentType === "movies") {
    return item.type === "movie";
  }

  if (preferences.contentType === "books") {
    return item.type === "book";
  }

  return item.type === "movie" || item.type === "book";
}

function matchesPeriod(
  item: Recommendation,
  preferences: UserPreferences
): boolean {
  const year = getYear(item);

  if (!Number.isFinite(year)) return false;

  if (preferences.period === "recent" && item.type === "movie") {
    return year >= 2024;
  }

  if (preferences.period === "recent" && item.type === "book") {
    return year >= 2020;
  }

  if (preferences.period === "classic" && item.type === "movie") {
    return year <= 2010;
  }

  if (preferences.period === "classic" && item.type === "book") {
    return year <= 2000;
  }

  return true;
}

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function matchesUserText(
  item: Recommendation,
  preferences: UserPreferences
): boolean {
  const query = normalize(preferences.creator);

  if (!query) return true;

  const target = normalize(
    `${item.title} ${item.creator} ${item.genre} ${item.description} ${item.reason}`
  );

  return target.includes(query);
}

function sanitizeFinalResults(
  recommendations: Recommendation[],
  preferences: UserPreferences,
  limit: number
): Recommendation[] {
  const unique = new Map<string, Recommendation>();

  recommendations
    .filter((item) => matchesContentType(item, preferences))
    .filter((item) => matchesPeriod(item, preferences))
    .filter((item) => matchesUserText(item, preferences))
    .forEach((item) => {
      const key = `${item.type}-${normalize(item.title)}-${normalize(
        item.creator
      )}`;

      if (!unique.has(key)) {
        unique.set(key, item);
      }
    });

  return Array.from(unique.values())
    .sort((a, b) => {
      const scoreDiff = (b.score ?? 0) - (a.score ?? 0);

      if (scoreDiff !== 0) return scoreDiff;

      return getYear(b) - getYear(a);
    })
    .slice(0, limit);
}

function limitByContentType(
  recommendations: Recommendation[],
  preferences: UserPreferences
): Recommendation[] {
  if (preferences.contentType === "movies") {
    return recommendations.filter((item) => item.type === "movie").slice(0, 1);
  }

  if (preferences.contentType === "books") {
    return recommendations.filter((item) => item.type === "book").slice(0, 1);
  }

  const movie = recommendations.find((item) => item.type === "movie");
  const book = recommendations.find((item) => item.type === "book");

  return [movie, book].filter((item): item is Recommendation => Boolean(item));
}

export async function getRecommendations(
  preferences: UserPreferences
): Promise<RecommendationResult> {
  const results: Recommendation[] = [];

  if (
    preferences.contentType === "movies" ||
    preferences.contentType === "both"
  ) {
    const movies = await searchMovies(preferences);
    results.push(...movies);
  }

  if (
    preferences.contentType === "books" ||
    preferences.contentType === "both"
  ) {
    const books = await searchBooks(preferences);
    results.push(...books);
  }

  const baseResults = sanitizeFinalResults(results, preferences, 12);

  const aiResult = await getAIRecommendations(preferences, baseResults);

  const finalResults = limitByContentType(
    sanitizeFinalResults(aiResult.recommendations, preferences, 12),
    preferences
  );

  const fallbackResults = limitByContentType(
    sanitizeFinalResults(baseResults, preferences, 12),
    preferences
  );

  return {
    source: aiResult.source,
    message: aiResult.message,
    recommendations: finalResults.length > 0 ? finalResults : fallbackResults,
  };
}