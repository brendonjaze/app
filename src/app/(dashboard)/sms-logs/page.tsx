'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAttendance, useRFID } from '@/contexts';
import styles from './page.module.css';

export default function SMSLogsPage() {
    const router = useRouter();
    const { hasRole } = useAuth();
    const { smsNotifications } = useAttendance();
    const { smsModuleStatus } = useRFID();

    const [filter, setFilter] = useState<'all' | 'sent' | 'delivered' | 'failed'>('all');

    // Check authorization - admin only
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
                <p>Only administrators can view SMS logs.</p>
                <button className="btn btn-primary" onClick={() => router.push('/dashboard')}>
                    Back to Dashboard
                </button>
            </div>
        );
    }

    // Filter notifications
    const filteredNotifications = smsNotifications.filter(n => {
        if (filter === 'all') return true;
        return n.deliveryStatus === filter;
    });

    // Stats
    const stats = {
        total: smsNotifications.length,
        pending: smsNotifications.filter(n => n.deliveryStatus === 'pending').length,
        sent: smsNotifications.filter(n => n.deliveryStatus === 'sent').length,
        delivered: smsNotifications.filter(n => n.deliveryStatus === 'delivered').length,
        failed: smsNotifications.filter(n => n.deliveryStatus === 'failed').length,
    };

    const formatTime = (date: Date) => {
        return new Date(date).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'delivered':
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                );
            case 'sent':
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="22 2 11 13" />
                        <polyline points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                );
            case 'pending':
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                    </svg>
                );
            case 'failed':
                return (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                );
            default:
                return null;
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <h1 className={styles.title}>SMS Logs</h1>
                    <p className={styles.subtitle}>
                        View SMS notification history and delivery status
                    </p>
                </div>
            </div>

            {/* Module Status */}
            <div className={styles.moduleStatus}>
                <div className={styles.moduleInfo}>
                    <div className={`${styles.statusIndicator} ${smsModuleStatus.isConnected ? styles.online : styles.offline}`}>
                        <span className={styles.statusDot} />
                        <span>{smsModuleStatus.isConnected ? 'SIM800L Online' : 'SIM800L Offline'}</span>
                    </div>
                    {smsModuleStatus.isConnected && (
                        <>
                            <span className={styles.moduleDetail}>
                                Network: <strong>{smsModuleStatus.networkOperator || 'N/A'}</strong>
                            </span>
                            <span className={styles.moduleDetail}>
                                Signal: <strong>{Math.round(smsModuleStatus.signalStrength / 31 * 100)}%</strong>
                            </span>
                        </>
                    )}
                </div>
                <div className={styles.pendingCount}>
                    <span className={styles.pendingNumber}>{smsModuleStatus.pendingMessages}</span>
                    <span className={styles.pendingLabel}>Pending</span>
                </div>
            </div>

            {/* Stats */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <span className={styles.statValue}>{stats.total}</span>
                    <span className={styles.statLabel}>Total Messages</span>
                </div>
                <div className={`${styles.statCard} ${styles.delivered}`}>
                    <span className={styles.statValue}>{stats.delivered}</span>
                    <span className={styles.statLabel}>Delivered</span>
                </div>
                <div className={`${styles.statCard} ${styles.sent}`}>
                    <span className={styles.statValue}>{stats.sent}</span>
                    <span className={styles.statLabel}>Sent</span>
                </div>
                <div className={`${styles.statCard} ${styles.failed}`}>
                    <span className={styles.statValue}>{stats.failed}</span>
                    <span className={styles.statLabel}>Failed</span>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className={styles.filterTabs}>
                <button
                    className={`${styles.filterTab} ${filter === 'all' ? styles.active : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All
                </button>
                <button
                    className={`${styles.filterTab} ${filter === 'delivered' ? styles.active : ''}`}
                    onClick={() => setFilter('delivered')}
                >
                    Delivered
                </button>
                <button
                    className={`${styles.filterTab} ${filter === 'sent' ? styles.active : ''}`}
                    onClick={() => setFilter('sent')}
                >
                    Sent
                </button>
                <button
                    className={`${styles.filterTab} ${filter === 'failed' ? styles.active : ''}`}
                    onClick={() => setFilter('failed')}
                >
                    Failed
                </button>
            </div>

            {/* Logs List */}
            <div className={styles.logsList}>
                {filteredNotifications.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                        </div>
                        <h3 className={styles.emptyTitle}>No SMS Logs Found</h3>
                        <p className={styles.emptyText}>
                            SMS notifications will appear here when students check in.
                        </p>
                    </div>
                ) : (
                    filteredNotifications.map((notification) => (
                        <div key={notification.id} className={styles.logItem}>
                            <div className={`${styles.logStatus} ${styles[notification.deliveryStatus]}`}>
                                {getStatusIcon(notification.deliveryStatus)}
                            </div>
                            <div className={styles.logContent}>
                                <div className={styles.logHeader}>
                                    <span className={styles.logPhone}>{notification.recipientPhone}</span>
                                    <span className={styles.logTime}>{formatTime(notification.sentAt)}</span>
                                </div>
                                <p className={styles.logMessage}>{notification.message}</p>
                                <div className={styles.logMeta}>
                                    <span className={`${styles.statusBadge} ${styles[notification.deliveryStatus]}`}>
                                        {notification.deliveryStatus}
                                    </span>
                                    {notification.deliveredAt && (
                                        <span className={styles.deliveryTime}>
                                            Delivered at {formatTime(notification.deliveredAt)}
                                        </span>
                                    )}
                                    {notification.errorMessage && (
                                        <span className={styles.errorMsg}>{notification.errorMessage}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
