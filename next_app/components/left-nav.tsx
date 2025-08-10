import { Power, Search, Settings } from "lucide-react"

export default function LeftNav({MENU,setMenuIndex,setMode,setGridIndex,rootRef,mode,menuIndex}){
    return(
              <aside className="relative z-10 flex h-full flex-col bg-black/50 backdrop-blur-sm sm:border-r border-white/10">
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="h-6 w-6 rounded-sm bg-cyan-500" aria-hidden />
          <div className="text-lg font-semibold tracking-wide text-white">CineBox</div>
        </div>
        <div className="px-2 text-xs text-white/60 uppercase tracking-wider">Browse</div>
        <nav role="navigation" aria-label="Primary" className="mt-2 flex-1">
          <ul className="space-y-1 px-2">
            {MENU.map((m, i) => {
              const Icon = m.icon
              const active = mode === "menu" && menuIndex === i
              const selectedKey = MENU[menuIndex].key
              return (
                <li key={m.key}>
                  <button
                    onClick={() => {
                      setMenuIndex(i)
                      setMode("grid")
                      setGridIndex(0)
                      rootRef.current?.focus()
                    }}
                    className={`group flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition
                      ${selectedKey === m.key ? "bg-white/10" : ""}
                      ${active ? "ring-2 ring-cyan-400" : "hover:bg-white/5"}
                    `}
                    aria-current={active ? "true" : "false"}
                    aria-selected={active}
                  >
                    <Icon className="h-5 w-5 text-white" />
                    <span className="truncate text-white">{m.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="mt-auto border-t border-white/10 p-2">
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2 text-white/90">
              <Power className="h-4 w-4" />
              <span className="text-sm">Power</span>
            </div>
            <div className="flex items-center gap-3 text-white/80">
              <Settings className="h-4 w-4" />
              <Search className="h-4 w-4" />
            </div>
          </div>
        </div>
      </aside>
    )
}