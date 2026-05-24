import { Link } from "react-router-dom";
import logo from '../../assets/logo.png';
import styles from './LandingPage.module.scss';

export default function LandingPage() {
    return (
        <div className={styles.landingContainer}>
            <div className={styles.heroSection}>
                <img src={logo} alt="Gym Planner Logo" className={styles.landingLogo} />
                <p className={styles.heroSubtitle}>Your ultimate fitness companion</p>
                <p className={styles.heroDescription}>Find workout buddies, join training sessions, and track your progress!</p>
                <div className={styles.ctaContainer}>
                    <Link to="/login" className={styles.ctaButtonPrimary}>Log In</Link>
                    <Link to="/goals" className={styles.ctaButtonSecondary}>Discover Training Ads</Link>
                </div>
            </div>
        </div>
    );
}
