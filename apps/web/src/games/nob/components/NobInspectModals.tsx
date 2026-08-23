import { useState } from "react";
import { X } from "lucide-react";
import { useLocale, useT } from "@/shared/i18n/useT";
import { getNobBloodlineArt, getNobBloodlineCardBack, getNobCardText } from "../assets/nobArt";
import { bloodlineFlavor, bloodlineTitle } from "../model/nobBloodlineCopy";
import type { NobCardInstance, NobView } from "../model/nobTypes";
import { NobCard } from "./NobCard";
import styles from "./NobInspectModals.module.css";

interface NobInspectModalsProps {
  view: NobView | null;
  roleOpen: boolean;
  cardsOpen: boolean;
  onClose: () => void;
}

export function NobInspectModals({ view, roleOpen, cardsOpen, onClose }: NobInspectModalsProps) {
  const t = useT();
  const locale = useLocale();
  const [cardIndex, setCardIndex] = useState(0);
  const [artBroken, setArtBroken] = useState(false);

  if (!roleOpen && !cardsOpen) {
    return null;
  }

  const knowledge = view?.myBloodlineKnowledge ?? null;
  const bloodline = view?.myBloodline ?? null;
  const known = Boolean(bloodline && (knowledge === "KNOWN" || knowledge === "PUBLICLY_REVEALED"));
  const art = known && bloodline ? getNobBloodlineArt(bloodline.type, bloodline.rank) : null;
  const cards: NobCardInstance[] =
    (view?.myDraftHand?.length ? view.myDraftHand : view?.myHand) ?? [];
  const safeIndex = cards.length === 0 ? 0 : Math.min(cardIndex, cards.length - 1);
  const current = cards[safeIndex];
  const text = current ? getNobCardText(current.cardCode, locale) : null;

  return (
    <div className={styles.layer}>
      <button type="button" className={styles.backdrop} aria-label={t("closeCardDetail")} onClick={onClose} />
      <div className={styles.dialog} role="dialog" aria-modal="true">
        <header className={styles.head}>
          <h2>{roleOpen ? t("viewRole") : t("viewCards")}</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label={t("closeCardDetail")}>
            <X size={18} />
          </button>
        </header>

        {roleOpen ? (
          <div className={styles.role}>
            {known && art && !artBroken ? (
              <img src={art} alt={bloodlineTitle(bloodline, locale)} onError={() => setArtBroken(true)} />
            ) : (
              <img src={getNobBloodlineCardBack()} alt={t("identityCard")} />
            )}
            {known && bloodline ? (
              <>
                <h3>{bloodlineTitle(bloodline, locale)}</h3>
                <p>
                  {bloodline.type === "HALFBLOOD"
                    ? (locale === "vi" ? "Con Lai" : "Halfblood")
                    : bloodline.type === "VAMPIRE"
                      ? (locale === "vi" ? "Ma Cà Rồng" : "Vampire")
                      : (locale === "vi" ? "Ma Sói" : "Werewolf")}
                  {bloodline.rank != null && bloodline.type !== "HALFBLOOD"
                    ? ` · ${locale === "vi" ? "Bậc" : "Rank"} ${bloodline.rank}`
                    : ""}
                </p>
                <p>{bloodlineFlavor(bloodline.type, locale)}</p>
              </>
            ) : (
              <p>{knowledge === "UNKNOWN_AFTER_SWAP" || !bloodline ? t("bloodlineUnknown") : t("hiddenBloodline")}</p>
            )}
          </div>
        ) : (
          <div className={styles.cards}>
            {cards.length === 0 || !current ? (
              <p>{t("noCardsInHand")}</p>
            ) : (
              <>
                <div className={styles.carousel}>
                  {cards.length > 1 ? (
                    <button type="button" onClick={() => setCardIndex((index) => (index - 1 + cards.length) % cards.length)}>
                      ‹
                    </button>
                  ) : null}
                  <NobCard cardCode={current.cardCode} revealed onClick={() => undefined} />
                  {cards.length > 1 ? (
                    <button type="button" onClick={() => setCardIndex((index) => (index + 1) % cards.length)}>
                      ›
                    </button>
                  ) : null}
                </div>
                <h3>{text?.name ?? current.cardCode}</h3>
                {current.number != null ? <p>#{current.number}</p> : null}
                <p>{text?.description ?? text?.tooltip ?? current.cardCode}</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
