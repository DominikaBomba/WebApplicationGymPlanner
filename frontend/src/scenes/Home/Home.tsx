import Post from "../../components/Posts";
import styles from "./Home.module.scss";
import LandingPage from "../LandingPage/LandingPage";
import { useAuth } from "../../AuthContext";
import {type FilterState, defaultFilters } from '../../types/filters';
import Filter from '../../components/Filter/Filter';
import {useState} from "react";

export default function Home() {
    const [filters, setFilters] = useState<FilterState>(defaultFilters);
    const token = localStorage.getItem("token");
    const { loading: authLoading } = useAuth();

    if (!token) return <LandingPage />;
    if (authLoading) return null;


    return (
        <div className={styles.dashboardContainer}>
            <Filter filters={filters} onChange={setFilters} />
            <div className={styles.dashboardGrid}>
                <section className={styles.feedSection}>
                    <h2 className={styles.sectionTitle}>Joined Trainings</h2>
                    <Post feedType="joined" filters={filters} />
                </section>
                <section className={styles.feedSection}>
                    <h2 className={styles.sectionTitle}>My Training Ads</h2>
                    <Post feedType="mine" filters={filters} />
                </section>
                <section className={styles.feedSection}>
                    <h2 className={styles.sectionTitle}>Friends Activity</h2>
                    <Post feedType="friends" filters={filters} />
                </section>
            </div>

            <section className={styles.discoverSection}>
                <h2 className={styles.sectionTitle}>Discover More</h2>
                <Post feedType="discover" filters={filters} />
            </section>
        </div>
    );
}