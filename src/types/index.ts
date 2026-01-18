// ================================
// TYPE DEFINITIONS
// Attendance Tracking System
// ================================

// User Roles
export type UserRole = 'admin' | 'instructor' | 'student';

// User Interface
export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  fullName: string;
  avatarUrl?: string;
  createdAt: Date;
}

// Student Interface
export interface Student {
  id: string;
  studentId: string;
  fullName: string;
  rfidCardId: string;
  guardianName: string;
  guardianPhone: string;
  studentPhone?: string;
  email?: string;
  course?: string;
  section?: string;
  yearLevel?: number;
  photoUrl?: string;
  registeredAt: Date;
  registeredBy: string;
  isActive: boolean;
}

// RFID Scan Event
export interface RFIDScanEvent {
  rfidCardId: string;
  timestamp: Date;
  scannerLocation: string;
  isRegistered: boolean;
  studentId?: string;
}

// Attendance Record
export interface AttendanceRecord {
  id: string;
  studentId: string;
  student: Student;
  checkInTime: Date;
  checkOutTime?: Date;
  date: string; // YYYY-MM-DD format
  status: AttendanceStatus;
  location: string;
  verifiedBy?: string;
  smsNotificationSent: boolean;
  smsDeliveryTime?: Date;
}

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused';

// SMS Notification
export interface SMSNotification {
  id: string;
  recipientPhone: string;
  studentId: string;
  message: string;
  sentAt: Date;
  deliveryStatus: SMSDeliveryStatus;
  deliveredAt?: Date;
  errorMessage?: string;
}

export type SMSDeliveryStatus = 'pending' | 'sent' | 'delivered' | 'failed';

// Registration Form Data
export interface RegistrationFormData {
  studentId: string;
  fullName: string;
  rfidCardId: string;
  guardianName: string;
  guardianPhone: string;
  email?: string;
  course?: string;
  section?: string;
  yearLevel?: number;
}

// Validation Errors
export interface ValidationErrors {
  studentId?: string;
  fullName?: string;
  rfidCardId?: string;
  guardianName?: string;
  guardianPhone?: string;
  email?: string;
  course?: string;
  section?: string;
  yearLevel?: string;
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Scanner Status
export interface ScannerStatus {
  isConnected: boolean;
  lastHeartbeat?: Date;
  location: string;
  firmwareVersion?: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalStudents: number;
  presentToday: number;
  lateToday: number;
  absentToday: number;
  attendanceRate: number;
  recentScans: RFIDScanEvent[];
}

// Toast Notification
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Filter Options
export interface AttendanceFilter {
  dateFrom?: string;
  dateTo?: string;
  status?: AttendanceStatus;
  studentId?: string;
  section?: string;
  course?: string;
}

// Hardware Events
export interface ArduinoEvent {
  type: 'rfid_scan' | 'scanner_status' | 'sms_status' | 'error';
  payload: Record<string, unknown>;
  timestamp: Date;
}

// SMS Module Status
export interface SMSModuleStatus {
  isConnected: boolean;
  signalStrength: number; // 0-31 or 99 for unknown
  networkOperator?: string;
  simCardStatus: 'ready' | 'not_inserted' | 'error';
  pendingMessages: number;
}

// Auth Context
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Navigation Item
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: UserRole[];
}
