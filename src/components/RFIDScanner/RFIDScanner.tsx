'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './RFIDScanner.module.css';
import { useRFID } from '@/contexts/RFIDContext';
import { useAttendance } from '@/contexts/AttendanceContext';
import { Student } from '@/types';

interface RFIDScannerProps {
    onUnregisteredCard?: (rfidCardId: string) => void;
}

export default function RFIDScanner({ onUnregisteredCard }: RFIDScannerProps) {
    const {
        scannerStatus,
        lastScan,
        pendingScan,
        isScanning,
        registeredStudents,
        simulateScan,
    } = useRFID();

    const { recordAttendance, sendSMSNotification } = useAttendance();

    const [scanResult, setScanResult] = useState<'idle' | 'success' | 'warning' | 'error'>('idle');
    const [scannedStudent, setScannedStudent] = useState<Student | null>(null);
    const [smsStatus, setSmsStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
    const [testRfid, setTestRfid] = useState('');
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Handle scan results
    useEffect(() => {
        if (lastScan) {
            if (lastScan.isRegistered) {
                // Find the student by RFID Card ID or Student ID
                const student = (registeredStudents.get(lastScan.rfidCardId) ||
                    Array.from(registeredStudents.values()).find(s => s.studentId === lastScan.studentId)) as Student | undefined;

                if (student) {
                    const timer = setTimeout(() => {
                        setScannedStudent(student);
                        setScanResult('success');
                    }, 0);

                    // Record attendance
                    const now = new Date();
                    const hour = now.getHours();
                    // After 8:30 AM is considered late
                    const status = hour >= 9 || (hour === 8 && now.getMinutes() > 30) ? 'late' : 'present';

                    recordAttendance(student.studentId, status).then(() => {
                        // Send SMS notification
                        setSmsStatus('sending');
                        const message = `[AttendTrack] ${student.fullName} checked in at ${now.toLocaleTimeString()} on ${now.toLocaleDateString()}. Status: ${status === 'late' ? 'LATE' : 'Present'}`;

                        sendSMSNotification(student.studentId, message)
                            .then(() => setSmsStatus('sent'))
                            .catch(() => setSmsStatus('failed'));
                    });

                    return () => clearTimeout(timer);
                } else {
                    // Fallback if marked as registered but not found in local map
                    const timer = setTimeout(() => {
                        setScanResult('warning');
                    }, 0);
                    return () => clearTimeout(timer);
                }
            } else {
                const timer = setTimeout(() => {
                    setScanResult('warning');
                }, 0);

                if (onUnregisteredCard) {
                    onUnregisteredCard(lastScan.rfidCardId);
                }

                // Note: we can't easily return a cleanup for this specific timer here 
                // because of the control flow, but the reset timer below will handle it.
            }

            // Reset after 5 seconds
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
                setScanResult('idle');
                setScannedStudent(null);
                setSmsStatus('idle');
            }, 5000);
        }

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [lastScan, registeredStudents, recordAttendance, sendSMSNotification, onUnregisteredCard]);

    const handleTestScan = () => {
        if (testRfid.trim()) {
            simulateScan(testRfid.trim());
            setTestRfid('');
        }
    };

    const handleQuickTest = (rfid: string) => {
        simulateScan(rfid);
    };

    return (
        <div className={styles.container}>
            {/* Scanner Status Card */}
            <div className={styles.scannerCard}>
                <div className={styles.scannerHeader}>
                    <h3 className={styles.scannerTitle}>RFID Scanner</h3>
                    <div className={`${styles.statusBadge} ${scannerStatus.isConnected ? styles.online : styles.offline}`}>
                        <span className={styles.statusDot} />
                        {scannerStatus.isConnected ? 'Online' : 'Offline'}
                    </div>
                </div>

                {/* Scanner Visual */}
                <div className={`${styles.scannerVisual} ${styles[scanResult]}`}>
                    <div className={styles.scannerFrame}>
                        <div className={styles.scannerCorner} style={{ top: 0, left: 0 }} />
                        <div className={styles.scannerCorner} style={{ top: 0, right: 0 }} />
                        <div className={styles.scannerCorner} style={{ bottom: 0, left: 0 }} />
                        <div className={styles.scannerCorner} style={{ bottom: 0, right: 0 }} />

                        {isScanning && <div className={styles.scanLine} />}

                        <div className={styles.scannerContent}>
                            {scanResult === 'idle' && !isScanning && (
                                <>
                                    <div className={styles.rfidIcon}>
                                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <rect x="2" y="5" width="20" height="14" rx="2" />
                                            <circle cx="17" cy="12" r="3" />
                                            <path d="M6 9h4" />
                                            <path d="M6 12h2" />
                                        </svg>
                                    </div>
                                    <p className={styles.scanInstruction}>Tap RFID card to scan</p>
                                </>
                            )}

                            {isScanning && (
                                <>
                                    <div className={styles.spinnerLarge} />
                                    <p className={styles.scanInstruction}>Reading card...</p>
                                </>
                            )}

                            {scanResult === 'success' && scannedStudent && (
                                <>
                                    <div className={styles.successIcon}>
                                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                            <polyline points="22 4 12 14.01 9 11.01" />
                                        </svg>
                                    </div>
                                    <div className={styles.studentInfo}>
                                        <h4 className={styles.studentName}>{scannedStudent.fullName}</h4>
                                        <p className={styles.studentId}>{scannedStudent.studentId}</p>
                                        <span className={styles.courseBadge}>
                                            {scannedStudent.course} - {scannedStudent.section}
                                        </span>
                                    </div>
                                </>
                            )}

                            {scanResult === 'warning' && (
                                <>
                                    <div className={styles.warningIcon}>
                                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                            <line x1="12" y1="9" x2="12" y2="13" />
                                            <line x1="12" y1="17" x2="12.01" y2="17" />
                                        </svg>
                                    </div>
                                    <p className={styles.warningText}>Unregistered Card</p>
                                    <p className={styles.cardId}>{lastScan?.rfidCardId}</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* SMS Status */}
                {smsStatus !== 'idle' && (
                    <div className={styles.smsStatus}>
                        <div className={styles.smsIcon}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                        </div>
                        <span className={styles.smsText}>
                            {smsStatus === 'sending' && 'Sending SMS notification...'}
                            {smsStatus === 'sent' && '✓ SMS sent to parent/guardian'}
                            {smsStatus === 'failed' && '✗ SMS failed to send'}
                        </span>
                        {smsStatus === 'sending' && <div className={styles.spinner} />}
                    </div>
                )}
            </div>

            {/* Test Scanner Section */}
            <div className={styles.testCard}>
                <h4 className={styles.testTitle}>Test Scanner</h4>
                <p className={styles.testDescription}>
                    Simulate RFID scans for testing purposes
                </p>

                <div className={styles.testInput}>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Enter RFID Card ID..."
                        value={testRfid}
                        onChange={(e) => setTestRfid(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleTestScan()}
                    />
                    <button
                        className="btn btn-primary"
                        onClick={handleTestScan}
                        disabled={!testRfid.trim() || isScanning}
                    >
                        Scan
                    </button>
                </div>

                <div className={styles.quickTests}>
                    <span className={styles.quickTestLabel}>Quick test:</span>
                    <button
                        className={styles.quickTestBtn}
                        onClick={() => handleQuickTest('RFID-001-ABC')}
                        disabled={isScanning}
                    >
                        Registered Card
                    </button>
                    <button
                        className={styles.quickTestBtn}
                        onClick={() => handleQuickTest('RFID-NEW-' + Date.now())}
                        disabled={isScanning}
                    >
                        New Card
                    </button>
                </div>
            </div>

            {/* Scanner Info */}
            <div className={styles.infoCard}>
                <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Location</span>
                    <span className={styles.infoValue}>{scannerStatus.location}</span>
                </div>
                <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Firmware</span>
                    <span className={styles.infoValue}>{scannerStatus.firmwareVersion}</span>
                </div>
                <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Last Heartbeat</span>
                    <span className={styles.infoValue}>
                        {scannerStatus.lastHeartbeat?.toLocaleTimeString() || 'N/A'}
                    </span>
                </div>
            </div>
        </div>
    );
}
