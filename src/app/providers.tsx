'use client';

import { ReactNode } from 'react';
import { ToastProvider, AuthProvider, RFIDProvider, AttendanceProvider } from '@/contexts';
import { ToastContainer } from '@/components';

export default function Providers({ children }: { children: ReactNode }) {
    return (
        <ToastProvider>
            <AuthProvider>
                <RFIDProvider>
                    <AttendanceProvider>
                        {children}
                        <ToastContainer />
                    </AttendanceProvider>
                </RFIDProvider>
            </AuthProvider>
        </ToastProvider>
    );
}
