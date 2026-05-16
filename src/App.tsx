import { useState } from "react";
import "./App.css";
import { PreferenceForm } from "./components/PreferenceForm";
import { ResultsSection } from "./components/ResultsSection";
import { getRecommendations } from "./services/recommender";
import type {
  Recommendation,
  RecommendationSource,
  UserPreferences,
} from "./types";

function App() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [source, setSource] = useState<RecommendationSource | null>(null);
  const [sourceMessage, setSourceMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(preferences: UserPreferences) {
    setIsLoading(true);
    setHasSearched(true);
    setError("");
    setSource(null);
    setSourceMessage("");

    try {
      const result = await getRecommendations(preferences);

      setRecommendations(result.recommendations);
      setSource(result.source);
      setSourceMessage(result.message);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Ocurrió un error al buscar recomendaciones.";

      setError(message);
      setRecommendations([]);
      setSource(null);
      setSourceMessage("");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <div className="hero-layout">
        <PreferenceForm onSubmit={handleSearch} isLoading={isLoading} />

        <section className="content-panel">
          {source && sourceMessage && (
            <div
              className={
                source === "ai"
                  ? "source-alert source-alert-ai"
                  : "source-alert source-alert-local"
              }
            >
              <strong>{source === "ai" ? "Búsqueda con IA" : "Advertencia"}</strong>
              <span>{sourceMessage}</span>
            </div>
          )}

          {isLoading && (
            <div className="status-card">
              <h2>Buscando recomendaciones...</h2>
              <p>
                El sistema está analizando tus filtros para generar resultados.
              </p>
            </div>
          )}

          {!isLoading && error && (
            <div className="status-card error-card">
              <h2>No se pudieron cargar las recomendaciones</h2>
              <p>{error}</p>
            </div>
          )}

          {!isLoading && !error && recommendations.length > 0 && (
            <ResultsSection recommendations={recommendations} />
          )}

          {!isLoading && !error && hasSearched && recommendations.length === 0 && (
            <div className="status-card">
              <h2>No se encontraron resultados</h2>
              <p>
                Intenta cambiar el género, la época o quitar el autor/director.
              </p>
            </div>
          )}

          {!isLoading && !hasSearched && (
            <div className="status-card">
              <h2>Recomendaciones inteligentes</h2>
              <p>
                Selecciona si quieres películas, libros o ambos. El sistema
                intentará usar IA; si no está disponible, lo advertirá en pantalla.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default App;