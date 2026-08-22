import { useEffect, useRef, useState } from "react";
import { useT } from "@/shared/i18n/useT";
import { getNobMoonMarkArt, getNobMoonMarkBack } from "../assets/nobArt";
import styles from "./NobMoonTokens.module.css";

interface NobMoonTokensProps {
  options: string[];
  disabled?: boolean;
  reducedMotion?: boolean;
  revealedValue?: number | null;
  pickedOption?: string | null;
  onPick: (option: string) => void;
}

export function NobMoonTokens({
  options,
  disabled = false,
  reducedMotion = false,
  revealedValue = null,
  pickedOption = null,
  onPick,
}: NobMoonTokensProps) {
  const t = useT();
  const back = getNobMoonMarkBack();
  const [brokenBack, setBrokenBack] = useState(false);
  const [brokenFront, setBrokenFront] = useState(false);
  const [flipOn, setFlipOn] = useState(false);
  const front = revealedValue != null ? getNobMoonMarkArt(revealedValue) : null;

  useEffect(() => {
    if (!pickedOption || revealedValue == null) {
      setFlipOn(false);
      return;
    }
    if (reducedMotion) {
      setFlipOn(true);
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      setFlipOn(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pickedOption, revealedValue, reducedMotion]);

  if (options.length === 0) {
    return null;
  }

  return (
    <div className={`${styles.row} ${reducedMotion ? styles.reduced : ""}`} aria-label={t("pickMoonToken")}>
      {options.map((option) => {
        const chosen = pickedOption === option;
        const faded = Boolean(pickedOption && !chosen);
        const flipped = Boolean(chosen && revealedValue != null && flipOn);
        return (
          <button
            key={option}
            type="button"
            className={styles.token}
            data-chosen={chosen ? "true" : "false"}
            data-faded={faded ? "true" : "false"}
            data-flip={flipped ? "true" : "false"}
            disabled={disabled || Boolean(pickedOption)}
            onClick={() => onPick(option)}
            aria-label={
              flipped ? t("moonMarkDrawn").replace("{n}", String(revealedValue)) : t("moonTokenBack")
            }
          >
            <span className={styles.inner}>
              <span className={styles.faceBack}>
                {brokenBack ? <span>{t("moonTokenBack")}</span> : (
                  <img src={back} alt="" draggable={false} onError={() => setBrokenBack(true)} />
                )}
              </span>
              <span className={styles.faceFront}>
                {front && !brokenFront ? (
                  <img src={front} alt="" draggable={false} onError={() => setBrokenFront(true)} />
                ) : (
                  <span>{revealedValue ?? ""}</span>
                )}
                {revealedValue != null ? <em>+{revealedValue}</em> : null}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function useMoonPickReveal(values: number[] | undefined, pickedOption: string | null) {
  const baseline = useRef<number[] | null>(null);
  const [revealed, setRevealed] = useState<number | null>(null);

  useEffect(() => {
    const next = values ?? [];
    if (!pickedOption) {
      baseline.current = next;
      setRevealed(null);
      return;
    }
    const before = baseline.current ?? [];
    if (next.length > before.length) {
      const added = next[next.length - 1];
      if (added === 2 || added === 3 || added === 4) {
        setRevealed(added);
      }
    }
  }, [values, pickedOption]);

  return revealed;
}
