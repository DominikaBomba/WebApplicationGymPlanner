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

            <section className={styles.upcomingSection}>
                <h2 className={styles.sectionTitle}>Upcoming – You're in</h2>
                <Post feedType="joined" filters={filters} excludeOwn upcomingOnly forceSort="soonest" />
            </section>

            <section className={styles.discoverSection}>
                <h2 className={styles.sectionTitle}>Discover More</h2>
                <div className={styles.discoverGrid}>
                    <div className={styles.discoverColumn}>
                        <h3 className={styles.columnTitle}>Friends' Activity</h3>
                        <Post feedType="friends" filters={filters} excludeOwn />
                    </div>
                    <div className={styles.discoverColumn}>
                        <h3 className={styles.columnTitle}>Public Trainings</h3>
                        <Post feedType="discover" filters={filters} excludeOwn />
                    </div>
                </div>
            </section>
        </div>
    );
}