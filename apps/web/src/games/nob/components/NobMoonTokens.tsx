import { useEffect, useRef, useState } from "react";
import { useT } from "@/shared/i18n/useT";
import { getNobMoonMarkArt, getNobMoonMarkBack } from "../assets/nobArt";
import { playNobSfx } from "../model/nobSfx";
import styles from "./NobMoonTokens.module.css";

interface NobMoonTokensProps {
  options: string[];
  remainingOptions?: string[];
  disabled?: boolean;
  reducedMotion?: boolean;
  revealedByOption?: Record<string, number>;
  pickedOptions?: string[];
  onPick: (option: string) => void;
}

export function NobMoonTokens({
  options,
  remainingOptions,
  disabled = false,
  reducedMotion = false,
  revealedByOption = {},
  pickedOptions = [],
  onPick,
}: NobMoonTokensProps) {
  const t = useT();
  const back = getNobMoonMarkBack();
  const [brokenBack, setBrokenBack] = useState(false);
  const [brokenFront, setBrokenFront] = useState(false);
  const flippedCount = Object.keys(revealedByOption).length;
  const [flipReady, setFlipReady] = useState(0);

  useEffect(() => {
    if (flippedCount === 0) {
      setFlipReady(0);
      return;
    }
    playNobSfx("tokenFlip");
    if (reducedMotion) {
      setFlipReady(flippedCount);
      return;
    }
    const frame = window.requestAnimationFrame(() => setFlipReady(flippedCount));
    return () => window.cancelAnimationFrame(frame);
  }, [flippedCount, reducedMotion]);

  if (options.length === 0) {
    return null;
  }

  return (
    <div className={`${styles.row} ${reducedMotion ? styles.reduced : ""}`} aria-label={t("pickMoonToken")}>
      {options.map((option) => {
        const chosen = pickedOptions.includes(option);
        const value = revealedByOption[option];
        const open = remainingOptions == null || remainingOptions.includes(option);
        const faded = Boolean(!chosen && pickedOptions.length > 0 && !open);
        const flipped = Boolean(chosen && value != null && flipReady > 0);
        const front = value != null ? getNobMoonMarkArt(value) : null;
        return (
          <button
            key={option}
            type="button"
            className={styles.token}
            data-chosen={chosen ? "true" : "false"}
            data-faded={faded ? "true" : "false"}
            data-flip={flipped ? "true" : "false"}
            disabled={disabled || chosen || !open}
            onClick={() => onPick(option)}
            aria-label={
              flipped ? t("moonMarkDrawn").replace("{n}", String(value)) : t("moonTokenBack")
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
                  <span>{value ?? ""}</span>
                )}
                {value != null ? <em>+{value}</em> : null}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function useMoonPickReveal(values: number[] | undefined, pickedOption: string | null) {
  const map = useMoonPickReveals(values, pickedOption ? [pickedOption] : []);
  return pickedOption ? (map[pickedOption] ?? null) : null;
}

export function useMoonPickReveals(values: number[] | undefined, pickedOptions: string[]) {
  const baseline = useRef<number[]>([]);
  const [map, setMap] = useState<Record<string, number>>({});

  useEffect(() => {
    const next = values ?? [];
    if (pickedOptions.length === 0) {
      baseline.current = next;
      setMap({});
      return;
    }
    const gained = next.slice(baseline.current.length);
    if (gained.length === 0) {
      return;
    }
    setMap((current) => {
      const copy = { ...current };
      let index = 0;
      for (const option of pickedOptions) {
        if (copy[option] != null) {
          continue;
        }
        const added = gained[index++];
        if (added === 2 || added === 3 || added === 4) {
          copy[option] = added;
        }
      }
      return copy;
    });
    baseline.current = next;
  }, [values, pickedOptions]);

  return map;
}
