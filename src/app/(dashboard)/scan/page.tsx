'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useRFID } from '@/contexts';
import { RFIDScanner, RegistrationForm } from '@/components';
import styles from './page.module.css';

export default function ScanPage() {
    const router = useRouter();
    const { hasRole } = useAuth();
    const { pendingScan, clearPendingScan } = useRFID();
    const [showRegistration, setShowRegistration] = useState(false);
    const [unregisteredRfid, setUnregisteredRfid] = useState<string | null>(null);

    // Check authorization
    if (!hasRole(['admin', 'instructor'])) {
        return (
            <div className={styles.unauthorized}>
                <div className={styles.unauthorizedIcon}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                    </svg>
                </div>
                <h2>Access Denied</h2>
                <p>You don&apos;t have permission to access this page.</p>
                <button className="btn btn-primary" onClick={() => router.push('/dashboard')}>
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const handleUnregisteredCard = (rfidCardId: string) => {
        setUnregisteredRfid(rfidCardId);
        // Auto-show registration if admin
        if (hasRole(['admin'])) {
            setShowRegistration(true);
        }
    };

    const handleRegistrationSuccess = () => {
        setShowRegistration(false);
        setUnregisteredRfid(null);
        clearPendingScan();
    };

    const handleRegistrationCancel = () => {
        setShowRegistration(false);
        setUnregisteredRfid(null);
        clearPendingScan();
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Attendance Scanner</h1>
                <p className={styles.subtitle}>
                    Scan student RFID cards to record attendance
                </p>
            </div>

            {/* Main Content */}
            <div className={styles.content}>
                {showRegistration ? (
                    <div className={styles.registrationWrapper}>
                        <div className={styles.backButton}>
                            <button className="btn btn-ghost" onClick={handleRegistrationCancel}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="15 18 9 12 15 6" />
                                </svg>
                                Back to Scanner
                            </button>
                        </div>
                        <RegistrationForm
                            prefilledRfid={unregisteredRfid || undefined}
                            onSuccess={handleRegistrationSuccess}
                            onCancel={handleRegistrationCancel}
                        />
                    </div>
                ) : (
                    <div className={styles.scannerWrapper}>
                        <RFIDScanner onUnregisteredCard={handleUnregisteredCard} />

                        {/* Unregistered Card Alert */}
                        {pendingScan && hasRole(['admin']) && (
                            <div className={styles.alertCard}>
                                <div className={styles.alertIcon}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                        <line x1="12" y1="9" x2="12" y2="13" />
                                        <line x1="12" y1="17" x2="12.01" y2="17" />
                                    </svg>
                                </div>
                                <div className={styles.alertContent}>
                                    <h4 className={styles.alertTitle}>Unregistered RFID Card Detected</h4>
                                    <p className={styles.alertText}>
                                        Card <code>{pendingScan.rfidCardId}</code> is not registered in the system.
                                    </p>
                                </div>
                                <div className={styles.alertActions}>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => {
                                            setUnregisteredRfid(pendingScan.rfidCardId);
                                            setShowRegistration(true);
                                        }}
                                    >
                                        Register Now
                                    </button>
                                    <button className="btn btn-ghost" onClick={clearPendingScan}>
                                        Dismiss
                                    </button>
                                </div>
                            </div>
                        )}

                        {pendingScan && !hasRole(['admin']) && (
                            <div className={styles.infoCard}>
                                <div className={styles.infoIcon}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="16" x2="12" y2="12" />
                                        <line x1="12" y1="8" x2="12.01" y2="8" />
                                    </svg>
                                </div>
                                <div className={styles.infoContent}>
                                    <h4 className={styles.infoTitle}>Unregistered Card</h4>
                                    <p className={styles.infoText}>
                                        Please contact an administrator to register this card.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
