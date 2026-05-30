import type {FilterState} from '../../types/filters';
import styles from './Filter.module.scss';

const LEVELS = ['BEGINNER', 'MID', 'ADVANCED', 'PRO'];
const SORT_OPTIONS = [
    { value: 'latest', label: 'newest first' },
    { value: 'soonest', label: 'Soonest' },
    { value: 'oldest', label: 'oldest first' },
];

interface Props {
    filters: FilterState;
    onChange: (filters: FilterState) => void;
}

export default function Filter({ filters, onChange }: Props) {
    const set = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch });

    const toggleLevel = (level: string) => {
        const next = filters.levels.includes(level)
            ? filters.levels.filter(l => l !== level)
            : [...filters.levels, level];
        set({ levels: next });
    };

    const activeChips = [
        filters.city && { key: 'city', label: filters.city },
        ...filters.levels.map(l => ({ key: `level-${l}`, label: l })),
        filters.startDate && { key: 'startDate', label: `From ${filters.startDate}` },
        filters.endDate && { key: 'endDate', label: `To ${filters.endDate}` },
    ].filter(Boolean) as { key: string; label: string }[];

    const removeChip = (key: string) => {
        if (key === 'city') set({ city: '' });
        else if (key === 'startDate') set({ startDate: '' });
        else if (key === 'endDate') set({ endDate: '' });
        else if (key.startsWith('level-')) toggleLevel(key.replace('level-', ''));
    };

    return (
        <div className={styles.filterBar}>
            <div className={styles.row}>
                <div className={styles.group}>
                    <label className={styles.label}>City</label>
                    <input
                        className={styles.input}
                        placeholder="e.g. Warsaw"
                        value={filters.city}
                        onChange={e => set({ city: e.target.value })}
                    />
                </div>

                <div className={styles.divider} />

                <div className={styles.group}>
                    <label className={styles.label}>Date</label>
                    <input
                        type="date"
                        className={styles.input}
                        value={filters.startDate}
                        onChange={e => set({ startDate: e.target.value })}
                    />
                    <span className={styles.dateSep}>–</span>
                    <input
                        type="date"
                        className={styles.input}
                        value={filters.endDate}
                        onChange={e => set({ endDate: e.target.value })}
                    />
                </div>

                <div className={styles.divider} />

                <div className={styles.group}>
                    <label className={styles.label}>Level</label>
                    <div className={styles.pillGroup}>
                        {LEVELS.map(level => (
                            <span
                                key={level}
                                className={`${styles.pill} ${filters.levels.includes(level) ? styles.pillActive : ''}`}
                                onClick={() => toggleLevel(level)}
                            >
                                {level}
                            </span>
                        ))}
                    </div>
                </div>

                <div className={styles.sortGroup}>
                    <span className={styles.sortLabel}>Sort by</span>
                    <select
                        className={styles.select}
                        value={filters.sort}
                        onChange={e => set({ sort: e.target.value as FilterState['sort'] })}
                    >
                        {SORT_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {activeChips.length > 0 && (
                <div className={styles.activeRow}>
                    <span className={styles.activeLabel}>Active:</span>
                    {activeChips.map(chip => (
                        <span key={chip.key} className={styles.chip}>
                            {chip.label}
                            <span className={styles.chipX} onClick={() => removeChip(chip.key)}>×</span>
                        </span>
                    ))}
                    <button
                        className={styles.clearAll}
                        onClick={() => onChange({ city: '', levels: [], startDate: '', endDate: '', sort: 'latest' })}
                    >
                        Clear all
                    </button>
                </div>
            )}
        </div>
    );
}