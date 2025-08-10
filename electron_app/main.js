import 'dotenv/config';
import { app, BrowserWindow, ipcMain } from 'electron';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';
import WebTorrent from 'webtorrent';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let MOVIES_DIR="/home/noobhacker/Videos/CineBox/Movies";

const client = new WebTorrent();
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_SEARCH_URL = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=`;
const TMDB_CONFIG_URL = `https://api.themoviedb.org/3/configuration?api_key=${TMDB_API_KEY}`;

console.log(`TMDB API Key: ${TMDB_API_KEY}`);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadURL('http://localhost:3000');
}

// Get current directory
ipcMain.handle('get-current-dir', () => {
  return process.cwd();
});

// Create folder
ipcMain.handle('create-folder', (event, folderPath) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    return `Folder created: ${folderPath}`;
  }
  return `Folder already exists: ${folderPath}`;
});

// Download file
ipcMain.handle('download-file', (event, { url, dest }) => {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);
    proto.get(url, (response) => {
      if (response.statusCode !== 200) {
        return reject(`Download failed: ${response.statusCode}`);
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(`Downloaded to: ${dest}`));
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err.message));
    });
  });
});

// Delete file
ipcMain.handle('delete-file', (event, filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return `Deleted: ${filePath}`;
  }
  return `File not found: ${filePath}`;
});

ipcMain.handle('download-torrent', async (event, torrentId) => {
  return new Promise((resolve, reject) => {
    client.add(torrentId, { path: path.join(app.getPath('downloads'), 'torrents') }, (torrent) => {
      console.log(`Downloading: ${torrent.name}`)

      torrent.on('download', () => {
        mainWindow.webContents.send('torrent-progress', {
          progress: (torrent.progress * 100).toFixed(2),
          downloaded: torrent.downloaded,
          total: torrent.length
        })
      })

      torrent.on('done', () => {
        console.log('Download finished:', torrent.name)
        resolve({ status: 'done', name: torrent.name, path: torrent.path })
      })

      torrent.on('error', (err) => {
        console.error(err)
        reject(err)
      })
    })
  })
})


async function getImageConfig() {
  const res = await fetch(TMDB_CONFIG_URL);
  const cfg = await res.json();
  const base = cfg.images.base_url;
  const best = cfg.images.poster_sizes.slice(-1)[0];
  return { base, size: best };
}

function cleanMovieTitle(filename) {
  return filename
    .replace(/\.[^/.]+$/, "")
    .replace(/\b(1080p|720p|2160p|480p)\b/gi, "")
    .replace(/\b(WEBRip|BluRay|BRRip|DVDRip|HDRip|WEB-DL)\b/gi, "")
    .replace(/\b(x264|x265|HEVC|H\.264)\b/gi, "")
    .replace(/\[[^\]]*\]|\([^\)]*\)/g, "")
    .replace(/-\[.*$/, "")
    .replace(/-\s*$/, "")
    .replace(/[\._]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function fetchMovieData(filename, imgCfg) {
  const title = cleanMovieTitle(path.parse(filename).name);
  const res = await fetch(TMDB_SEARCH_URL + encodeURIComponent(title));
  const data = await res.json();

  if (data.results && data.results.length > 0) {
    const movie = data.results[0];
    const posterUrl = movie.poster_path
      ? `${imgCfg.base}${imgCfg.size}${movie.poster_path}`
      : null;

    return {
      file: filename,
      localTitle: title,
      posterUrl,
      tmdbRaw: movie // full TMDB object
    };
  }

  return { file: filename, localTitle: title, error: "Not found" };
}

async function scanMoviesFolder() {
  const files = fs.readdirSync(MOVIES_DIR);
  const imgCfg = await getImageConfig();
  const results = [];

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if ([".mp4", ".mkv", ".avi"].includes(ext)) {
      const info = await fetchMovieData(file, imgCfg);
      results.push(info);
    }
  }

  console.log(JSON.stringify(results, null, 2));
}

scanMoviesFolder();

app.whenReady().then(createWindow);


// [
//   {
//     "file": "Men.In.Black.International.2019.1080p.WEBRip.x264-[YTS.LT].mp4",
//     "localTitle": "Men In Black International 2019",
//     "posterUrl": "http://image.tmdb.org/t/p/original/dPrUPFcgLfNbmDL8V69vcrTyEfb.jpg",
//     "tmdbRaw": {
//       "adult": false,
//       "backdrop_path": "/uK9uFbAwQ1s2JHKkJ5l0obPTcXI.jpg",
//       "genre_ids": [
//         35,
//         878,
//         28
//       ],
//       "id": 479455,
//       "original_language": "en",
//       "original_title": "Men in Black: International",
//       "overview": "The Men in Black have always protected the Earth from the scum of the universe. In this new adventure, they tackle their biggest, most global threat to date: a mole in the Men in Black organization.",
//       "popularity": 5.8665,
//       "poster_path": "/dPrUPFcgLfNbmDL8V69vcrTyEfb.jpg",
//       "release_date": "2019-06-12",
//       "title": "Men in Black: International",
//       "video": false,
//       "vote_average": 5.904,
//       "vote_count": 5088
//     }
//   }
// ]