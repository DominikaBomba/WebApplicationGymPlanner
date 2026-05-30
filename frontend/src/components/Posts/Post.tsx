import { useEffect, useState, useMemo } from 'react';
import { type FilterState } from '../../types/filters';
import styles from './Post.module.scss';
import { Link, useNavigate } from "react-router";
import PostDetails from '../PostDetails/PostDetails';
import { useAuth } from '../../AuthContext';

interface PostProps {
    feedType: 'all' | 'friends' | 'joined' | 'mine' | 'profile' | 'discover',
    userId?: number,
    filters?: FilterState,
    excludeOwn?: boolean,
    upcomingOnly?: boolean,
    forceSort?: 'latest' | 'soonest' | 'oldest'
}

export default function Post({ feedType, userId, filters, excludeOwn, upcomingOnly, forceSort }: PostProps) {
    const { user: currentUser } = useAuth();
    const currentUserId = Number(currentUser?.id);
    const [allPosts, setAllPosts] = useState<any[]>([]);
    console.log('currentUser:', currentUserId)

    const [loading, setLoading] = useState(true);
    const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
    const navigate = useNavigate();

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            let url = 'http://localhost:3000/api/posts/all';
            if (feedType === 'friends') url = 'http://localhost:3000/api/posts/friends-feed';
            else if (feedType === 'joined') url = 'http://localhost:3000/api/posts/joined';
            else if (feedType === 'mine') url = `http://localhost:3000/api/posts/${currentUserId}`;
            else if (feedType === 'profile' && userId) url = `http://localhost:3000/api/posts/${userId}`;
            else if (feedType === 'discover') url = 'http://localhost:3000/api/posts/discover';
            const response = await fetch(url, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            setAllPosts(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error fetching posts:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (feedType === 'profile' && !userId) return;
        fetchPosts();

        const handlePostAction = () => {
            fetchPosts();
        };

        window.addEventListener('post-action-success', handlePostAction);
        return () => {
            window.removeEventListener('post-action-success', handlePostAction);
        };
    }, [feedType, userId]);

    const posts = useMemo(() => {
        let result = [...allPosts];

        if (excludeOwn && currentUserId) {
            result = result.filter(p => Number(p.userId) !== currentUserId);
        }

        if (filters?.city) {
            const city = filters.city.toLowerCase();
            result = result.filter(p => p.gym?.city?.toLowerCase().includes(city));
        }

        if (filters?.levels?.length) {
            result = result.filter(p => filters.levels.includes(p.user?.level));
        }

        if (filters?.startDate) {
            const from = new Date(filters.startDate);
            result = result.filter(p => new Date(p.date || p.createdAt) >= from);
        }

        if (filters?.endDate) {
            const to = new Date(filters.endDate);
            to.setHours(23, 59, 59);
            result = result.filter(p => new Date(p.date || p.createdAt) <= to);
        }

        if (upcomingOnly) {
            const now = Date.now();
            result = result.filter(p => p.date && new Date(p.date).getTime() >= now);
        }

        const sortKey = forceSort ?? filters?.sort;
        if (sortKey === 'soonest') {
            result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        } else if (sortKey === 'oldest') {
            result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        } else {
            result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        return result;
    }, [allPosts, filters, excludeOwn, upcomingOnly, forceSort, currentUserId]);

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
                body: JSON.stringify({ postId: Number(postId) })
            });
            const data = await response.json();
            if (!response.ok) {
                console.error('Join error:', data);
                return;
            }
            window.dispatchEvent(new CustomEvent('post-action-success'));
            navigate('/');
        } catch (err) {
            console.error(err);
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
                body: JSON.stringify({ postId: Number(postId) })
            });
            const data = await response.json();
            if (!response.ok) {
                console.error('Leave error:', data);
                return;
            }
            window.dispatchEvent(new CustomEvent('post-action-success'));
        } catch (err) {
            console.error(err);
        }
    };



    if (loading) return <div className={styles.loading}>Loading sessions...</div>;

    return (
        <div className={styles.feedContainer}>
            {selectedPostId && (
                <PostDetails postId={selectedPostId} onClose={() => setSelectedPostId(null)} />
            )}
            {posts.length === 0 ? (
                <p className={styles.emptyText}>No active training sessions.</p>
            ) : (
                <div className={styles.postsGrid}>
                    {posts.map((post: any) => {
                        let duration: string = "";
                        switch (post.trainingDuration) {
                            case ("FROM_1_TO_2_HOURS"):
                                duration = "1-2 hours";
                                break;
                            case "LESS_THAN_1_HOUR":
                                duration = "<1 hour";
                                break;
                            default:
                                duration = ">2 hours";
                                break;
                        }


                        const isJoined = post.participants?.some((p: any) => Number(p.participantId) === currentUserId);
                        const isOwner = Number(post.userId) === currentUserId;
                        const isPast = !!post.date && new Date(post.date).getTime() < Date.now();

                        let countdownLabel = "";
                        if (isJoined && !isPast && post.date) {
                            const msPerDay = 1000 * 60 * 60 * 24;
                            const startOfToday = new Date();
                            startOfToday.setHours(0, 0, 0, 0);
                            const trainingDay = new Date(post.date);
                            trainingDay.setHours(0, 0, 0, 0);
                            const daysUntil = Math.round((trainingDay.getTime() - startOfToday.getTime()) / msPerDay);
                            if (daysUntil <= 0) countdownLabel = "Today";
                            else if (daysUntil === 1) countdownLabel = "Tomorrow";
                            else countdownLabel = `In ${daysUntil} days`;
                        }

                        console.log('post.userId:', post.userId, 'currentUserId:', currentUserId, 'isOwner:', isOwner);
                        console.log('participants:', post.participants);
                        const postDate = new Date(post.date || post.createdAt);
                        const formattedDate = postDate.toLocaleDateString('en-GB');
                        const formattedTime = postDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                        return (
                            <div key={post.id} className={`${styles.postCard} ${isPast ? styles.postCardPast : ''}`}>
                                {isPast && (
                                    <div className={styles.finishedBanner}>
                                        Finished — this session has already taken place
                                    </div>
                                )}
                                <div className={styles.cardHeader}>
                                    <Link to={"../profile/" + post.user?.nickname}>
                                        <img
                                            src={post.user?.profilePicture || "/default-avatar.png"}
                                            className={styles.authorAvatar}
                                            alt={post.user?.nickname || "profile"}
                                        />
                                    </Link>
                                    <div className={styles.authorInfo}>
                                        <strong className={styles.authorName}>{post.user?.nickname}</strong>
                                        <span className={styles.authorLocation}>
                                            {post.gym?.name}, {post.gym?.city}
                                        </span>
                                    </div>
                                    <span className={styles.levelBadge}>{post.user?.level || "General"}</span>
                                </div>

                                <h3 className={styles.postTitle}>{post.title}</h3>

                                <div className={styles.cardMetaRow}>
                                    {countdownLabel && (
                                        <span className={styles.countdownBadge}>{countdownLabel}</span>
                                    )}
                                    <span className={styles.metaItem}>{formattedDate}</span>
                                    <span className={styles.metaItem}>{formattedTime}</span>
                                    <span className={styles.metaItem}>{duration || "2h"}</span>
                                </div>

                                <p className={styles.postDescription}>{post.description || post.content}</p>

                                <span
                                    className={styles.moreLink}
                                    onClick={() => {
                                        if (!localStorage.getItem('token')) navigate('/login');
                                        else setSelectedPostId(post.id);
                                    }}
                                >
                                    See training plan & more
                                </span>

                                <hr className={styles.cardDivider} />

                                <div className={styles.cardFooter}>
                                    <span className={styles.slotsTag}>
                                        {post._count?.participants || 0} / {post.maxParticipants || "∞"} spots
                                    </span>
                                    <span className={styles.statusTag}>
                                        {post.isPublic ? "Public" : "Friends"}
                                    </span>
                                    <div className={styles.buttonGroup}>
                                        {isPast ? (
                                            <span className={styles.endedTag}>Ended</span>
                                        ) : isOwner ? (
                                            <span className={styles.ownerTag}>Your post</span>
                                        ) : isJoined ? (
                                            <button className={styles.cancelButton}
                                                onClick={(e) => handleLeave(e, post.id)}>
                                                Leave
                                            </button>
                                        ) : (
                                            <button className={styles.joinButton}
                                                onClick={(e) => handleJoin(e, post.id)}>
                                                Join
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}