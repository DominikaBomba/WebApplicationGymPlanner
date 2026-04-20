// scenes/Home/Home.tsx
import Post from "../../components/Posts";
import styles from "./Home.module.scss";

export default function Home() {
    return (
        <div className={styles.homeContainer}>
            <section className={styles.feedSection}>
                <h2 className={styles.sectionTitle}>Odkrywaj (Publiczne)</h2>
                <Post feedType="all" />
            </section>

            <section className={styles.feedSection}>
                <h2 className={styles.sectionTitle}>Treningi Znajomych</h2>
                <Post feedType="friends" />
            </section>
        </div>
    );
}