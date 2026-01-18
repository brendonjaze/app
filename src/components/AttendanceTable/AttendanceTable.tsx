'use client';

import React from 'react';
import styles from './AttendanceTable.module.css';
import { AttendanceRecord } from '@/types';

interface AttendanceTableProps {
    records: AttendanceRecord[];
    showStudent?: boolean;
    onRowClick?: (record: AttendanceRecord) => void;
}

export default function AttendanceTable({
    records,
    showStudent = true,
    onRowClick,
}: AttendanceTableProps) {
    const formatTime = (date: Date) => {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getStatusBadge = (status: string) => {
        const statusClasses: Record<string, string> = {
            present: styles.badgeSuccess,
            late: styles.badgeWarning,
            absent: styles.badgeError,
            excused: styles.badgeInfo,
        };
        return statusClasses[status] || styles.badgeInfo;
    };

    if (records.length === 0) {
        return (
            <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                </div>
                <h4 className={styles.emptyTitle}>No Records Found</h4>
                <p className={styles.emptyText}>
                    Attendance records will appear here once students check in.
                </p>
            </div>
        );
    }

    return (
        <div className={styles.tableContainer}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        {showStudent && <th>Student</th>}
                        <th>Date</th>
                        <th>Check In</th>
                        <th>Check Out</th>
                        <th>Status</th>
                        <th>SMS</th>
                    </tr>
                </thead>
                <tbody>
                    {records.map((record) => (
                        <tr
                            key={record.id}
                            onClick={() => onRowClick?.(record)}
                            className={onRowClick ? styles.clickable : ''}
                        >
                            {showStudent && (
                                <td>
                                    <div className={styles.studentCell}>
                                        <div className={styles.avatar}>
                                            {record.student.fullName.charAt(0)}
                                        </div>
                                        <div className={styles.studentInfo}>
                                            <span className={styles.studentName}>{record.student.fullName}</span>
                                            <span className={styles.studentId}>{record.studentId}</span>
                                        </div>
                                    </div>
                                </td>
                            )}
                            <td>
                                <span className={styles.date}>{formatDate(record.date)}</span>
                            </td>
                            <td>
                                <span className={styles.time}>{formatTime(record.checkInTime)}</span>
                            </td>
                            <td>
                                {record.checkOutTime ? (
                                    <span className={styles.time}>{formatTime(record.checkOutTime)}</span>
                                ) : (
                                    <span className={styles.pending}>--</span>
                                )}
                            </td>
                            <td>
                                <span className={`${styles.badge} ${getStatusBadge(record.status)}`}>
                                    {record.status}
                                </span>
                            </td>
                            <td>
                                {record.smsNotificationSent ? (
                                    <span className={styles.smsSuccess}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                        Sent
                                    </span>
                                ) : (
                                    <span className={styles.smsPending}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <polyline points="12 6 12 12 16 14" />
                                        </svg>
                                        Pending
                                    </span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
