"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Film,
  Tv2,
  Power,
  Settings,
  Search,
  Clock,
  Play,
  Info,
  HardDrive,
  Download,
  Axis3DIcon,
} from "lucide-react";
import { Button } from "@/next_app/components/ui/button";
import { Input } from "@/next_app/components/ui/input";
import { Label } from "@/next_app/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/next_app/components/ui/dialog";
import {
  DownloadsPanel,
  type DownloadEntry,
} from "@/next_app/components/downloads-panel";
import { MOVIES } from "@/next_app/data/movies";
import { SERIES } from "@/next_app/data/series";
import { LOCAL_ITEMS, type LocalItem } from "@/next_app/data/local";
import axios from "axios";

import LeftNav from "./left-nav";
import { downloadTorrent } from "@/next_app/lib/handleMovieDownload";
import { SearchOverlay, StartOverlay } from "./Overlays";
import MainSection from "./MainSection";
type MenuKey = "movies" | "series" | "local";

type MediaItem = {
  id: string;
  title: string;
  year: number;
  poster: string;
  kind: "movies" | "series";
};

type AnyItem = MediaItem | (LocalItem & { kind: "local" });

const MENU: { key: MenuKey; label: string; icon: any }[] = [
  { key: "movies", label: "Movies", icon: Film },
  { key: "series", label: "Series", icon: Tv2 },
  { key: "local", label: "Local", icon: HardDrive },
];

