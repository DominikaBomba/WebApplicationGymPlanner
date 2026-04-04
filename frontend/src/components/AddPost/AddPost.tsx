import styles from "./AddPost.module.scss";
import { useNavigate } from "react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

export default function AddPost() {
    const [isOpen, setIsOpen] = useState(false);

    // Przykładowy stan dla prostych pól
    const [formData, setFormData] = useState({
        gym: "",
        date: "2026-04-04",
        time: "18:00",
        duration: "~2 hours",
        isPublic: true,
        additionalInfo: ""
    });

    if (!isOpen) {
        return <button onClick={() => setIsOpen(true)}>Add Post</button>;
    }

    return (
        <div className={styles.container}>
            <h2>Add post</h2>

            <div className={styles.formGrid}>

                <div className={styles.column}>
                    <label>Choose gym</label>
                    <select
                        value={formData.gym}
                        onChange={(e) => setFormData({...formData, gym: e.target.value})}
                    >
                        <option value="">Select gym...</option>
                        <option value="gym1">City Fit</option>
                        <option value="gym2">McFit</option>
                    </select>

                    <label>When?</label>
                    <div className={styles.dateTimeRow}>
                        <input type="date" value={formData.date} />
                        <input type="time" value={formData.time} />
                    </div>

                    <label>How long?</label>
                    <input
                        type="text"
                        placeholder="~2 hours"
                        value={formData.duration}
                    />
                </div>

                <div className={styles.column}>
                    <label>Workout plan</label>
                    <div className={styles.planButtons}>
                        <button type="button">create new +</button>
                        <button type="button">choose from saved</button>
                    </div>

                    <div className={styles.exerciseList}>
                        <div className={styles.exerciseItem}>pompki</div>
                        <div className={styles.exerciseItem}>przysiady</div>
                    </div>

                    <label>Additional info</label>
                    <textarea
                        value={formData.additionalInfo}
                        onChange={(e) => setFormData({...formData, additionalInfo: e.target.value})}
                    />

                    <div className={styles.bottomRow}>
                        <div className={styles.publicToggle}>
                            <input
                                type="checkbox"
                                id="public"
                                checked={formData.isPublic}
                                onChange={(e) => setFormData({...formData, isPublic: e.target.checked})}
                            />
                            <label htmlFor="public">Public</label>
                        </div>
                        <button className={styles.postButton}>Post</button>
                    </div>
                </div>
            </div>
        </div>
    );
}