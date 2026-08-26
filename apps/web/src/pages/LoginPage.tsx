import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PageHeading } from "@/shared/components/PageHeading/PageHeading";
import { useT } from "@/shared/i18n/useT";
import { useSessionStore } from "@/shared/state/sessionStore";
import { ApiError } from "@/shared/api/types";
import { safeReturnTo } from "@/shared/auth/memberAccess";
import styles from "./LoginPage.module.css";

interface LoginPageProps {
  defaultTab?: "login" | "register";
}

export function LoginPage({ defaultTab = "login" }: LoginPageProps) {
  const t = useT();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "register" ? "register" : defaultTab;
  const requiresMember = searchParams.get("required") === "member";
  const returnTo = safeReturnTo(searchParams.get("returnTo"));
  const [tab, setTab] = useState<"login" | "register">(initialTab);

  // Form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [guestName, setGuestName] = useState("");

  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const login = useSessionStore((state) => state.login);
  const register = useSessionStore((state) => state.register);
  const startGuest = useSessionStore((state) => state.startGuest);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedUser = username.trim();
    if (!trimmedUser) {
      setErrorMessage(t("usernameRequired"));
      return;
    }
    if (!password) {
      setErrorMessage(t("passwordRequired"));
      return;
    }

    if (tab === "register") {
      if (password !== confirmPassword) {
        setErrorMessage(t("passwordMismatch"));
        return;
      }
    }

    setLoading(true);
    try {
      if (tab === "login") {
        await login({ username: trimmedUser, password });
      } else {
        await register({ username: trimmedUser, password });
      }
      navigate(returnTo, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message || t("authFailed"));
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(t("authFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestPlay = async (e: FormEvent) => {
    e.preventDefault();
    const name = guestName.trim() || "Player";
    setGuestLoading(true);
    try {
      await startGuest(name);
      navigate("/");
    } catch {
      setErrorMessage(t("sessionError"));
    } finally {
      setGuestLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <PageHeading
        title={tab === "login" ? t("loginTitle") : t("registerTitle")}
        subtitle={tab === "login" ? t("loginSub") : t("registerSub")}
      />

      <div className={`${styles.authCard} theme-card`}>
        {/* Tab switch */}
        <div className={styles.tabHeader} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "login"}
            className={`${styles.tabBtn} ${tab === "login" ? styles.activeTab : ""}`}
            onClick={() => {
              setTab("login");
              setErrorMessage(null);
            }}
          >
            {t("login")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "register"}
            className={`${styles.tabBtn} ${tab === "register" ? styles.activeTab : ""}`}
            onClick={() => {
              setTab("register");
              setErrorMessage(null);
            }}
          >
            {t("register")}
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className={styles.errorAlert} role="alert">
            <span className={styles.errorIcon}>!</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Main Auth Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="username" className={styles.label}>
              {t("username")}
            </label>
            <input
              id="username"
              type="text"
              className={`${styles.input} theme-input`}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="VD: bloodmoon"
              autoComplete="username"
              required
              disabled={loading}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              {t("password")}
            </label>
            <input
              id="password"
              type="password"
              className={`${styles.input} theme-input`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={tab === "login" ? "current-password" : "new-password"}
              required
              disabled={loading}
            />
          </div>

          {tab === "register" && (
            <div className={styles.field}>
              <label htmlFor="confirmPassword" className={styles.label}>
                {t("confirmPassword")}
              </label>
              <input
                id="confirmPassword"
                type="password"
                className={`${styles.input} theme-input`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                disabled={loading}
              />
            </div>
          )}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? (
              <span className={styles.spinner} />
            ) : tab === "login" ? (
              t("login")
            ) : (
              t("register")
            )}
          </button>
        </form>

        {/* Tab switch hint */}
        <div className={styles.switchHint}>
          {tab === "login" ? (
            <span>
              {t("dontHaveAccount")}{" "}
              <button
                type="button"
                className={styles.textLink}
                onClick={() => {
                  setTab("register");
                  setErrorMessage(null);
                }}
              >
                {t("registerNow")}
              </button>
            </span>
          ) : (
            <span>
              {t("alreadyHaveAccount")}{" "}
              <button
                type="button"
                className={styles.textLink}
                onClick={() => {
                  setTab("login");
                  setErrorMessage(null);
                }}
              >
                {t("loginNow")}
              </button>
            </span>
          )}
        </div>

        {requiresMember ? null : <div className={styles.divider}>
          <span className={styles.dividerLine} />
          <span className={styles.dividerText}>HOẶC</span>
          <span className={styles.dividerLine} />
        </div>}

        {/* Guest quick join section */}
        {requiresMember ? null : <div className={styles.guestSection}>
          <div className={styles.guestHeading}>
            <span className={styles.guestTitle}>{t("guestQuickPlay")}</span>
          </div>
          <form onSubmit={handleGuestPlay} className={styles.guestForm}>
            <input
              type="text"
              className={`${styles.input} ${styles.guestInput} theme-input`}
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder={t("guestNameLabel")}
              maxLength={24}
              disabled={guestLoading}
            />
            <button
              type="submit"
              className={styles.guestBtn}
              disabled={guestLoading}
            >
              {guestLoading ? t("saving") : t("guestPlayBtn")}
            </button>
          </form>
        </div>}
      </div>
    </div>
  );
}
