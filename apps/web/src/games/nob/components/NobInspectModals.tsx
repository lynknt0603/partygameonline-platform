import { useState } from "react";
import { X } from "lucide-react";
import { useLocale, useT } from "@/shared/i18n/useT";
import { getNobBloodlineArt, getNobBloodlineCardBack } from "../assets/nobArt";
import { bloodlineFlavor, bloodlineGuide, bloodlineTitle } from "../model/nobBloodlineCopy";
import type { NobView } from "../model/nobTypes";
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
  const [artBroken, setArtBroken] = useState(false);

  if (!roleOpen && !cardsOpen) {
    return null;
  }

  const knowledge = view?.myBloodlineKnowledge ?? null;
  const bloodline = view?.myBloodline ?? null;
  const known = Boolean(bloodline && (knowledge === "KNOWN" || knowledge === "PUBLICLY_REVEALED"));
  const art = known && bloodline ? getNobBloodlineArt(bloodline.type, bloodline.rank) : null;
  const guide = known && bloodline ? bloodlineGuide(bloodline.type, locale) : null;
  const roundOrder = locale === "vi"
    ? [
        "Chọn bài (Draft cards) · 2 lượt",
        "Kẻ Theo Dõi (Shadow Stalker)",
        "Tiên Tri (Blood Seer)",
        "Kẻ Hóa Hình (Shapeshifter)",
        "Sát Thủ Hoang Dã (Feral Killer)",
        "Thợ Săn (Hunter)",
      ]
    : ["Draft cards (2 picks)", "Shadow Stalker", "Blood Seer", "Shapeshifter", "Feral Killer", "Hunter"];

  return (
    <div className={styles.layer}>
      <button type="button" className={styles.backdrop} aria-label={t("closeCardDetail")} onClick={onClose} />
      <div className={styles.dialog} role="dialog" aria-modal="true">
        <header className={styles.head}>
          <h2>{roleOpen ? t("viewRole") : t("viewRoundOrder")}</h2>
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
                <p>{bloodlineFlavor(bloodline.type, locale)}</p>
                {guide ? (
                  <div className={styles.guide}>
                    <section>
                      <h4>{locale === "vi" ? "Điều kiện thắng" : "Win condition"}</h4>
                      <p>{guide.winCondition}</p>
                    </section>
                    <section>
                      <h4>{locale === "vi" ? "Mẹo chơi" : "Tips"}</h4>
                      <ul>
                        {guide.tips.map((tip) => <li key={tip}>{tip}</li>)}
                      </ul>
                    </section>
                  </div>
                ) : null}
              </>
            ) : (
              <p>{knowledge === "UNKNOWN_AFTER_SWAP" || !bloodline ? t("bloodlineUnknown") : t("hiddenBloodline")}</p>
            )}
          </div>
        ) : (
          <div className={styles.roundOrder}>
            <p>{locale === "vi" ? "Các giai đoạn được gọi lần lượt trong mỗi round:" : "Phases are called in this order each round:"}</p>
            <ol>
              {roundOrder.map((phase) => <li key={phase}>{phase}</li>)}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
