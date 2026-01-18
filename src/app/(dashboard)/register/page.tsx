'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts';
import { RegistrationForm } from '@/components';
import styles from './page.module.css';

export default function RegisterPage() {
    const router = useRouter();
    const { hasRole } = useAuth();

    // Check authorization - only admins can register students
    if (!hasRole(['admin'])) {
        return (
            <div className={styles.unauthorized}>
                <div className={styles.unauthorizedIcon}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                    </svg>
                </div>
                <h2>Access Denied</h2>
                <p>Only administrators can register new students.</p>
                <button className="btn btn-primary" onClick={() => router.push('/dashboard')}>
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const handleSuccess = () => {
        router.push('/students');
    };

    const handleCancel = () => {
        router.push('/dashboard');
    };

    return (
        <div className={styles.container}>
            <RegistrationForm onSuccess={handleSuccess} onCancel={handleCancel} />
        </div>
    );
}
