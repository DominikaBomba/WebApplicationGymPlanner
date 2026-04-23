// components/Post/Post.tsx
import { useEffect, useState } from 'react';
import styles from './Post.module.scss';

interface PostProps {
    feedType: 'all' | 'friends';
}

export default function Post({ feedType }: PostProps) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');

                // Wybieramy endpoint na podstawie typu feedu
                const endpoint = feedType === 'friends' ? 'friends-feed' : 'all';

                const response = await fetch(`http://localhost:3000/api/posts/${endpoint}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });

                const data = await response.json();
                // @ts-ignore
                setPosts(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Błąd:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, [feedType]);

    if (loading) return <div className={styles.loading}>Pobieranie treningów...</div>;

    return (
        <div className={styles.feedContainer}>
            {posts.length === 0 ? (
                <p>Brak postów do wyświetlenia.</p>
            ) : (
                posts.map((post: any) => (
                    <div key={post.id} className={styles.postCard}>
                        <img
                            src={post.user.profilePicture || ""}
                            className={styles.avatar}
                            alt="profile"
                        />
                        <div className={styles.author}>
                            <strong>{post.user.nickname}</strong>
                        </div>
                        <h3>{post.title}</h3>
                        <p>{post.description}</p>
                        <div className={styles.footer}>
                            {post.gym.name} | {new Date(post.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}