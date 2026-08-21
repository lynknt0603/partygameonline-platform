import { useEffect, useRef, useState } from "react";

export function useNobClock(serverTime: string | null | undefined) {
  const offsetRef = useRef(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!serverTime) {
      return;
    }
    const parsed = Date.parse(serverTime);
    if (!Number.isNaN(parsed)) {
      offsetRef.current = parsed - Date.now();
    }
  }, [serverTime]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  const estimatedNow = now + offsetRef.current;

  const remainingMs = (deadline: string | null | undefined): number | null => {
    if (!deadline) {
      return null;
    }
    const end = Date.parse(deadline);
    if (Number.isNaN(end)) {
      return null;
    }
    return end - estimatedNow;
  };

  return { estimatedNow, remainingMs };
}

export function formatCountdown(remainingMs: number): string {
  const total = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
