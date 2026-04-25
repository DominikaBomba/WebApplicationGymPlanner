import  { useState, useEffect } from 'react';
import styles from './PlanCreator.module.scss';

export default function PlanCreator() {
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
                `https://wger.de/api/v2/exerciseinfo/?name=${searchTerm}`
            );
            const data = await response.json();

            console.log("Dane z Wger API:", data);

            setSuggestions(data.results || []);
        } catch (err) {
            console.error("Błąd API Wger:", err);
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
        if (!title.trim()) return alert("Podaj nazwę planu!");
        if (exercises.length === 0) return alert("Dodaj przynajmniej jedno ćwiczenie!");

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
                alert("Plan został pomyślnie zapisany!");
                setTitle('');
                setExercises([]);
            } else {
                const errData = await response.json();
                alert(errData.error || "Błąd zapisu.");
            }
        } catch (error) {
            alert("Błąd połączenia z serwerem.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={styles.creatorContainer}>
            <h2 className={styles.header}>Nowy Plan Treningowy</h2>

            <div className={styles.section}>
                <label>Nazwa planu</label>
                <input
                    className={styles.mainInput}
                    placeholder="np. FBW Poniedziałek"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            </div>

            <div className={styles.section}>
                <label>Dodaj ćwiczenia</label>
                <div className={styles.searchWrapper}>
                    <div className={styles.inputWithBtn}>
                        <input
                            placeholder="Szukaj w atlasie lub wpisz własne..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <button
                            className={styles.addManualBtn}
                            onClick={() => addExercise()}
                            disabled={!query.trim()}
                        >
                            Dodaj ręcznie
                        </button>
                    </div>

                    {isSearching && <div className={styles.loader}>Przeszukiwanie bazy...</div>}

                    {suggestions.length > 0 && (
                        <ul className={styles.dropdown}>
                            {suggestions.map((s: any) => (
                                <li key={s.id} onClick={() => addExercise(s)}>

                                    {s.name}
                                    {s.category && <span className={styles.category}> ({s.category.name})</span>}
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
                                placeholder="Serie/powt."
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
                {isSaving ? "Zapisywanie..." : "Zapisz plan w bibliotece"}
            </button>
        </div>
    );
}