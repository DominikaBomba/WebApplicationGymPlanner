
    import { useEffect, useState } from 'react';
    import styles from './Post.module.scss';
    import { Link, useNavigate } from "react-router";
import PostDetails from '../PostDetails/PostDetails'; // Upewnij się, że ścieżka jest poprawna

interface PostProps {
    feedType: 'all' | 'friends' | 'joined' | 'mine';
}

export default function Post({ feedType }: PostProps) {
    const currentUserId = Number(localStorage.getItem('userId')); // Przykład
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPostId, setSelectedPostId] = useState<number | null>(null);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            let endpoint = 'all';
            if (feedType === 'friends') endpoint = 'friends-feed';
            else if (feedType === 'joined') endpoint = 'joined';
            else if (feedType === 'mine') endpoint = `${currentUserId}`;

            const response = await fetch(`http://localhost:3000/api/posts/${endpoint}`, {
                headers: {"Authorization": `Bearer ${token}`}
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

    const navigate = useNavigate();

        const handleJoin = async (e: React.MouseEvent, postId: number) => {
            e.stopPropagation();
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            try {
                const response = await fetch(`http://localhost:3000/api/posts/join_post`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({postId})
                });

                if (response.ok) {
                    await fetchPosts();
                } else {
                    const data = await response.json();
                    alert(data.error || "Wystąpił błąd");
                }
            } catch (err) {
                console.error("Błąd wysyłania:", err);
            }
        };

        const handleLeave = async (e: React.MouseEvent, postId: number) => {
            e.stopPropagation();
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            try {
                const response = await fetch(`http://localhost:3000/api/posts/leave_post`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({postId})
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
                {selectedPostId && (
                    <PostDetails
                        postId={selectedPostId}
                        onClose={() => setSelectedPostId(null)}
                    />
                )}

                {posts.length === 0 ? (
                    <p>Brak postów do wyświetlenia.</p>
                ) : (
                    posts.map((post: any) => {
                        const isJoined = post.participants?.some((p: any) => p.participantId === currentUserId);
                        post.participants?.some((p: any) =>console.log(p))
                        return (
                            <div key={post.id} className={styles.postCard}>
                                <Link to={"../profile/" + post.user.nickname} className={styles.header}>
                                    <img
                                        src={post.user.profilePicture || "/default-avatar.png"}
                                        className={styles.avatar}
                                        alt="profile"
                                    />
                                    <strong>{post.user.nickname}</strong>
                                </Link>

                                <h3>{post.title}</h3>
                                <p>{post.description}</p>

                                <div className={styles.buttonGroup}>
                                    <button
                                        className={styles.detailsButton}
                                        onClick={() => {
                                            if (!localStorage.getItem('token')) {
                                                navigate('/login');
                                            } else {
                                                setSelectedPostId(post.id);
                                            }
                                        }}
                                    >
                                        Szczegóły
                                    </button>

                                    {isJoined ? (
                                        <button
                                            className={styles.cancelButton}
                                            onClick={(e) => handleLeave(e, post.id)}
                                        >
                                            Cancel / Leave
                                        </button>
                                    ) : (
                                        <button
                                            className={styles.joinButton}
                                            onClick={(e) => handleJoin(e, post.id)}
                                        >
                                            Join training
                                        </button>
                                    )}
                                </div>

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