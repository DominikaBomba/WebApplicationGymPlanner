import { useParams } from 'react-router';
import { useAuth } from "../../AuthContext";
import { useEffect, useState } from 'react';
import styles from './Profile.module.scss';
import type { UserData } from "../../types/UserData.ts";
import { Link } from "react-router";
import Post from "../../components/Posts";

export default function Profile() {
    const { nickname } = useParams<{ nickname: string }>();
    const { user: currentUser, loading: authLoading } = useAuth();

    const [displayedUser, setDisplayedUser] = useState<UserData | null>(null);
    const [displayedFriends, setDisplayedFriends] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [myPosts, setMyPosts] = useState<any[]>([]);
    const [myFriends, setMyFriends] = useState<UserData[]>([]);
    const [plans, setPlans] = useState<any[]>([]);

    const fetchUserPosts = async (userId: number) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3000/api/posts/${userId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                const sorted = data.sort((a: any, b: any) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                );
                setMyPosts(sorted);
            }
        } catch (error) {
            console.error("Error fetching user posts:", error);
        }
    };

    const fetchPlans = async (userId: number, isOwn: boolean) => {
        try {
            const token = localStorage.getItem('token');
            const url = isOwn
                ? `http://localhost:3000/api/plans/my-plans`
                : `http://localhost:3000/api/plans/user/${userId}`;
            const response = await fetch(url, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setPlans(data);
            }
        } catch (error) {
            console.error("Error fetching plans:", error);
        }
    };

    const fetchFriends = async (targetNickname: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3000/api/users/friends/${targetNickname}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            setDisplayedFriends(Array.isArray(data) ? data : []);
        } catch (err: any) {
            console.error("Error fetching friends:", err);
        }
    };

    const fetchUserByUsername = async (targetNickname: string) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3000/api/users/${targetNickname}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("User not found");
            const data = await response.json();
            const userData = Array.isArray(data) ? data[0] : data;
            setDisplayedUser(userData);
            setError(null);
            if (userData?.id) {
                fetchUserPosts(userData.id);
                fetchPlans(userData.id, false);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchCurrentUserFriends = async () => {
            if (!currentUser) return;
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://localhost:3000/api/users/friends/${currentUser.nickname}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setMyFriends(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error("Error fetching logged-in user's friends:", err);
            }
        };
        fetchCurrentUserFriends();
    }, [currentUser]);

    useEffect(() => {
        if (authLoading) return;
        if (!nickname || (currentUser && nickname === currentUser.nickname)) {
            setDisplayedUser(currentUser);
            setLoading(false);
            if (currentUser?.id) {
                fetchUserPosts(currentUser.id);
                fetchFriends(currentUser.nickname);
                fetchPlans(currentUser.id, true);
            }
        } else {
            fetchUserByUsername(nickname);
            fetchFriends(nickname);
        }
    }, [nickname, currentUser, authLoading]);

    const handleAddFriend = async () => {
        if (!displayedUser) return;
        setIsSending(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3000/api/users/friends`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ friendId: displayedUser.id })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Adding error");
            }
            alert("Added to friends!");
            fetchFriends(displayedUser.nickname);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSending(false);
        }
    };

    const handleRemoveFriend = async () => {
        if (!displayedUser) return;
        setIsSending(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3000/api/users/friends`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ friendId: displayedUser.id })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Removal error");
            }
            alert("Removed from friends.");
            setMyFriends(myFriends.filter(f => f.id !== displayedUser.id));
            fetchFriends(displayedUser.nickname);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSending(false);
        }
    };

    if (authLoading || loading) return <div className={styles.loading}>Loading...</div>;
    if (error) return <div className={styles.error}>{error}</div>;
    if (!displayedUser) return <div className={styles.error}>User not found.</div>;

    const isMyProfile = !nickname || displayedUser.id === currentUser?.id;
    const isFriend = myFriends.some(f => f.id === displayedUser?.id);
    console.log(isFriend);
    console.log(myFriends);
    return (
        <div className={styles["profile-container"]}>
            <div className={styles.profileTop}>
                <img
                    src={displayedUser.profilePicture || ""}
                    className={styles["avatar-preview"]}
                    alt="profile"
                />
                <div className={styles.profileMeta}>
                    <div className={styles.profileNameRow}>
                        <h1>{displayedUser.nickname}</h1>
                        {isMyProfile && <span className={styles.youBadge}>You</span>}
                    </div>
                    <p className={styles.levelText}>{displayedUser.level}</p>
                    <p className={styles.descriptionText}>{displayedUser.description || "No description"}</p>

                    <div className={styles.statsRow}>
                        <div className={styles.statItem}>
                            <span className={styles.statNumber}>{myPosts.length}</span>
                            <span className={styles.statLabel}>posts</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statNumber}>{displayedFriends.length}</span>
                            <span className={styles.statLabel}>friends</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statNumber}>{plans.length}</span>
                            <span className={styles.statLabel}>plans</span>
                        </div>
                    </div>

                    {isMyProfile ? (
                        <Link to={"../settings"} className={styles.editLink}>Edit profile</Link>
                    ) : (
                        <button
                            className={`${styles.friendBtn} ${isFriend ? styles.removeBtn : ''}`}
                            onClick={isFriend ? handleRemoveFriend : handleAddFriend}
                            disabled={isSending}
                        >
                            {isSending ? "Processing..." : (isFriend ? "Remove friend" : "Add friend")}
                        </button>
                    )}
                </div>
            </div>

            {displayedFriends.length > 0 && (
                <div className={styles.friendsStrip}>
                    <p className={styles.stripLabel}>Friends</p>
                    <div className={styles["friends-avatar-container"]}>
                        {displayedFriends.map(friend => (
                            <div key={friend.id} className={styles.friendAvatarWrap}>
                                <Link to={`/profile/${friend.nickname}`}>
                                    <img
                                        className={styles["avatar-friends"]}
                                        src={friend.profilePicture}
                                        alt={friend.nickname}
                                    />
                                </Link>
                                <div className={styles.friendNickname}>{friend.nickname}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <section className={styles.contentSection}>
                <h2>{isMyProfile ? "My training ads" : `${displayedUser.nickname}'s training ads`}
                    <span className={styles.countBadge}>{myPosts.length}</span>
                </h2>
                <Post feedType="profile" userId={displayedUser.id} />
            </section>

            <section className={styles.contentSection}>
                <h2>{isMyProfile ? "My training plans" : `${displayedUser.nickname}'s training plans`}
                    <span className={styles.countBadge}>{plans.length}</span>
                </h2>
                {plans.length > 0 ? (
                    <div className={styles.plansGrid}>
                        {plans.map(plan => (
                            <div key={plan.id} className={styles.planCard}>
                                <div className={styles.planHeader}>
                                    <h4>{plan.title}</h4>
                                    <span className={styles.exerciseCount}>{plan.exercises?.length || 0} exercises</span>
                                </div>
                                {plan.exercises?.length > 0 && (
                                    <div className={styles.exerciseList}>
                                        {plan.exercises.slice(0, 3).map((ex: any) => (
                                            <div key={ex.id} className={styles.exerciseRow}>
                                                <span>{ex.name}</span>
                                                <span className={styles.reps}>{ex.reps}</span>
                                            </div>
                                        ))}
                                        {plan.exercises.length > 3 && (
                                            <p className={styles.moreExercises}>+{plan.exercises.length - 3} more</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className={styles.emptyText}>No training plans yet.</p>
                )}
            </section>
        </div>
    );
}