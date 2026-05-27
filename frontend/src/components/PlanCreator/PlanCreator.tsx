import { useState, useEffect } from 'react';
import styles from './PlanCreator.module.scss';

interface Props {
    onSaved?: (planId: number) => void;
}

export default function PlanCreator({ onSaved }: Props) {
    const [title, setTitle] = useState('');
    const [exercises, setExercises] = useState<any[]>([]);
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim().length > 2) {
                performSearch(query);
            } else {
                setSuggestions([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    const performSearch = async (searchTerm: string) => {
        setIsSearching(true);
        try {
            const response = await fetch(
                `https://wger.de/api/v2/exerciseinfo/?format=json&language=2&limit=20`
            );
            const data = await response.json();

            // Client-side filtering by name
            const term = searchTerm.toLowerCase();
            const mapped = (data.results || [])
                .map((ex: any) => {
                    // Looking for English translation (language=2)
                    const translation = ex.translations?.find((t: any) => t.language === 2);
                    return {
                        name: translation?.name ?? null,
                        id: ex.id,
                        category: ex.category?.name ?? null,
                    };
                })
                .filter((ex: any) => ex.name?.toLowerCase().includes(term));

            setSuggestions(mapped);
        } catch (err) {
            alert("Failed to fetch exercises from the external database.");
        } finally {
            setIsSearching(false);
        }
    };

    const addExercise = (item?: any) => {
        const newEx = {
            name: item ? item.name : query,
            externalId: item ? String(item.id) : null,
            reps: "3x12"
        };
        setExercises([...exercises, newEx]);
        setQuery('');
        setSuggestions([]);
    };

    const removeExercise = (index: number) => {
        setExercises(exercises.filter((_, i) => i !== index));
    };

    const updateReps = (index: number, value: string) => {
        const updated = [...exercises];
        updated[index].reps = value;
        setExercises(updated);
    };

    const handleSavePlan = async () => {
        if (!title.trim()) return alert("Please enter a plan title!");
        if (exercises.length === 0) return alert("Please add at least one exercise!");

        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3000/api/plans', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, exercises })
            });

            if (response.ok) {
                const data = await response.json();
                onSaved?.(data.id);
                alert("Workout plan saved successfully!");
                setTitle('');
                setExercises([]);
            } else {
                const errData = await response.json();
                alert(errData.error || "Failed to save the workout plan.");
            }
        } catch (error) {
            alert("Server connection error.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={styles.creatorContainer}>
            <h2 className={styles.header}>New Workout Plan</h2>

            <div className={styles.section}>
                <label>Plan Title</label>
                <input
                    className={styles.mainInput}
                    placeholder="e.g. Full Body Workout Monday"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            </div>

            <div className={styles.section}>
                <label>Add Exercises</label>
                <div className={styles.searchWrapper}>
                    <div className={styles.inputWithBtn}>
                        <input
                            placeholder="Search exercise database or type custom..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <button
                            className={styles.addManualBtn}
                            onClick={() => addExercise()}
                            disabled={!query.trim()}
                        >
                            Add custom
                        </button>
                    </div>

                    {isSearching && <div className={styles.loader}>Searching database...</div>}

                    {suggestions.length > 0 && (
                        <ul className={styles.dropdown}>
                            {suggestions.map((s: any) => (
                                <li key={s.id} onClick={() => addExercise(s)}>
                                    {s.name}
                                    {s.category && <span className={styles.category}> ({s.category})</span>}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            <div className={styles.exerciseList}>
                {exercises.map((ex, index) => (
                    <div key={index} className={styles.exerciseItem}>
                        <div className={styles.info}>
                            <span className={styles.name}>{ex.name}</span>
                            <input
                                className={styles.repsInput}
                                value={ex.reps}
                                onChange={(e) => updateReps(index, e.target.value)}
                                placeholder="Sets/reps"
                            />
                        </div>
                        <button className={styles.removeBtn} onClick={() => removeExercise(index)}>✕</button>
                    </div>
                ))}
            </div>

            <button
                className={styles.savePlanBtn}
                onClick={handleSavePlan}
                disabled={isSaving || exercises.length === 0}
            >
                {isSaving ? "Saving..." : "Save plan to library"}
            </button>
        </div>
    );
}