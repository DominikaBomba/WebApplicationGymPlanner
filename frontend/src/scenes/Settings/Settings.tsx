import styles from './Settings.module.scss';
import { Link } from "react-router";
import { useState, useEffect, useRef } from "react";
import { supabase } from "../../supabaseClient.ts";
import { useAuth } from "../../AuthContext.tsx"; // Import hooka

export default function Settings() {
    const { user, refreshUser } = useAuth();

    const [level, setLevel] = useState(user?.level || "BEGGINER");
    const [description, setDescription] = useState(user?.description || "");
    const [profilePictureUrl, setProfilePictureUrl] = useState("");
    const [previewUrl, setPreviewUrl] = useState("");
    const [message, setMessage] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user) {
            setLevel(user.level || "BEGGINER");
            setDescription(user.description || "");
        }
    }, [user]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setPreviewUrl(URL.createObjectURL(file));

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data, error } = await supabase.storage
            .from('avatars')
            .upload(filePath, file);

        if (error) {
            setMessage("Error uploading image to storage.");
            return;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        setProfilePictureUrl(publicUrl);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const finalPicture = profilePictureUrl || user?.profilePicture;

        try {
            const response = await fetch("http://localhost:3000/api/users/update", {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    level,
                    description,
                    profilePicture: finalPicture
                })
            });

            if (response.ok) {
                await refreshUser(); // KLUCZOWE: Odświeżamy dane w całej aplikacji (Context)
                setMessage("Post updated successfully!");
            } else {
                setMessage("Failed to update profile.");
            }
        } catch (error) {
            console.error(error);
            setMessage("Error connecting to server.");
        }
    };

    if (!user) return <p>Loading...</p>;

    return (
        <div className={styles["settings-container"]}>
            <div className={styles["settings-card"]}>
                <h1>Account Settings</h1>

                {message && <p className={styles.notification}>{message}</p>}

                <form onSubmit={handleUpdate} className={styles["settings-form"]}>
                    <div className={styles["avatar-section"]}>
                        <img
                            src={previewUrl || user.profilePicture || "https://via.placeholder.com/150"}
                            alt="Avatar Preview"
                            className={styles["avatar-preview"]}
                        />
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className={styles["upload-btn"]}
                        >
                            Change Photo
                        </button>
                    </div>

                    <div className={styles["input-group"]}>
                        <label>Nickname (Read-only)</label>
                        <input type="text" value={user.nickname} disabled />
                    </div>

                    <div className={styles["input-group"]}>
                        <label htmlFor="level">Level</label>
                        <select id="level" value={level} onChange={(e) => setLevel(e.target.value)}>
                            <option value="BEGGINER">BEGGINER</option>
                            <option value="MID">MID</option>
                            <option value="ADVANCED">ADVANCED</option>
                            <option value="PRO">PRO</option>
                        </select>
                    </div>

                    <div className={styles["input-group"]}>
                        <label htmlFor="description">About Me</label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className={styles.actions}>
                        <button type="submit" className={styles["save-btn"]}>Save Changes</button>
                        <Link to="/profile" className={styles["cancel-link"]}>Back</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}