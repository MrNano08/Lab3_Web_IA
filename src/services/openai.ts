import type {
  AIResponse,
  Recommendation,
  RecommendationResult,
  UserPreferences,
} from "../types";

function isValidRecommendation(item: unknown): item is Recommendation {
  if (!item || typeof item !== "object") return false;

  const record = item as Record<string, unknown>;

  return (
    typeof record.id === "string" &&
    (record.type === "movie" || record.type === "book") &&
    typeof record.title === "string" &&
    typeof record.creator === "string" &&
    typeof record.year === "string" &&
    typeof record.genre === "string" &&
    typeof record.description === "string" &&
    typeof record.reason === "string"
  );
}

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function findMatchingBaseResult(
  recommendation: Recommendation,
  baseResults: Recommendation[]
): Recommendation | undefined {
  const title = normalize(recommendation.title);

  return baseResults.find((item) => normalize(item.title) === title);
}

function sanitizeAIResponse(
  data: unknown,
  baseResults: Recommendation[]
): Recommendation[] {
  const response = data as Partial<AIResponse>;

  if (!Array.isArray(response.recommendations)) return [];

  return response.recommendations
    .filter(isValidRecommendation)
    .map((item) => {
      const baseMatch = findMatchingBaseResult(item, baseResults);

      return {
        ...item,
        imageUrl: item.imageUrl || baseMatch?.imageUrl || "",
        score: typeof item.score === "number" ? item.score : baseMatch?.score ?? 0,
      };
    });
}

export async function getAIRecommendations(
  preferences: UserPreferences,
  baseResults: Recommendation[]
): Promise<RecommendationResult> {
  const fallbackResults = baseResults.slice(
    0,
    preferences.contentType === "both" ? 8 : 6
  );

  try {
    const response = await fetch("/api/recommendations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        preferences,
        baseResults,
      }),
    });

    if (!response.ok) {
      return {
        source: "local",
        message:
          "Modo local: no se encontró el endpoint /api/recommendations. Revisa que exista api/recommendations.js en la raíz del proyecto.",
        recommendations: fallbackResults,
      };
    }

    const data = await response.json();

    const aiRecommendations = sanitizeAIResponse(data, baseResults);

    if (data.source === "ai" && aiRecommendations.length > 0) {
      return {
        source: "ai",
        message:
          data.message ||
          "Modo IA: recomendaciones generadas usando inteligencia artificial.",
        recommendations: aiRecommendations,
      };
    }

    return {
      source: "local",
      message:
        data.message ||
        "Modo local: la IA no devolvió resultados válidos. Se muestran recomendaciones locales.",
      recommendations: fallbackResults,
    };
  } catch {
    return {
      source: "local",
      message:
        "Modo local: no se pudo conectar con el servidor. Se muestran recomendaciones locales.",
      recommendations: fallbackResults,
    };
  }
}