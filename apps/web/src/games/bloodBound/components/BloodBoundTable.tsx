import React from "react";
import type { BloodBoundCard, BloodBoundPlayerPublic, BloodBoundPhase } from "../model/bloodBoundTypes";
import { BloodBoundSeatCard } from "./BloodBoundSeatCard";
import { BloodBoundCenterHub } from "./BloodBoundCenterHub";
import type { SpeechBubbleData } from "./BloodBoundSpeechBubble";
import styles from "../pages/BloodBoundPlayPage.module.css";

interface BloodBoundTableProps {
  tableSeats: BloodBoundPlayerPublic[];
  myPlayerId: string;
  daggerHolderPlayerId: string;
  currentTargetPlayerId: string | null;
  intervenedByPlayerId: string | null;
  secretCards: Record<string, BloodBoundCard>;
  isMyTurn: boolean;
  canDebug: boolean;
  debugMode: boolean;
  isGameOver: boolean;
  phase: BloodBoundPhase;
  canIIntervene: boolean;
  attackerName?: string;
  targetName?: string;
  victimName?: string;
  isVictimMe?: boolean;
  daggerHolderName?: string;
  interventionCountdown?: number | null;
  totalCountdown?: number;
  speechBubbles?: Record<string, SpeechBubbleData>;
  onStartPlay: () => void;
  onIntervene: () => void;
  onPassIntervene: () => void;
  onSelectTarget: (playerId: string) => void;
}

export function getSeatPosition(index: number, total: number): { left: string; top: string } {
  if (total <= 0) return { left: "50%", top: "50%" };

  // Index 0 ("Bạn") starts at bottom (angle = 90 deg = PI/2)
  const angle = (index / total) * 2 * Math.PI + Math.PI / 2;
  const radiusX = total > 12 ? 43 : total > 8 ? 41 : 39;
  const radiusY = total > 12 ? 36 : total > 8 ? 34 : 32;

  const left = 50 + radiusX * Math.cos(angle);
  const top = 50 + radiusY * Math.sin(angle);

  return { left: `${left.toFixed(2)}%`, top: `${top.toFixed(2)}%` };
}

export const BloodBoundTable: React.FC<BloodBoundTableProps> = ({
  tableSeats,
  myPlayerId,
  daggerHolderPlayerId,
  currentTargetPlayerId,
  intervenedByPlayerId,
  secretCards,
  isMyTurn,
  canDebug,
  debugMode,
  isGameOver,
  phase,
  canIIntervene,
  attackerName,
  targetName,
  victimName,
  isVictimMe,
  daggerHolderName,
  interventionCountdown,
  totalCountdown,
  speechBubbles,
  onStartPlay,
  onIntervene,
  onPassIntervene,
  onSelectTarget,
}) => {
  return (
    <div className={styles.tableArena}>
      <div className={styles.tableWrapper}>
        {/* Felt Poker Table Rim & Felt */}
        <div className={styles.pokerTable} />

        {/* SVG Trajectory, Compass & Flow Arrows */}
        <svg className={styles.tableSvgOverlay} viewBox="0 0 1000 650">
          <defs>
            <marker id="arrow-rose" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
            </marker>
            <marker id="arrow-purple" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#c084fc" />
            </marker>
            <marker id="arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#34d399" />
            </marker>
            <marker id="arrow-amber" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
            </marker>
          </defs>

          {/* Main Trajectory Orbit */}
          <ellipse
            cx="500"
            cy="325"
            rx="390"
            ry="225"
            fill="none"
            stroke="rgba(245, 158, 11, 0.16)"
            strokeWidth="1.6"
            strokeDasharray="8 6"
          />

          {/* Inner Trajectory Ring */}
          <ellipse
            cx="500"
            cy="325"
            rx="180"
            ry="110"
            fill="none"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth="1"
          />

          {/* Vertical Compass Line */}
          <line
            x1="500"
            y1="215"
            x2="500"
            y2="435"
            stroke="#f59e0b"
            strokeWidth="1.4"
            strokeDasharray="4 4"
            opacity="0.35"
          />

          {/* Directional Curved Arrows */}
          <path d="M 440 435 A 180 110 0 0 1 320 340" fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="5 4" markerEnd="url(#arrow-rose)" opacity="0.85" />
          <path d="M 320 310 A 180 110 0 0 1 440 215" fill="none" stroke="#c084fc" strokeWidth="2" strokeDasharray="5 4" markerEnd="url(#arrow-purple)" opacity="0.85" />
          <path d="M 560 215 A 180 110 0 0 1 680 310" fill="none" stroke="#34d399" strokeWidth="2" strokeDasharray="5 4" markerEnd="url(#arrow-green)" opacity="0.85" />
          <path d="M 680 340 A 180 110 0 0 1 560 435" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5 4" markerEnd="url(#arrow-amber)" opacity="0.85" />
        </svg>

        {/* Central Action Hub (Đặt ngay tâm bàn cờ, nổi bật, không che ghế) */}
        <BloodBoundCenterHub
          phase={phase}
          isMyTurn={isMyTurn}
          canIIntervene={canIIntervene}
          attackerName={attackerName}
          targetName={targetName}
          victimName={victimName}
          isVictimMe={isVictimMe}
          daggerHolderName={daggerHolderName}
          interventionCountdown={interventionCountdown}
          totalCountdown={totalCountdown}
          onStartPlay={onStartPlay}
          onIntervene={onIntervene}
          onPassIntervene={onPassIntervene}
        />

        {/* Seat Cards Area */}
        <div className={styles.seatsRoundArea}>
          {tableSeats.map((player, index) => {
            const isYou = player.playerId === myPlayerId;
            const isLeftNeighbor = index === 1;
            const isOpposite = index === Math.floor(tableSeats.length / 2);
            const isDaggerHolder = daggerHolderPlayerId === player.playerId;
            const isTarget = currentTargetPlayerId === player.playerId;
            const isIntervener = intervenedByPlayerId === player.playerId;
            const secret = secretCards[player.playerId];
            const pos = getSeatPosition(index, tableSeats.length);

            return (
              <BloodBoundSeatCard
                key={player.playerId}
                player={player}
                index={index}
                totalSeats={tableSeats.length}
                isYou={isYou}
                isLeftNeighbor={isLeftNeighbor}
                isOpposite={isOpposite}
                isDaggerHolder={isDaggerHolder}
                isTarget={isTarget}
                isIntervener={isIntervener}
                secret={secret}
                pos={pos}
                isMyTurn={isMyTurn}
                canDebug={canDebug}
                debugMode={debugMode}
                isGameOver={isGameOver}
                speechBubble={speechBubbles?.[player.playerId]}
                onSelectTarget={onSelectTarget}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
