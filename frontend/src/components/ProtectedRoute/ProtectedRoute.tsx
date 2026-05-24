// src/components/ProtectedRoute/ProtectedRoute.tsx
import { Navigate } from "react-router";
import {type JSX} from "react";

interface ProtectedRouteProps {
    children: JSX.Element;
    onOpenLogin?: () => void;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const token = localStorage.getItem("token");

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return children;
}