import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import logo from '../../assets/logo.png';
import arrow from '../../assets/arrow.png';
import styles from './LandingPage.module.scss';

const sliderImages = [
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&h=450&fit=crop",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=450&fit=crop",
    "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=300&h=450&fit=crop",
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=300&h=450&fit=crop",
    "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=300&h=450&fit=crop",
    "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=300&h=450&fit=crop",
    "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=300&h=450&fit=crop",
];

export default function LandingPage() {
    const sliderRef = useRef(null);
    const slidesRef = useRef([]);

    useEffect(() => {
        let frame;

        const update = () => {
            const slider = sliderRef.current;
            if (slider) {
                const rect = slider.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const halfW = rect.width / 2;

                const maxDrop = 45;   // jak mocno środek opada (głębokość łuku)
                const maxAngle = 7;   // maksymalny obrót na brzegach (w stopniach)

                for (const el of slidesRef.current) {
                    if (!el) continue;
                    const r = el.getBoundingClientRect();
                    const slideCenter = r.left + r.width / 2;

                    // pozycja kafelka: -1 (lewy brzeg) ... 0 (środek) ... 1 (prawy brzeg)
                    let dx = (slideCenter - centerX) / halfW;
                    dx = Math.max(-1, Math.min(1, dx));

                    const y = maxDrop * (1 - dx * dx); // środek nisko, brzegi wysoko
                    const angle = maxAngle * dx;       // lewa strona w lewo, prawa w prawo

                    el.style.transform = `translateY(${y}px) rotate(${angle}deg)`;
                }
            }
            frame = requestAnimationFrame(update);
        };

        frame = requestAnimationFrame(update);
        return () => cancelAnimationFrame(frame);
    }, []);

    const allImages = [...sliderImages, ...sliderImages];

    return (
        <div className={styles.landingContainer}>
            <div className={styles.heroSection}>
                <img src={logo} alt="Gym Planner Logo" className={styles.landingLogo} />



                <h1 className={styles.heroTitle}>
                    Train Smarter<br />Reach Your Goals
                </h1>

                <p className={styles.heroDescription}>
                    Find workout buddies, join training sessions, and track your
                    progress with your ultimate fitness companion.
                </p>
                <img src={arrow} className={styles.arrow1} />
                <span className={styles.ctaNote1}>It's 10/10</span>
                <span className={styles.badge}>Join over 10 happy members</span>
                <div className={styles.slider} ref={sliderRef}>
                    <div className={styles.sliderTrack}>
                        {allImages.map((src, i) => (
                            <div
                                className={styles.slide}
                                key={i}
                                ref={(el) => (slidesRef.current[i] = el)}
                            >
                                <img src={src} alt="" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.ctaContainer}>

                    <Link to="/login" className={styles.ctaButtonPrimary}>Get Started</Link>
                </div>
                <img src={arrow} className={styles.arrow2} />
                <span className={styles.ctaNote}>It's free</span>
            </div>
        </div>
    );
}