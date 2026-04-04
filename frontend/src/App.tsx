import Navbar from "./components/Navbar";
import Register from "./components/Register";
import {useLocation, Route, Routes} from "react-router";
import Login from "./components/Login";
import {useState} from "react";
import Profile from "./scenes/Profile"
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute.tsx";
import Settings from "./scenes/Settings/Settings.tsx";
import Search from "./components/Search";
import AddPost from "./components/AddPost";

function App() {
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [authMode, setAuthMode] = useState<"login" | "register">("login");
    const location = useLocation();


    const token = localStorage.getItem("token");

    const showNavbar = location.pathname !== "/login";
    return (
        <>


            { !token && (
                <button
                    className="registerBtn"
                    onClick={() => {
                        setAuthMode("register");
                        setIsAuthOpen(true);
                    }}
                >
                   Log In
                </button>
            )}
            {isAuthOpen && (
                <div className="login-overlay">
                    {authMode === "login" ? (
                        <Login
                            onClose={() => setIsAuthOpen(false)}
                            onSwitchToRegister={() => setAuthMode("register")}
                        />
                    ) : (
                        <Register
                            onClose={() => setIsAuthOpen(false)}
                            onSwitchToLogin={() => setAuthMode("login")}
                        />
                    )}
                </div>
            )}

            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=bar_chart_4_bars,home_app_logo,logout,man,notifications,settings"/>


            <Search/>
            <AddPost/>
            {showNavbar && <Navbar />}

            <Routes>


                {/* Tutaj chronisz ścieżkę profilu */}
                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute onOpenLogin={() => setIsAuthOpen(true)}>
                            <Profile />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/settings"
                    element={
                        <ProtectedRoute onOpenLogin={() => setIsAuthOpen(true)}>
                            <Settings />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/profile/:nickname"
                    element={
                        <Profile/>
                    }
                />
            </Routes>

        </>
    )
}

export default App
