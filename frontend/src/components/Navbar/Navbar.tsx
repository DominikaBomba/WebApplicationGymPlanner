import styles from './Navbar.module.scss';
import { Link } from "react-router";
import logoPrototype from '../../assets/logo_prototype.png';
import { useNavigate } from "react-router-dom";
export default function Navbar() {

    const navigate = useNavigate();

    const handleLogout = () => {

        localStorage.removeItem("token");

        // 2. Opcjonalnie: czyścimy inne dane (np. z cache TanStack Query)
        // queryClient.clear();


        navigate("/");


        window.location.reload();
    };
    return (
        <nav className={styles.Navbar}>

            <div className={styles.TopSection}>
                <img src={logoPrototype} className={styles.NavbarLogo} alt="Logo" />

            </div>


            <div className={styles.MiddleSection}>
                <ul className={styles.PillContainer}>
                    <li className={styles.ActiveItem}>
                        <Link to="/" className={styles.NavbarLink}>
                             <span className="material-symbols-outlined">home_app_logo</span>
                        </Link>
                    </li>
                    <li>
                        <Link to="/profile" className={styles.NavbarLink}>
                            <span className="material-symbols-outlined">man</span>
                        </Link>
                    </li>
                    <li><Link to="/goals" className={styles.NavbarLink}>
                        <span className="material-symbols-outlined">bar_chart_4_bars</span>
                    </Link></li>
                     </ul>

                <ul className={styles.PillContainer}>
                    <li><a className={styles.NavbarLink} onClick={() => handleLogout()}>    <span className="material-symbols-outlined">logout</span></a>
                    </li>



                    <li>
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
                            <img src="" alt="Avatar" />
                        </Link>
                    </li>
                </ul>
            </div>
        </nav>
    );
}