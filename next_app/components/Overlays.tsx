import React from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "@radix-ui/react-label";
import { Input } from "./ui/input";

export function StartOverlay({ startApp, setHasStarted }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70">
      <div className="mx-4 max-w-md rounded-xl border border-white/10 bg-black/60 p-6 text-center text-white">
        <div className="mb-3 text-xl font-semibold">CineBox</div>
        <p className="mb-4 text-white/80">
          Press Enter or click Start to launch in fullscreen and enable
          remote-like keyboard navigation.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button
            onClick={startApp}
            size="lg"
            className="bg-cyan-600 hover:bg-cyan-500"
          >
            Start
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => setHasStarted(true)}
            className="border-white/20 bg-white/10 text-white hover:bg-white/20"
          >
            Continue without fullscreen
          </Button>
        </div>
        <div className="mt-3 text-xs text-white/60">
          Tip: press F anytime to toggle fullscreen.
        </div>
      </div>
    </div>
  );
}

export function SearchOverlay({
  MENU,
  menuIndex,
  items,
  setSearchOpen,
  searchOpen,
  searchQuery,
  setSearchQuery,
  searchSel,
  setSearchSel,
  searchLoading,
  setSearchLoading,
  openDetails,
  searchInputRef,
  handleSearch
}) {
  return (
    <Dialog
      open={searchOpen}
      onOpenChange={(open) => {
        if (!searchLoading) {
          setSearchOpen(open);
          if (open) setSearchSel(0);
        }
      }}
    >
      <DialogContent className="sm:max-w-2xl bg-slate-900 text-white border-white/10">
        <DialogHeader>
          <DialogTitle>Search {MENU[menuIndex].label}</DialogTitle>
          <DialogDescription className="text-white/70">
            Type to filter. Arrow Up/Down to choose a result. Enter to open. Esc
            to close.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 md:grid-cols-[1fr_280px]">
          <div className="space-y-2">
            <Label htmlFor="search" className="text-white">
              Query
            </Label>
            <Input
              id="search"
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchSel(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && items.length > 0 && !searchLoading) {
                  openDetails(items[searchSel]);
                  setSearchOpen(false);
                }
              }}
              placeholder={`Find in ${MENU[menuIndex].label.toLowerCase()}…`}
              className="border-white/20 bg-white/10 text-white placeholder:text-white/50"
              disabled={searchLoading}
            />
            <div className="text-xs text-white/60">
              {items.length} result{items.length === 1 ? "" : "s"}
            </div>
          </div>

          {/* Results list */}
          <div className="max-h-72 overflow-auto rounded-md border border-white/10 bg-black/30">
            {items.length === 0 ? (
              <div className="p-3 text-sm text-white/60">No matches</div>
            ) : (
              <ul
                role="listbox"
                aria-label="Search results"
                className="divide-y divide-white/10"
              >
                {items.slice(0, 24).map((r, i) => {
                  const active = i === searchSel;
                  const isLocal = r.kind === "local";
                  return (
                    <li
                      key={"id" in r ? r.id : `${r.Name}-${i}`}
                      role="option"
                      aria-selected={active}
                      className={`flex cursor-pointer gap-3 p-2 text-sm transition ${
                        active
                          ? "bg-white/10 ring-1 ring-cyan-400"
                          : "hover:bg-white/5"
                      }`}
                      onMouseEnter={() => setSearchSel(i)}
                      onClick={() => {
                        openDetails(r);
                        setSearchOpen(false);
                      }}
                    >
                      <img
                        src={
                          r.Poster ||
                          "/placeholder.svg?height=60&width=40&query=poster"
                        }
                        alt=""
                        className="h-16 w-12 flex-none rounded object-cover"
                      />
                      <div className="min-w-0">
                        <div className="truncate font-medium text-white">
                          {r.Name}{" "}
                          {isLocal && r.ReleasedDate
                            ? `· ${r.ReleasedDate}`
                            : ""}
                        </div>
                        {isLocal ? (
                          <div className="text-xs text-white/70">
                            {r.Genre ? `${r.Genre} · ` : ""}
                            {r.Runtime ? `${r.Runtime} · ` : ""}
                            {r.Language || ""}
                          </div>
                        ) : (
                          <div className="text-xs text-white/70">
                            {r.Year || ""}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            className="border-white/20 bg-white/10 text-white hover:bg-white/20"
            onClick={() => setSearchOpen(false)}
          >
            Close
          </Button>
          <Button
            onClick={() => {
              handleSearch();
              // if (items.length > 0) {
              //   openDetails(items[searchSel])
              //   setSearchOpen(false)
              // }
            }}
            className="bg-cyan-600 hover:bg-cyan-500"
            disabled={searchLoading}
          >
            {menuIndex==2&& "Search"}
            {/* Open selected */}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
