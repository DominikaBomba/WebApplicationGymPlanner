import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import userRoutes from "./routes/user.routes";
import postRoutes from "./routes/post.routes";
import gymRoutes from "./routes/gym.routes";
import planRoutes from "./routes/plan.routes";
import statsRoutes from "./routes/stats.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/gyms', gymRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/Stats', statsRoutes);

// Export app for Supertest (tests import the app without starting the server)
export default app;

const PORT = process.env.PORT || 3000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}