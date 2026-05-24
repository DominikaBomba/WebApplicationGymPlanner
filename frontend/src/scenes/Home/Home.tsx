import Post from "../../components/Posts";
import styles from "./Home.module.scss";
import LandingPage from "../LandingPage/LandingPage";

export default function Home() {
    const token = localStorage.getItem("token");

    if (!token) {
        return <LandingPage />;
    }

    return (
        <div className={styles.dashboardContainer}>
            <div className={styles.dashboardGrid}>
                <section className={styles.feedSection}>
                    <h2 className={styles.sectionTitle}>Joined Trainings</h2>
                    <Post feedType="joined" />
                </section>

                <section className={styles.feedSection}>
                    <h2 className={styles.sectionTitle}>My Training Ads</h2>
                    <Post feedType="mine" />
                </section>

                <section className={styles.feedSection}>
                    <h2 className={styles.sectionTitle}>Friends Activity</h2>
                    <Post feedType="friends" />
                </section>
            </div>
        </div>
    );
}