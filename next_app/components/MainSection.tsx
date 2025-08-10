import { Label } from "@radix-ui/react-label";
import { Download, Clock, Play, Info } from "lucide-react";
import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { LiveClock } from "./LiveClock";

export default function MainSection({
  MENU,
  menuIndex,
  items,
  setDownloadsOpen,
  activeKey,
  localBasePath,
  setLocalBasePath,
  newTitle,
  setNewTitle,
  newYear,
  setNewYear,
  newPosterPath,
  setNewPosterPath,
  newUrl,
  setNewUrl,
  addLocalItem,
  torrentSearchResult,
  mode,
  gridIndex,
  setGridIndex,
  openDetails,
  gridRef
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalItem, setModalItem] = useState<any>(null);
  // Local search state
  const [localSearch, setLocalSearch] = useState("");
  const [localResults, setLocalResults] = useState<any[]>([]);

  // Dummy search handler for local
  const handleLocalSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Dummy results for demo
    setLocalResults([
      {
        Name: "Inception",
        Poster: "https://image.tmdb.org/t/p/original/qmDpIHrmpJINaRKAfWQfftjCdyi.jpg",
        ReleasedDate: "2010",
        tmdbRaw: { overview: "A thief who steals corporate secrets..." }
      },
      {
        Name: "Interstellar",
        Poster: "https://image.tmdb.org/t/p/original/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
        ReleasedDate: "2014",
        tmdbRaw: { overview: "A team of explorers travel through a wormhole..." }
      }
    ]);
  };

  const handleOpenDetails = (item: any) => {
    setModalItem(item);
    setModalOpen(true);
  };
  const handleCloseModal = () => {
    setModalOpen(false);
    setModalItem(null);
  };

  // Helpers for grid and modal info
  function getName(it: any) {
    return it.Name || it.localTitle || it.tmdbRaw?.title || it.tmdbRaw?.original_title || it.file || "Untitled";
  }
  function getPoster(it: any) {
    return it.Poster || it.posterUrl || it.tmdbRaw?.poster_path || "/placeholder.svg?height=270&width=180&query=poster";
  }
  function getYear(it: any) {
    return it.ReleasedDate || (it.tmdbRaw?.release_date ? it.tmdbRaw.release_date.slice(0, 4) : "");
  }
  function getOverview(it: any) {
    return it.tmdbRaw?.overview || "No description available.";
  }

  return (
    <section className="relative z-10 flex min-h-[60vh] flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-lg font-medium text-white">
          {MENU[menuIndex].label}
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            className="border-cyan-600/40 bg-cyan-600/10 text-cyan-300 hover:bg-cyan-600/20"
            onClick={() => setDownloadsOpen(true)}
            title="Show downloads (D)"
          >
            <Download className="mr-2 h-4 w-4" />
            Downloads
          </Button>
          <div className="flex items-center gap-2 text-white/80">
            <Clock className="h-4 w-4" aria-hidden />
            <LiveClock />
          </div>
        </div>
      </div>

      {/* Hint bar */}
      <div className="px-4 pb-2 text-sm text-white/70">
        Arrows navigate. Enter to open. F toggles fullscreen. Esc exits.
        Ctrl/Cmd+F searches {MENU[menuIndex].label}. Press D to view downloads.
      </div>

      {/* Local search UI */}
      {activeKey === "local" && (
        <div className="mx-4 mb-3 rounded-lg border border-white/10 bg-black/30 p-3 text-white">
          <form onSubmit={handleLocalSearch} className="flex gap-2 mb-4">
            <Input
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              placeholder="Search for movies..."
              className="border-white/20 bg-white/10 text-white placeholder:text-white/50"
            />
            <Button type="submit" className="bg-cyan-600 hover:bg-cyan-500">Search</Button>
          </form>
        </div>
      )}

      {/* Grid */}
      <div ref={gridRef} className="relative flex-1 overflow-auto px-4 pb-8">
        {activeKey === "local" ? (
          <>
            {localResults.length > 0 ? (
              <div
                className="grid gap-4"
                style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}
                role="grid"
                aria-label="Local search results grid"
              >
                {localResults.map((it, idx) => {
                  const name = getName(it);
                  const poster = getPoster(it);
                  const year = getYear(it);
                  return (
                    <div
                      key={name + "-" + idx}
                      role="gridcell"
                      className="group relative overflow-hidden rounded-lg border border-white/10 bg-white/5 transition-transform duration-200 hover:scale-105 focus-within:scale-105 cursor-pointer"
                      onClick={() => handleOpenDetails(it)}
                      tabIndex={0}
                    >
                      <img
                        src={poster}
                        alt={`${name} poster`}
                        className="aspect-[2/3] w-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <div className="line-clamp-1 text-sm font-medium text-white">{name}</div>
                        <div className="text-xs text-white/70">{year}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-16 text-center text-white/70">No results. Try a different search.</div>
            )}
          </>
        ) : (
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}
            role="grid"
            aria-label={`${MENU[menuIndex].label} grid`}
          >
            {items && items.map((it, idx) => {
              const name = getName(it);
              const poster = getPoster(it);
              const year = getYear(it);
              const selected = mode === "grid" && gridIndex === idx;
              return (
                <div
                  key={name + "-" + idx}
                  role="gridcell"
                  aria-selected={selected}
                  className={`group relative overflow-hidden rounded-lg border border-white/10 bg-white/5 transition-transform duration-200
                    ${selected ? "ring-2 ring-cyan-400" : "hover:bg-white/10"}
                    hover:scale-105 focus-within:scale-105 cursor-pointer`}
                  onMouseEnter={() => setGridIndex(idx)}
                  onClick={() => handleOpenDetails(it)}
                  tabIndex={0}
                >
                  <img
                    src={poster}
                    alt={`${name} poster`}
                    className="aspect-[2/3] w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <div className="line-clamp-1 text-sm font-medium text-white">{name}</div>
                    <div className="text-xs text-white/70">{year}</div>
                  </div>
                  <div className="pointer-events-none absolute inset-0 hidden items-center justify-center gap-2 group-[aria-selected=true]:flex">
                    <div className="rounded-full bg-black/60 p-2">
                      <Play className="h-5 w-5 text-white" />
                    </div>
                    <div className="rounded-full bg-black/60 p-2">
                      <Info className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal for details, play, and download */}
      {modalOpen && modalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="relative w-full max-w-md rounded-lg bg-slate-900 p-6 shadow-lg border border-white/10">
            <button
              className="absolute top-2 right-2 text-white/60 hover:text-white text-xl"
              onClick={handleCloseModal}
              aria-label="Close"
            >
              ×
            </button>
            <div className="flex flex-col items-center gap-4">
              <img
                src={getPoster(modalItem)}
                alt={getName(modalItem) + " poster"}
                className="w-40 rounded shadow"
              />
              <div className="text-xl font-semibold text-white text-center">{getName(modalItem)}</div>
              <div className="text-white/70 text-center">{getYear(modalItem)}</div>
              <div className="text-white/80 text-sm text-center mb-2">{getOverview(modalItem)}</div>
              {activeKey === "local" ? (
                <button
                  className="flex items-center gap-2 rounded bg-cyan-600 px-4 py-2 text-white hover:bg-cyan-500 transition"
                  onClick={() => alert('Download feature coming soon!')}
                >
                  <Download className="h-5 w-5" />
                  Download
                </button>
              ) : (
                <button
                  className="flex items-center gap-2 rounded bg-cyan-600 px-4 py-2 text-white hover:bg-cyan-500 transition"
                  onClick={() => alert('Play feature coming soon!')}
                >
                  <Play className="h-5 w-5" />
                  Play
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
