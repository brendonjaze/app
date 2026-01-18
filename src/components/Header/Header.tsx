'use client';

import React, { useState, useEffect } from 'react';
import styles from './Header.module.css';
import { useAuth } from '@/contexts/AuthContext';
import { useRFID } from '@/contexts/RFIDContext';

interface HeaderProps {
    onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
    const { user } = useAuth();
    const { scannerStatus, smsModuleStatus } = useRFID();
    const [mounted, setMounted] = useState(false);
    const [dateString, setDateString] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setMounted(true);
            setDateString(new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            }));
        }, 0);
        return () => clearTimeout(timer);
    }, []);

    return (
        <header className={styles.header}>
            <div className={styles.left}>
                <button className={styles.menuBtn} onClick={onMenuClick} aria-label="Toggle menu">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>
                <div className={styles.dateInfo}>
                    <span className={styles.greeting}>
                        Welcome back, <strong>{user?.fullName?.split(' ')[0]}</strong>
                    </span>
                    <span className={styles.date}>{mounted ? dateString : ''}</span>
                </div>
            </div>

            <div className={styles.right}>
                {/* Scanner Status */}
                <div className={styles.statusGroup}>
                    <div className={`${styles.statusItem} ${scannerStatus.isConnected ? styles.online : styles.offline}`}>
                        <div className={styles.statusDot} />
                        <span className={styles.statusLabel}>Scanner</span>
                    </div>
                    <div className={`${styles.statusItem} ${smsModuleStatus.isConnected ? styles.online : styles.offline}`}>
                        <div className={styles.statusDot} />
                        <span className={styles.statusLabel}>SMS</span>
                        {smsModuleStatus.isConnected && (
                            <span className={styles.signalBars}>
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <span
                                        key={i}
                                        className={`${styles.signalBar} ${i < Math.ceil(smsModuleStatus.signalStrength / 8) ? styles.active : ''}`}
                                        style={{ height: `${(i + 1) * 25}%` }}
                                    />
                                ))}
                            </span>
                        )}
                    </div>
                </div>

                {/* Current Time */}
                <div className={styles.clock}>
                    <CurrentTime />
                </div>
            </div>
        </header>
    );
}

function CurrentTime() {
    const [time, setTime] = useState<string | null>(null);

    useEffect(() => {
        // Set initial time on client
        const timer = setTimeout(() => {
            setTime(new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            }));
        }, 0);

        const interval = setInterval(() => {
            setTime(new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            }));
        }, 1000);
        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, []);

    // Return empty span during SSR to avoid hydration mismatch
    if (!time) {
        return <span>--:--:--</span>;
    }

    return <span>{time}</span>;
}
