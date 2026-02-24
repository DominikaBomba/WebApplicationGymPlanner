import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.scss'
import App from './App.tsx'
import {BrowserRouter} from "react-router";
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {AuthProvider} from "./AuthContext.tsx";

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
            <BrowserRouter>
                <App />
            </BrowserRouter>
            </AuthProvider>
            <ReactQueryDevtools/>
        </QueryClientProvider>

    </StrictMode>,
)
