'use client';

import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth, useAttendance, useRFID } from '@/contexts';
import { AttendanceTable } from '@/components';
import { AttendanceFilter } from '@/types';
import styles from './page.module.css';

export default function RecordsPage() {
    const searchParams = useSearchParams();
    const { hasRole, user } = useAuth();
    const { attendanceRecords } = useAttendance();
    const { registeredStudents } = useRFID();

    // Get student filter from URL if present
    const urlStudentId = searchParams.get('student');

    const [filters, setFilters] = useState<AttendanceFilter>({
        studentId: urlStudentId || '',
        dateFrom: '',
        dateTo: '',
        status: undefined,
    });

    // Filter records based on user role and filters
    const filteredRecords = useMemo(() => {
        let records = [...attendanceRecords];

        // If student role, only show their own records
        if (user?.role === 'student') {
            records = records.filter(r => r.student.studentId === user.username);
        }

        // Apply filters
        if (filters.studentId) {
            const query = filters.studentId.toLowerCase();
            records = records.filter(r =>
                r.studentId.toLowerCase().includes(query) ||
                r.student.fullName.toLowerCase().includes(query)
            );
        }

        if (filters.dateFrom) {
            records = records.filter(r => r.date >= filters.dateFrom!);
        }

        if (filters.dateTo) {
            records = records.filter(r => r.date <= filters.dateTo!);
        }

        if (filters.status) {
            records = records.filter(r => r.status === filters.status);
        }

        // Sort by date descending
        return records.sort((a, b) =>
            new Date(b.date + 'T' + b.checkInTime).getTime() -
            new Date(a.date + 'T' + a.checkInTime).getTime()
        );
    }, [attendanceRecords, filters, user]);

    // Get unique students for filter dropdown
    const studentsArray = Array.from(registeredStudents.values());

    // Calculate stats
    const stats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const todayRecords = attendanceRecords.filter(r => r.date === today);

        return {
            total: filteredRecords.length,
            present: filteredRecords.filter(r => r.status === 'present').length,
            late: filteredRecords.filter(r => r.status === 'late').length,
            absent: filteredRecords.filter(r => r.status === 'absent').length,
        };
    }, [filteredRecords, attendanceRecords]);

    const clearFilters = () => {
        setFilters({
            studentId: '',
            dateFrom: '',
            dateTo: '',
            status: undefined,
        });
    };

    const hasActiveFilters = filters.studentId || filters.dateFrom || filters.dateTo || filters.status;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <h1 className={styles.title}>Attendance Records</h1>
                    <p className={styles.subtitle}>
                        View and filter attendance history
                    </p>
                </div>
            </div>

            {/* Stats Summary */}
            <div className={styles.statsBar}>
                <div className={styles.stat}>
                    <span className={styles.statValue}>{stats.total}</span>
                    <span className={styles.statLabel}>Total Records</span>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.stat}>
                    <span className={`${styles.statValue} ${styles.present}`}>{stats.present}</span>
                    <span className={styles.statLabel}>Present</span>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.stat}>
                    <span className={`${styles.statValue} ${styles.late}`}>{stats.late}</span>
                    <span className={styles.statLabel}>Late</span>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.stat}>
                    <span className={`${styles.statValue} ${styles.absent}`}>{stats.absent}</span>
                    <span className={styles.statLabel}>Absent</span>
                </div>
            </div>

            {/* Filters */}
            <div className={styles.filtersCard}>
                <div className={styles.filtersHeader}>
                    <h3 className={styles.filtersTitle}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                        </svg>
                        Filters
                    </h3>
                    {hasActiveFilters && (
                        <button className={styles.clearBtn} onClick={clearFilters}>
                            Clear All
                        </button>
                    )}
                </div>

                <div className={styles.filtersGrid}>
                    {/* Student Search/Select */}
                    {hasRole(['admin', 'instructor']) && (
                        <div className="form-group">
                            <label className="form-label">Student</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Search by name or ID..."
                                value={filters.studentId}
                                onChange={(e) => setFilters(prev => ({ ...prev, studentId: e.target.value }))}
                            />
                        </div>
                    )}

                    {/* Date Range */}
                    <div className="form-group">
                        <label className="form-label">From Date</label>
                        <input
                            type="date"
                            className="form-input"
                            value={filters.dateFrom}
                            onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">To Date</label>
                        <input
                            type="date"
                            className="form-input"
                            value={filters.dateTo}
                            onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="form-group">
                        <label className="form-label">Status</label>
                        <select
                            className="form-input"
                            value={filters.status || ''}
                            onChange={(e) => setFilters(prev => ({
                                ...prev,
                                status: e.target.value ? e.target.value as any : undefined
                            }))}
                        >
                            <option value="">All Statuses</option>
                            <option value="present">Present</option>
                            <option value="late">Late</option>
                            <option value="absent">Absent</option>
                            <option value="excused">Excused</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Records Table */}
            <div className={styles.tableCard}>
                <AttendanceTable
                    records={filteredRecords}
                    showStudent={hasRole(['admin', 'instructor'])}
                />
            </div>

            {/* Export Options (Admin only) */}
            {hasRole(['admin']) && filteredRecords.length > 0 && (
                <div className={styles.exportBar}>
                    <span className={styles.exportLabel}>Export:</span>
                    <button className="btn btn-ghost btn-sm">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        CSV
                    </button>
                    <button className="btn btn-ghost btn-sm">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                        </svg>
                        PDF
                    </button>
                </div>
            )}
        </div>
    );
}
