import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Zero Labs AI Publisher</h1>
        <p>AI-powered automated publishing platform for websites, portfolios, and social media</p>
        <p>
          <em>Environment setup is in progress. Full features coming soon.</em>
        </p>
      </main>
    </div>
  );
}
