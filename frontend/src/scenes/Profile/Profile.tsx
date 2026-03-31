import { useParams } from 'react-router-dom';
import { useAuth } from "../../AuthContext";
import { useEffect, useState } from 'react';
import styles from './Profile.module.scss';
import type {UserData} from "../../types/UserData.ts";

export default function Profile() {
    const { nickname } = useParams<{ nickname: string }>();
    const { user: currentUser, loading: authLoading } = useAuth();

    const [displayedUser, setDisplayedUser] = useState<UserData | null>(null);
    const [displayedFriends, setDisplayedFriends] = useState<UserData[] | null>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);

    const handleAddFriend = async () => {
        if (!displayedUser) return;

        setIsSending(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3000/api/users/friends`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ friendId: displayedUser.id })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Błąd dodawania");
            }

            alert("Dodano do znajomych!");
            // Opcjonalnie: odśwież listę znajomych po dodaniu
            fetchFriends(displayedUser.nickname);

        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSending(false);
        }
    };
    const fetchUserByUsername = async (targetNickname: string) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3000/api/users/${targetNickname}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
            });

            if (!response.ok) throw new Error("User not found");

            const data = await response.json();

                 const userData = Array.isArray(data) ? data[0] : data;

            setDisplayedUser(userData);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchFriends = async (targetNickname: string) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3000/api/users/friends/${targetNickname}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
            });



            const data = await response.json();
            setDisplayedFriends(Array.isArray(data) ? data : []);


            console.log(displayedFriends);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
    console.log("dzialam")
        if (authLoading) return;
        if (!nickname) {
            setDisplayedUser(currentUser);
            setDisplayedFriends(displayedFriends);
            setLoading(false);
        }
        else if (currentUser && nickname === currentUser.nickname) {
            setDisplayedUser(currentUser);
            setDisplayedFriends(displayedFriends);
            setLoading(false);
        }
        else {
            fetchUserByUsername(nickname);
            fetchFriends(nickname);
        }

    }, [nickname, currentUser, authLoading]);

    if (authLoading || loading) return <div className={styles.loading}>Loading...</div>;
    if (error) return <div className={styles.error}>{error}</div>;
    if (!displayedUser) return <div className={styles.error}>Użytkownik nie odnaleziony.</div>;

    const isMyProfile = !nickname || displayedUser.id === currentUser?.id;

    return (
        <div className={styles["profile-container"]}>
            <h1>{displayedUser.nickname} {isMyProfile && "(Ty)"}</h1>
            {displayedFriends?.map(friend => (<div key={friend.id}>{friend.nickname}</div>))}

            <div className={styles["user-info"]}>
                <img
                    src={displayedUser.profilePicture || ""}
                    className={styles["avatar-preview"]}
                    alt="profile"
                />
                <div className={styles.details}>
                    <p><strong>Level:</strong> {displayedUser.level}</p>
                    <p><strong>About:</strong> {displayedUser.description || "Brak opisu"}</p>
                    {isMyProfile ? (
                        <button className={styles.editBtn}>Edit Profile</button>
                    ) : (
                        <button className={styles.friendBtn}
                                onClick={handleAddFriend}
                                disabled={isSending}>{isSending ? "Dodawanie..." : "Add Friend"}</button>
                    )}
                </div>
            </div>
        </div>
    );
}