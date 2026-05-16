import type { Recommendation, UserPreferences } from "../types";

const MOVIES: Recommendation[] = [
  {
    id: "movie-dune-part-two",
    type: "movie",
    title: "Dune: Part Two",
    creator: "Denis Villeneuve",
    year: "2024",
    genre: "Ciencia ficción / Aventura / Drama",
    description:
      "Paul Atreides continúa su camino entre política, guerra, profecías y poder en Arrakis.",
    reason:
      "Encaja si busca ciencia ficción reciente, visualmente fuerte y con conflicto político.",
    imageUrl:
      "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
  },
  {
    id: "movie-furiosa",
    type: "movie",
    title: "Furiosa: A Mad Max Saga",
    creator: "George Miller",
    year: "2024",
    genre: "Acción / Aventura / Ciencia ficción",
    description:
      "Una historia de origen centrada en Furiosa dentro de un mundo desértico violento y caótico.",
    reason:
      "Funciona para quien quiere una película reciente, intensa y de ritmo alto.",
    imageUrl:
      "https://image.tmdb.org/t/p/w500/iADOJ8Zymht2JPMoy3R7xceZprc.jpg",
  },
  {
    id: "movie-inside-out-2",
    type: "movie",
    title: "Inside Out 2",
    creator: "Kelsey Mann",
    year: "2024",
    genre: "Animación / Comedia / Familiar",
    description:
      "Riley enfrenta nuevas emociones durante una etapa de cambios personales.",
    reason:
      "Recomendada si busca algo reciente, familiar, ligero y emocional.",
    imageUrl:
      "https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg",
  },
  {
    id: "movie-civil-war",
    type: "movie",
    title: "Civil War",
    creator: "Alex Garland",
    year: "2024",
    genre: "Drama / Acción / Distopía",
    description:
      "Un grupo de periodistas atraviesa un país dividido por un conflicto interno.",
    reason:
      "Sirve si busca una película reciente, tensa y con lectura social.",
    imageUrl:
      "https://image.tmdb.org/t/p/w500/sh7Rg8Er3tFcN9BpKIPOMvALgZd.jpg",
  },
  {
    id: "movie-the-fall-guy",
    type: "movie",
    title: "The Fall Guy",
    creator: "David Leitch",
    year: "2024",
    genre: "Acción / Comedia / Romance",
    description:
      "Un doble de riesgo se ve envuelto en una investigación mientras intenta recuperar una relación.",
    reason:
      "Buena opción si quiere algo reciente, entretenido, ligero y con acción.",
    imageUrl:
      "https://image.tmdb.org/t/p/w500/tSz1qsmSJon0rqjHBxXZmrotuse.jpg",
  },
  {
    id: "movie-godzilla-x-kong",
    type: "movie",
    title: "Godzilla x Kong: The New Empire",
    creator: "Adam Wingard",
    year: "2024",
    genre: "Acción / Ciencia ficción / Aventura",
    description:
      "Godzilla y Kong enfrentan una amenaza que puede alterar el equilibrio entre titanes.",
    reason:
      "Encaja si busca una película reciente, visual, directa y de gran espectáculo.",
    imageUrl:
      "https://image.tmdb.org/t/p/w500/z1p34vh7dEOnLDmyCrlUVLuoDzd.jpg",
  },
  {
    id: "movie-arrival",
    type: "movie",
    title: "Arrival",
    creator: "Denis Villeneuve",
    year: "2016",
    genre: "Ciencia ficción / Drama",
    description:
      "Una lingüista intenta comunicarse con visitantes extraterrestres mientras enfrenta decisiones personales complejas.",
    reason:
      "Funciona bien si busca ciencia ficción reflexiva, emocional y con ideas profundas.",
    imageUrl:
      "https://image.tmdb.org/t/p/w500/x2FJsf1ElAgr63Y3PNPtJrcmpoe.jpg",
  },
  {
    id: "movie-interstellar",
    type: "movie",
    title: "Interstellar",
    creator: "Christopher Nolan",
    year: "2014",
    genre: "Ciencia ficción / Aventura / Drama",
    description:
      "Un grupo de exploradores viaja por el espacio para encontrar una posible salida al futuro de la humanidad.",
    reason:
      "Adecuada para quien quiere una historia emocionante, visual y con temas familiares.",
    imageUrl:
      "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
  },
  {
    id: "movie-knives-out",
    type: "movie",
    title: "Knives Out",
    creator: "Rian Johnson",
    year: "2019",
    genre: "Misterio / Comedia",
    description:
      "Un detective investiga una muerte dentro de una familia llena de intereses ocultos.",
    reason:
      "Buena opción si quiere misterio accesible, ágil y con humor.",
    imageUrl:
      "https://image.tmdb.org/t/p/w500/pThyQovXQrw2m0s9x82twj48Jq4.jpg",
  },
  {
    id: "movie-spirited-away",
    type: "movie",
    title: "Spirited Away",
    creator: "Hayao Miyazaki",
    year: "2001",
    genre: "Fantasía / Aventura",
    description:
      "Una niña entra en un mundo fantástico y debe adaptarse para rescatar a sus padres.",
    reason:
      "Recomendada para fantasía imaginativa, visualmente rica y apta para varios públicos.",
    imageUrl:
      "https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
  },
];

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getYear(item: Recommendation): number {
  return Number.parseInt(item.year, 10);
}

