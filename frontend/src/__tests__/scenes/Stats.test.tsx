/**
 * Tests for Stats scene.
 *
 * Stats uses TanStack Query to fetch /api/stats/summary and displays
 * charts (Recharts), summary cards, and ranking lists.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Stats from '../../scenes/Stats/Stats';
import { mockStats, mockFetchSuccess, mockFetchFailure } from '../../__tests__/helpers/mocks';

// Mock Recharts to avoid SVG rendering issues in jsdom
vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
    Line: () => <div data-testid="line" />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
    PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
    Pie: ({ children }: any) => <div data-testid="pie">{children}</div>,
    Cell: () => <div data-testid="cell" />,
    Legend: () => <div data-testid="legend" />,
}));

function renderStats() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <Stats />
        </QueryClientProvider>
    );
}

describe('Stats scene', () => {
    beforeEach(() => {
        localStorage.setItem('token', 'valid-token');
    });

    it('should show loading spinner while fetching stats', () => {
        // GIVEN: Query is loading (fetch never resolves)
        vi.mocked(fetch).mockReturnValueOnce(new Promise(() => { }));

        // WHEN: Component renders
        renderStats();

        // THEN: "Loading statistics..." is visible
        expect(screen.getByText('Loading statistics...')).toBeInTheDocument();
    });

    it('should show error message when fetch fails', async () => {
        // GIVEN: Query returns error
        vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

        // WHEN: Component renders
        renderStats();

        // THEN: "Failed to load statistics" is shown
        await waitFor(() => {
            expect(screen.getByText('Failed to load statistics')).toBeInTheDocument();
        });
    });

    it('should render summary cards (Workouts, Plans, This month)', async () => {
        // GIVEN: stats fetched successfully
        mockFetchSuccess(mockStats);

        // WHEN: Data loaded
        renderStats();

        // THEN: Summary cards show correct values
        await waitFor(() => {
            expect(screen.getByText('10')).toBeInTheDocument(); // totalPosts
            expect(screen.getByText('3')).toBeInTheDocument();  // totalPlans
            // monthlyCount appears in both summary and achievements
            expect(screen.getAllByText('5').length).toBeGreaterThanOrEqual(1);
        });

        expect(screen.getByText('Workouts')).toBeInTheDocument();
        expect(screen.getByText('Plans')).toBeInTheDocument();
        expect(screen.getByText('This month')).toBeInTheDocument();
    });

    it('should render the main title "Your Activity"', async () => {
        // GIVEN: Stats loaded
        mockFetchSuccess(mockStats);

        // WHEN: Component renders
        renderStats();

        // THEN: Title is visible
        await waitFor(() => {
            expect(screen.getByText('Your Activity')).toBeInTheDocument();
        });
    });

    it('should render weekly line chart section', async () => {
        // GIVEN: Stats data available
        mockFetchSuccess(mockStats);

        // WHEN: Rendered
        renderStats();

        // THEN: Line chart and section title are present
        await waitFor(() => {
            expect(screen.getByText('Workouts by Weekday')).toBeInTheDocument();
            expect(screen.getByTestId('line-chart')).toBeInTheDocument();
        });
    });

    it('should render duration distribution pie chart', async () => {
        // GIVEN: Stats with duration data
        mockFetchSuccess(mockStats);

        // WHEN: Rendered
        renderStats();

        // THEN: Pie chart section is present
        await waitFor(() => {
            expect(screen.getByText('Duration Distribution')).toBeInTheDocument();
            expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
        });
    });

    it('should render favorite gyms list', async () => {
        // GIVEN: Stats with gym data
        mockFetchSuccess(mockStats);

        // WHEN: Rendered
        renderStats();

        // THEN: Gym names and visit counts are visible
        await waitFor(() => {
            expect(screen.getByText('Favorite Gyms')).toBeInTheDocument();
            expect(screen.getByText('IronHouse Gym')).toBeInTheDocument();
            expect(screen.getByText('5 visits')).toBeInTheDocument();
            expect(screen.getByText('Fit Zone')).toBeInTheDocument();
            expect(screen.getByText('3 visits')).toBeInTheDocument();
        });
    });

    it('should render top exercises', async () => {
        // GIVEN: Stats with exercise data
        mockFetchSuccess(mockStats);

        // WHEN: Rendered
        renderStats();

        // THEN: Exercise names and counts are visible
        await waitFor(() => {
            expect(screen.getByText('Your TOP 5 Exercises')).toBeInTheDocument();
            expect(screen.getByText('Bench Press')).toBeInTheDocument();
            expect(screen.getByText('8× in plans')).toBeInTheDocument();
        });
    });

    it('should render personal achievements section', async () => {
        // GIVEN: Stats loaded
        mockFetchSuccess(mockStats);

        // WHEN: Rendered
        renderStats();

        // THEN: Achievements are visible
        await waitFor(() => {
            expect(screen.getByText('Personal Achievements')).toBeInTheDocument();
            expect(screen.getByText('Workouts this month')).toBeInTheDocument();
            expect(screen.getByText('Longest session')).toBeInTheDocument();
        });
    });

    it('should show empty states for missing gym and exercise data', async () => {
        // GIVEN: Stats with empty arrays
        mockFetchSuccess({
            ...mockStats,
            topGyms: [],
            topExercises: [],
            durationChart: [],
        });

        // WHEN: Rendered
        renderStats();

        // THEN: Empty messages shown
        await waitFor(() => {
            expect(screen.getByText('No gym data yet')).toBeInTheDocument();
            expect(screen.getByText('No exercise data yet')).toBeInTheDocument();
            expect(screen.getByText('No data yet')).toBeInTheDocument();
        });
    });
});
