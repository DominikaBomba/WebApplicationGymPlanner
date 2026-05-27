import styles from './Navbar.module.scss';
import { Link, useLocation } from "react-router";
import logoIcon from '../../assets/icon.png';
import logo from '../../assets/logo.png';
import { useAuth } from "../../AuthContext.tsx";

import noAvatar from "../../assets/no_avatar.png";
import Search from "../Search";
import AddPost from "../AddPost";

import ChevronRightIcon from '../../assets/icons/chevron_right.svg?react';
import HomeIcon from '../../assets/icons/home_app_logo.svg?react';
import PersonIcon from '../../assets/icons/person.svg?react';
import DumbellIcon from '../../assets/icons/dumbell.svg?react';
import LogoutIcon from '../../assets/icons/logout.svg?react';
import SettingsIcon from '../../assets/icons/settings.svg?react';

interface NavbarProps {
    isExpanded: boolean;
    setIsExpanded: (expanded: boolean) => void;
}

export default function Navbar({ isExpanded, setIsExpanded }: NavbarProps) {
    const { user, logout } = useAuth();
    const location = useLocation();

    const token = localStorage.getItem("token");
    const path = location.pathname;

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to log out?')) {
            logout();
            window.location.href = '/';
        }
    };

    return (
        <>
            <div className={`${styles.NavbarHeader} ${isExpanded ? styles.expanded : ''}`}>
                <Search />
                {token ? (
                    <button onClick={handleLogout} className={styles.logoutBtn}>
                        Log Out
                    </button>
                ) : (
                    <Link to="/login" className={styles.registerBtn}>
                        Log In
                    </Link>
                )}
            </div>

            <nav className={`${styles.Navbar} ${isExpanded ? styles.expanded : ''}`}>
                <div className={styles.TopSection}>
                    <button
                        className={`${styles.ToggleButton} ${isExpanded ? styles.expanded : ''}`}
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        <ChevronRightIcon className={styles.icon} />
                    </button>
                    <img src={isExpanded ? logo : logoIcon} className={styles.NavbarLogo} alt="Logo" />
                </div>

                <div className={styles.MiddleSection}>
                    <ul className={styles.PillContainer}>
                        <li className={path === "/" ? styles.ActiveItem : ""}>
                            <Link to="/" className={styles.NavbarLink}>
                                <HomeIcon className={styles.icon} />
                                {isExpanded && <span className={styles.LinkLabel}>Home</span>}
                            </Link>
                        </li>
                        <li className={path === "/profile" ? styles.ActiveItem : ""}>
                            <Link to="/profile" className={styles.NavbarLink}>
                                <PersonIcon className={styles.icon} />
                                {isExpanded && <span className={styles.LinkLabel}>Profile</span>}
                            </Link>
                        </li>
                        <li className={path === "/stats" ? styles.ActiveItem : ""}>
                            <Link to="/stats" className={styles.NavbarLink}>
                                <DumbellIcon className={styles.icon} />
                                {isExpanded && <span className={styles.LinkLabel}>Ads</span>}
                            </Link>
                        </li>
                    </ul>

                    <ul className={styles.PillContainer}>
                        {token && (
                            <li>
                                <a className={`${styles.NavbarLink} ${styles.LogoutLink}`} onClick={handleLogout} style={{ cursor: 'pointer' }}>
                                    <LogoutIcon className={styles.icon} />
                                    {isExpanded && <span className={styles.LinkLabel}>Logout</span>}
                                </a>
                            </li>
                        )}
                        <li className={path === "/settings" ? styles.ActiveItem : ""}>
                            <Link to="/settings" className={styles.NavbarLink}>
                                <SettingsIcon className={styles.icon} />
                                {isExpanded && <span className={styles.LinkLabel}>Settings</span>}
                            </Link>
                        </li>
                    </ul>
                </div>

                <div className={styles.BottomSection}>
                    <ul className={styles.PillContainer}>
                        <li className={styles.ProfileAvatar}>
                            {token && user ? (
                                <Link to="/profile" className={styles.AvatarLink}>
                                    <img src={user.profilePicture || 'default-avatar.png'} alt="Avatar" className={styles.AvatarImg} />
                                    {isExpanded && (
                                        <div className={styles.UserInfo}>
                                            <span className={styles.UserNickname}>{user.nickname}</span>
                                            {user.level && <span className={styles.UserLevel}>{user.level}</span>}
                                        </div>
                                    )}
                                </Link>
                            ) : (
                                <Link to="/login" className={styles.AvatarLink}>
                                    <img src={noAvatar} alt="Avatar" className={styles.AvatarImg} />
                                    {isExpanded && (
                                        <div className={styles.UserInfo}>
                                            <span className={styles.UserNickname}>Guest</span>
                                            <span className={styles.UserLevel}>Log In</span>
                                        </div>
                                    )}
                                </Link>
                            )}
                        </li>
                    </ul>
                </div>
            </nav>
            {token && (<AddPost />)}
        </>
    );
}