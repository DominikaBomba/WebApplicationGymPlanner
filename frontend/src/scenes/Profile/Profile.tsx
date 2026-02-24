import styles from './Profile.module.scss';
import { useAuth } from "../../AuthContext"; // Importujesz swój nowy hook

export default function Profile() {
    const { user, loading } = useAuth();

    if (loading) return <div className={styles.loading}>Loading...</div>;

    if (!user) return null;

    return (
        <div className={styles["profile-container"]}>
            <h1>{user.nickname}</h1>
            <div className={styles["user-info"]}>
                <img
                    src={user.profilePicture || "https://via.placeholder.com/150"}
                    alt="Avatar Preview"
                    className={styles["avatar-preview"]}
                />
                <div className={styles.details}>
                    <p><strong>Email:</strong> {user.login}</p>
                    <p><strong>Level:</strong> {user.level || "Beginner"}</p>
                    <p><strong>About me:</strong> {user.description || "No description provided."}</p>
                </div>
            </div>
        </div>
    );
}