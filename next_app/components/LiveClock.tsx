import { useState, useEffect } from "react";

export function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const h = now.getHours();
  const m = now.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = ((h + 11) % 12) + 1;
  const mm = String(m).padStart(2, "0");
  return (
    <span
      className="text-white"
      aria-live="polite"
    >{`${hh}:${mm} ${ampm}`}</span>
  );
}