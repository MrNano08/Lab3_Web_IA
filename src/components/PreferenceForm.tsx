import { useState } from "react";
import type {
  ContentType,
  LengthPreference,
  Mood,
  Period,
  UserPreferences,
} from "../types";

interface PreferenceFormProps {
  onSubmit: (preferences: UserPreferences) => void | Promise<void>;
  isLoading: boolean;
}

export function PreferenceForm({ onSubmit, isLoading }: PreferenceFormProps) {
  const [contentType, setContentType] = useState<ContentType>("both");
  const [genre, setGenre] = useState("Ciencia ficción");
  const [creator, setCreator] = useState("");
  const [mood, setMood] = useState<Mood>("any");
  const [length, setLength] = useState<LengthPreference>("any");
  const [period, setPeriod] = useState<Period>("any");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const preferences: UserPreferences = {
      contentType,
      genre,
      creator: creator.trim(),
      mood,
      length,
      period,
    };

    onSubmit(preferences);
  }

  return (
    <section className="preference-card">
      <div className="form-header">
        <span className="eyebrow">Recomendador IA</span>
        <h1>Encuentra películas y libros</h1>
        <p>
          Selecciona pocos filtros y el sistema intentará generar recomendaciones
          usando inteligencia artificial.
        </p>
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Tipo de contenido
          <select
            value={contentType}
            onChange={(event) =>
              setContentType(event.target.value as ContentType)
            }
            disabled={isLoading}
          >
            <option value="both">Películas y libros</option>
            <option value="movies">Solo películas</option>
            <option value="books">Solo libros</option>
          </select>
        </label>

        <label>
          Género
          <select
            value={genre}
            onChange={(event) => setGenre(event.target.value)}
            disabled={isLoading}
          >
            <option value="Acción">Acción</option>
            <option value="Aventura">Aventura</option>
            <option value="Ciencia ficción">Ciencia ficción</option>
            <option value="Comedia">Comedia</option>
            <option value="Drama">Drama</option>
            <option value="Fantasía">Fantasía</option>
            <option value="Histórico">Histórico</option>
            <option value="Misterio">Misterio</option>
            <option value="Romance">Romance</option>
            <option value="Terror">Terror</option>
          </select>
        </label>

        <label>
          Autor, director, actor o palabra clave
          <input
            type="text"
            value={creator}
            onChange={(event) => setCreator(event.target.value)}
            placeholder="Ejemplo: Nolan, Tolkien, dragones..."
            disabled={isLoading}
          />
        </label>

        <label>
          Estado de ánimo
          <select
            value={mood}
            onChange={(event) => setMood(event.target.value as Mood)}
            disabled={isLoading}
          >
            <option value="any">Sin preferencia</option>
            <option value="light">Algo ligero</option>
            <option value="deep">Algo profundo</option>
            <option value="exciting">Algo emocionante</option>
            <option value="sad">Algo triste</option>
            <option value="thoughtful">Algo para pensar</option>
            <option value="family">Algo familiar</option>
          </select>
        </label>

        <label>
          Duración o extensión
          <select
            value={length}
            onChange={(event) =>
              setLength(event.target.value as LengthPreference)
            }
            disabled={isLoading}
          >
            <option value="any">Sin preferencia</option>
            <option value="short">Corto</option>
            <option value="medium">Medio</option>
            <option value="long">Largo</option>
          </select>
        </label>

        <label>
          Época
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value as Period)}
            disabled={isLoading}
          >
            <option value="any">Sin preferencia</option>
            <option value="recent">Reciente</option>
            <option value="classic">Clásico</option>
          </select>
        </label>

        <button className="primary-button" type="submit" disabled={isLoading}>
          {isLoading ? "Buscando..." : "Buscar recomendaciones"}
        </button>
      </form>
    </section>
  );
}