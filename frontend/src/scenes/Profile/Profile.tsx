import styles from './Profile.module.scss';
import { Link } from "react-router";
import logoPrototype from '../../assets/logo_prototype.png';

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface UserData {
    nickname: string;
    login: string;
    level?: string;
    description?: string;
    profilePicture: string;
}

export default function Profile() {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/");
                return;
            }

            try {
                const response = await fetch("http://localhost:3000/api/users/me", {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`, // Format wymagany przez Twój middleware
                        "Content-Type": "application/json"
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setUser(data.user);
                    console.log(data);
                } else {

                    localStorage.removeItem("token");
                    navigate("/");
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [navigate]);

    if (loading) return <div>Loading...</div>;
    if (!user) return null;

    return (
        <div className="profile-container">
            <h1>{user.nickname}</h1>
            <div className="user-info">
                <img

                    src={ user.profilePicture }
                    alt="Avatar Preview"
                    className={styles["avatar-preview"]}
                />
                <p><strong>Email:</strong> {user.login}</p>
                <p><strong>Level:</strong> {user.level || "Beginner"}</p>
                <p><strong>About me:</strong> {user.description || "No description provided."}</p>
            </div>
        </div>
    );
}