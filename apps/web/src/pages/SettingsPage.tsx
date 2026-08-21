import { useState, type FormEvent } from "react";
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

  const saveName = (event: FormEvent) => {
    event.preventDefault();
    if (name.trim()) {
      void rename(name.trim());
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
        <form className={styles.toggle} onSubmit={saveName}>
          <input value={name} onChange={(event) => setName(event.target.value)} maxLength={32} />
          <button type="submit">{t("save")}</button>
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
