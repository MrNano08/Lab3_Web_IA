import type { VercelRequest, VercelResponse } from "@vercel/node";

type ContentType = "movies" | "books" | "both";
type Mood =
  | "light"
  | "deep"
  | "exciting"
  | "sad"
  | "thoughtful"
  | "family"
  | "any";
type Period = "recent" | "classic" | "any";
type LengthPreference = "short" | "medium" | "long" | "any";

interface UserPreferences {
  contentType: ContentType;
  genre: string;
  creator: string;
  mood: Mood;
  length: LengthPreference;
  period: Period;
}

interface Recommendation {
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

interface RequestBody {
  preferences: UserPreferences;
  baseResults: Recommendation[];
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

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
  const compactResults = baseResults.slice(0, 10).map((item) => ({
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

function cleanJson(text: string): string {
  return text
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();
}

function isQuotaError(status: number, body: string): boolean {
  return (
    status === 429 ||
    body.includes("insufficient_quota") ||
    body.includes("exceeded your current quota")
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({
      source: "local",
      message: "Método no permitido.",
      recommendations: [],
    });
  }

  if (!OPENAI_API_KEY) {
    return res.status(200).json({
      source: "local",
      message:
        "Modo local: no hay API key configurada en Vercel. El sistema no está usando IA en esta búsqueda.",
      recommendations: [],
    });
  }

  const body = req.body as RequestBody;
  const { preferences, baseResults } = body;

  if (!preferences || !Array.isArray(baseResults)) {
    return res.status(400).json({
      source: "local",
      message: "Solicitud inválida.",
      recommendations: [],
    });
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
        input: buildPrompt(preferences, baseResults),
        temperature: 0.2,
        max_output_tokens: 900,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      if (isQuotaError(response.status, errorText)) {
        return res.status(200).json({
          source: "local",
          message:
            "Modo local: la IA no está disponible porque la cuenta API no tiene cuota o saldo suficiente.",
          recommendations: [],
        });
      }

      return res.status(200).json({
        source: "local",
        message:
          "Modo local: ocurrió un error al consultar la IA. Se muestran recomendaciones locales.",
        recommendations: [],
      });
    }

    const data = await response.json();

    const outputText =
      typeof data.output_text === "string"
        ? data.output_text
        : data.output?.[0]?.content?.[0]?.text ?? "";

    if (!outputText) {
      return res.status(200).json({
        source: "local",
        message:
          "Modo local: la IA respondió sin contenido válido. Se muestran recomendaciones locales.",
        recommendations: [],
      });
    }

    const parsed = JSON.parse(cleanJson(outputText));

    return res.status(200).json({
      source: "ai",
      message: "Modo IA: recomendaciones generadas usando inteligencia artificial.",
      recommendations: parsed.recommendations ?? [],
    });
  } catch {
    return res.status(200).json({
      source: "local",
      message:
        "Modo local: no se pudo conectar con la IA. Se muestran recomendaciones locales.",
      recommendations: [],
    });
  }
}