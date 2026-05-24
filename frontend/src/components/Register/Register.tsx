import styles from "./Register.module.scss";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router";
import CloseIcon from "../../assets/icons/close.svg?react";

export default function Register() {
    const navigate = useNavigate();
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
                throw new Error(errorData.error || "Registration failed");
            }

            return response.json();
        },
        onSuccess: () => {
            alert("Account created successfully! You can now log in.");
            navigate("/login"); // Transition to login view after success
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutate({ login: email, nickname, password });
    };

    return (
        <div className={styles["login-container-fullscreen"]}>
            <div className={styles["login-card"]}>
                <div className={styles["login-form-section"]}>
                    <Link to="/" className={styles.closeButton}>
                        <CloseIcon />
                    </Link>
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

                        <p className={styles["switch-auth"]}>
                            Already have an account?
                            <Link to="/login"> Log In</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}