function useColumns(
  containerRef: React.RefObject<HTMLDivElement>,
  tileMinWidth = 180
) {
  const [cols, setCols] = useState(5);
  useEffect(() => {
    function compute() {
      const el = containerRef.current;
      if (!el) return;
      const w = el.clientWidth;
      const c = Math.max(1, Math.floor(w / (tileMinWidth + 16)));
      setCols(c);
    }
    compute();
    const ro = new ResizeObserver(compute);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [containerRef, tileMinWidth]);
  return cols;
}

function normalize(s: string) {
  return s
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function TheaterShell() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // App state
  const [mode, setMode] = useState<"menu" | "grid">("menu");
  const [menuIndex, setMenuIndex] = useState(0);
  const [gridIndex, setGridIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Toast (inline)
  const [toastMsg, setToastMsg] = useState<{
    title: string;
    description?: string;
  } | null>(null);
  const notify = useCallback((title: string, description?: string) => {
    setToastMsg({ title, description });
    window.clearTimeout((notify as any)._t);
    (notify as any)._t = window.setTimeout(() => setToastMsg(null), 2200);
  }, []);

  // Search
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSel, setSearchSel] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);

  // Local: base path and ability to add custom entries (poster path can be absolute or relative to base)
  const [localBasePath, setLocalBasePath] = useState("");
  const [userLocalItems, setUserLocalItems] = useState<LocalItem[]>([]);

  // Details dialog
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsItem, setDetailsItem] = useState<LocalItem | null>(null);
  // Downloads
  const [downloadsOpen, setDownloadsOpen] = useState(false);
  const [downloads, setDownloads] = useState<DownloadEntry[]>([]);

  // UI helpers
  const cols = useColumns(gridRef);
  const activeKey: MenuKey = MENU[menuIndex].key;

  // Load persisted
  useEffect(() => {
    try {
      setLocalBasePath(localStorage.getItem("cinebox_local_basepath") ?? "");
      const u = JSON.parse(
        localStorage.getItem("cinebox_user_local") ?? "[]"
      ) as LocalItem[];
      setUserLocalItems(Array.isArray(u) ? u : []);
      const d = JSON.parse(
        localStorage.getItem("cinebox_downloads") ?? "[]"
      ) as DownloadEntry[];
      setDownloads(Array.isArray(d) ? d : []);
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("cinebox_local_basepath", localBasePath);
    } catch {}
  }, [localBasePath]);
  useEffect(() => {
    try {
      localStorage.setItem(
        "cinebox_user_local",
        JSON.stringify(userLocalItems)
      );
    } catch {}
  }, [userLocalItems]);
  useEffect(() => {
    try {
      localStorage.setItem("cinebox_downloads", JSON.stringify(downloads));
    } catch {}
  }, [downloads]);

  // Source items by category
  const movies: MediaItem[] = useMemo(
    () => MOVIES.map((m) => ({ ...m, kind: "movies" as const })),
    []
  );
  const series: MediaItem[] = useMemo(
    () => SERIES.map((s) => ({ ...s, kind: "series" as const })),
    []
  );
  const localCombined: (LocalItem & { kind: "local" })[] = useMemo(() => {
    const resolvePoster = (p?: string) => {
      if (!p) return "";
      if (/^https?:\/\//i.test(p) || p.startsWith("/")) return p;
      return `${localBasePath?.replace(/\/$/, "")}/${p.replace(/^\//, "")}`;
    };
    const mapWithKind = (x: LocalItem) => ({
      ...x,
      Poster: resolvePoster(x.Poster),
      kind: "local" as const,
    });
    return [...LOCAL_ITEMS, ...userLocalItems].map(mapWithKind);
  }, [localBasePath, userLocalItems]);

  // Build items for current category + search
  const baseItems: AnyItem[] = useMemo(() => {
    if (activeKey === "movies") return movies;
    if (activeKey === "series") return series;
    return localCombined;
  }, [activeKey, localCombined, movies, series]);

  // Local-specific tokenized search across multiple fields; movies/series simple title/year search
  const items: AnyItem[] = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return baseItems;
    if (activeKey !== "local") {
      const nq = normalize(q);
      return (baseItems as MediaItem[]).filter(
        (i) => normalize(i.title).includes(nq) || String(i.year).includes(nq)
      ) as AnyItem[];
    }
    const tokens = normalize(q).split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return baseItems;

    function localText(l: LocalItem) {
      return normalize(
        [
          l.Name,
          l.ReleasedDate,
          l.Genre,
          l.Rating,
          l.Likes,
          l.Runtime,
          l.Language,
          l.Url,
        ]
          .filter(Boolean)
          .join(" | ")
      );
    }

    return (baseItems as (LocalItem & { kind: "local" })[]).filter((l) => {
      const text = localText(l);
      return tokens.every((t) => text.includes(t));
    }) as AnyItem[];
  }, [activeKey, baseItems, searchQuery]);

  // Keep selection index in bounds
  useEffect(() => {
    setGridIndex((i) =>
      Math.min(Math.max(0, i), Math.max(0, items.length - 1))
    );
  }, [items.length]);

  // Focus root to capture keys
  useEffect(() => {
    rootRef.current?.focus();
  }, [hasStarted]);

  // Fullscreen handling
  const requestFS = useCallback(async () => {
    const el = rootRef.current;
    if (!el) return;
    if (searchOpen) {
      return;
    }
    try {
      const req: (() => Promise<void>) | undefined =
        el.requestFullscreen ||
        el.webkitRequestFullscreen ||
        el.msRequestFullscreen;
      if (req) await req.call(el);
      else await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
      localStorage.setItem("cinebox_fs_optin", "1");
    } catch {}
  }, []);
  const exitFS = useCallback(async () => {
    if (searchOpen) {
      return;
    }
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      setIsFullscreen(false);
    } catch {}
  }, []);
  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  useEffect(() => {
    const opted =
      typeof window !== "undefined" &&
      localStorage.getItem("cinebox_fs_optin") === "1";
    if (opted) setHasStarted(false);
  }, []);
  const startApp = useCallback(async () => {
    setHasStarted(true);
    rootRef.current?.focus();
    await requestFS();
  }, [requestFS]);

  // Keyboard navigation + search
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!hasStarted) return;
      const key = e.key;
      if ((e.ctrlKey || e.metaKey) && (key === "f" || key === "F")) {
        e.preventDefault();
        setSearchOpen(true);
        setSearchSel(0);
        setTimeout(() => searchInputRef.current?.focus(), 0);
        return;
      }
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(key)
      )
        e.preventDefault();
      if (key === "F" || key === "f") {
        if (searchOpen) return;
        if (!e.ctrlKey && !e.metaKey) isFullscreen ? exitFS() : requestFS();
        return;
      }
      if (key === "Escape") {
        if (searchOpen) setSearchOpen(false);
        else exitFS();
        return;
      }
      if (key === "d" || key === "D") {
        setDownloadsOpen(true);
        return;
      }
      if (searchOpen) {
        if (key === "ArrowDown")
          setSearchSel((i) => Math.min(Math.max(0, items.length - 1), i + 1));
        else if (key === "ArrowUp") setSearchSel((i) => Math.max(0, i - 1));
        else if (key === "Enter" && items.length > 0) {
          openDetails(items[searchSel]);
          setSearchOpen(false);
        }
        return;
      }
      if (mode === "menu") {
        if (key === "ArrowUp")
          setMenuIndex((i) => (i - 1 + MENU.length) % MENU.length);
        if (key === "ArrowDown") setMenuIndex((i) => (i + 1) % MENU.length);
        if (key === "ArrowRight" || key === "Enter") {
          setMode("grid");
          setGridIndex(0);
        }
      } else {
        if (key === "ArrowLeft") {
          if (gridIndex % cols === 0) setMode("menu");
          else setGridIndex((i) => Math.max(0, i - 1));
        }
        if (key === "ArrowRight")
          setGridIndex((i) => Math.min(items.length - 1, i + 1));
        if (key === "ArrowUp") setGridIndex((i) => Math.max(0, i - cols));
        if (key === "ArrowDown")
          setGridIndex((i) => Math.min(items.length - 1, i + cols));
        if (key === "Enter" || key === " ") {
          items[gridIndex] && openDetails(items[gridIndex]);
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    cols,
    exitFS,
    gridIndex,
    hasStarted,
    isFullscreen,
    items,
    mode,
    requestFS,
    searchOpen,
    searchSel,
  ]);

  // SW registration
  useEffect(() => {
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  // Local add form (simple)
  const [newTitle, setNewTitle] = useState("");
  const [newYear, setNewYear] = useState<number | "">("");
  const [newPosterPath, setNewPosterPath] = useState("");
  const [newUrl, setNewUrl] = useState("");
  // function addLocalItem() {
  //   if (!newTitle || !newYear) {
  //     notify("Missing fields", "Please provide title and year");
  //     return;
  //   }
  //   const poster =
  //     /^https?:\/\//i.test(newPosterPath) || newPosterPath.startsWith("/")
  //       ? newPosterPath
  //       : `${localBasePath?.replace(/\/$/, "")}/${newPosterPath?.replace(
  //           /^\//,
  //           ""
  //         )}`;
  //   const item: LocalItem = {
  //     id: `l_${Date.now()}`,
  //     Name: newTitle,
  //     ReleasedDate: String(newYear),
  //     Genre: "",
  //     Rating: "",
  //     Likes: "",
  //     Runtime: "",
  //     Language: "",
  //     Url: newUrl || "",
  //     Poster: poster,
  //   };
  //   setUserLocalItems((prev) => [item, ...prev]);
  //   setNewTitle("");
  //   setNewYear("");
  //   setNewPosterPath("");
  //   setNewUrl("");
  //   notify("Added to Local", item.Name);
  // }

  // Details dialog open
  
  function openDetails(item: LocalItem) {
    setDetailsItem(item);
    setDetailsOpen(true);
  }

  // Downloads manager (simulate progress)
  function addDownload(name: string, url?: string, poster?: string) {
    const id = `dl_${Date.now()}`;
    const entry: DownloadEntry = {
      id,
      name,
      url,
      poster,
      status: "queued",
      progress: 0,
      addedAt: Date.now(),
    };
    setDownloads((d) => [entry, ...d]);
    notify("Download added", name);

    // Simulate async download
    let progress = 0;
    const startDelay = setTimeout(() => {
      setDownloads((d) =>
        d.map((x) => (x.id === id ? { ...x, status: "downloading" } : x))
      );
      const int = setInterval(() => {
        progress += Math.random() * 18 + 5;
        if (progress >= 100) {
          clearInterval(int);
          setDownloads((d) =>
            d.map((x) =>
              x.id === id
                ? {
                    ...x,
                    status: "completed",
                    progress: 100,
                    completedAt: Date.now(),
                  }
                : x
            )
          );
        } else {
          setDownloads((d) =>
            d.map((x) =>
              x.id === id ? { ...x, progress: Math.floor(progress) } : x
            )
          );
        }
      }, 500);
      (entry as any)._int = int;
    }, 400);
    (entry as any)._startDelay = startDelay;
  }
  function cancelDownload(id: string) {
    setDownloads((d) => d.filter((x) => x.id !== id));
  }
  function clearCompleted() {
    setDownloads((d) => d.filter((x) => x.status !== "completed"));
  }

  async function handleSearch() {
    if (searchLoading) return;
    // await createExampleFolder();

    setSearchLoading(true);
    try {
      console.log(menuIndex);
      if (menuIndex === 1 || searchQuery.length >= 3) {
        // Local Search only
        const res = await axios.get(`/api/all/${searchQuery}`);
        // console.log(res.data.data)
        const combined = [].concat(...res.data.data.map((item) => item.value));
        settorrentSearchResults(combined);
        notify(
          "Search completed",
          `Found ${res.data.data?.length || 0} results`
        );
      }
    } catch (error) {
      console.error("Search failed:", error);
      notify("Search failed", "Please try again");
    } finally {
      setSearchLoading(false);
      setSearchOpen(false);
    }
  }

  const [torrentSearchResult, settorrentSearchResults] =
    useState<LocalItem[]>();

  console.log(torrentSearchResult);

  // const local_items=torrentSearchResult?.map()
  // async function createExampleFolder() {
  //   const result = await window.fileAPI.createFolder('/home/noobhacker/Documents/Movies/NewFolder');
  //   console.log(result);
  // }

  async function downloadMovie() {
    // console.log(detailsItem)
    if (!detailsItem) {
      return;
    }
    const res = await downloadTorrent(detailsItem);
  }

  return (
    <div
      ref={rootRef}
      tabIndex={0}
      className="relative grid min-h-screen overflow-hidden focus:outline-none sm:grid-cols-[280px_1fr] grid-cols-1"
      aria-label="CineBox App Shell"
    >
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(800px 400px at 30% 30%, rgba(14,165,233,0.25), transparent)",
          }}
        />
      </div>

      {/* LEFT NAV */}
      <LeftNav
        MENU={MENU}
        setMenuIndex={setMenuIndex}
        setMode={setMode}
        setGridIndex={setGridIndex}
        rootRef={rootRef}
        mode={mode}
        menuIndex={menuIndex}
      />

      {/* RIGHT CONTENT */}
      <MainSection
        MENU={MENU}
        menuIndex={menuIndex}
        items={items}
        setDownloadsOpen={setDownloadsOpen}
        activeKey={activeKey}
        localBasePath={localBasePath}
        setLocalBasePath={setLocalBasePath}
        newTitle={newTitle}
        setNewTitle={setNewTitle}
        newYear={newYear}
        setNewYear={setNewYear}
        newPosterPath={newPosterPath}
        setNewPosterPath={setNewPosterPath}
        newUrl={newUrl}
        setNewUrl={setNewUrl}
        // addLocalItem={addLocalItem}
        torrentSearchResult={torrentSearchResult}
        mode={mode}
        gridIndex={gridIndex}
        setGridIndex={setGridIndex}
        openDetails={openDetails}
        gridRef={gridRef}
      />
      {/* Start overlay */}
      {!hasStarted && (
        <StartOverlay startApp={startApp} setHasStarted={setHasStarted} />
      )}

      {/* Search Overlay */}
      <SearchOverlay
        MENU={MENU}
        menuIndex={menuIndex}
        items={items}
        setSearchOpen={setSearchOpen}
        searchOpen={searchOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchSel={searchSel}
        setSearchSel={setSearchSel}
        searchLoading={searchLoading}
        setSearchLoading={setSearchLoading}
        openDetails={openDetails}
        searchInputRef={searchInputRef}
        handleSearch={handleSearch}
      />

      {/* Details / Action dialog */}
      <Dialog
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) setDetailsItem(null);
        }}
      >
        <DialogContent className="sm:max-w-2xl bg-slate-900 text-white border-white/10">
          {detailsItem && menuIndex == 2 && (
            <>
              <DialogHeader>
                <DialogTitle>{detailsItem.Name}</DialogTitle>
                <DialogDescription className="text-white/70">
                  {/* {detailsItem.kind === "local"
                    ? [detailsItem.Genre, detailsItem.Runtime, detailsItem.Language].filter(Boolean).join(" · ") ||
                      "Local media"
                    : `${yearOf(detailsItem) || ""}`} */}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 md:grid-cols-[160px_1fr]">
                <img
                  src={
                    detailsItem.Poster ||
                    "/placeholder.svg?height=240&width=160&query=poster"
                  }
                  alt=""
                  className="h-60 w-40 rounded object-cover"
                />
                <div className="space-y-3">
                  {detailsItem.kind === "local" && (
                    <>
                      <div className="text-sm text-white/80">
                        Released: {detailsItem.ReleasedDate || "—"}
                        {detailsItem.Rating ? ` · ${detailsItem.Rating}` : ""}
                        {detailsItem.Likes
                          ? ` · ${detailsItem.Likes} likes`
                          : ""}
                      </div>
                      {detailsItem.Url && (
                        <div className="text-xs text-cyan-300 break-all">
                          Source: {detailsItem.Url}
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex gap-2">
                    <Button
                      className="bg-cyan-600 hover:bg-cyan-500"
                      onClick={() => {
                        downloadMovie();
                        addDownload(
                          titleOf(detailsItem),
                          detailsItem.kind === "local"
                            ? detailsItem.Url
                            : undefined,
                          posterOf(detailsItem)
                        );
                        setDetailsOpen(false);
                        setDownloadsOpen(true);
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                      onClick={() => {
                        notify(
                          "Added",
                          `${titleOf(detailsItem)} added to list`
                        );
                        setDetailsOpen(false);
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Downloads panel */}
      <DownloadsPanel
        open={downloadsOpen}
        onOpenChange={setDownloadsOpen}
        items={downloads}
        onCancel={cancelDownload}
        onClearCompleted={clearCompleted}
      />

      {/* Inline toast */}
      <div
        aria-live="polite"
        className={`pointer-events-none fixed bottom-4 right-4 z-50 transition-all ${
          toastMsg ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        {toastMsg && (
          <div className="pointer-events-auto min-w-[220px] max-w-xs rounded-md border border-white/10 bg-black/80 p-3 text-white shadow-lg">
            <div className="text-sm font-medium">{toastMsg.title}</div>
            {toastMsg.description && (
              <div className="mt-0.5 text-xs text-white/70">
                {toastMsg.description}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}



// detailsItem

// {
//   "Name": "The Occupant",
//   "ReleasedDate": "2025",
//   "Genre": "Drama / Mystery / Sci-Fi / Thriller",
//   "Rating": "⭐",
//   "Likes": "8",
//   "Runtime": "1 hr 44 min",
//   "Language": "English 2.0",
//   "Url": "https://yts.mx/movies/the-occupant-2025",
//   "Poster": "https://img.yts.mx/assets/images/movies/the_occupant_2025/medium-cover.jpg",
//   "Files": [
//     {
//       "Quality": "720p",
//       "Type": "WEB ",
//       "Size": "959.49 MB",
//       "Torrent": "https://yts.mx/torrent/download/AF5315525606CEBC98408C579696C6113F3911AC",
//       "Magnet": "magnet:?xt=urn:btih:AF5315525606CEBC98408C579696C6113F3911AC&dn=The+Occupant+%282025%29+%5B720p%5D+%5BYTS.MX%5D&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=udp%3A%2F%2Fopen.tracker.cl%3A1337%2Fannounce&tr=udp%3A%2F%2Fp4p.arenabg.com%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.torrent.eu.org%3A451%2Fannounce&tr=udp%3A%2F%2Ftracker.dler.org%3A6969%2Fannounce&tr=udp%3A%2F%2Fopen.stealth.si%3A80%2Fannounce&tr=udp%3A%2F%2Fipv4.tracker.harry.lu%3A80%2Fannounce&tr=https%3A%2F%2Fopentracker.i2p.rocks%3A443%2Fannounce"
//     },
//     {
//       "Quality": "1080p",
//       "Type": "WEB ",
//       "Size": "1.92 GB",
//       "Torrent": "https://yts.mx/torrent/download/155F729D61E62218EBA70AED32406789FA2E77A3",
//       "Magnet": "magnet:?xt=urn:btih:155F729D61E62218EBA70AED32406789FA2E77A3&dn=The+Occupant+%282025%29+%5B1080p%5D+%5BYTS.MX%5D&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=udp%3A%2F%2Fopen.tracker.cl%3A1337%2Fannounce&tr=udp%3A%2F%2Fp4p.arenabg.com%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.torrent.eu.org%3A451%2Fannounce&tr=udp%3A%2F%2Ftracker.dler.org%3A6969%2Fannounce&tr=udp%3A%2F%2Fopen.stealth.si%3A80%2Fannounce&tr=udp%3A%2F%2Fipv4.tracker.harry.lu%3A80%2Fannounce&tr=https%3A%2F%2Fopentracker.i2p.rocks%3A443%2Fannounce"
//     },
//     {
//       "Quality": "1080p",
//       "Type": "WEB.x265.10bit ",
//       "Size": "1.74 GB",
//       "Torrent": "https://yts.mx/torrent/download/5615D23563E794B6CE339ED7ECECB5756B573CD4",
//       "Magnet": "magnet:?xt=urn:btih:5615D23563E794B6CE339ED7ECECB5756B573CD4&dn=The+Occupant+%282025%29+%5B1080p%5D+%5BYTS.MX%5D&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=udp%3A%2F%2Fopen.tracker.cl%3A1337%2Fannounce&tr=udp%3A%2F%2Fp4p.arenabg.com%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.torrent.eu.org%3A451%2Fannounce&tr=udp%3A%2F%2Ftracker.dler.org%3A6969%2Fannounce&tr=udp%3A%2F%2Fopen.stealth.si%3A80%2Fannounce&tr=udp%3A%2F%2Fipv4.tracker.harry.lu%3A80%2Fannounce&tr=https%3A%2F%2Fopentracker.i2p.rocks%3A443%2Fannounce"
//     }
//   ]
// }
// [{value}]
