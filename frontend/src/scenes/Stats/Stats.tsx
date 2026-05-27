import { useQuery } from '@tanstack/react-query';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import styles from './Stats.module.scss';

interface StatsData {
    summary: { totalPosts: number; totalPlans: number };
    weeklyChart: { labels: string[]; data: number[] };
    durationChart: Array<{ name: string; count: number }>;
    topExercises: Array<{ name: string; _count: { name: number } }>;
    topGyms: Array<{ name: string; count: number }>;
    records: { longestSession: string; monthlyCount: number };
}

export default function Stats() {
    const { data: stats, isLoading, isError } = useQuery<StatsData>({
        queryKey: ['stats', 'summary'],
        queryFn: async () => {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:3000/api/stats/summary', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch stats');
            return res.json();
        }
    });

    if (isLoading) {
        return (
            <div className={styles.loader}>
                <div className={styles.spinner} />
                <p>Loading statistics...</p>
            </div>
        );
    }

    if (isError || !stats) {
        return (
            <div className={styles.loader}>
                <p>Failed to load statistics</p>
            </div>
        );
    }

    const weeklyData = stats.weeklyChart.labels.map((label, i) => ({
        day: label,
        workouts: stats.weeklyChart.data[i] ?? 0
    }));

    // Dynamic color assignment for the pie chart using main theme colors
    const pieColors = ['var(--primary-color)', 'var(--secondary-color)', 'var(--border-color)'];

    return (
        <div className={styles.container}>
            <h1 className={styles.mainTitle}>Your Activity</h1>

            {/* Summary Row */}
            <div className={styles.summaryRow}>
                <div className={styles.summaryCard}>
                    <span className={styles.summaryValue}>{stats.summary.totalPosts ?? 0}</span>
                    <span className={styles.summaryLabel}>Workouts</span>
                </div>
                <div className={styles.summaryCard}>
                    <span className={styles.summaryValue}>{stats.summary.totalPlans ?? 0}</span>
                    <span className={styles.summaryLabel}>Plans</span>
                </div>
                <div className={styles.summaryCard}>
                    <span className={styles.summaryValue}>{stats.records.monthlyCount ?? 0}</span>
                    <span className={styles.summaryLabel}>This month</span>
                </div>
            </div>

            {/* Weekly Line Chart */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Workouts by Weekday</h2>
                <div className={styles.chartCard}>
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={weeklyData} margin={{ top: 15, right: 20, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="4 4" stroke="var(--border-color)" vertical={false} />
                            <XAxis dataKey="day" stroke="var(--text-muted-color)" tick={{ fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} />
                            <YAxis stroke="var(--text-muted-color)" tick={{ fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--surface-color)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 12,
                                    fontSize: 13,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="workouts"
                                stroke="var(--dark-color)"
                                strokeWidth={3}
                                dot={{ fill: 'var(--primary-color)', stroke: 'var(--dark-color)', strokeWidth: 2, r: 5 }}
                                activeDot={{ r: 7, strokeWidth: 0 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </section>

            {/* Two-Column Layout */}
            <div className={styles.twoColumn}>
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Duration Distribution</h2>
                    <div className={styles.chartCard}>
                        {stats.durationChart.length > 0 ? (
                            <ResponsiveContainer width="100%" height={240}>
                                <PieChart>
                                    <Pie
                                        data={stats.durationChart}
                                        dataKey="count"
                                        nameKey="name"
                                        cx="50%"
                                        cy="45%"
                                        outerRadius={80}
                                        innerRadius={50}
                                        paddingAngle={3}
                                    >
                                        {stats.durationChart.map((_, index) => (
                                            <Cell key={index} fill={pieColors[index % pieColors.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            background: 'var(--surface-color)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: 12,
                                            fontSize: 12
                                        }}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        iconType="circle"
                                        wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className={styles.emptyText}>No data yet</p>
                        )}
                    </div>
                </section>

                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Favorite Gyms</h2>
                    <div className={styles.listCard}>
                        {stats.topGyms.length > 0 ? (
                            stats.topGyms.map((gym, i) => (
                                <div key={i} className={styles.listRow}>
                                    <div className={styles.rank}>{i + 1}</div>
                                    <span className={styles.itemName}>{gym.name}</span>
                                    <span className={styles.itemMeta}>{gym.count} visits</span>
                                </div>
                            ))
                        ) : (
                            <p className={styles.emptyText}>No gym data yet</p>
                        )}
                    </div>
                </section>
            </div>

            {/* Personal Achievements */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Personal Achievements</h2>
                <div className={styles.recordsGrid}>
                    <div className={styles.recordCard}>
                        <span className={styles.recordValue}>{stats.records.monthlyCount ?? 0}</span>
                        <span className={styles.recordLabel}>Workouts this month</span>
                    </div>
                    <div className={styles.recordCard}>
                        <span className={styles.recordValue}>{stats.records.longestSession || 'N/A'}</span>
                        <span className={styles.recordLabel}>Longest session</span>
                    </div>
                </div>
            </section>

            {/* Top Exercises */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Your TOP 5 Exercises</h2>
                <div className={styles.listCard}>
                    {stats.topExercises.length > 0 ? (
                        stats.topExercises.map((ex, i) => (
                            <div key={i} className={styles.listRow}>
                                <div className={styles.rank}>{i + 1}</div>
                                <div className={styles.exerciseInfo}>
                                    <span className={styles.itemName}>{ex.name}</span>
                                    <span className={styles.itemMeta}>{ex._count.name}× in plans</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className={styles.emptyText}>No exercise data yet</p>
                    )}
                </div>
            </section>
        </div>
    );
}