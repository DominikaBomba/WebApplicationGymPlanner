import { useParams } from 'react-router-dom';
import { useAuth } from "../../AuthContext";
import { useEffect, useState } from 'react';
import styles from './Profile.module.scss';
import type {UserData} from "../../types/UserData.ts";

export default function Profile() {
    const { nickname } = useParams(); // Pobiera 'mareknowak' z /profile/mareknowak
    const username = nickname;
   // console.log(username);
    const { user: currentUser, loading: authLoading } = useAuth();
    const [displayedUser, setDisplayedUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // profile
        if (!username) {
            if (!authLoading) {
                setDisplayedUser(currentUser);
                setLoading(false);
            }
        }
        // profile/:username
        else {
            fetchUserByUsername(username);
        }
    }, [username, currentUser, authLoading]);

    const fetchUserByUsername = async (username: string) => {
        try {
            const token = localStorage.getItem('token');
            setLoading(true);
            const response = await fetch(`http://localhost:3000/api/users/${username}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
            });


            if (!response.ok) throw new Error("User not found");

            const data = await response.json();
           // console.log(data);
            setDisplayedUser(data);
            console.log(data);

        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading || authLoading) return <div className={styles.loading}>Loading...</div>;
    if (error) return <div className={styles.error}>{error}</div>;
    if (!displayedUser) return null;

    const isMyProfile = !username || displayedUser.id === currentUser?.id;

    return (
        <div className={styles["profile-container"]}>
            <h1>{displayedUser.nickname} {isMyProfile && "(Ty)"}</h1>

            <div className={styles["user-info"]}>
                <img
                    src={displayedUser.profilePicture || "https://via.placeholder.com/150"}
                    className={styles["avatar-preview"]}
                />
                <div className={styles.details}>
                    <p><strong>Level:</strong> {displayedUser.level}</p>
                    <p><strong>About:</strong> {displayedUser.description}</p>

                    {/* Przycisk edycji tylko u siebie */}
                    {isMyProfile && <button className={styles.editBtn}>Edit Profile</button>}

                    {/* Przycisk dodawania znajomego tylko u kogoś */}
                    {!isMyProfile && <button className={styles.friendBtn}>Add Friend</button>}
                </div>
            </div>


        </div>
    );
}