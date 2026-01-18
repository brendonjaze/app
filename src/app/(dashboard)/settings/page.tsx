'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useToast } from '@/contexts';
import styles from './page.module.css';

export default function SettingsPage() {
    const router = useRouter();
    const { hasRole, user } = useAuth();
    const { addToast } = useToast();

    const [settings, setSettings] = useState({
        // General
        schoolName: 'Demo School',
        lateThreshold: '08:30',
        enableSmsNotifications: true,
        enableEmailNotifications: false,

        // SMS Settings
        smsApiEndpoint: '/api/sms',
        smsTemplate: '[AttendTrack] {studentName} checked in at {time} on {date}. Status: {status}',

        // Scanner Settings
        scannerLocation: 'Main Entrance',
        scanCooldown: 30, // seconds

        // Appearance
        theme: 'dark',
    });

    const [isSaving, setIsSaving] = useState(false);

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
                <p>Only administrators can access settings.</p>
                <button className="btn btn-primary" onClick={() => router.push('/dashboard')}>
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const handleSave = async () => {
        setIsSaving(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        addToast({
            type: 'success',
            title: 'Settings Saved',
            message: 'Your settings have been updated successfully.',
        });

        setIsSaving(false);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Settings</h1>
                <p className={styles.subtitle}>
                    Configure system preferences and integrations
                </p>
            </div>

            <div className={styles.content}>
                {/* General Settings */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                        General
                    </h2>

                    <div className={styles.settingsGrid}>
                        <div className="form-group">
                            <label className="form-label">School Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={settings.schoolName}
                                onChange={(e) => setSettings(prev => ({ ...prev, schoolName: e.target.value }))}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Late Threshold Time</label>
                            <input
                                type="time"
                                className="form-input"
                                value={settings.lateThreshold}
                                onChange={(e) => setSettings(prev => ({ ...prev, lateThreshold: e.target.value }))}
                            />
                            <p className="form-hint">Students arriving after this time will be marked as late</p>
                        </div>
                    </div>
                </section>

                {/* Notification Settings */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        Notifications
                    </h2>

                    <div className={styles.toggleGroup}>
                        <div className={styles.toggleItem}>
                            <div className={styles.toggleInfo}>
                                <span className={styles.toggleLabel}>SMS Notifications</span>
                                <span className={styles.toggleDesc}>Send SMS to parents when students check in</span>
                            </div>
                            <label className={styles.toggle}>
                                <input
                                    type="checkbox"
                                    checked={settings.enableSmsNotifications}
                                    onChange={(e) => setSettings(prev => ({
                                        ...prev,
                                        enableSmsNotifications: e.target.checked
                                    }))}
                                />
                                <span className={styles.toggleSlider} />
                            </label>
                        </div>

                        <div className={styles.toggleItem}>
                            <div className={styles.toggleInfo}>
                                <span className={styles.toggleLabel}>Email Notifications</span>
                                <span className={styles.toggleDesc}>Send email copies of attendance reports</span>
                            </div>
                            <label className={styles.toggle}>
                                <input
                                    type="checkbox"
                                    checked={settings.enableEmailNotifications}
                                    onChange={(e) => setSettings(prev => ({
                                        ...prev,
                                        enableEmailNotifications: e.target.checked
                                    }))}
                                />
                                <span className={styles.toggleSlider} />
                            </label>
                        </div>
                    </div>

                    <div className={styles.settingsGrid}>
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="form-label">SMS Message Template</label>
                            <textarea
                                className="form-input"
                                rows={3}
                                value={settings.smsTemplate}
                                onChange={(e) => setSettings(prev => ({ ...prev, smsTemplate: e.target.value }))}
                            />
                            <p className="form-hint">
                                Variables: {'{studentName}'}, {'{time}'}, {'{date}'}, {'{status}'}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Scanner Settings */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                            <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                            <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                            <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                            <rect x="7" y="7" width="10" height="10" rx="1" />
                        </svg>
                        RFID Scanner
                    </h2>

                    <div className={styles.settingsGrid}>
                        <div className="form-group">
                            <label className="form-label">Scanner Location</label>
                            <input
                                type="text"
                                className="form-input"
                                value={settings.scannerLocation}
                                onChange={(e) => setSettings(prev => ({ ...prev, scannerLocation: e.target.value }))}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Scan Cooldown (seconds)</label>
                            <input
                                type="number"
                                className="form-input"
                                min="5"
                                max="300"
                                value={settings.scanCooldown}
                                onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    scanCooldown: parseInt(e.target.value) || 30
                                }))}
                            />
                            <p className="form-hint">Minimum time between scans for the same card</p>
                        </div>
                    </div>
                </section>

                {/* Hardware Integration */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
                            <rect x="9" y="9" width="6" height="6" />
                            <line x1="9" y1="1" x2="9" y2="4" />
                            <line x1="15" y1="1" x2="15" y2="4" />
                            <line x1="9" y1="20" x2="9" y2="23" />
                            <line x1="15" y1="20" x2="15" y2="23" />
                            <line x1="20" y1="9" x2="23" y2="9" />
                            <line x1="20" y1="14" x2="23" y2="14" />
                            <line x1="1" y1="9" x2="4" y2="9" />
                            <line x1="1" y1="14" x2="4" y2="14" />
                        </svg>
                        Hardware Integration
                    </h2>

                    <div className={styles.hardwareInfo}>
                        <div className={styles.hardwareItem}>
                            <div className={styles.hardwareIcon}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="2" y="5" width="20" height="14" rx="2" />
                                    <circle cx="17" cy="12" r="3" />
                                </svg>
                            </div>
                            <div className={styles.hardwareDetails}>
                                <h4>RFID Reader</h4>
                                <p>MFRC522 / RC522 Module</p>
                            </div>
                            <span className={styles.hardwareBadge}>Compatible</span>
                        </div>

                        <div className={styles.hardwareItem}>
                            <div className={styles.hardwareIcon}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                            </div>
                            <div className={styles.hardwareDetails}>
                                <h4>SMS Module</h4>
                                <p>SIM800L GSM/GPRS</p>
                            </div>
                            <span className={styles.hardwareBadge}>Compatible</span>
                        </div>

                        <div className={styles.hardwareItem}>
                            <div className={styles.hardwareIcon}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="4" y="4" width="16" height="16" rx="2" />
                                    <line x1="9" y1="9" x2="15" y2="15" />
                                    <line x1="15" y1="9" x2="9" y2="15" />
                                </svg>
                            </div>
                            <div className={styles.hardwareDetails}>
                                <h4>Microcontroller</h4>
                                <p>Arduino UNO / ESP32</p>
                            </div>
                            <span className={styles.hardwareBadge}>Compatible</span>
                        </div>
                    </div>
                </section>

                {/* Save Button */}
                <div className={styles.actions}>
                    <button
                        className="btn btn-primary btn-lg"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>
                                <span className={styles.spinner} />
                                Saving...
                            </>
                        ) : (
                            <>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                    <polyline points="17 21 17 13 7 13 7 21" />
                                    <polyline points="7 3 7 8 15 8" />
                                </svg>
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
