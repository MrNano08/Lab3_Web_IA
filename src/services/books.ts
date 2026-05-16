import type { Recommendation, UserPreferences } from "../types";

const BOOKS: Recommendation[] = [
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
      "Encaja si busca ciencia ficción reciente, ágil, técnica y con sentido de aventura.",
    imageUrl:
      "https://covers.openlibrary.org/b/isbn/9780593135204-L.jpg",
  },
  {
    id: "book-the-ministry-for-the-future",
    type: "book",
    title: "The Ministry for the Future",
    creator: "Kim Stanley Robinson",
    year: "2020",
    genre: "Ciencia ficción / Clima / Política",
    description:
      "Una novela especulativa sobre crisis climática, decisiones políticas y futuros posibles.",
    reason:
      "Funciona para quien quiere ciencia ficción reciente, seria y centrada en problemas globales.",
    imageUrl:
      "https://covers.openlibrary.org/b/isbn/9780316300131-L.jpg",
  },
  {
    id: "book-mexican-gothic",
    type: "book",
    title: "Mexican Gothic",
    creator: "Silvia Moreno-Garcia",
    year: "2020",
    genre: "Terror / Misterio / Gótico",
    description:
      "Una joven viaja a una mansión aislada para descubrir qué ocurre con su prima recién casada.",
    reason:
      "Buena opción si busca terror reciente, misterio y atmósfera gótica.",
    imageUrl:
      "https://covers.openlibrary.org/b/isbn/9780525620785-L.jpg",
  },
  {
    id: "book-the-invisible-life",
    type: "book",
    title: "The Invisible Life of Addie LaRue",
    creator: "V. E. Schwab",
    year: "2020",
    genre: "Fantasía / Romance / Drama",
    description:
      "Una mujer hace un trato que le permite vivir durante siglos, pero nadie puede recordarla.",
    reason:
      "Recomendada si busca fantasía reciente, emocional y con romance.",
    imageUrl:
      "https://covers.openlibrary.org/b/isbn/9780765387561-L.jpg",
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
    imageUrl:
      "https://covers.openlibrary.org/b/isbn/9781250899651-L.jpg",
  },
  {
    id: "book-yellowface",
    type: "book",
    title: "Yellowface",
    creator: "R. F. Kuang",
    year: "2023",
    genre: "Drama / Sátira / Literatura contemporánea",
    description:
      "Una escritora toma una decisión cuestionable que expone ambición, identidad y mercado editorial.",
    reason:
      "Sirve si busca algo reciente, crítico y con temas contemporáneos.",
    imageUrl:
      "https://covers.openlibrary.org/b/isbn/9780063250833-L.jpg",
  },
  {
    id: "book-fourth-wing",
    type: "book",
    title: "Fourth Wing",
    creator: "Rebecca Yarros",
    year: "2023",
    genre: "Fantasía / Romance / Aventura",
    description:
      "Una joven entra a una academia militar de jinetes de dragones donde debe sobrevivir y demostrar su capacidad.",
    reason:
      "Buena opción si quiere fantasía reciente, romance y acción.",
    imageUrl:
      "https://covers.openlibrary.org/b/isbn/9781649374042-L.jpg",
  },
  {
    id: "book-tomorrow-tomorrow",
    type: "book",
    title: "Tomorrow, and Tomorrow, and Tomorrow",
    creator: "Gabrielle Zevin",
    year: "2022",
    genre: "Drama / Contemporáneo",
    description:
      "Dos amigos construyen una relación creativa alrededor del diseño de videojuegos y los cambios de la vida adulta.",
    reason:
      "Encaja si busca una lectura reciente, humana y relacionada con creatividad y tecnología.",
    imageUrl:
      "https://covers.openlibrary.org/b/isbn/9780593321201-L.jpg",
  },
  {
    id: "book-dune",
    type: "book",
    title: "Dune",
    creator: "Frank Herbert",
    year: "1965",
    genre: "Ciencia ficción / Política",
    description:
      "Una familia noble llega a un planeta desértico clave para el poder económico y político del universo.",
    reason:
      "Conviene si busca ciencia ficción extensa, estratégica y con construcción de mundo.",
    imageUrl:
      "https://covers.openlibrary.org/b/isbn/9780441172719-L.jpg",
  },
  {
    id: "book-the-hobbit",
    type: "book",
    title: "The Hobbit",
    creator: "J. R. R. Tolkien",
    year: "1937",
    genre: "Fantasía / Aventura",
    description:
      "Bilbo Bolsón inicia un viaje inesperado junto a un grupo de enanos para recuperar un tesoro.",
    reason:
      "Buena opción para fantasía accesible, aventura y lectura de dificultad moderada.",
    imageUrl:
      "https://covers.openlibrary.org/b/isbn/9780547928227-L.jpg",
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
  let score = 0;

  const genre = normalize(preferences.genre);
  const text = normalize(
    `${item.title} ${item.creator} ${item.genre} ${item.description} ${item.reason}`
  );

  if (genre && normalize(item.genre).includes(genre)) score += 5;

  if (preferences.creator && matchesText(item, preferences.creator)) {
    score += 4;
  }

  if (preferences.period === "recent" && getYear(item) >= 2020) score += 5;
  if (preferences.period === "classic" && getYear(item) <= 2000) score += 3;

  if (preferences.mood === "light" && /(entretenida|aventura|romance|agil)/.test(text)) {
    score += 2;
  }

  if (preferences.mood === "deep" && /(politica|crisis|critico|humana|seria)/.test(text)) {
    score += 2;
  }

  if (preferences.mood === "exciting" && /(aventura|accion|sobrevivir|dragones|misterio)/.test(text)) {
    score += 2;
  }

  if (preferences.mood === "thoughtful" && /(critico|problemas globales|contemporaneos|politica)/.test(text)) {
    score += 2;
  }

  if (preferences.mood === "family" && /(aventura|fantasia|entretenida)/.test(text)) {
    score += 1;
  }

  if (preferences.length === "short" && /(yellowface|mexican gothic)/.test(text)) {
    score += 1;
  }

  if (preferences.length === "long" && /(dune|ministry|fourth wing|sanderson)/.test(text)) {
    score += 1;
  }

  return score;
}

export async function searchBooks(preferences: UserPreferences): Promise<Recommendation[]> {
  const genre = normalize(preferences.genre);

  const results = BOOKS
    .filter((item) => matchesPeriod(item, preferences))
    .filter((item) => {
      const genreOk = !genre || normalize(item.genre).includes(genre);
      const textOk = matchesText(item, preferences.creator);

      return genreOk && textOk;
    })
    .map((item) => ({
      ...item,
      score: scoreBook(item, preferences),
    }))
    .sort((a, b) => {
      const scoreDiff = (b.score ?? 0) - (a.score ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      return getYear(b) - getYear(a);
    });

  return results.slice(0, 8);
}