function matchesPeriod(item: Recommendation, preferences: UserPreferences): boolean {
  const year = getYear(item);

  if (preferences.period === "recent") {
    return year >= 2024;
  }

  if (preferences.period === "classic") {
    return year <= 2010;
  }

  return true;
}

function matchesText(item: Recommendation, query: string): boolean {
  const cleanQuery = normalize(query);
  if (!cleanQuery) return true;

  const target = normalize(
    `${item.title} ${item.creator} ${item.genre} ${item.description} ${item.reason}`
  );

  return target.includes(cleanQuery);
}

function scoreMovie(item: Recommendation, preferences: UserPreferences): number {
  let score = 0;

  const genre = normalize(preferences.genre);
  const text = normalize(
    `${item.title} ${item.creator} ${item.genre} ${item.description} ${item.reason}`
  );

  if (genre && normalize(item.genre).includes(genre)) score += 5;

  if (preferences.creator && matchesText(item, preferences.creator)) {
    score += 4;
  }

  if (preferences.period === "recent" && getYear(item) >= 2024) score += 5;
  if (preferences.period === "classic" && getYear(item) <= 2010) score += 3;

  if (preferences.mood === "light" && /(comedia|familiar|liger|entretenid)/.test(text)) {
    score += 2;
  }

  if (preferences.mood === "deep" && /(profund|filosofic|reflexiv|drama|politic)/.test(text)) {
    score += 2;
  }

  if (preferences.mood === "exciting" && /(accion|aventura|intensa|ritmo alto|espectaculo)/.test(text)) {
    score += 2;
  }

  if (preferences.mood === "thoughtful" && /(pensar|social|politic|reflexiv|distopia)/.test(text)) {
    score += 2;
  }

  if (preferences.mood === "family" && /(familiar|animacion|varios publicos)/.test(text)) {
    score += 2;
  }

  return score;
}

export async function searchMovies(preferences: UserPreferences): Promise<Recommendation[]> {
  const genre = normalize(preferences.genre);

  const results = MOVIES
    .filter((item) => matchesPeriod(item, preferences))
    .filter((item) => {
      const genreOk = !genre || normalize(item.genre).includes(genre);
      const textOk = matchesText(item, preferences.creator);

      return genreOk && textOk;
    })
    .map((item) => ({
      ...item,
      score: scoreMovie(item, preferences),
    }))
    .sort((a, b) => {
      const scoreDiff = (b.score ?? 0) - (a.score ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      return getYear(b) - getYear(a);
    });

  return results.slice(0, 8);
}