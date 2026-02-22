import styles from "./Register.module.scss";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

interface RegisterProps {
    onClose: () => void;
    onSwitchToLogin: () => void;
}

export default function Register({ onClose, onSwitchToLogin }: RegisterProps) {
    const [email, setEmail] = useState("");
    const [nickname, setNickname] = useState("");
    const [password, setPassword] = useState("");

    const { mutate, isPending, error } = useMutation({
        mutationFn: async (userData: any) => {
            const response = await fetch("http://localhost:3000/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                // If Zod validation fails, detailed errors are in errorData.details
                throw new Error(errorData.error || "Registration failed");
            }

            return response.json();
        },
        onSuccess: () => {
            alert("Account created successfully! You can now log in.");
            onSwitchToLogin(); // Transition to login view after success
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Sending data mapping 'email' to 'login' to match your schema
        mutate({ login: email, nickname, password });
    };

    return (

        <div className={styles["login-container"]}>

            <div className={styles["login-card"]}>
                <button className={styles["close-x"]} onClick={onClose}>✕</button>
                <div className={styles["login-form-section"]}>
                    <div className={styles["form-header"]}>
                        <h1>Create Account</h1>
                        <p>Enter your details below to join us!</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className={styles["input-group"]}>
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                placeholder="example@mail.com"
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className={styles["input-group"]}>
                            <label htmlFor="nickname">Nickname</label>
                            <input
                                type="text"
                                id="nickname"
                                placeholder="How should we call you?"
                                onChange={(e) => setNickname(e.target.value)}
                                required
                            />
                        </div>

                        <div className={styles["input-group"]}>
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                placeholder="At least 6 characters"
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && <p className={styles["error-message"]}>{error.message}</p>}

                        <button
                            type="submit"
                            className={styles["login-btn"]}
                            disabled={isPending}
                        >
                            {isPending ? "Creating account..." : "Sign Up"}
                        </button>

                        <p>
                            Already have an account?
                            <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToLogin(); }}> Log In</a>
                        </p>
                    </form>
                </div>

            </div>
        </div>

    );
}