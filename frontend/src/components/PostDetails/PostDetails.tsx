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
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <p className={styles.loadingText}>Loading...</p>
            </div>
        </div>
    );

    if (!post) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose} aria-label="Close">&#x2715;</button>

                <div className={styles.modalHeader}>
                    <img
                        src={post.user.profilePicture || "/default-avatar.png"}
                        alt="avatar"
                        className={styles.authorAvatar}
                    />
                    <div className={styles.authorInfo}>
                        <strong className={styles.authorName}>{post.user.nickname}</strong>
                        <span className={styles.authorLevel}>{post.user.level}</span>
                    </div>
                    <div className={styles.badges}>
                        <span className={styles.badge}>{post.isPublic ? "Public" : "Friends"}</span>
                    </div>
                </div>

                <h2 className={styles.modalTitle}>{post.title}</h2>

                <hr className={styles.divider} />

                <div className={styles.infoGrid}>
                    <div className={styles.infoBlock}>
                        <p className={styles.blockLabel}>When &amp; where</p>
                        <div className={styles.infoRow}>{new Date(post.date).toLocaleString('en-GB')}</div>
                        <div className={styles.infoRow}>{post.gym.name}</div>
                        <div className={styles.infoRow}>{post.gym.address}, {post.gym.city}</div>
                        {post.gym.link && (
                            <a href={post.gym.link} target="_blank" rel="noreferrer" className={styles.gymLink}>
                                Gym website
                            </a>
                        )}
                    </div>
                    <div className={styles.infoBlock}>
                        <p className={styles.blockLabel}>Details</p>
                        <div className={styles.infoRow}>{post.trainingDuration.replace(/_/g, ' ')}</div>
                        <div className={styles.infoRow} data-testid="spots-taken">{post.participants.length} / {post.maxParticipants || 'No limit'} spots taken</div>
                    </div>
                </div>

                <hr className={styles.divider} />

                <div className={styles.section}>
                    <p className={styles.blockLabel}>Description</p>
                    <p className={styles.description}>{post.description}</p>
                    {post.additionalInfo && (
                        <p className={styles.additionalInfo}>{post.additionalInfo}</p>
                    )}
                </div>

                {post.trainingPlan && (
                    <>
                        <hr className={styles.divider} />
                        <div className={styles.section}>
                            <p className={styles.blockLabel}>Training plan — {post.trainingPlan.title}</p>
                            {post.trainingPlan.exercises.length > 0 ? (
                                <div className={styles.exerciseList}>
                                    {post.trainingPlan.exercises.map((ex: any) => (
                                        <div key={ex.id} className={styles.exerciseRow}>
                                            <span className={styles.exerciseName}>{ex.name}</span>
                                            <span className={styles.exerciseReps}>{ex.reps}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className={styles.emptyText}>No exercises in this plan.</p>
                            )}
                        </div>
                    </>
                )}

                <hr className={styles.divider} />

                <div className={styles.section}>
                    <p className={styles.blockLabel} data-testid="participants-label">Participants ({post.participants.length})</p>
                    {post.participants.length === 0 ? (
                        <p className={styles.emptyText}>No one has joined yet.</p>
                    ) : (
                        <div className={styles.participantsList}>
                            {post.participants.map((p: any) => (
                                <div key={p.id} className={styles.participantItem}>
                                    <img
                                        className={styles.participantAvatar}
                                        src={p.user.profilePicture || "/default-avatar.png"}
                                        alt="avatar"
                                    />
                                    <span>{p.user.nickname}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}