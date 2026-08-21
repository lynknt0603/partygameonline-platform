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
  const front = revealedValue != null ? getNobMoonMarkArt(revealedValue) : null;

  if (options.length === 0) {
    return null;
  }

  return (
    <div className={`${styles.row} ${reducedMotion ? styles.reduced : ""}`} aria-label={t("pickMoonToken")}>
      {options.map((option) => {
        const chosen = pickedOption === option;
        const faded = Boolean(pickedOption && !chosen);
        const showFront = chosen && front && revealedValue != null && !brokenFront;
        return (
          <button
            key={option}
            type="button"
            className={styles.token}
            data-chosen={chosen ? "true" : "false"}
            data-faded={faded ? "true" : "false"}
            data-flip={showFront ? "true" : "false"}
            disabled={disabled || Boolean(pickedOption)}
            onClick={() => onPick(option)}
          >
            {showFront ? (
              <img src={front} alt={`Moon ${revealedValue}`} onError={() => setBrokenFront(true)} />
            ) : brokenBack ? (
              <span>{t("moonTokenBack")}</span>
            ) : (
              <img src={back} alt={t("moonTokenBack")} onError={() => setBrokenBack(true)} />
            )}
            {chosen && revealedValue != null && (brokenFront || !front) ? <span>{revealedValue}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export function useMoonPickReveal(values: number[] | undefined, pickedOption: string | null) {
  const prev = useRef(values ?? []);
  const [revealed, setRevealed] = useState<number | null>(null);

  useEffect(() => {
    const next = values ?? [];
    if (pickedOption && next.length > prev.current.length) {
      const added = next[next.length - 1];
      if (added === 2 || added === 3 || added === 4) {
        setRevealed(added);
      }
    }
    if (!pickedOption) {
      setRevealed(null);
    }
    prev.current = next;
  }, [values, pickedOption]);

  return revealed;
}
