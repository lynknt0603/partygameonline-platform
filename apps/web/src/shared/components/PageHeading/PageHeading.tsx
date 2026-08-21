import styles from "./PageHeading.module.css";

interface PageHeadingProps {
  kicker?: string;
  title: string;
  subtitle: string;
}

export function PageHeading({ kicker, title, subtitle }: PageHeadingProps) {
  return (
    <header className={styles.wrap}>
      {kicker ? <p className={styles.kicker}>{kicker}</p> : null}
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.subtitle}>{subtitle}</p>
    </header>
  );
}
