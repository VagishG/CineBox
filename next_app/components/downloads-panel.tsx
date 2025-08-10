"use client"

import { useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, CheckCircle2, Loader2, X } from "lucide-react"

export type DownloadEntry = {
  id: string
  name: string
  poster?: string
  url?: string
  status: "queued" | "downloading" | "completed" | "failed"
  progress: number // 0-100
  addedAt: number
  completedAt?: number
}

export function DownloadsPanel({
  open,
  onOpenChange,
  items,
  onCancel,
  onClearCompleted,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: DownloadEntry[]
  onCancel: (id: string) => void
  onClearCompleted: () => void
}) {
  const inProgress = useMemo(() => items.filter((i) => i.status !== "completed"), [items])
  const completed = useMemo(() => items.filter((i) => i.status === "completed"), [items])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-slate-900 text-white border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Downloads
          </DialogTitle>
        </DialogHeader>

        <section className="space-y-6">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-white/80">In progress</h3>
            {inProgress.length === 0 ? (
              <div className="rounded-md border border-white/10 bg-black/30 p-3 text-sm text-white/60">
                Nothing downloading
              </div>
            ) : (
              <ul className="divide-y divide-white/10 rounded-md border border-white/10 bg-black/30">
                {inProgress.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 p-3">
                    <img
                      src={d.poster || "/placeholder.svg?height=60&width=40&query=poster"}
                      alt=""
                      className="h-16 w-12 flex-none rounded object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{d.name}</div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded bg-white/10">
                        <div
                          className="h-full bg-cyan-500"
                          style={{ width: `${Math.max(0, Math.min(100, d.progress))}%` }}
                        />
                      </div>
                      <div className="mt-1 text-xs text-white/70">{d.progress}%</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {d.status === "downloading" ? (
                        <Loader2 className="h-4 w-4 animate-spin text-white/80" />
                      ) : (
                        <Download className="h-4 w-4 text-white/80" />
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                        onClick={() => onCancel(d.id)}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white/80">Completed</h3>
              {completed.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                  onClick={onClearCompleted}
                >
                  Clear completed
                </Button>
              )}
            </div>
            {completed.length === 0 ? (
              <div className="rounded-md border border-white/10 bg-black/30 p-3 text-sm text-white/60">
                No completed downloads
              </div>
            ) : (
              <ul className="divide-y divide-white/10 rounded-md border border-white/10 bg-black/30">
                {completed.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 p-3">
                    <img
                      src={d.poster || "/placeholder.svg?height=60&width=40&query=poster"}
                      alt=""
                      className="h-16 w-12 flex-none rounded object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{d.name}</div>
                      <div className="text-xs text-white/60">
                        Finished {new Date(d.completedAt || d.addedAt).toLocaleString()}
                      </div>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </DialogContent>
    </Dialog>
  )
}
