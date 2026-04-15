import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import userRoutes from "./routes/user.routes";
import postRoutes from "./routes/post.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});