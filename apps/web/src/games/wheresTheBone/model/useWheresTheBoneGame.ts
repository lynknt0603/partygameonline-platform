import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { WsEnvelope } from "@/shared/api/types";
import { useRoomRealtime } from "@/shared/hooks/useRoomRealtime";
import { fetchWheresTheBoneSnapshot, sendWheresTheBoneCommand, type WheresTheBoneCommand } from "../api/wheresTheBoneApi";
import { parseWheresTheBoneView, type WheresTheBoneView } from "./wheresTheBoneTypes";
export function useWheresTheBoneGame(roomId:string|undefined, enabled:boolean){
  const id=roomId?.toUpperCase(); const snapshot=useQuery({queryKey:["wheres-the-bone",id],queryFn:()=>fetchWheresTheBoneSnapshot(id!),enabled:Boolean(id&&enabled),refetchInterval:id&&enabled?2000:false,gcTime:0});
  const [view,setView]=useState<WheresTheBoneView|null>(null); const [notice,setNotice]=useState<string|null>(null); const [rejectCode,setRejectCode]=useState<string|null>(null);
  useEffect(()=>{if(snapshot.data)setView(c=>!c||snapshot.data!.version>=c.version?snapshot.data!:c);},[snapshot.data]);
  const onView=useCallback((raw:Record<string,unknown>,_e:WsEnvelope)=>{const next=parseWheresTheBoneView(raw);if(next)setView(c=>!c||next.version>=c.version?next:c);},[]);
  const onRejected=useCallback((code:string,message:string)=>{setRejectCode(code);setNotice(message);},[]); useRoomRealtime(enabled?id:undefined,{onView,onRejected});
  const sendCommand=useCallback((command:WheresTheBoneCommand)=>{if(!id||!view)return null;setNotice(null);return sendWheresTheBoneCommand(id,command,view.version);},[id,view]);
  return {view,snapshotPending:enabled&&snapshot.isPending,snapshotError:enabled&&snapshot.isError?(snapshot.error as Error):null,notice,rejectCode,sendCommand};
}
