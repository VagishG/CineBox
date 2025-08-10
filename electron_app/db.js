// db.js
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import path from "path";
import { app } from "electron"
import WebTorrent from 'webtorrent'
import fs from 'fs';

const file = path.join(app.getPath("userData"), "db.json");
const adapter = new JSONFile(file);
const db = new Low(adapter, { movies: [] });


export async function addMovie(movie) {
  await db.read();
  if (!db.data) db.data = { movies: [] };
  if (!db.data.movies) db.data.movies = [];

  const exists = db.data.movies.some(m => m?.tmdbRaw?.id === movie?.tmdbRaw?.id);
  if (exists) {
    console.log("Movie already exists");
    return;
  }
  db.data.movies.push(movie);
  await db.write();
}

// export async function addPath(path){
//     const path = await db.read();

//   // Make sure db.data exists
//   if (!db.data) db.data = { path: [] };

//   // Check if a movie with the same tmdb ID already exists
//   const exists = db.data.movies.some(m => m.tmdbRaw.id === movie.tmdbRaw.id);

//   if (!exists) {
//     db.data.movies.push(movie);
//     await db.write();
//   }
// }

export async function addSeries(series) {
  const shows = await db.read();

  // Make sure db.data exists
  if (!db.data) db.data = { shows: [] };

  // Check if a show with the same tmdb ID already exists
  const exists = db.data.shows.some((s) => s.tmdbRaw.id === series.tmdbRaw.id);

  if (!exists) {
    db.data.shows.push(series);
    await db.write();
  }
}

export async function getMovies() {
  await db.read();
  return db.data.movies || [];
}

export async function getSeries() {
  await db.read();
  return db.data.shows || [];
}


export async function downloadTorrent(magnetURI, fileName, event) {
  return new Promise((resolve, reject) => {
    const client = new WebTorrent()
    const downloadDir = '/home/noobhacker/Videos/CineBox/Movies/'

    client.add(magnetURI, { path: downloadDir }, torrent => {
      console.log(`Torrent info: ${torrent.name}`)

      let targetFile = fileName
        ? torrent.files.find(f => f.name.includes(fileName))
        : torrent.files[0]

      if (!targetFile) {
        client.destroy()
        return reject(new Error(`File "${fileName}" not found in torrent`))
      }

      const savePath = path.join(downloadDir, targetFile.name)

      const stream = targetFile.createReadStream()
      const writeStream = fs.createWriteStream(savePath)

      let downloaded = 0
      const total = targetFile.length

      stream.on('data', chunk => {
        downloaded += chunk.length
        // Send progress to renderer via IPC event
        const progressPercent = ((downloaded / total) * 100).toFixed(2)
        event.sender.send('torrent-download-progress', {
          progress: progressPercent,
          downloaded,
          total
        })
      })

      stream.pipe(writeStream)

      writeStream.on('finish', () => {
        console.log(`✅ Download complete: ${savePath}`)
        client.destroy()
        resolve(savePath)
      })

      writeStream.on('error', err => {
        client.destroy()
        reject(err)
      })
    })

    client.on('error', err => reject(err))
  })
}

// type MovieScanResult = {
//   file: string
//   localTitle: string
//   posterUrl: string
//   tmdbRaw: {
//     adult: boolean
//     backdrop_path: string | null
//     genre_ids: number[]
//     id: number
//     original_language: string
//     original_title: string
//     overview: string
//     popularity: number
//     poster_path: string | null
//     release_date: string
//     title: string
//     video: boolean
//     vote_average: number
//     vote_count: number
//   }
// }
