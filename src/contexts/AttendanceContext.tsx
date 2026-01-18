'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AttendanceRecord, AttendanceStatus, AttendanceFilter, SMSNotification } from '@/types';
import { useToast } from './ToastContext';
import { useRFID } from './RFIDContext';

// Generate mock attendance records
const generateMockAttendance = (): AttendanceRecord[] => {
    const records: AttendanceRecord[] = [];
    const today = new Date();

    // Create attendance for past 7 days
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        // Add records for some students
        const statuses: AttendanceStatus[] = ['present', 'present', 'late', 'present', 'absent'];

        records.push({
            id: `att-${dateStr}-1`,
            studentId: '2024-0001',
            student: {
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
            checkInTime: new Date(dateStr + 'T08:00:00'),
            checkOutTime: new Date(dateStr + 'T16:00:00'),
            date: dateStr,
            status: statuses[i % statuses.length],
            location: 'Main Entrance',
            smsNotificationSent: true,
            smsDeliveryTime: new Date(dateStr + 'T08:01:00'),
        });

        records.push({
            id: `att-${dateStr}-2`,
            studentId: '2024-0002',
            student: {
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
            checkInTime: new Date(dateStr + 'T08:15:00'),
            checkOutTime: new Date(dateStr + 'T16:30:00'),
            date: dateStr,
            status: i === 0 ? 'present' : statuses[(i + 1) % statuses.length],
            location: 'Main Entrance',
            smsNotificationSent: true,
            smsDeliveryTime: new Date(dateStr + 'T08:16:00'),
        });
    }

    return records;
};

interface AttendanceContextType {
    attendanceRecords: AttendanceRecord[];
    todayRecords: AttendanceRecord[];
    smsNotifications: SMSNotification[];
    recordAttendance: (studentId: string, status: AttendanceStatus) => Promise<AttendanceRecord>;
    getStudentAttendance: (studentId: string, filter?: AttendanceFilter) => AttendanceRecord[];
    getAttendanceStats: () => { present: number; late: number; absent: number; total: number };
    sendSMSNotification: (studentId: string, message: string) => Promise<SMSNotification>;
    isLoading: boolean;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export function AttendanceProvider({ children }: { children: ReactNode }) {
    const { addToast } = useToast();
    const { registeredStudents } = useRFID();

    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(generateMockAttendance());
    const [smsNotifications, setSmsNotifications] = useState<SMSNotification[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Get today's records
    const todayRecords = attendanceRecords.filter(
        record => record.date === new Date().toISOString().split('T')[0]
    );

    const recordAttendance = useCallback(async (
        studentId: string,
        status: AttendanceStatus
    ): Promise<AttendanceRecord> => {
        setIsLoading(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        // Find student
        let student = null;
        registeredStudents.forEach(s => {
            if (s.studentId === studentId) {
                student = s;
            }
        });

        if (!student) {
            setIsLoading(false);
            throw new Error('Student not found');
        }

        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];

        // Check if already recorded today
        const existingRecord = attendanceRecords.find(
            r => r.studentId === studentId && r.date === dateStr
        );

        if (existingRecord) {
            // Update checkout time
            const updatedRecord = {
                ...existingRecord,
                checkOutTime: now,
            };

            setAttendanceRecords(prev =>
                prev.map(r => r.id === existingRecord.id ? updatedRecord : r)
            );

            setIsLoading(false);
            return updatedRecord;
        }

        // Create new record
        const newRecord: AttendanceRecord = {
            id: `att-${dateStr}-${Date.now()}`,
            studentId,
            student,
            checkInTime: now,
            date: dateStr,
            status,
            location: 'Main Entrance',
            smsNotificationSent: false,
        };

        setAttendanceRecords(prev => [newRecord, ...prev]);
        setIsLoading(false);

        return newRecord;
    }, [registeredStudents, attendanceRecords]);

    const getStudentAttendance = useCallback((
        studentId: string,
        filter?: AttendanceFilter
    ): AttendanceRecord[] => {
        let records = attendanceRecords.filter(r => r.studentId === studentId);

        if (filter) {
            if (filter.dateFrom) {
                records = records.filter(r => r.date >= filter.dateFrom!);
            }
            if (filter.dateTo) {
                records = records.filter(r => r.date <= filter.dateTo!);
            }
            if (filter.status) {
                records = records.filter(r => r.status === filter.status);
            }
        }

        return records.sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }, [attendanceRecords]);

    const getAttendanceStats = useCallback(() => {
        const today = new Date().toISOString().split('T')[0];
        const todayRecords = attendanceRecords.filter(r => r.date === today);

        return {
            present: todayRecords.filter(r => r.status === 'present').length,
            late: todayRecords.filter(r => r.status === 'late').length,
            absent: todayRecords.filter(r => r.status === 'absent').length,
            total: registeredStudents.size,
        };
    }, [attendanceRecords, registeredStudents.size]);

    const sendSMSNotification = useCallback(async (
        studentId: string,
        message: string
    ): Promise<SMSNotification> => {
        // Find student
        let student = null;
        registeredStudents.forEach(s => {
            if (s.studentId === studentId) {
                student = s;
            }
        });

        if (!student) {
            throw new Error('Student not found');
        }

        // Simulate sending SMS
        await new Promise(resolve => setTimeout(resolve, 1000));

        const notification: SMSNotification = {
            id: `sms-${Date.now()}`,
            recipientPhone: student.guardianPhone,
            studentId,
            message,
            sentAt: new Date(),
            deliveryStatus: 'sent',
        };

        setSmsNotifications(prev => [notification, ...prev]);

        // Simulate delivery confirmation
        setTimeout(() => {
            setSmsNotifications(prev =>
                prev.map(n =>
                    n.id === notification.id
                        ? { ...n, deliveryStatus: 'delivered', deliveredAt: new Date() }
                        : n
                )
            );

            addToast({
                type: 'success',
                title: 'SMS Delivered',
                message: `Notification sent to ${student.guardianPhone}`,
            });
        }, 2000);

        // Update attendance record
        setAttendanceRecords(prev =>
            prev.map(r => {
                if (r.studentId === studentId && r.date === new Date().toISOString().split('T')[0]) {
                    return { ...r, smsNotificationSent: true, smsDeliveryTime: new Date() };
                }
                return r;
            })
        );

        return notification;
    }, [registeredStudents, addToast]);

    return (
        <AttendanceContext.Provider
            value={{
                attendanceRecords,
                todayRecords,
                smsNotifications,
                recordAttendance,
                getStudentAttendance,
                getAttendanceStats,
                sendSMSNotification,
                isLoading,
            }}
        >
            {children}
        </AttendanceContext.Provider>
    );
}

export function useAttendance() {
    const context = useContext(AttendanceContext);
    if (context === undefined) {
        throw new Error('useAttendance must be used within an AttendanceProvider');
    }
    return context;
}
