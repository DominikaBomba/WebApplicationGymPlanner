// components/PostDetails/PostDetails.tsx
import { useEffect, useState } from 'react';
import styles from './PostDetails.module.scss';

interface PostDetailsProps {
    postId: number;
    onClose: () => void;
}

export default function PostDetails({ postId, onClose }: PostDetailsProps) {
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const token = localStorage.getItem('token');
                // Upewnij się, że backend w zapytaniu Prisma robi:
                // include: { user: true, gym: true, trainingPlan: { include: { exercises: true } }, participants: { include: { user: true } } }
                const response = await fetch(`http://localhost:3000/api/posts/details/${postId}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                const data = await response.json();
                setPost(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [postId]);

    if (loading) return (
        <div className={styles.overlay}><div className={styles.modal}>Ładowanie...</div></div>
    );

    if (!post) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose}>&times;</button>

                {/* Sekcja nagłówka: Autor i Tytuł */}
                <header className={styles.modalHeader}>
                    <div className={styles.authorBadge}>
                        <img
                            src={post.user.profilePicture || "/default-avatar.png"}
                            alt="avatar"
                            className={styles.authorAvatar}
                        />
                        <div>
                            <strong>{post.user.nickname}</strong>
                            <span>Poziom: {post.user.level}</span>
                        </div>
                    </div>
                    <h1>{post.title}</h1>
                </header>

                <hr className={styles.separator} />

                {/* Sekcja głównych informacji o treningu */}
                <section className={styles.detailsGrid}>
                    <div className={styles.infoBox}>
                        <h4>Kiedy i Gdzie?</h4>
                        <p><strong>📅 Data:</strong> {new Date(post.date).toLocaleString()}</p>
                        <p><strong>📍 Siłownia:</strong> {post.gym.name}</p>
                        <p><strong>🏠 Adres:</strong> {post.gym.address}, {post.gym.city}</p>
                        {post.gym.link && <a href={post.gym.link} target="_blank" rel="noreferrer">Otwórz stronę siłowni</a>}
                    </div>

                    <div className={styles.infoBox}>
                        <h4>Specyfikacja</h4>
                        <p><strong>⏳ Czas trwania:</strong> {post.trainingDuration.replace(/_/g, ' ')}</p>
                        <p><strong>👥 Limit:</strong> {post.participants.length} / {post.maxParticipants || 'Brak limitu'}</p>
                        <p><strong>🔒 Typ:</strong> {post.isPublic ? "Publiczny" : "Dla znajomych"}</p>
                    </div>
                </section>

                {/* Opis posta */}
                <section className={styles.textSection}>
                    <h4>Opis treningu</h4>
                    <p>{post.description}</p>
                    {post.additionalInfo && (
                        <div className={styles.additionalInfo}>
                            <strong>Dodatkowe info:</strong> {post.additionalInfo}
                        </div>
                    )}
                </section>

                {/* Plan Treningowy i Ćwiczenia */}
                {post.trainingPlan && (
                    <section className={styles.planSection}>
                        <h3>📋 Plan: {post.trainingPlan.title}</h3>
                        <div className={styles.exercisesContainer}>
                            {post.trainingPlan.exercises.length > 0 ? (
                                <table className={styles.exerciseTable}>
                                    <thead>
                                    <tr>
                                        <th>Ćwiczenie</th>
                                        <th>Serie/Powtórzenia</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {post.trainingPlan.exercises.map((ex: any) => (
                                        <li key={ex.id} className={styles.exerciseRow}>
                                            <strong>{ex.name}</strong> — {ex.reps}
                                        </li>
                                    ))}
                                    </tbody>
                                </table>
                            ) : <p>Brak ćwiczeń w tym planie.</p>}
                        </div>
                    </section>
                )}


                <section className={styles.participantsSection}>
                    <h3>👥 Uczestnicy ({post.participants.length})</h3>
                    <div className={styles.participantsList}>
                        {post.participants.map((p: any) => (
                            <div key={p.id} className={styles.participantItem}>
                                <img className={styles.friendsAvatar} src={p.user.profilePicture || "/default-avatar.png"} alt="avatar" />
                                <span>{p.user.nickname}</span>
                            </div>
                        ))}
                        {post.participants.length === 0 && <p>Nikt jeszcze nie dołączył.</p>}
                    </div>
                </section>
            </div>
        </div>
    );
}