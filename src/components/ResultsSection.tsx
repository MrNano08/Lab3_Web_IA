import type { Recommendation } from "../types";
import { RecommendationCard } from "./RecommendationCard";

interface ResultsSectionProps {
  recommendations: Recommendation[];
}

export function ResultsSection({ recommendations }: ResultsSectionProps) {
  return (
    <section className="results-section">
      <div className="results-header">
        <div>
          <span className="eyebrow">Resultados</span>
          <h2>Recomendaciones encontradas</h2>
        </div>

        <p>{recommendations.length} resultado(s)</p>
      </div>

      <div className="recommendations-grid">
        {recommendations.map((recommendation) => (
          <RecommendationCard
            key={`${recommendation.type}-${recommendation.id}`}
            recommendation={recommendation}
          />
        ))}
      </div>
    </section>
  );
}