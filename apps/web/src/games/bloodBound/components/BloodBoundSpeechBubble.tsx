import React from "react";
import styles from "../pages/BloodBoundPlayPage.module.css";

export interface SpeechBubbleData {
  text: string;
  type?: "attack" | "intervene" | "wound" | "ability" | "info";
  timestamp: number;
}

interface BloodBoundSpeechBubbleProps {
  data?: SpeechBubbleData | null;
}

export const BloodBoundSpeechBubble: React.FC<BloodBoundSpeechBubbleProps> = ({ data }) => {
  if (!data || !data.text) return null;

  const type = data.type ?? "info";

  return (
    <div
      className={`${styles.speechBubble} ${
        type === "attack"
          ? styles.bubbleAttack
          : type === "intervene"
          ? styles.bubbleIntervene
          : type === "wound"
          ? styles.bubbleWound
          : type === "ability"
          ? styles.bubbleAbility
          : styles.bubbleInfo
      }`}
      role="status"
      aria-live="polite"
    >
      <div className={styles.speechBubbleContent}>
        <span>{data.text}</span>
      </div>
      <div className={styles.speechBubbleArrow} />
    </div>
  );
};
