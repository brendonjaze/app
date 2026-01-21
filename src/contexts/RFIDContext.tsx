'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, useRef } from 'react';
import { RFIDScanEvent, ScannerStatus, SMSModuleStatus, Student, ArduinoEvent } from '@/types';
import { useToast } from './ToastContext';
import { API_BASE_URL } from '@/config';

interface RFIDContextType {
    scannerStatus: ScannerStatus;
    smsModuleStatus: SMSModuleStatus;
    lastScan: RFIDScanEvent | null;
    pendingScan: RFIDScanEvent | null;
    clearPendingScan: () => void;
    isScanning: boolean;
    registeredStudents: Map<string, Student>;
    checkRFIDRegistration: (rfidCardId: string) => Student | null;
    registerStudent: (student: Student) => Promise<void>;
    simulateScan: (rfidCardId: string) => void;
    isLoading: boolean;
}

const RFIDContext = createContext<RFIDContextType | undefined>(undefined);

interface BackendStudent {
    id: string;
    student_id: string;
    name: string;
    rfid: string;
    parent_name?: string;
    parent_phone: string;
    student_phone?: string;
    course?: string;
    section?: string;
    year_level?: number;
    created_at: string;
}

export function RFIDProvider({ children }: { children: ReactNode }) {
    const { addToast } = useToast();
    const wsRef = useRef<WebSocket | null>(null);

    const [scannerStatus, setScannerStatus] = useState<ScannerStatus>({
        isConnected: true, // Simulated as connected
        lastHeartbeat: new Date(),
        location: 'Main Entrance',
        firmwareVersion: '1.0.3',
    });

    const [smsModuleStatus, setSmsModuleStatus] = useState<SMSModuleStatus>({
        isConnected: true,
        signalStrength: 25,
        networkOperator: 'SMART',
        simCardStatus: 'ready',
        pendingMessages: 0,
    });

    const [lastScan, setLastScan] = useState<RFIDScanEvent | null>(null);
    const [pendingScan, setPendingScan] = useState<RFIDScanEvent | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [registeredStudents, setRegisteredStudents] = useState<Map<string, Student>>(new Map());

    // Fetch students from backend
    const fetchStudents = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/students`);
            if (!response.ok) throw new Error('Failed to fetch students');

            const data = await response.json();
            const map = new Map<string, Student>();
            data.forEach((s: BackendStudent) => {
                // Map backend fields to frontend Student interface
                const student: Student = {
                    id: s.id,
                    studentId: s.student_id,
                    fullName: s.name,
                    rfidCardId: s.rfid,
                    guardianName: s.parent_name || 'N/A', // Assuming backend might have these or defaults
                    guardianPhone: s.parent_phone,
                    studentPhone: s.student_phone,
                    course: s.course || 'N/A',
                    section: s.section || 'N/A',
                    yearLevel: s.year_level || 1,
                    registeredAt: new Date(s.created_at),
                    registeredBy: 'admin',
                    isActive: true,
                };
                map.set(student.rfidCardId, student);
            });
            setRegisteredStudents(map);

        } catch (error) {
            console.error('Error fetching students:', error);
            addToast({
                type: 'error',
                title: 'Connection Error',
                message: 'Could not connect to the backend to fetch students.',
            });
        } finally {
            setIsLoading(false);
        }
    }, [addToast]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    // Simulate WebSocket connection to Arduino
    useEffect(() => {
        const simulateConnection = () => {
            setScannerStatus(prev => ({
                ...prev,
                isConnected: true,
                lastHeartbeat: new Date(),
            }));
        };

        const heartbeatInterval = setInterval(simulateConnection, 5000);
        const currentWs = wsRef.current;

        return () => {
            clearInterval(heartbeatInterval);
            if (currentWs) {
                currentWs.close();
            }
        };
    }, []);

    // Handle incoming Arduino events
    const handleArduinoEvent = useCallback(async (event: ArduinoEvent) => {
        switch (event.type) {
            case 'rfid_scan':
                const rfidCardId = event.payload.rfidCardId as string;

                // Track attendance in backend
                try {
                    const response = await fetch(`${API_BASE_URL}/api/attendance/scan`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ rfid: rfidCardId })
                    });

                    const result = await response.json();
                    const student = registeredStudents.get(rfidCardId);

                    const scanEvent: RFIDScanEvent = {
                        rfidCardId,
                        timestamp: new Date(),
                        scannerLocation: scannerStatus.location,
                        isRegistered: result.status === 'registered',
                        studentId: student?.studentId,
                    };

                    setLastScan(scanEvent);

                    if (result.status === 'unregistered') {
                        setPendingScan(scanEvent);
                        addToast({
                            type: 'warning',
                            title: 'Unregistered RFID Card',
                            message: `Card ${rfidCardId} is not registered. Please register the student.`,
                        });
                    } else {
                        addToast({
                            type: 'success',
                            title: 'Attendance Recorded',
                            message: `${student?.fullName || 'Student'} checked in successfully.`,
                        });
                    }
                } catch (error) {
                    console.error('Error recording attendance:', error);
                }
                break;

            case 'scanner_status':
                setScannerStatus(prev => ({
                    ...prev,
                    ...(event.payload as Partial<ScannerStatus>),
                }));
                break;

            case 'sms_status':
                setSmsModuleStatus(prev => ({
                    ...prev,
                    ...(event.payload as Partial<SMSModuleStatus>),
                }));
                break;

            case 'error':
                addToast({
                    type: 'error',
                    title: 'Hardware Error',
                    message: event.payload.message as string || 'An error occurred with the hardware.',
                });
                break;
        }
    }, [registeredStudents, scannerStatus.location, addToast]);

    const clearPendingScan = useCallback(() => {
        setPendingScan(null);
    }, []);

    const checkRFIDRegistration = useCallback((rfidCardId: string): Student | null => {
        return registeredStudents.get(rfidCardId) || null;
    }, [registeredStudents]);

    const registerStudent = useCallback(async (student: Student) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/students`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    rfid: student.rfidCardId,
                    studentId: student.studentId,
                    name: student.fullName,
                    studentPhone: student.studentPhone || student.guardianPhone, // Fallback if not provided
                    parentPhone: student.guardianPhone,
                    guardianName: student.guardianName,
                    course: student.course,
                    section: student.section,
                    yearLevel: student.yearLevel
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                // Check for 'error' or 'message' property from backend
                throw new Error(errorData.error || errorData.message || 'Failed to register student');
            }

            const result = await response.json();

            // Update local state
            setRegisteredStudents(prev => {
                const newMap = new Map(prev);
                newMap.set(student.rfidCardId, {
                    ...student,
                    id: result.student?.id || student.id
                });
                return newMap;
            });

            // Clear pending scan if it matches
            if (pendingScan?.rfidCardId === student.rfidCardId) {
                setPendingScan(null);
            }

            addToast({
                type: 'success',
                title: 'Student Registered',
                message: `${student.fullName} has been successfully registered.`,
            });
        } catch (error: unknown) {
            console.error('Registration Error:', error);
            const errorMessage = error instanceof Error ? error.message : 'An error occurred during registration.';
            addToast({
                type: 'error',
                title: 'Registration Failed',
                message: errorMessage,
            });
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [pendingScan, addToast]);

    // Simulate an RFID scan for testing
    const simulateScan = useCallback((rfidCardId: string) => {
        setIsScanning(true);

        // Simulate scan delay
        setTimeout(() => {
            handleArduinoEvent({
                type: 'rfid_scan',
                payload: { rfidCardId },
                timestamp: new Date(),
            });
            setIsScanning(false);
        }, 500);
    }, [handleArduinoEvent]);

    return (
        <RFIDContext.Provider
            value={{
                scannerStatus,
                smsModuleStatus,
                lastScan,
                pendingScan,
                clearPendingScan,
                isScanning,
                registeredStudents,
                checkRFIDRegistration,
                registerStudent,
                simulateScan,
                isLoading
            }}
        >
            {children}
        </RFIDContext.Provider>
    );
}

export function useRFID() {
    const context = useContext(RFIDContext);
    if (context === undefined) {
        throw new Error('useRFID must be used within an RFIDProvider');
    }
    return context;
}
