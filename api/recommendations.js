function getRecentRule(preferences) {
  if (preferences.period !== "recent") {
    return "No apliques restricción estricta de año si el usuario no pidió contenido reciente.";
  }

  if (preferences.contentType === "movies") {
    return "Todas las películas deben ser del año 2024 o posteriores.";
  }

  if (preferences.contentType === "books") {
    return "Todos los libros deben ser del año 2020 o posteriores.";
  }

  return "Las películas deben ser del año 2024 o posteriores. Los libros deben ser del año 2020 o posteriores.";
}

function getContentRule(preferences) {
  if (preferences.contentType === "movies") {
    return "Devuelve únicamente películas. No incluyas libros.";
  }

  if (preferences.contentType === "books") {
    return "Devuelve únicamente libros. No incluyas películas.";
  }

  return "Puedes devolver películas y libros.";
}

function compactBaseResults(baseResults) {
  return baseResults.slice(0, 6).map((item) => ({
    id: item.id,
    type: item.type,
    title: item.title,
    creator: item.creator,
    year: item.year,
    genre: item.genre,
    imageUrl: item.imageUrl || "",
    score: item.score || 0,
  }));
}

function buildPrompt(preferences, baseResults) {
  const compactResults = compactBaseResults(baseResults);

  return `
Eres un recomendador de películas y libros.

Filtros del usuario:
${JSON.stringify(preferences)}

Resultados base disponibles:
${JSON.stringify(compactResults)}

Reglas:
- ${getContentRule(preferences)}
- ${getRecentRule(preferences)}
- Respeta el género, autor, director, actor o palabra clave si existen.
- Usa preferiblemente resultados base.
- Conserva imageUrl cuando exista.
- No inventes imageUrl.
- Devuelve entre 3 y 6 recomendaciones.
- Cada reason debe ser breve: máximo 22 palabras.
- Cada description debe ser breve: máximo 22 palabras.
- Devuelve solo JSON válido.
`;
}

const responseSchema = {
  type: "OBJECT",
  properties: {
    recommendations: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          type: { type: "STRING" },
          title: { type: "STRING" },
          creator: { type: "STRING" },
          year: { type: "STRING" },
          genre: { type: "STRING" },
          description: { type: "STRING" },
          reason: { type: "STRING" },
          imageUrl: { type: "STRING" },
          score: { type: "NUMBER" },
        },
        required: [
          "id",
          "type",
          "title",
          "creator",
          "year",
          "genre",
          "description",
          "reason",
          "imageUrl",
          "score",
        ],
      },
    },
  },
  required: ["recommendations"],
};

function cleanJson(text) {
  return text
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();
}

function extractJson(text) {
  const cleaned = cleanJson(text);

  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const possibleJson = cleaned.slice(firstBrace, lastBrace + 1);
      return JSON.parse(possibleJson);
    }

    throw new Error("No se pudo extraer JSON válido de la respuesta de Gemini.");
  }
}

function extractGeminiText(data) {
  return (
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("") || ""
  );
}

function isQuotaError(status, body) {
  return (
    status === 429 ||
    body.includes("quota") ||
    body.includes("RESOURCE_EXHAUSTED") ||
    body.includes("rate limit")
  );
}

function normalizeType(type) {
  if (type === "movie" || type === "book") return type;
  return "";
}

function normalizeRecommendation(item) {
  return {
    id: String(item.id || `${item.type}-${item.title}`),
    type: normalizeType(item.type),
    title: String(item.title || ""),
    creator: String(item.creator || ""),
    year: String(item.year || ""),
    genre: String(item.genre || ""),
    description: String(item.description || ""),
    reason: String(item.reason || ""),
    imageUrl: String(item.imageUrl || ""),
    score: Number(item.score || 0),
  };
}

function isValidRecommendation(item) {
  return (
    item &&
    (item.type === "movie" || item.type === "book") &&
    item.title &&
    item.creator &&
    item.year &&
    item.genre &&
    item.description &&
    item.reason
  );
}

function filterByPreferences(recommendations, preferences) {
  return recommendations.filter((item) => {
    const year = Number.parseInt(item.year, 10);

    if (!Number.isFinite(year)) return false;

    if (preferences.contentType === "movies" && item.type !== "movie") {
      return false;
    }

    if (preferences.contentType === "books" && item.type !== "book") {
      return false;
    }

    if (preferences.period === "recent" && item.type === "movie" && year < 2024) {
      return false;
    }

    if (preferences.period === "recent" && item.type === "book" && year < 2020) {
      return false;
    }

    if (preferences.period === "classic" && item.type === "movie" && year > 2010) {
      return false;
    }

    if (preferences.period === "classic" && item.type === "book" && year > 2000) {
      return false;
    }

    return true;
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      source: "local",
      message: "Método no permitido.",
      recommendations: [],
    });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

  if (!GEMINI_API_KEY) {
    return res.status(200).json({
      source: "local",
      message:
        "Modo local: no hay GEMINI_API_KEY configurada en Vercel. El sistema no está usando IA.",
      recommendations: [],
    });
  }

  const { preferences, baseResults } = req.body || {};

  if (!preferences || !Array.isArray(baseResults)) {
    return res.status(400).json({
      source: "local",
      message: "Solicitud inválida.",
      recommendations: [],
    });
  }

  try {
    const prompt = buildPrompt(preferences, baseResults);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.15,
            maxOutputTokens: 900,
            responseMimeType: "application/json",
            responseSchema,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error("GEMINI_ERROR", response.status, errorText);

      if (isQuotaError(response.status, errorText)) {
        return res.status(200).json({
          source: "local",
          message:
            "Modo local: Gemini no está disponible porque se superó la cuota gratuita o el límite de uso.",
          recommendations: [],
        });
      }

      return res.status(200).json({
        source: "local",
        message: `Modo local: Gemini respondió con error ${
          response.status
        }. Detalle: ${errorText.slice(0, 300)}`,
        recommendations: [],
      });
    }

    const data = await response.json();
    const outputText = extractGeminiText(data);

    if (!outputText) {
      return res.status(200).json({
        source: "local",
        message:
          "Modo local: Gemini respondió sin contenido válido. Se muestran recomendaciones locales.",
        recommendations: [],
      });
    }

    let parsed;

    try {
      parsed = extractJson(outputText);
    } catch (error) {
      console.error("GEMINI_JSON_PARSE_ERROR", outputText);

      return res.status(200).json({
        source: "local",
        message: `Modo local: Gemini respondió, pero el formato JSON no fue válido. Detalle: ${
          error instanceof Error ? error.message : String(error)
        }`,
        recommendations: [],
      });
    }

    const recommendations = Array.isArray(parsed.recommendations)
      ? parsed.recommendations
          .map(normalizeRecommendation)
          .filter(isValidRecommendation)
      : [];

    const filteredRecommendations = filterByPreferences(
      recommendations,
      preferences
    ).slice(0, preferences.contentType === "both" ? 8 : 6);

    if (filteredRecommendations.length === 0) {
      return res.status(200).json({
        source: "local",
        message:
          "Modo local: Gemini respondió, pero no devolvió recomendaciones válidas según los filtros.",
        recommendations: [],
      });
    }

    return res.status(200).json({
      source: "ai",
      message: "Modo IA: recomendaciones generadas usando Google Gemini.",
      recommendations: filteredRecommendations,
    });
  } catch (error) {
    console.error("INTERNAL_GEMINI_ERROR", error);

    return res.status(200).json({
      source: "local",
      message: `Modo local: error interno al consultar Gemini. Detalle: ${
        error instanceof Error ? error.message : String(error)
      }`,
      recommendations: [],
    });
  }
}