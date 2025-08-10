import { Label } from "@radix-ui/react-label";
import { Download, Clock, Play, Info } from "lucide-react";
import React from "react";
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

      {/* Local config and Add form */}
      {activeKey === "local" && (
        <div className="mx-4 mb-3 rounded-lg border border-white/10 bg-black/30 p-3 text-white">
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <Label htmlFor="basepath" className="text-white">
                Base path
              </Label>
              <Input
                id="basepath"
                value={localBasePath}
                onChange={(e) => setLocalBasePath(e.target.value)}
                placeholder="e.g. https://my-cdn.example.com/media"
                className="mt-1 border-white/20 bg-white/10 text-white placeholder:text-white/50"
              />
            </div>
            <div className="md:col-span-2">
              <div className="grid gap-3 md:grid-cols-4">
                <div className="md:col-span-2">
                  <Label htmlFor="title" className="text-white">
                    Title
                  </Label>
                  <Input
                    id="title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Movie title"
                    className="mt-1 border-white/20 bg-white/10 text-white placeholder:text-white/50"
                  />
                </div>
                <div>
                  <Label htmlFor="year" className="text-white">
                    Year
                  </Label>
                  <Input
                    id="year"
                    type="number"
                    value={newYear}
                    onChange={(e) =>
                      setNewYear(e.target.value ? Number(e.target.value) : "")
                    }
                    placeholder="2025"
                    className="mt-1 border-white/20 bg-white/10 text-white placeholder:text-white/50"
                  />
                </div>
                <div>
                  <Label htmlFor="poster" className="text-white">
                    Poster path
                  </Label>
                  <Input
                    id="poster"
                    value={newPosterPath}
                    onChange={(e) => setNewPosterPath(e.target.value)}
                    placeholder="poster.jpg or https://…"
                    className="mt-1 border-white/20 bg-white/10 text-white placeholder:text-white/50"
                  />
                </div>
                <div className="md:col-span-3">
                  <Label htmlFor="url" className="text-white">
                    URL (optional)
                  </Label>
                  <Input
                    id="url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://example.com/movie"
                    className="mt-1 border-white/20 bg-white/10 text-white placeholder:text-white/50"
                  />
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  onClick={addLocalItem}
                  className="bg-cyan-600 hover:bg-cyan-500"
                >
                  Add to Local
                </Button>
                <Button
                  variant="outline"
                  className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                  onClick={() => {
                    setNewTitle("");
                    setNewYear("");
                    setNewPosterPath("");
                    setNewUrl("");
                  }}
                >
                  Clear
                </Button>
              </div>
              <div className="mt-2 text-xs text-white/60">
                If Poster is relative, it resolves against Base path.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      <div ref={gridRef} className="relative flex-1 overflow-auto px-4 pb-8">
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          }}
          role="grid"
          aria-label={`${MENU[menuIndex].label} grid`}
        >
          {menuIndex === 2 &&
            torrentSearchResult &&
            torrentSearchResult.map((it, idx) => {
              const selected = mode === "grid" && gridIndex === idx;

              return (
                <div
                  key={`${it.Name}-${idx}`}
                  role="gridcell"
                  aria-selected={selected}
                  className={`group relative overflow-hidden rounded-lg border border-white/10 bg-white/5 transition
                    ${selected ? "ring-2 ring-cyan-400" : "hover:bg-white/10"}
                  `}
                  onMouseEnter={() => setGridIndex(idx)}
                  onClick={() => openDetails(it)}
                >
                  <img
                    src={
                      it.Poster ||
                      "/placeholder.svg?height=270&width=180&query=poster"
                    }
                    alt={`${it.Name} poster`}
                    className="aspect-[2/3] w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <div className="line-clamp-1 text-sm font-medium text-white">
                      {it.Name}
                    </div>
                    <div className="text-xs text-white/70">
                      {it.ReleasedDate || ""}
                    </div>
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

          {/* {items.map((it, idx) => {
              const selected = mode === "grid" && gridIndex === idx
              return (
                <div
                  key={"id" in it ? it.id : `${titleOf(it)}-${idx}`}
                  role="gridcell"
                  aria-selected={selected}
                  className={`group relative overflow-hidden rounded-lg border border-white/10 bg-white/5 transition
                    ${selected ? "ring-2 ring-cyan-400" : "hover:bg-white/10"}
                  `}
                  onMouseEnter={() => setGridIndex(idx)}
                  onClick={() => openDetails(it)}
                >
                  <img
                    src={posterOf(it) || "/placeholder.svg?height=270&width=180&query=poster"}
                    alt={`${titleOf(it)} poster`}
                    className="aspect-[2/3] w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <div className="line-clamp-1 text-sm font-medium text-white">{titleOf(it)}</div>
                    <div className="text-xs text-white/70">{yearOf(it) || ""}</div>
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
              )
            })} */}
        </div>
        {items.length === 0 && (
          <div className="mt-16 text-center text-white/70">
            No results. Try a different search.
          </div>
        )}
      </div>
    </section>
  );
}
