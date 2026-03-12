import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import styles from './Search.module.scss';

export default function Search() {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Zamykanie wyników po kliknięciu poza komponent
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (searchTerm.length < 2) {
            setResults([]);
            return;
        }

        const delay = setTimeout(async () => {
            const response = await fetch(`http://localhost:3000/api/users/search?q=${searchTerm}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            setResults(data);
            setIsOpen(true);
        }, 300);

        return () => clearTimeout(delay);
    }, [searchTerm]);

    return (
        <div className={styles.searchWrapper} ref={searchRef}>
            <div className={styles.inputArea}>
                <input
                    type="text"
                    placeholder="Szukaj znajomych..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => searchTerm.length >= 2 && setIsOpen(true)}
                />
            </div>

            {isOpen && results.length > 0 && (
                <div className={styles.resultsDropdown}>
                    {results.map(user => (
                        <Link
                            to={`/profile/${user.nickname}`}
                            key={user.id}
                            className={styles.resultItem}
                            onClick={() => {
                                setIsOpen(false);
                                setSearchTerm('');
                            }}
                        >
                            <img src={user.profilePicture || '/default-avatar.png'} alt="" />
                            <div className={styles.userMeta}>
                                <span className={styles.nickname}>{user.nickname}</span>
                                <span className={styles.level}>{user.level}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}