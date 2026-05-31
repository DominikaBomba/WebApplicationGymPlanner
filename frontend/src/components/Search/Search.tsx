import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import styles from './Search.module.scss';
import SearchIcon from '../../assets/icons/search.svg?react';

export default function Search() {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);


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
            //      setResults([]);
            //  console.log("za krotkie: " + searchTerm.length);
            return;
        }

        const delay = setTimeout(async () => {
            const response = await fetch(`http://localhost:3000/api/users/${searchTerm}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            //console.log( data);
            setResults(data);
            //console.log( results);
            setIsOpen(true);
        }, 300);

        return () => clearTimeout(delay);
    }, [searchTerm]);

    //console.log(results);
    return (
        <div className={styles.searchWrapper} ref={searchRef}>
            <div className={styles.inputArea}>
                <SearchIcon className={styles.searchIcon} />
                <input
                    type="text"
                    placeholder={localStorage.getItem('token') ? "Search for friends..." : "Login to search for other's profiles."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => searchTerm.length >= 2 && setIsOpen(true)}
                    disabled={!localStorage.getItem('token')}
                />
            </div>

            {isOpen && (
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