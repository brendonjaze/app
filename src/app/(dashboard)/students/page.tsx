'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useRFID } from '@/contexts';
import { Student } from '@/types';
import styles from './page.module.css';

export default function StudentsPage() {
    const router = useRouter();
    const { hasRole } = useAuth();
    const { registeredStudents } = useRFID();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

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
                <p>You don&apos;t have permission to view this page.</p>
                <button className="btn btn-primary" onClick={() => router.push('/dashboard')}>
                    Back to Dashboard
                </button>
            </div>
        );
    }

    // Convert Map to array and filter
    const studentsArray = Array.from(registeredStudents.values());
    const filteredStudents = studentsArray.filter(student => {
        const query = searchQuery.toLowerCase();
        return (
            student.fullName.toLowerCase().includes(query) ||
            student.studentId.toLowerCase().includes(query) ||
            student.rfidCardId.toLowerCase().includes(query) ||
            (student.course?.toLowerCase().includes(query) ?? false)
        );
    });

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <div className={styles.container}>
            {/* Student Detail Modal */}
            {selectedStudent && (
                <div className={styles.modalOverlay} onClick={() => setSelectedStudent(null)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <button className={styles.modalClose} onClick={() => setSelectedStudent(null)}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>

                        <div className={styles.modalHeader}>
                            <div className={styles.modalAvatar}>
                                {selectedStudent.fullName.charAt(0)}
                            </div>
                            <h2 className={styles.modalTitle}>{selectedStudent.fullName}</h2>
                            <span className={styles.modalId}>{selectedStudent.studentId}</span>
                        </div>

                        <div className={styles.modalContent}>
                            <div className={styles.detailSection}>
                                <h3 className={styles.sectionTitle}>Student Information</h3>
                                <div className={styles.detailGrid}>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Course</span>
                                        <span className={styles.detailValue}>{selectedStudent.course}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Section</span>
                                        <span className={styles.detailValue}>{selectedStudent.section}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Year Level</span>
                                        <span className={styles.detailValue}>Year {selectedStudent.yearLevel}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>RFID Card</span>
                                        <code className={styles.detailCode}>{selectedStudent.rfidCardId}</code>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.detailSection}>
                                <h3 className={styles.sectionTitle}>Guardian Information</h3>
                                <div className={styles.detailGrid}>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Name</span>
                                        <span className={styles.detailValue}>{selectedStudent.guardianName}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Phone</span>
                                        <span className={styles.detailValue}>{selectedStudent.guardianPhone}</span>
                                    </div>
                                    {selectedStudent.email && (
                                        <div className={styles.detailItem}>
                                            <span className={styles.detailLabel}>Email</span>
                                            <span className={styles.detailValue}>{selectedStudent.email}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={styles.detailSection}>
                                <h3 className={styles.sectionTitle}>Registration</h3>
                                <div className={styles.detailGrid}>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Registered On</span>
                                        <span className={styles.detailValue}>{formatDate(selectedStudent.registeredAt)}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <span className={styles.detailLabel}>Status</span>
                                        <span className={`${styles.statusBadge} ${selectedStudent.isActive ? styles.active : styles.inactive}`}>
                                            {selectedStudent.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.modalActions}>
                            <button className="btn btn-secondary" onClick={() => setSelectedStudent(null)}>
                                Close
                            </button>
                            <button className="btn btn-primary" onClick={() => router.push(`/records?student=${selectedStudent.studentId}`)}>
                                View Attendance
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.header}>
                <div className={styles.headerText}>
                    <h1 className={styles.title}>Students</h1>
                    <p className={styles.subtitle}>
                        {studentsArray.length} registered students
                    </p>
                </div>
                {hasRole(['admin']) && (
                    <button className="btn btn-primary" onClick={() => router.push('/register')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Add Student
                    </button>
                )}
            </div>

            {/* Search */}
            <div className={styles.searchBar}>
                <div className={styles.searchIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                </div>
                <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Search by name, ID, RFID, or course..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <button className={styles.clearBtn} onClick={() => setSearchQuery('')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Students Grid */}
            {filteredStudents.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                    </div>
                    <h3 className={styles.emptyTitle}>
                        {searchQuery ? 'No Students Found' : 'No Registered Students'}
                    </h3>
                    <p className={styles.emptyText}>
                        {searchQuery
                            ? 'Try adjusting your search criteria.'
                            : 'Register your first student to get started.'
                        }
                    </p>
                    {!searchQuery && hasRole(['admin']) && (
                        <button className="btn btn-primary" onClick={() => router.push('/register')}>
                            Register Student
                        </button>
                    )}
                </div>
            ) : (
                <div className={styles.studentsGrid}>
                    {filteredStudents.map((student) => (
                        <div
                            key={student.id}
                            className={styles.studentCard}
                            onClick={() => setSelectedStudent(student)}
                        >
                            <div className={styles.cardHeader}>
                                <div className={styles.avatar}>
                                    {student.fullName.charAt(0)}
                                </div>
                                <div className={styles.cardInfo}>
                                    <h3 className={styles.studentName}>{student.fullName}</h3>
                                    <span className={styles.studentId}>{student.studentId}</span>
                                </div>
                            </div>
                            <div className={styles.cardDetails}>
                                <div className={styles.cardDetail}>
                                    <span className={styles.cardLabel}>Course</span>
                                    <span className={styles.cardValue}>{student.course}</span>
                                </div>
                                <div className={styles.cardDetail}>
                                    <span className={styles.cardLabel}>Section</span>
                                    <span className={styles.cardValue}>{student.section}</span>
                                </div>
                            </div>
                            <div className={styles.cardFooter}>
                                <span className={`${styles.statusDot} ${student.isActive ? styles.active : ''}`} />
                                <span className={styles.rfidTag}>{student.rfidCardId}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
