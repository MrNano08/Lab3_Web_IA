import type {
  AIResponse,
  Recommendation,
  RecommendationResult,
  UserPreferences,
} from "../types";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_MODEL = import.meta.env.VITE_OPENAI_MODEL || "gpt-4.1-mini";

function cleanJson(text: string): string {
  return text
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();
}

function getRecentRule(preferences: UserPreferences): string {
  if (preferences.period !== "recent") {
    return "Si el usuario no pidió contenido reciente, no apliques restricción estricta de año.";
  }

  if (preferences.contentType === "movies") {
    return "El usuario pidió contenido reciente. TODAS las películas deben ser del año 2024 o posteriores.";
  }

  if (preferences.contentType === "books") {
    return "El usuario pidió contenido reciente. TODOS los libros deben ser del año 2020 o posteriores.";
  }

  return "El usuario pidió contenido reciente. Las películas deben ser del año 2024 o posteriores. Los libros deben ser del año 2020 o posteriores.";
}

function buildPrompt(preferences: UserPreferences, baseResults: Recommendation[]): string {
  const compactResults = baseResults.map((item) => ({
    id: item.id,
    type: item.type,
    title: item.title,
    creator: item.creator,
    year: item.year,
    genre: item.genre,
    description: item.description,
    reason: item.reason,
    imageUrl: item.imageUrl || "",
    score: item.score ?? 0,
  }));

  return `
Actúa como un recomendador de películas y libros.

Reglas obligatorias:
- Recomienda solo según el tipo solicitado: movies, books o both.
- Si el usuario pide "movies", no devuelvas libros.
- Si el usuario pide "books", no devuelvas películas.
- Si el usuario pide "both", puedes devolver películas y libros.
- ${getRecentRule(preferences)}
- Usa preferiblemente los resultados base entregados.
- Si usas resultados base, conserva su imageUrl.
- Devuelve únicamente JSON válido.
- No agregues explicación fuera del JSON.
- Devuelve máximo 6 recomendaciones.

Preferencias:
${JSON.stringify(preferences)}

Resultados base:
${JSON.stringify(compactResults)}

Formato:
{
  "recommendations": [
    {
      "id": "string",
      "type": "movie" | "book",
      "title": "string",
      "creator": "string",
      "year": "string",
      "genre": "string",
      "description": "string",
      "reason": "string",
      "imageUrl": "string",
      "score": number
    }
  ]
}
`;
}

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

function isQuotaError(status: number, body: string): boolean {
  return (
    status === 429 ||
    body.includes("insufficient_quota") ||
    body.includes("exceeded your current quota")
  );
}

export async function getAIRecommendations(
  preferences: UserPreferences,
  baseResults: Recommendation[]
): Promise<RecommendationResult> {
  const fallbackResults = baseResults.slice(
    0,
    preferences.contentType === "both" ? 8 : 6
  );

  if (!OPENAI_API_KEY || OPENAI_API_KEY.trim() === "") {
    return {
      source: "local",
      message:
        "Modo local: no hay API key configurada. El sistema no está usando IA en esta búsqueda.",
      recommendations: fallbackResults,
    };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: buildPrompt(preferences, baseResults.slice(0, 10)),
        temperature: 0.2,
        max_output_tokens: 900,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      if (isQuotaError(response.status, errorText)) {
        return {
          source: "local",
          message:
            "Modo local: la IA no está disponible porque la cuenta API no tiene cuota o saldo suficiente.",
          recommendations: fallbackResults,
        };
      }

      return {
        source: "local",
        message:
          "Modo local: ocurrió un error al consultar la IA. Se muestran recomendaciones locales.",
        recommendations: fallbackResults,
      };
    }

    const data = await response.json();

    const outputText =
      typeof data.output_text === "string"
        ? data.output_text
        : data.output?.[0]?.content?.[0]?.text ?? "";

    if (!outputText) {
      return {
        source: "local",
        message:
          "Modo local: la IA respondió sin recomendaciones válidas. Se muestran resultados locales.",
        recommendations: fallbackResults,
      };
    }

    const parsed = JSON.parse(cleanJson(outputText));
    const recommendations = sanitizeAIResponse(parsed, baseResults);

    if (recommendations.length === 0) {
      return {
        source: "local",
        message:
          "Modo local: la IA no devolvió resultados válidos. Se muestran recomendaciones locales.",
        recommendations: fallbackResults,
      };
    }

    return {
      source: "ai",
      message: "Modo IA: recomendaciones generadas usando inteligencia artificial.",
      recommendations,
    };
  } catch {
    return {
      source: "local",
      message:
        "Modo local: no se pudo conectar con la IA. Se muestran recomendaciones locales.",
      recommendations: fallbackResults,
    };
  }
}