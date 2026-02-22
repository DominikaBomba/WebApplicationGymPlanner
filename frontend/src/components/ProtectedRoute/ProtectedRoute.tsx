// src/components/ProtectedRoute/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import {type JSX} from "react";

interface ProtectedRouteProps {
    children: JSX.Element;
    onOpenLogin: () => void;
}

export default function ProtectedRoute({ children, onOpenLogin }: ProtectedRouteProps) {
    const token = localStorage.getItem("token");

    if (!token) {

        onOpenLogin();
        return <Navigate to="/" replace />;
    }

    return children;
}