import type { Recommendation, UserPreferences } from "../types";

interface OpenLibraryDoc {
  key?: string;
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  subject?: string[];
  cover_i?: number;
  isbn?: string[];
}

interface OpenLibraryResponse {
  docs?: OpenLibraryDoc[];
}

const LOCAL_BOOKS: Recommendation[] = [
  {
    id: "book-project-hail-mary",
    type: "book",
    title: "Project Hail Mary",
    creator: "Andy Weir",
    year: "2021",
    genre: "Ciencia ficción / Aventura",
    description:
      "Un científico despierta en una misión espacial crítica y debe reconstruir lo ocurrido para intentar salvar a la humanidad.",
    reason:
      "Encaja si busca ciencia ficción reciente, ágil, técnica y con aventura.",
    imageUrl: "https://covers.openlibrary.org/b/isbn/9780593135204-L.jpg",
  },
  {
    id: "book-the-ministry-for-the-future",
    type: "book",
    title: "The Ministry for the Future",
    creator: "Kim Stanley Robinson",
    year: "2020",
    genre: "Ciencia ficción / Política / Clima",
    description:
      "Una novela especulativa sobre crisis climática, política y futuros posibles.",
    reason:
      "Funciona para quien quiere ciencia ficción reciente, seria y crítica.",
    imageUrl: "https://covers.openlibrary.org/b/isbn/9780316300131-L.jpg",
  },
  {
    id: "book-mexican-gothic",
    type: "book",
    title: "Mexican Gothic",
    creator: "Silvia Moreno-Garcia",
    year: "2020",
    genre: "Terror / Misterio / Gótico",
    description:
      "Una joven viaja a una mansión aislada para descubrir qué ocurre con su prima.",
    reason:
      "Buena opción si busca terror reciente, misterio y atmósfera gótica.",
    imageUrl: "https://covers.openlibrary.org/b/isbn/9780525620785-L.jpg",
  },
  {
    id: "book-the-invisible-life",
    type: "book",
    title: "The Invisible Life of Addie LaRue",
    creator: "V. E. Schwab",
    year: "2020",
    genre: "Fantasía / Romance / Drama",
    description:
      "Una mujer vive durante siglos, pero nadie puede recordarla.",
    reason:
      "Recomendada si busca fantasía reciente, emocional y con romance.",
    imageUrl: "https://covers.openlibrary.org/b/isbn/9780765387561-L.jpg",
  },
  {
    id: "book-tress",
    type: "book",
    title: "Tress of the Emerald Sea",
    creator: "Brandon Sanderson",
    year: "2023",
    genre: "Fantasía / Aventura",
    description:
      "Una joven emprende un viaje por mares peligrosos para rescatar a alguien importante.",
    reason:
      "Encaja si quiere fantasía reciente, aventura y lectura entretenida.",
    imageUrl: "https://covers.openlibrary.org/b/isbn/9781250899651-L.jpg",
  },
  {
    id: "book-yellowface",
    type: "book",
    title: "Yellowface",
    creator: "R. F. Kuang",
    year: "2023",
    genre: "Drama / Sátira / Contemporáneo",
    description:
      "Una escritora toma una decisión cuestionable que expone ambición, identidad y mercado editorial.",
    reason:
      "Sirve si busca algo reciente, crítico y con temas contemporáneos.",
    imageUrl: "https://covers.openlibrary.org/b/isbn/9780063250833-L.jpg",
  },
  {
    id: "book-fourth-wing",
    type: "book",
    title: "Fourth Wing",
    creator: "Rebecca Yarros",
    year: "2023",
    genre: "Fantasía / Romance / Aventura",
    description:
      "Una joven entra a una academia militar de jinetes de dragones.",
    reason:
      "Buena opción si quiere fantasía reciente, romance y acción.",
    imageUrl: "https://covers.openlibrary.org/b/isbn/9781649374042-L.jpg",
  },
  {
    id: "book-tomorrow-tomorrow",
    type: "book",
    title: "Tomorrow, and Tomorrow, and Tomorrow",
    creator: "Gabrielle Zevin",
    year: "2022",
    genre: "Drama / Contemporáneo",
    description:
      "Dos amigos construyen una relación creativa alrededor del diseño de videojuegos.",
    reason:
      "Encaja si busca una lectura reciente, humana y relacionada con creatividad.",
    imageUrl: "https://covers.openlibrary.org/b/isbn/9780593321201-L.jpg",
  },
  {
    id: "book-dune",
    type: "book",
    title: "Dune",
    creator: "Frank Herbert",
    year: "1965",
    genre: "Ciencia ficción / Política",
    description:
      "Una familia noble llega a un planeta desértico clave para el poder del universo.",
    reason:
      "Conviene si busca ciencia ficción estratégica y construcción de mundo.",
    imageUrl: "https://covers.openlibrary.org/b/isbn/9780441172719-L.jpg",
  },
  {
    id: "book-the-hobbit",
    type: "book",
    title: "The Hobbit",
    creator: "J. R. R. Tolkien",
    year: "1937",
    genre: "Fantasía / Aventura",
    description:
      "Bilbo Bolsón inicia un viaje inesperado junto a un grupo de enanos.",
    reason:
      "Buena opción para fantasía accesible, aventura y lectura clásica.",
    imageUrl: "https://covers.openlibrary.org/b/isbn/9780547928227-L.jpg",
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

function mapGenreToEnglish(genre: string): string {
  const normalized = normalize(genre);

  const map: Record<string, string> = {
    accion: "action",
    aventura: "adventure",
    "ciencia ficcion": "science fiction",
    comedia: "humor",
    drama: "drama",
    fantasia: "fantasy",
    historico: "historical fiction",
    misterio: "mystery",
    romance: "romance",
    terror: "horror",
  };

  return map[normalized] || genre;
}

function buildSearchQuery(preferences: UserPreferences): string {
  const parts: string[] = [];

  if (preferences.creator.trim()) {
    parts.push(preferences.creator.trim());
  }

  if (preferences.genre.trim()) {
    parts.push(mapGenreToEnglish(preferences.genre));
  }

  if (preferences.mood === "exciting") {
    parts.push("adventure");
  }

  if (preferences.mood === "thoughtful" || preferences.mood === "deep") {
    parts.push("literary fiction");
  }

  if (preferences.mood === "family") {
    parts.push("young adult");
  }

  return parts.join(" ").trim() || "fiction";
}

function getCoverUrl(doc: OpenLibraryDoc): string {
  if (doc.cover_i) {
    return `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
  }

  const isbn = doc.isbn?.[0];

  if (isbn) {
    return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
  }

  return "";
}

function openLibraryToRecommendation(doc: OpenLibraryDoc): Recommendation | null {
  if (!doc.title || !doc.first_publish_year) return null;

  const subjects = doc.subject?.slice(0, 3).join(" / ") || "Libro";
  const author = doc.author_name?.[0] || "Autor no disponible";

  return {
    id: `openlibrary-${doc.key || normalize(doc.title).replace(/\s+/g, "-")}`,
    type: "book",
    title: doc.title,
    creator: author,
    year: String(doc.first_publish_year),
    genre: subjects,
    description: `Libro encontrado en Open Library relacionado con ${subjects}.`,
    reason:
      "Coincide con los filtros de búsqueda y se incluye como resultado ampliado desde Open Library.",
    imageUrl: getCoverUrl(doc),
    score: 1,
  };
}

function matchesPeriod(item: Recommendation, preferences: UserPreferences): boolean {
  const year = getYear(item);

  if (!Number.isFinite(year)) return false;

  if (preferences.period === "recent") {
    return year >= 2020;
  }

  if (preferences.period === "classic") {
    return year <= 2000;
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

function scoreBook(item: Recommendation, preferences: UserPreferences): number {
  let score = item.score ?? 0;

  const genre = normalize(preferences.genre);
  const text = normalize(
    `${item.title} ${item.creator} ${item.genre} ${item.description} ${item.reason}`
  );

  if (genre && text.includes(genre)) score += 6;

  const englishGenre = normalize(mapGenreToEnglish(preferences.genre));
  if (englishGenre && text.includes(englishGenre)) score += 5;

  if (preferences.creator && matchesText(item, preferences.creator)) {
    score += 5;
  }

  if (preferences.period === "recent" && getYear(item) >= 2020) score += 4;
  if (preferences.period === "classic" && getYear(item) <= 2000) score += 3;

  if (preferences.mood === "light" && /(humor|romance|adventure|young adult|fantasy)/.test(text)) {
    score += 2;
  }

  if (preferences.mood === "deep" && /(literary|drama|politic|philosophy|society|climate)/.test(text)) {
    score += 2;
  }

  if (preferences.mood === "exciting" && /(adventure|action|fantasy|dragon|mystery|thriller)/.test(text)) {
    score += 2;
  }

  if (preferences.mood === "thoughtful" && /(literary|politic|society|philosophy|science fiction)/.test(text)) {
    score += 2;
  }

  if (preferences.mood === "family" && /(juvenile|young adult|fantasy|adventure)/.test(text)) {
    score += 2;
  }

  return score;
}

async function searchOpenLibrary(
  preferences: UserPreferences
): Promise<Recommendation[]> {
  const query = buildSearchQuery(preferences);

  const params = new URLSearchParams({
    q: query,
    limit: "24",
    fields:
      "key,title,author_name,first_publish_year,subject,cover_i,isbn",
  });

  const response = await fetch(`https://openlibrary.org/search.json?${params}`);

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as OpenLibraryResponse;

  return (data.docs || [])
    .map(openLibraryToRecommendation)
    .filter((item): item is Recommendation => Boolean(item));
}

function uniqueBooks(items: Recommendation[]): Recommendation[] {
  const map = new Map<string, Recommendation>();

  for (const item of items) {
    const key = `${normalize(item.title)}-${normalize(item.creator)}`;

    if (!map.has(key)) {
      map.set(key, item);
    }
  }

  return Array.from(map.values());
}

export async function searchBooks(
  preferences: UserPreferences
): Promise<Recommendation[]> {
  let externalResults: Recommendation[] = [];

  try {
    externalResults = await searchOpenLibrary(preferences);
  } catch {
    externalResults = [];
  }

  const combined = uniqueBooks([...externalResults, ...LOCAL_BOOKS]);

  const filtered = combined
    .filter((item) => matchesPeriod(item, preferences))
    .filter((item) => matchesText(item, preferences.creator))
    .map((item) => ({
      ...item,
      score: scoreBook(item, preferences),
    }))
    .sort((a, b) => {
      const scoreDiff = (b.score ?? 0) - (a.score ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      return getYear(b) - getYear(a);
    });

  return filtered.slice(0, 12);
}