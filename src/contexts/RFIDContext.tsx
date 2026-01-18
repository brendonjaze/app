'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, useRef } from 'react';
import { RFIDScanEvent, ScannerStatus, SMSModuleStatus, Student, ArduinoEvent } from '@/types';
import { useToast } from './ToastContext';

interface RFIDContextType {
    scannerStatus: ScannerStatus;
    smsModuleStatus: SMSModuleStatus;
    lastScan: RFIDScanEvent | null;
    pendingScan: RFIDScanEvent | null;
    clearPendingScan: () => void;
    isScanning: boolean;
    registeredStudents: Map<string, Student>;
    checkRFIDRegistration: (rfidCardId: string) => Student | null;
    registerStudent: (student: Student) => void;
    simulateScan: (rfidCardId: string) => void;
}

const RFIDContext = createContext<RFIDContextType | undefined>(undefined);

// Mock registered students
const INITIAL_STUDENTS: Student[] = [
    {
        id: '1',
        studentId: '2024-0001',
        fullName: 'Maria Santos',
        rfidCardId: 'RFID-001-ABC',
        guardianName: 'Juan Santos',
        guardianPhone: '+639171234567',
        course: 'Computer Science',
        section: 'A',
        yearLevel: 2,
        registeredAt: new Date('2024-08-15'),
        registeredBy: 'admin',
        isActive: true,
    },
    {
        id: '2',
        studentId: '2024-0002',
        fullName: 'Carlos Reyes',
        rfidCardId: 'RFID-002-DEF',
        guardianName: 'Ana Reyes',
        guardianPhone: '+639189876543',
        course: 'Information Technology',
        section: 'B',
        yearLevel: 1,
        registeredAt: new Date('2024-08-16'),
        registeredBy: 'admin',
        isActive: true,
    },
    {
        id: '3',
        studentId: '2024-0003',
        fullName: 'Elena Cruz',
        rfidCardId: 'RFID-003-GHI',
        guardianName: 'Roberto Cruz',
        guardianPhone: '+639195551234',
        course: 'Computer Science',
        section: 'A',
        yearLevel: 3,
        registeredAt: new Date('2024-08-17'),
        registeredBy: 'admin',
        isActive: true,
    },
];

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
    const [registeredStudents, setRegisteredStudents] = useState<Map<string, Student>>(() => {
        const map = new Map();
        INITIAL_STUDENTS.forEach(student => {
            map.set(student.rfidCardId, student);
        });
        return map;
    });

    // Simulate WebSocket connection to Arduino
    useEffect(() => {
        // In production, this would connect to a real WebSocket server
        // that interfaces with the Arduino
        const simulateConnection = () => {
            setScannerStatus(prev => ({
                ...prev,
                isConnected: true,
                lastHeartbeat: new Date(),
            }));
        };

        const heartbeatInterval = setInterval(simulateConnection, 5000);

        return () => {
            clearInterval(heartbeatInterval);
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    // Handle incoming Arduino events
    const handleArduinoEvent = useCallback((event: ArduinoEvent) => {
        switch (event.type) {
            case 'rfid_scan':
                const rfidCardId = event.payload.rfidCardId as string;
                const student = registeredStudents.get(rfidCardId);

                const scanEvent: RFIDScanEvent = {
                    rfidCardId,
                    timestamp: new Date(),
                    scannerLocation: scannerStatus.location,
                    isRegistered: !!student,
                    studentId: student?.studentId,
                };

                setLastScan(scanEvent);

                if (!student) {
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
                        message: `${student.fullName} checked in successfully.`,
                    });
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

    const registerStudent = useCallback((student: Student) => {
        setRegisteredStudents(prev => {
            const newMap = new Map(prev);
            newMap.set(student.rfidCardId, student);
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
