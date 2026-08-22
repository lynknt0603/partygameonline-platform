import { useEffect, useState } from "react";
import { realtime, type RealtimeStatus } from "@/shared/api/ws";

export function useRealtimeStatus(): RealtimeStatus {
  const [status, setStatus] = useState<RealtimeStatus>(() => realtime.currentStatus());

  useEffect(() => realtime.subscribeStatus(setStatus), []);

  return status;
}
