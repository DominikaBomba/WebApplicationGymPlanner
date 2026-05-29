import styles from "./AddPost.module.scss";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import PlanCreator from "../PlanCreator/PlanCreator"; // adjust path

export const TrainingDuration = {
    LESS_THAN_1_HOUR: 'LESS_THAN_1_HOUR',
    FROM_1_TO_2_HOURS: 'FROM_1_TO_2_HOURS',
    MORE_THAN_2_HOURS: 'MORE_THAN_2_HOURS'
} as const;

export type TrainingDuration = typeof TrainingDuration[keyof typeof TrainingDuration];

export default function AddPost() {
    const [isOpen, setIsOpen] = useState(false);
    const [planMode, setPlanMode] = useState<'none' | 'pick' | 'create'>('none');
    const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        title: "",
        gymId: "",
        date: new Date().toISOString().split('T')[0],
        time: "18:00",
        trainingDuration: TrainingDuration.FROM_1_TO_2_HOURS as TrainingDuration,
        description: "",
        isPublic: true,
        additionalInfo: "",
        maxParticipants: ""
    });

    const { data: myPlans = [] } = useQuery({
        queryKey: ['plans', 'my'],
        queryFn: async () => {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:3000/api/plans/my-plans', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.json();
        },
        enabled: planMode === 'pick'
    });

    const { data: friendsPlans = [] } = useQuery({
        queryKey: ['plans', 'friends'],
        queryFn: async () => {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:3000/api/plans/friends-plans', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.json();
        },
        enabled: planMode === 'pick'
    });

    const allPlans = [...myPlans, ...friendsPlans];

    const { mutate, isPending } = useMutation({
        mutationFn: async (newPostData: any) => {
            const token = localStorage.getItem("token");
            const response = await fetch("http://localhost:3000/api/posts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(newPostData),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw errorData;
            }
            return response.json();
        },
        onSuccess: () => {
            alert("Post added successfully!");
            setIsOpen(false);
            setPlanMode('none');
            setSelectedPlanId(null);
            queryClient.invalidateQueries({ queryKey: ['posts'] });
        },
        onError: (err: any) => {
            alert(`Error: ${err.error || "Failed to add post"}`);
        }
    });

    const handleSubmit = () => {
        const combinedDateTime = new Date(`${formData.date}T${formData.time}:00`).toISOString();
        const participantsLimit = formData.maxParticipants === "" || parseInt(formData.maxParticipants) <= 0
            ? null
            : parseInt(formData.maxParticipants);

        mutate({
            title: formData.title || "My Training",
            gymId: Number(formData.gymId),
            description: formData.description || "Awesome training",
            date: combinedDateTime,
            trainingDuration: formData.trainingDuration,
            isPublic: formData.isPublic,
            additionalInfo: formData.additionalInfo,
            maxParticipants: participantsLimit,
            trainingPlanId: selectedPlanId ?? null
        });
    };

    const selectedPlan = allPlans.find((p: any) => p.id === selectedPlanId);

    if (!isOpen) {
        return (
            <button className={styles.fabButton} onClick={() => setIsOpen(true)}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
            </button>
        );
    }

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.container}>
                <button
                    className={styles.closeButton}
                    onClick={() => setIsOpen(false)}
                    aria-label="Close"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <h2>Add post</h2>

                <div className={styles.formGrid}>
                    <div className={styles.column}>
                        <label>Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            placeholder="Chest training"
                        />
                        <label>Choose gym</label>
                        <select
                            value={formData.gymId}
                            onChange={(e) => setFormData({...formData, gymId: e.target.value})}
                        >
                            <option value="">Select gym...</option>
                            <option value="1">Fabryka Formy</option>
                            <option value="2">McFit</option>
                        </select>

                        <label>When?</label>
                        <div className={styles.dateTimeRow}>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({...formData, date: e.target.value})}
                            />
                            <input
                                type="time"
                                value={formData.time}
                                onChange={(e) => setFormData({...formData, time: e.target.value})}
                            />
                        </div>

                        <label>How long?</label>
                        <select
                            value={formData.trainingDuration}
                            onChange={(e) => setFormData({...formData, trainingDuration: e.target.value as TrainingDuration})}
                        >
                            <option value={TrainingDuration.LESS_THAN_1_HOUR}>Less than 1 hour</option>
                            <option value={TrainingDuration.FROM_1_TO_2_HOURS}>1 to 2 hours</option>
                            <option value={TrainingDuration.MORE_THAN_2_HOURS}>More than 2 hours</option>
                        </select>
                    </div>

                    <div className={styles.column}>
                        <label>Workout plan</label>

                        {/* Mode: no plan */}
                        {planMode === 'none' && (
                            <div className={styles.planButtons}>
                                <button type="button" onClick={() => setPlanMode('pick')}>
                                    Choose saved plan
                                </button>
                                <button type="button" onClick={() => setPlanMode('create')}>
                                    Create new +
                                </button>
                            </div>
                        )}

                        {/* Mode: pick from list */}
                        {planMode === 'pick' && (
                            <div>
                                <select
                                    value={selectedPlanId ?? ''}
                                    onChange={(e) => setSelectedPlanId(Number(e.target.value))}
                                >
                                    <option value="">-- select plan --</option>
                                    {myPlans.length > 0 && (
                                        <optgroup label="My plans">
                                            {myPlans.map((p: any) => (
                                                <option key={p.id} value={p.id}>{p.title}</option>
                                            ))}
                                        </optgroup>
                                    )}
                                    {friendsPlans.length > 0 && (
                                        <optgroup label="Friends' plans">
                                            {friendsPlans.map((p: any) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.title} — {p.author.nickname}
                                                </option>
                                            ))}
                                        </optgroup>
                                    )}
                                </select>

                                {selectedPlan && (
                                    <div className={styles.exerciseList}>
                                        {selectedPlan.exercises.map((ex: any) => (
                                            <div key={ex.id} className={styles.exerciseItem}>
                                                <span>{ex.name}</span>
                                                <span>{ex.reps}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button type="button" onClick={() => {
                                    setPlanMode('none');
                                    setSelectedPlanId(null);
                                }}>
                                    Cancel
                                </button>
                            </div>
                        )}

                        {/* Mode: create new */}
                        {planMode === 'create' && (
                            <div>
                                <PlanCreator
                                    onSaved={(planId) => {
                                        setSelectedPlanId(planId);
                                        setPlanMode('pick');
                                        queryClient.invalidateQueries({ queryKey: ['plans', 'my'] });
                                    }}
                                />
                                <button type="button" onClick={() => setPlanMode('none')}>
                                    Cancel
                                </button>
                            </div>
                        )}

                        <label>Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            placeholder="Describe your workout..."
                        />
                        <label>Additional info</label>
                        <textarea
                            value={formData.additionalInfo}
                            onChange={(e) => setFormData({...formData, additionalInfo: e.target.value})}
                        />
                        <label>Max participants (0 = no limit)</label>
                        <input
                            type="number"
                            placeholder="Unlimited"
                            value={formData.maxParticipants}
                            onChange={(e) => setFormData({...formData, maxParticipants: e.target.value})}
                        />

                        <div className={styles.bottomRow}>
                            <div className={styles.publicToggle}>
                                <input
                                    type="checkbox"
                                    id="public"
                                    checked={formData.isPublic}
                                    onChange={(e) => setFormData({...formData, isPublic: e.target.checked})}
                                />
                                <label htmlFor="public">{formData.isPublic ? "Public" : "Private"}</label>
                            </div>
                            <button
                                className={styles.postButton}
                                onClick={handleSubmit}
                                disabled={isPending}
                            >
                                {isPending ? "Posting..." : "Post"}
                            </button>
                        </div>
                    </div>
                </div>

             </div>
        </div>
    );
}