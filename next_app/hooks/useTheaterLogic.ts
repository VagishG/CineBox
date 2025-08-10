import { useState, useEffect, useMemo, useCallback } from "react"
import axios from "axios"

export function useTheaterLogic() {
  const [menuIndex, setMenuIndex] = useState(0)
  const [items, setItems] = useState<any[]>([])
  const [torrentSearchResult, setTorrentSearchResult] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const menus = [
    { name: "Movies" },
    { name: "TV Shows" },
    { name: "Local" }
  ]

  const displayedItems = useMemo(() => {
    return menuIndex === 2 && torrentSearchResult.length
      ? torrentSearchResult
      : items
  }, [menuIndex, torrentSearchResult, items])

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return

    if (menuIndex === 2) {
      const { data } = await axios.get(`/api/all/${searchQuery}`)
      setTorrentSearchResult(data.results || [])
    } else {
      const filtered = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setItems(filtered)
    }
  }, [menuIndex, searchQuery, items])

  const handleItemClick = useCallback((item: any) => {
    console.log("Clicked:", item)
  }, [])

  return {
    items,
    menus,
    menuIndex,
    setMenuIndex,
    searchQuery,
    setSearchQuery,
    isSearchOpen,
    setIsSearchOpen,
    handleSearch,
    displayedItems,
    handleItemClick
  }
}
