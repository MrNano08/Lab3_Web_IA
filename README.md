# Proyecto Recomendaciones IA

Aplicación React + TypeScript + Vite para recomendar películas, libros o ambos usando IA.

## Ejecutar

```bash
npm install
npm run dev
```

## Usar IA real

Copia `.env.example` como `.env` y coloca tu API key:

```bash
VITE_OPENAI_API_KEY=tu_api_key
VITE_OPENAI_MODEL=gpt-4.1-mini
```

Nota: esto es aceptable para una demostración académica local. Para producción, la API key no debe ir en el frontend; debe ir en un backend/proxy.

## Estructura principal

```txt
src/components/PreferenceForm.tsx
src/components/RecommendationCard.tsx
src/components/ResultsSection.tsx
src/services/books.ts
src/services/movies.ts
src/services/openai.ts
src/services/recommender.ts
src/types.ts
```
