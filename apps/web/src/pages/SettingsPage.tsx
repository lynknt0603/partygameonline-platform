import { useEffect, useState, type FormEvent } from "react";
import { AppearanceSettings } from "@/shared/components/AppearanceSettings/AppearanceSettings";
import { PageHeading } from "@/shared/components/PageHeading/PageHeading";
import { useLocaleStore } from "@/shared/i18n/useLocaleStore";
import { useT } from "@/shared/i18n/useT";
import { useSessionStore } from "@/shared/state/sessionStore";
import styles from "./SettingsPage.module.css";

export function SettingsPage() {
  const t = useT();
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);
  const [sound, setSound] = useState(true);
  const session = useSessionStore((state) => state.session);
  const rename = useSessionStore((state) => state.rename);
  const [name, setName] = useState(session?.displayName ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(session?.displayName ?? "");
  }, [session?.displayName]);

  const saveName = async (event: FormEvent) => {
    event.preventDefault();
    const next = name.trim().slice(0, 32);
    if (!next) {
      return;
    }
    setSaving(true);
    setSaved(false);
    try {
      await rename(next);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <PageHeading title={t("settingsTitle")} subtitle={t("settingsSub")} />

      <section className={`${styles.panel} theme-panel`}>
        <h2>{t("language")}</h2>
        <label className={styles.toggle}>
          <input
            type="radio"
            name="locale"
            checked={locale === "vi"}
            onChange={() => setLocale("vi")}
          />
          <span>{t("vietnamese")}</span>
        </label>
        <label className={styles.toggle}>
          <input
            type="radio"
            name="locale"
            checked={locale === "en"}
            onChange={() => setLocale("en")}
          />
          <span>{t("english")}</span>
        </label>
      </section>

      <section className={`${styles.panel} theme-panel`}>
        <h2>{t("guestName")}</h2>
        <p>{t("guestNameHint")}</p>
        <form className={styles.nameForm} onSubmit={(event) => void saveName(event)}>
          <input
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setSaved(false);
            }}
            maxLength={32}
            autoComplete="nickname"
            aria-label={t("guestName")}
          />
          <button type="submit" disabled={saving || !name.trim()}>
            {saving ? t("saving") : saved ? t("nameSaved") : t("save")}
          </button>
        </form>
      </section>

      <AppearanceSettings />

      <section className={`${styles.panel} theme-panel`}>
        <h2>{t("sound")}</h2>
        <label className={styles.toggle}>
          <input type="checkbox" checked={sound} onChange={() => setSound((value) => !value)} />
          <span>{t("sound")}</span>
        </label>
      </section>
    </div>
  );
}
