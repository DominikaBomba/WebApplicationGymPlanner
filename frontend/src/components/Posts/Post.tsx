import { useEffect, useState } from 'react';
import styles from './Post.module.scss';

interface PostProps {
    feedType: 'all' | 'friends';
}

export default function Post({ feedType }: PostProps) {
    const [posts, setPosts] = useState<any[]>([]); // Warto dodać typowanie zamiast any
    const [loading, setLoading] = useState(true);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const endpoint = feedType === 'friends' ? 'friends-feed' : 'all';

            const response = await fetch(`http://localhost:3000/api/posts/${endpoint}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            const data = await response.json();
            setPosts(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Błąd:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [feedType]);

    const handleJoin = async (postId: number) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3000/api/posts/join_post`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ postId })
            });

            const data = await response.json();

            if (response.ok) {
                await fetchPosts();


            } else {
                alert(data.error || "Wystąpił błąd");
            }
        } catch (err) {
            console.error("Błąd wysyłania:", err);
            alert("Błąd połączenia z serwerem");
        }
    };
    const handleLeave = async (postId: number) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3000/api/posts/leave_post`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ postId })
            });

            if (response.ok) {

                await fetchPosts();
            } else {
                const data = await response.json();
                alert(data.error || "Wystąpił błąd");
            }
        } catch (err) {
            console.error("Błąd:", err);
        }
    };
    if (loading) return <div className={styles.loading}>Pobieranie treningów...</div>;

    return (
        <div className={styles.feedContainer}>
            {posts.length === 0 ? (
                <p>Brak postów do wyświetlenia.</p>
            ) : (
                posts.map((post: any) => {
                    // Logika obliczeniowa musi być przed returnem wewnątrz map
                    const isJoined = post.participants && post.participants.length > 0;

                    return (
                        <div key={post.id} className={styles.postCard}>
                            <div className={styles.header}>
                                <img
                                    src={post.user.profilePicture || "/default-avatar.png"}
                                    className={styles.avatar}
                                    alt="profile"
                                />
                                <strong>{post.user.nickname}</strong>
                            </div>

                            <h3>{post.title}</h3>
                            <p>{post.description}</p>

                            {isJoined ? (
                                <button
                                    className={styles.cancelButton}
                                    onClick={() => handleLeave(post.id)}
                                >
                                    Cancel / Leave
                                </button>
                            ) : (
                                <button
                                    className={styles.joinButton}
                                    onClick={() => handleJoin(post.id)}
                                >
                                    Join training
                                </button>
                            )}

                            <div className={styles.footer}>
                                {post.gym.name} | {new Date(post.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );

}