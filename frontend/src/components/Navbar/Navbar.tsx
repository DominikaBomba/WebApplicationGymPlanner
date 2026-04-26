import styles from './Navbar.module.scss';
import { Link, useLocation } from "react-router";
import logoPrototype from '../../assets/logo_prototype.png';
import { useAuth } from "../../AuthContext.tsx";
import Login from "../Login";
import Register from "../Register";
import { useState } from "react";
import Search from "../Search";
import AddPost from "../AddPost";
import PlanCreator from "../PlanCreator";

export default function Navbar() {
    const { user, logout } = useAuth();
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [authMode, setAuthMode] = useState<"login" | "register">("login");
    const location = useLocation();

    const token = localStorage.getItem("token");
    const path = location.pathname;
    const [showPlanCreator, setShowPlanCreator] = useState(false);
    return (
        <>
            <div className={styles.NavbarHeader}>

                <Search />
                {token && (<AddPost/>)}
                {!showPlanCreator ? (
                    <button onClick={() => setShowPlanCreator(true)} className="add-plan-btn">
                        Add Plan
                    </button>
                ) : (
                    <div className="plan-creator-overlay">
                        <PlanCreator />
                        {/* Opcjonalnie przycisk zamknij */}
                        <button onClick={() => setShowPlanCreator(false)}>Close</button>
                    </div>
                )}

                {!token && (
                    <button
                        className={styles.registerBtn}
                        onClick={() => {
                            setAuthMode("register");
                            setIsAuthOpen(true);
                        }}
                    >
                        Log In
                    </button>
                )}
            </div>

            {isAuthOpen && (
                <div className={styles.loginOverlay}>
                    {authMode === "login" ? (
                        <Login
                            onClose={() => setIsAuthOpen(false)}
                            onSwitchToRegister={() => setAuthMode("register")}
                        />
                    ) : (
                        <Register
                            onClose={() => setIsAuthOpen(false)}
                            onSwitchToLogin={() => setAuthMode("login")}
                        />
                    )}
                </div>
            )}

            <nav className={styles.Navbar}>
                <div className={styles.TopSection}>
                    <img src={logoPrototype} className={styles.NavbarLogo} alt="Logo" />
                </div>

                <div className={styles.MiddleSection}>
                    <ul className={styles.PillContainer}>
                        <li className={path === "/" ? styles.ActiveItem : ""}>
                            <Link to="/" className={styles.NavbarLink}>
                                <span className="material-symbols-outlined">home_app_logo</span>
                            </Link>
                        </li>
                        <li className={path === "/profile" ? styles.ActiveItem : ""}>
                            <Link to="/profile" className={styles.NavbarLink}>
                                <span className="material-symbols-outlined">man</span>
                            </Link>
                        </li>
                        <li className={path === "/goals" ? styles.ActiveItem : ""}>
                            <Link to="/goals" className={styles.NavbarLink}>
                                <span className="material-symbols-outlined">bar_chart_4_bars</span>
                            </Link>
                        </li>
                    </ul>

                    <ul className={styles.PillContainer}>
                        <li>
                            <a className={styles.NavbarLink} onClick={logout} style={{ cursor: 'pointer' }}>
                                <span className="material-symbols-outlined">logout</span>
                            </a>
                        </li>
                        <li className={path === "/settings" ? styles.ActiveItem : ""}>
                            <Link to="/settings" className={styles.NavbarLink}>
                                <span className="material-symbols-outlined">settings</span>
                            </Link>
                        </li>
                    </ul>
                </div>

                <div className={styles.BottomSection}>
                    <ul className={styles.PillContainer}>
                        <li className={styles.ProfileAvatar}>
                            <Link to="/profile">
                                <img src={user?.profilePicture || 'default-avatar.png'} alt="Avatar" />
                            </Link>
                        </li>
                    </ul>
                </div>
            </nav>
        </>
    );
}