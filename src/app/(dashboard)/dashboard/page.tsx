'use client';

import React from 'react';
import { useAuth, useAttendance, useRFID } from '@/contexts';
import { StatsCard, AttendanceTable } from '@/components';
import styles from './page.module.css';

export default function DashboardPage() {
    const { user, hasRole } = useAuth();
    const { todayRecords, attendanceRecords, getAttendanceStats } = useAttendance();
    const { scannerStatus, smsModuleStatus, registeredStudents } = useRFID();

    const stats = getAttendanceStats();
    const attendanceRate = stats.total > 0
        ? Math.round(((stats.present + stats.late) / stats.total) * 100)
        : 0;

    // Get recent activity (last 5 records)
    const recentRecords = attendanceRecords.slice(0, 5);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Dashboard</h1>
                <p className={styles.subtitle}>
                    Overview of today&apos;s attendance activity
                </p>
            </div>

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
                <StatsCard
                    title="Total Students"
                    value={registeredStudents.size}
                    subtitle="Registered students"
                    icon="students"
                    color="primary"
                />
                <StatsCard
                    title="Present Today"
                    value={stats.present}
                    subtitle={`${todayRecords.length} checked in`}
                    icon="present"
                    color="success"
                    trend={{ value: 5, isPositive: true }}
                />
                <StatsCard
                    title="Late Arrivals"
                    value={stats.late}
                    subtitle="After 8:30 AM"
                    icon="late"
                    color="warning"
                />
                <StatsCard
                    title="Attendance Rate"
                    value={`${attendanceRate}%`}
                    subtitle="Today's rate"
                    icon="rate"
                    color={attendanceRate >= 80 ? 'success' : attendanceRate >= 60 ? 'warning' : 'error'}
                />
            </div>

            {/* Quick Actions & Status */}
            <div className={styles.grid}>
                {/* System Status */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>System Status</h2>
                    </div>
                    <div className={styles.statusList}>
                        <div className={styles.statusItem}>
                            <div className={styles.statusInfo}>
                                <span className={styles.statusLabel}>RFID Scanner</span>
                                <span className={styles.statusLocation}>{scannerStatus.location}</span>
                            </div>
                            <div className={`${styles.statusBadge} ${scannerStatus.isConnected ? styles.online : styles.offline}`}>
                                <span className={styles.statusDot} />
                                {scannerStatus.isConnected ? 'Online' : 'Offline'}
                            </div>
                        </div>
                        <div className={styles.statusItem}>
                            <div className={styles.statusInfo}>
                                <span className={styles.statusLabel}>SMS Module (SIM800L)</span>
                                <span className={styles.statusLocation}>
                                    {smsModuleStatus.networkOperator || 'No network'}
                                </span>
                            </div>
                            <div className={`${styles.statusBadge} ${smsModuleStatus.isConnected ? styles.online : styles.offline}`}>
                                <span className={styles.statusDot} />
                                {smsModuleStatus.isConnected ? 'Connected' : 'Disconnected'}
                            </div>
                        </div>
                        <div className={styles.statusItem}>
                            <div className={styles.statusInfo}>
                                <span className={styles.statusLabel}>Signal Strength</span>
                            </div>
                            <div className={styles.signalBars}>
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <span
                                        key={i}
                                        className={`${styles.signalBar} ${i < Math.ceil(smsModuleStatus.signalStrength / 6) ? styles.active : ''}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                {hasRole(['admin', 'instructor']) && (
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>Quick Actions</h2>
                        </div>
                        <div className={styles.actionGrid}>
                            <a href="/scan" className={styles.actionCard}>
                                <div className={styles.actionIcon}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                                        <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                                        <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                                        <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                                        <rect x="7" y="7" width="10" height="10" rx="1" />
                                    </svg>
                                </div>
                                <span className={styles.actionLabel}>Start Scanning</span>
                            </a>
                            {hasRole(['admin']) && (
                                <>
                                    <a href="/register" className={styles.actionCard}>
                                        <div className={styles.actionIcon}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                                <circle cx="9" cy="7" r="4" />
                                                <line x1="19" y1="8" x2="19" y2="14" />
                                                <line x1="22" y1="11" x2="16" y2="11" />
                                            </svg>
                                        </div>
                                        <span className={styles.actionLabel}>Register Student</span>
                                    </a>
                                    <a href="/students" className={styles.actionCard}>
                                        <div className={styles.actionIcon}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                <circle cx="9" cy="7" r="4" />
                                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                            </svg>
                                        </div>
                                        <span className={styles.actionLabel}>View Students</span>
                                    </a>
                                </>
                            )}
                            <a href="/records" className={styles.actionCard}>
                                <div className={styles.actionIcon}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <line x1="16" y1="13" x2="8" y2="13" />
                                        <line x1="16" y1="17" x2="8" y2="17" />
                                    </svg>
                                </div>
                                <span className={styles.actionLabel}>View Records</span>
                            </a>
                        </div>
                    </div>
                )}
            </div>

            {/* Recent Activity */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Recent Activity</h2>
                    <a href="/records" className={styles.viewAll}>
                        View All
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </a>
                </div>
                <AttendanceTable records={recentRecords} />
            </div>
        </div>
    );
}
