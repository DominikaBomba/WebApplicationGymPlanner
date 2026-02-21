import { z } from 'zod'; //libka do walidacji typów i różnych rzeczy

export const registerSchema = z.object({
    body: z.object({
        login: z
            .string()
            .min(1, "Email is required")
            .email("Invalid email format"),
        nickname: z
            .string()
            .min(3, "Nickname must be at least 3 characters long"),
        password: z
            .string()
            .min(6, "Password must be at least 6 characters long"),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        login: z
            .string()
            .min(1, "Email is required")
            .email("Invalid email format"),
        password: z
            .string()
            .min(1, "Password is required"),
    }),
});