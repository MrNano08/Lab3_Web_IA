function getRecentRule(preferences) {
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

function buildPrompt(preferences, baseResults) {
  const compactResults = baseResults.slice(0, 8).map((item) => ({
    id: item.id,
    type: item.type,
    title: item.title,
    creator: item.creator,
    year: item.year,
    genre: item.genre,
    description: item.description,
    reason: item.reason,
    imageUrl: item.imageUrl || "",
    score: item.score || 0,
  }));

  return `
Eres un recomendador de películas y libros.

Debes elegir y ordenar recomendaciones usando los filtros del usuario.

Reglas obligatorias:
- Recomienda solo según el tipo solicitado: movies, books o both.
- Si el usuario pide "movies", no devuelvas libros.
- Si el usuario pide "books", no devuelvas películas.
- Si el usuario pide "both", puedes devolver películas y libros.
- ${getRecentRule(preferences)}
- Respeta el género solicitado.
- Respeta autor, director, actor o palabra clave si existe.
- Usa preferiblemente los resultados base.
- Si usas resultados base, conserva su imageUrl.
- No inventes imageUrl si no tienes una.
- Devuelve máximo 6 recomendaciones.
- Devuelve únicamente JSON válido.
- No agregues texto fuera del JSON.

Preferencias del usuario:
${JSON.stringify(preferences)}

Resultados base:
${JSON.stringify(compactResults)}

Formato exacto:
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

function cleanJson(text) {
  return text
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();
}

function isQuotaError(status, body) {
  return (
    status === 429 ||
    body.includes("quota") ||
    body.includes("RESOURCE_EXHAUSTED") ||
    body.includes("rate limit")
  );
}

function extractGeminiText(data) {
  return (
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("") || ""
  );
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
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 600,
            responseMimeType: "application/json",
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
      parsed = JSON.parse(cleanJson(outputText));
    } catch (error) {
      console.error("GEMINI_JSON_PARSE_ERROR", outputText);

      return res.status(200).json({
        source: "local",
        message:
          "Modo local: Gemini respondió, pero el formato JSON no fue válido. Se muestran recomendaciones locales.",
        recommendations: [],
      });
    }

    return res.status(200).json({
      source: "ai",
      message: "Modo IA: recomendaciones generadas usando Google Gemini.",
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations
        : [],
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