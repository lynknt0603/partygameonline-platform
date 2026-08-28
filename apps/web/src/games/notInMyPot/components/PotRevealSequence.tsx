import { useEffect, useRef, useState } from "react";
import { Eye, Target } from "lucide-react";
import { NOT_IN_MY_POT_ASSETS } from "../assets/notInMyPotAssetManifest";
import type { NotInMyPotCard } from "../model/notInMyPotTypes";
import styles from "../pages/NotInMyPotPlayPage.module.css";

interface PotRevealSequenceProps {
  cards: NotInMyPotCard[];
  targetScore: number;
  locale: "vi" | "en";
  onComplete: () => void;
}

type RevealPhase = "PREPARING" | "REVEALING_CARD" | "UPDATING_SCORE" | "COMPLETE";

const INGREDIENT_ART: Record<string, string> = {
  VEGETABLE: NOT_IN_MY_POT_ASSETS.cards.vegetable,
  SALT: NOT_IN_MY_POT_ASSETS.cards.tofu,
  TOFU: NOT_IN_MY_POT_ASSETS.cards.tofu,
  
  MEAT: NOT_IN_MY_POT_ASSETS.cards.meat,
};

function ingredientLabel(type: string, locale: "vi" | "en"): string {
  if (type === "VEGETABLE") return locale === "vi" ? "Rau củ" : "Vegetable";
  if (type === "SALT" || type === "TOFU") return locale === "vi" ? "Đậu phụ" : "Tofu";
  if (type === "MEAT") return locale === "vi" ? "Thịt" : "Meat";
  return type.replaceAll("_", " ");
}

function RevealCard({
  card,
  locale,
  flipped = false,
}: {
  card: NotInMyPotCard;
  locale: "vi" | "en";
  flipped?: boolean;
}) {
  const score = card.score ?? 0;
  const scoreLabel = score > 0 ? `+${score}` : String(score);
  return (
    <div className={`${styles.revealCard} ${flipped ? styles.revealCardFlipped : ""}`}>
      <div className={styles.revealCardInner}>
        <div className={styles.revealCardBack}>
          <img src={NOT_IN_MY_POT_ASSETS.cards.gameplayBack} alt="" aria-hidden="true" />
        </div>
        <div className={styles.revealCardFront}>
          <img src={INGREDIENT_ART[card.type] ?? NOT_IN_MY_POT_ASSETS.cards.gameplayBack} alt="" aria-hidden="true" />
          <strong>{ingredientLabel(card.type, locale)}</strong>
          <b className={score < 0 ? styles.revealScoreNegative : score > 0 ? styles.revealScorePositive : ""}>{scoreLabel}</b>
        </div>
      </div>
    </div>
  );
}

export function PotRevealSequence({ cards, targetScore, locale, onComplete }: PotRevealSequenceProps) {
  const [revealedCount, setRevealedCount] = useState(0);
  const [runningScore, setRunningScore] = useState(0);
  const [flippingCard, setFlippingCard] = useState<NotInMyPotCard | null>(null);
  const [phase, setPhase] = useState<RevealPhase>("PREPARING");
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const signature = cards.map((card) => `${card.cardId}:${card.type}:${card.score ?? ""}`).join("|");

  useEffect(() => {
    let timer: number | undefined;
    let cancelled = false;

    setRevealedCount(0);
    setRunningScore(0);
    setFlippingCard(null);
    setPhase("PREPARING");

    const finish = () => {
      if (cancelled) return;
      setPhase("COMPLETE");
      timer = window.setTimeout(() => {
        if (!cancelled) onCompleteRef.current();
      }, 850);
    };

    const revealNext = (index: number, scoreBefore: number) => {
      if (cancelled) return;
      if (index >= cards.length) {
        finish();
        return;
      }
      setPhase("REVEALING_CARD");
      timer = window.setTimeout(() => {
        if (cancelled) return;
        const card = cards[index];
        const nextScore = scoreBefore + (card.score ?? 0);
        setFlippingCard(card);
        setPhase("UPDATING_SCORE");
        timer = window.setTimeout(() => {
          if (cancelled) return;
          setRunningScore(nextScore);
          setRevealedCount(index + 1);
          setFlippingCard(null);
          timer = window.setTimeout(() => revealNext(index + 1, nextScore), 360);
        }, 560);
      }, index === 0 ? 520 : 300);
    };

    if (cards.length === 0) {
      finish();
    } else {
      revealNext(0, 0);
    }

    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [signature]);

  const isFinished = phase === "COMPLETE";
  const currentCard = flippingCard ?? cards[revealedCount] ?? null;
  const comparison = runningScore >= targetScore ? "≥" : "<";

  return (
    <div className={styles.revealLayer} role="dialog" aria-modal="true" aria-labelledby="nimp-reveal-title">
      <div className={styles.revealBackdrop} />
      <section className={styles.revealCardPanel}>
        <header className={styles.revealHeader}>
          <div>
            <p className={styles.modalEyebrow}>{locale === "vi" ? "TOÀN BỘ BÀN CÙNG XEM" : "EVERYONE AT THE TABLE"}</p>
            <h2 id="nimp-reveal-title">{locale === "vi" ? "Mở nồi!" : "Reveal the pot!"}</h2>
          </div>
          <span className={styles.revealLock}><Eye size={15} /> {locale === "vi" ? "Đang khóa lượt chơi" : "Gameplay locked"}</span>
        </header>

        <div className={styles.revealScoreboard}>
          <div>
            <span>{locale === "vi" ? "ĐIỂM NỒI" : "POT SCORE"}</span>
            <strong className={runningScore < 0 ? styles.revealScoreNegative : runningScore > 0 ? styles.revealScorePositive : ""}>{runningScore}</strong>
          </div>
          <div className={styles.revealTarget}><Target size={18} /><span>{locale === "vi" ? "MỤC TIÊU" : "TARGET"}</span><strong>{targetScore}</strong></div>
        </div>

        <div className={styles.revealStage} aria-live="polite">
          {currentCard ? <RevealCard card={currentCard} locale={locale} flipped={Boolean(flippingCard)} /> : null}
          {!currentCard && isFinished ? <span className={styles.revealDone}>{locale === "vi" ? "Đã mở hết nguyên liệu" : "All ingredients revealed"}</span> : null}
        </div>

        <div className={styles.revealedRow} aria-label={locale === "vi" ? "Các nguyên liệu đã mở" : "Revealed ingredients"}>
          {cards.slice(0, revealedCount).map((card) => (
            <div className={styles.revealedMiniCard} key={card.cardId}>
              <img src={INGREDIENT_ART[card.type] ?? NOT_IN_MY_POT_ASSETS.cards.gameplayBack} alt="" aria-hidden="true" />
              <span>{card.score !== null && card.score > 0 ? `+${card.score}` : card.score ?? 0}</span>
            </div>
          ))}
        </div>

        <footer className={styles.revealFooter}>
          <span>{locale === "vi" ? `Lá ${Math.min(revealedCount + (flippingCard ? 1 : 0), cards.length)} / ${cards.length}` : `Card ${Math.min(revealedCount + (flippingCard ? 1 : 0), cards.length)} / ${cards.length}`}</span>
          {isFinished ? <strong>{runningScore} {comparison} {targetScore}</strong> : <span>{locale === "vi" ? "Lật từng lá để tính điểm thật" : "Flipping each card to calculate the true score"}</span>}
        </footer>
      </section>
    </div>
  );
}
