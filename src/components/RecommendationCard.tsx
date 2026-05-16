import type { Recommendation } from "../types";

interface RecommendationCardProps {
  recommendation: Recommendation;
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const label = recommendation.type === "movie" ? "Película" : "Libro";

  return (
    <article className="recommendation-card">
      <div className="cover-frame">
        {recommendation.imageUrl ? (
          <img
            src={recommendation.imageUrl}
            alt={`Carátula de ${recommendation.title}`}
            className="cover-image"
            loading="lazy"
          />
        ) : (
          <div className="cover-placeholder">
            <span>{recommendation.type === "movie" ? "🎬" : "📚"}</span>
            <strong>{label}</strong>
          </div>
        )}
      </div>

      <div className="card-content">
        <div className="card-topline">
          <span className={`content-badge ${recommendation.type}`}>{label}</span>
          <span className="year">{recommendation.year}</span>
        </div>

        <h3>{recommendation.title}</h3>
        <p className="creator">{recommendation.creator}</p>
        <p className="genre">{recommendation.genre}</p>
        <p className="description">{recommendation.description}</p>

        <div className="reason-box">
          <strong>Por qué encaja:</strong>
          <span>{recommendation.reason}</span>
        </div>
      </div>
    </article>
  );
}