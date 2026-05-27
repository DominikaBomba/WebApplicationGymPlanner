export interface FilterState {
    city: string;
    levels: string[];
    startDate: string;
    endDate: string;
    sort: 'latest' | 'soonest' | 'oldest';
}

export const defaultFilters: FilterState = {
    city: '',
    levels: [],
    startDate: '',
    endDate: '',
    sort: 'latest',
};