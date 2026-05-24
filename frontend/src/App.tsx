import Navbar from "./components/Navbar/Navbar";
import Register from "./components/Register";
import { useLocation, Route, Routes } from "react-router";
import Login from "./components/Login";
import { useState } from "react";
import Profile from "./scenes/Profile"
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute.tsx";
import Settings from "./scenes/Settings/Settings.tsx";
import Post from "./components/Posts";
import Home from "./scenes/Home";
import Stats from "./scenes/Stats";
function App() {
    const [isExpanded, setIsExpanded] = useState(false);
    const location = useLocation();

    const showNavbar = location.pathname !== "/login" && location.pathname !== "/register";
    return (
        <>
            {showNavbar && <Navbar isExpanded={isExpanded} setIsExpanded={setIsExpanded} />}
            <main className={`content-wrapper ${isExpanded ? 'expanded' : ''} ${!showNavbar ? 'no-sidebar' : ''}`}>
                <div className="scroll-area">
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path={"/"} element={<Home />} />
                        <Route path={"/stats"} element={<Stats/>} />

                        <Route path="/profile" element={
                            <ProtectedRoute onOpenLogin={() => { }}>
                                <Profile />
                            </ProtectedRoute>
                        } />
                        <Route path="/settings" element={
                            <ProtectedRoute onOpenLogin={() => { }}>
                                <Settings />
                            </ProtectedRoute>
                        } />
                        <Route path="/profile/:nickname" element={<Profile />} />
                    </Routes>
                </div>
            </main>
        </>
    )
}

export default App
