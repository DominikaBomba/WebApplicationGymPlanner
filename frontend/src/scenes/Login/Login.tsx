import styles from "./Login.module.scss";

export default function Login() {
    return (
        <div className={styles["login-container"]}>
            <div className={styles["login-card"]}>
                <div className={styles["login-form-section"]}>
                    <div className={styles["form-header"]}>
                        <span className={styles["home-emoji"]}></span>
                        <h1>Welcome to ...</h1>
                        <p>Enter your details and lets move on!</p>
                    </div>

                    <form>
                        <div className={styles["input-group"]}>
                            <label htmlFor="email">Email</label>
                            <input type="email" id="email" placeholder="Enter your email" />
                        </div>

                        <div className={styles["input-group"]}>
                            <label htmlFor="password">Password</label>
                            <input type="password" id="password" placeholder="••••••••" />
                        </div>

                        <div className={styles["form-options"]}>

                            <a href="#" className={styles["forgot-password"]}>Forgot password?</a>
                        </div>

                        <button type="submit" className={styles["login-btn"]}>Login</button>
                        <p> <a href="#">Sign Up</a></p>

                    </form>
                </div>


            </div>
        </div>
    );
}