import styles from "./Login.module.scss";
import { useNavigate, Link } from "react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import CloseIcon from "../../assets/icons/close.svg?react";
import logo from '../../assets/logo.png';
export default function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const { mutate, isPending, error } = useMutation({
        mutationFn: async (credentials: any) => {
            const response = await fetch("http://localhost:3000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(credentials),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Login failed");
            }

            return response.json();
        },
        onSuccess: (data) => {
            localStorage.setItem("token", data.token); //saving token
            navigate("/"); // Redirect to home after login
            window.location.reload();
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutate({ login: email, password });
    };

    return (
        <div className={styles["login-container-fullscreen"]}>
            <div className={styles["login-card"]}>
                <div className={styles["login-form-section"]}>
                    <Link to="/" className={styles.closeButton}>
                        <CloseIcon />
                    </Link>
                    <div className={styles["form-header"]}>
                           <img src={logo} alt="Gym Planner Logo" className={styles["landing-logo"]} />
                        <h1>Welcome Back!</h1>
                        <p>Enter your details and let's move on!</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className={styles["input-group"]}>
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                placeholder="Enter your email"
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className={styles["input-group"]}>
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                placeholder="••••••••"
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        {error && <p className={styles["error-message"]}>{error.message}</p>}
                        <div className={styles["form-options"]}>
                            <a href="#" className={styles["forgot-password"]}>Forgot password?</a>
                        </div>

                        <button
                            type="submit"
                            className={styles["login-btn"]}
                            disabled={isPending}
                        >
                            {isPending ? "Logging in..." : "Login"}
                        </button>

                        <p className={styles["switch-auth"]}>
                            You don't have an account?
                            <Link to="/register"> SignUp</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}