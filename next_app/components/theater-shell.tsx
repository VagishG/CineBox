"use client";


"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Film, Tv2, HardDrive } from "lucide-react";
import LeftNav from "./left-nav";
import { DownloadsPanel, type DownloadEntry } from "@/components/downloads-panel";
import { StartOverlay } from "./Overlays";

// --- Types and Constants ---
type MenuKey = "movies" | "series" | "local";
const MENU: { key: MenuKey; label: string; icon: any }[] = [
  { key: "movies", label: "Movies", icon: Film },
  { key: "series", label: "Series", icon: Tv2 },
  { key: "local", label: "Local", icon: HardDrive },
];

// --- Utility Hooks ---
function useColumns(containerRef: React.RefObject<HTMLDivElement>, tileMinWidth = 180) {
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
  return s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// --- LocalNav Placeholder (for custom local navigation logic) ---
type LocalNavProps = {
  setMenuIndex: (i: number) => void;
  setMode: (mode: "menu" | "grid") => void;
  setGridIndex: (i: number) => void;
  rootRef: React.RefObject<HTMLDivElement>;
  menuIndex: number;
};

import MainSection from "./MainSection";

const dummyItems: Record<string, any[]> = {
  movies: [
    {
      file: "Men.In.Black.International.2019.1080p.WEBRip.x264-[YTS.LT].mp4",
      localTitle: "Men In Black International 2019",
      posterUrl: "http://image.tmdb.org/t/p/original/dPrUPFcgLfNbmDL8V69vcrTyEfb.jpg",
      tmdbRaw: {
        adult: false,
        backdrop_path: "/uK9uFbAwQ1s2JHKkJ5l0obPTcXI.jpg",
        genre_ids: [35, 878, 28],
        id: 479455,
        original_language: "en",
        original_title: "Men in Black: International",
        overview: "The Men in Black have always protected the Earth from the scum of the universe. In this new adventure, they tackle their biggest, most global threat to date: a mole in the Men in Black organization.",
        popularity: 5.8665,
        poster_path: "/dPrUPFcgLfNbmDL8V69vcrTyEfb.jpg",
        release_date: "2019-06-12",
        title: "Men in Black: International",
        video: false,
        vote_average: 5.904,
        vote_count: 5088
      }
    }
  ],
  series: [
    {
      file: "Dummy.Series.S01E01.mkv",
      localTitle: "Dummy Series S01E01",
      posterUrl: "https://placehold.co/300x450",
      tmdbRaw: {},
      Name: "Dummy Series S01E01",
      Poster: "https://placehold.co/300x450",
      ReleasedDate: "2024",
    },
  ],
  local: [],
};

// --- Main Component ---
export default function TheaterShell() {
  // --- Refs ---
  const rootRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // --- State: UI and Navigation ---
  const [mode, setMode] = useState<"menu" | "grid">("menu");
  const [menuIndex, setMenuIndex] = useState(0);
  const [gridIndex, setGridIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // --- State: Toast ---
  const [toastMsg, setToastMsg] = useState<{ title: string; description?: string } | null>(null);
  const notify = useCallback((title: string, description?: string) => {
    setToastMsg({ title, description });
    window.clearTimeout((notify as any)._t);
    (notify as any)._t = window.setTimeout(() => setToastMsg(null), 2200);
  }, []);

  // --- State: Downloads ---
  const [downloadsOpen, setDownloadsOpen] = useState(false);
  const [downloads, setDownloads] = useState<DownloadEntry[]>([]);

  // --- State: Local Add Form ---
  const [localBasePath, setLocalBasePath] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newYear, setNewYear] = useState<number | "">("");
  const [newPosterPath, setNewPosterPath] = useState("");
  const [newUrl, setNewUrl] = useState("");

  // --- State: Details Dialog ---
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsItem, setDetailsItem] = useState<any>(null);

  // --- State: Search (not implemented here) ---
  // ...

  // --- UI helpers ---
  const cols = useColumns(gridRef as React.RefObject<HTMLDivElement>);
  const activeKey: MenuKey = MENU[menuIndex].key;

  // --- Effects: Local Storage ---
  useEffect(() => {
    try {
      localStorage.setItem("cinebox_local_basepath", localBasePath);
    } catch {}
  }, [localBasePath]);

  // --- Effects: Focus root to capture keys ---
  useEffect(() => {
    rootRef.current?.focus();
  }, [hasStarted]);

  // --- Effects: Fullscreen handling ---
  const requestFS = useCallback(async () => {
    const el = rootRef.current;
    if (!el) return;
    try {
      const req: (() => Promise<void>) | undefined =
        el.requestFullscreen ||
        (el as any).webkitRequestFullscreen ||
        (el as any).msRequestFullscreen;
      if (req) await req.call(el);
      else await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
      localStorage.setItem("cinebox_fs_optin", "1");
    } catch {}
  }, []);
  const exitFS = useCallback(async () => {
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

  // --- App Start ---
  const startApp = useCallback(async () => {
    setHasStarted(true);
    rootRef.current?.focus();
    await requestFS();
  }, [requestFS]);

  // --- Keyboard navigation (simplified, can be extended) ---
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!hasStarted) return;
      const key = e.key;
      if ((e.ctrlKey || e.metaKey) && (key === "f" || key === "F")) {
        e.preventDefault();
        // setSearchOpen(true); // Not implemented here
        // setSearchSel(0);
        // setTimeout(() => searchInputRef.current?.focus(), 0);
        return;
      }
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(key))
        e.preventDefault();
      if (key === "F" || key === "f") {
        if (!e.ctrlKey && !e.metaKey) isFullscreen ? exitFS() : requestFS();
        return;
      }
      if (key === "Escape") {
        exitFS();
        return;
      }
      if (key === "d" || key === "D") {
        setDownloadsOpen(true);
        return;
      }
      if (mode === "menu") {
        if (key === "ArrowUp") setMenuIndex((i) => (i - 1 + MENU.length) % MENU.length);
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
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cols, gridIndex, hasStarted, isFullscreen, mode, requestFS, exitFS, setDownloadsOpen, setMenuIndex, setMode, setGridIndex]);

  // --- Service Worker registration ---
  useEffect(() => {
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  function cancelDownload(id: string) {
    setDownloads((d) => d.filter((x) => x.id !== id));
  }
  function clearCompleted() {
    setDownloads((d) => d.filter((x) => x.status !== "completed"));
  }

  // --- Details dialog open ---
  function openDetails(item: any) {
    setDetailsItem(item);
    setDetailsOpen(true);
  }

  // --- Render ---
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

      {/* Side Navigation */}
      {/* Always show LeftNav for all sections (LocalNav not implemented) */}
      <LeftNav
        MENU={MENU}
        setMenuIndex={setMenuIndex}
        setMode={setMode}
        setGridIndex={setGridIndex}
        rootRef={rootRef}
        mode={mode}
        menuIndex={menuIndex}
      />


      {/* Main Content: Always render MainSection for all sections */}
      <div className="relative flex-1 min-h-0">
        <MainSection
          MENU={MENU}
          menuIndex={menuIndex}
          items={dummyItems[MENU[menuIndex].key]}
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
          addLocalItem={() => {}}
          torrentSearchResult={dummyItems[MENU[menuIndex].key]}
          mode={mode}
          gridIndex={gridIndex}
          setGridIndex={setGridIndex}
          openDetails={openDetails}
          gridRef={gridRef}
        />
      </div>

      {/* Start overlay */}
      {!hasStarted && (
        <StartOverlay startApp={startApp} setHasStarted={setHasStarted} />
      )}

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




