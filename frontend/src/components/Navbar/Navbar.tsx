import styles from './Navbar.module.scss';
import {Link, useLocation} from "react-router";
import logoPrototype from '../../assets/logo_prototype.png';
import { useNavigate } from "react-router-dom";
import {useAuth} from "../../AuthContext.tsx";

export default function Navbar() {
    const {user, logout} = useAuth();



    const path = location.pathname;
    return (
        <nav className={styles.Navbar}>

            <div className={styles.TopSection}>
                <img src={logoPrototype} className={styles.NavbarLogo} alt="Logo" />

            </div>


            <div className={styles.MiddleSection}>
                <ul className={styles.PillContainer}>
                   <li className={path == "/" ? styles.ActiveItem : ""}>
                        <Link to="/" className={styles.NavbarLink}>
                             <span className="material-symbols-outlined">home_app_logo</span>
                        </Link>
                    </li>
                    <li className={path == "/profile" ? styles.ActiveItem : ""}>
                        <Link to="/profile" className={styles.NavbarLink}>
                            <span className="material-symbols-outlined">man</span>
                        </Link>
                    </li>
                    <li className={path == "/goals" ? styles.ActiveItem : ""}>
                        <Link to="/goals" className={styles.NavbarLink}>
                        <span className="material-symbols-outlined">bar_chart_4_bars</span>
                    </Link>
                    </li>
                     </ul>

                <ul className={styles.PillContainer}>
                    <li><a className={styles.NavbarLink} onClick={logout}>
                        <span className="material-symbols-outlined">logout</span></a>
                    </li>



                    <li className={path == "/settings" ? styles.ActiveItem : ""}>
                        <Link to="/settings" className={styles.NavbarLink}>
                        <span className="material-symbols-outlined">settings</span>
                        ️</Link>
                    </li>
                </ul>
            </div>


            <div className={styles.BottomSection}>
                <ul className={styles.PillContainer}>
                    <li className={styles.ProfileAvatar}>
                        <Link to="/profile">
                            <img src={user?.profilePicture} alt="Avatar" />
                        </Link>
                    </li>
                </ul>
            </div>
        </nav>
    );
}