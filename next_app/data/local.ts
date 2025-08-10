export type LocalItem = {
  // id: string
  Name: string
  ReleasedDate: string
  Genre: string
  Rating: string
  Likes: string
  Runtime: string
  Language: string
  Url: string
  Poster: string
  Files?:[]
}

// Sample Local data reflecting the shape you provided
export const LOCAL_ITEMS: LocalItem[] = [
  {
    // id: "l_sample_1",
    Name: "Hunting Daze",
    ReleasedDate: "2024 [FRENCH]",
    Genre: "Mystery / Thriller",
    Rating: "⭐",
    Likes: "3",
    Runtime: "1 hr 16 min",
    Language: "French 2.0",
    Url: "https://yts.mx/movies/hunting-daze-2024",
    Poster: "https://img.yts.mx/assets/images/movies/hunting_daze_2024/medium-cover.jpg",
  },
  {
    // id: "l_sample_2",
    Name: "Neon Alley",
    ReleasedDate: "2023 [ENGLISH]",
    Genre: "Action / Crime",
    Rating: "⭐⭐⭐",
    Likes: "124",
    Runtime: "1 hr 48 min",
    Language: "English 5.1",
    Url: "https://example.com/neon-alley",
    Poster: "/neon-action-poster.png",
  },
  {
    // id: "l_sample_3",
    Name: "Silent Shores",
    ReleasedDate: "2022 [HINDI]",
    Genre: "Drama",
    Rating: "⭐⭐",
    Likes: "56",
    Runtime: "1 hr 41 min",
    Language: "Hindi 2.0",
    Url: "https://example.com/silent-shores",
    Poster: "/indie-drama-poster.png",
  },
]
