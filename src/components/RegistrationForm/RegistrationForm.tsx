'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './RegistrationForm.module.css';
import { RegistrationFormData, ValidationErrors, Student } from '@/types';
import { useRFID } from '@/contexts/RFIDContext';
import { useToast } from '@/contexts/ToastContext';

interface RegistrationFormProps {
    prefilledRfid?: string;
    onSuccess?: (student: Student) => void;
    onCancel?: () => void;
}

const INITIAL_FORM_DATA: RegistrationFormData = {
    studentId: '',
    fullName: '',
    rfidCardId: '',
    guardianName: '',
    guardianPhone: '',
    email: '',
    course: '',
    section: '',
    yearLevel: 1,
};

const COURSES = [
    'Computer Science',
    'Information Technology',
    'Information Systems',
    'Computer Engineering',
    'Data Science',
];

const SECTIONS = ['A', 'B', 'C', 'D', 'E'];

export default function RegistrationForm({
    prefilledRfid,
    onSuccess,
    onCancel,
}: RegistrationFormProps) {
    const { registerStudent, registeredStudents } = useRFID();
    const { addToast } = useToast();

    const [formData, setFormData] = useState<RegistrationFormData>({
        ...INITIAL_FORM_DATA,
        rfidCardId: prefilledRfid || '',
    });
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState(1);
    const [showConfirmation, setShowConfirmation] = useState(false);

    // Update RFID when prefilled changes
    useEffect(() => {
        if (prefilledRfid) {
            setFormData(prev => ({ ...prev, rfidCardId: prefilledRfid }));
        }
    }, [prefilledRfid]);

    // Validate phone number format (Philippine mobile number)
    const validatePhoneNumber = (phone: string): boolean => {
        const cleanPhone = phone.replace(/\D/g, '');
        // Philippine mobile: 09XXXXXXXXX or +639XXXXXXXXX
        return /^(09\d{9}|639\d{9}|\+639\d{9})$/.test(cleanPhone);
    };

    // Validate email format
    const validateEmail = (email: string): boolean => {
        if (!email) return true; // Optional field
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    // Validate student ID format
    const validateStudentId = (id: string): boolean => {
        return /^\d{4}-\d{4}$/.test(id);
    };

    // Check for duplicate RFID
    const isDuplicateRfid = (rfid: string): boolean => {
        return registeredStudents.has(rfid);
    };

    // Check for duplicate Student ID
    const isDuplicateStudentId = (studentId: string): boolean => {
        let isDuplicate = false;
        registeredStudents.forEach(student => {
            if (student.studentId === studentId) {
                isDuplicate = true;
            }
        });
        return isDuplicate;
    };

    // Validate entire form
    const validateForm = useCallback((): ValidationErrors => {
        const newErrors: ValidationErrors = {};

        // Student ID
        if (!formData.studentId.trim()) {
            newErrors.studentId = 'Student ID is required';
        } else if (!validateStudentId(formData.studentId)) {
            newErrors.studentId = 'Format: YYYY-NNNN (e.g., 2024-0001)';
        } else if (isDuplicateStudentId(formData.studentId)) {
            newErrors.studentId = 'This Student ID is already registered';
        }

        // Full Name
        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Full name is required';
        } else if (formData.fullName.trim().length < 3) {
            newErrors.fullName = 'Name must be at least 3 characters';
        }

        // RFID Card ID
        if (!formData.rfidCardId.trim()) {
            newErrors.rfidCardId = 'RFID Card ID is required';
        } else if (isDuplicateRfid(formData.rfidCardId)) {
            newErrors.rfidCardId = 'This RFID card is already registered';
        }

        // Guardian Name
        if (!formData.guardianName.trim()) {
            newErrors.guardianName = 'Guardian name is required';
        }

        // Guardian Phone
        if (!formData.guardianPhone.trim()) {
            newErrors.guardianPhone = 'Phone number is required';
        } else if (!validatePhoneNumber(formData.guardianPhone)) {
            newErrors.guardianPhone = 'Invalid Philippine mobile number';
        }

        // Email (optional)
        if (formData.email && !validateEmail(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        // Course
        if (!formData.course) {
            newErrors.course = 'Please select a course';
        }

        // Section
        if (!formData.section) {
            newErrors.section = 'Please select a section';
        }

        return newErrors;
    }, [formData, registeredStudents]);

    // Handle field change
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error when field changes
        if (errors[name as keyof ValidationErrors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    // Handle field blur
    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));

        // Validate field on blur
        const formErrors = validateForm();
        if (formErrors[name as keyof ValidationErrors]) {
            setErrors(prev => ({ ...prev, [name]: formErrors[name as keyof ValidationErrors] }));
        }
    };

    // Format phone number as user types
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/[^\d+]/g, '');

        // Auto-add +63 prefix if starting with 09
        if (value.startsWith('09') && value.length > 2) {
            value = '+63' + value.substring(1);
        }

        setFormData(prev => ({ ...prev, guardianPhone: value }));
    };

    // Handle step navigation
    const nextStep = () => {
        // Validate current step fields
        const formErrors = validateForm();
        const stepFields: (keyof ValidationErrors)[][] = [
            ['studentId', 'fullName', 'rfidCardId'],
            ['guardianName', 'guardianPhone', 'email'],
            ['course', 'section', 'yearLevel'],
        ];

        const currentStepFields = stepFields[step - 1];
        const hasErrors = currentStepFields.some(field => formErrors[field]);

        if (hasErrors) {
            // Mark fields as touched and show errors
            const newTouched: Record<string, boolean> = {};
            const newErrors: ValidationErrors = {};
            currentStepFields.forEach(field => {
                newTouched[field] = true;
                if (formErrors[field]) {
                    newErrors[field] = formErrors[field];
                }
            });
            setTouched(prev => ({ ...prev, ...newTouched }));
            setErrors(prev => ({ ...prev, ...newErrors }));
            return;
        }

        if (step < 3) {
            setStep(step + 1);
        } else {
            setShowConfirmation(true);
        }
    };

    const prevStep = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    // Handle form submission
    const handleSubmit = async () => {
        setIsSubmitting(true);

        try {
            const newStudent: Student = {
                id: `student-${Date.now()}`,
                studentId: formData.studentId,
                fullName: formData.fullName,
                rfidCardId: formData.rfidCardId,
                guardianName: formData.guardianName,
                guardianPhone: formData.guardianPhone,
                email: formData.email,
                course: formData.course,
                section: formData.section,
                yearLevel: formData.yearLevel,
                registeredAt: new Date(),
                registeredBy: 'admin', // Would come from auth context
                isActive: true,
            };

            await registerStudent(newStudent);

            setIsSubmitting(false);
            setShowConfirmation(false);

            if (onSuccess) {
                onSuccess(newStudent);
            }
        } catch (error) {
            setIsSubmitting(false);
            // Error handling is already done in registerStudent via addToast
        }
    };

    const getFieldClass = (fieldName: string) => {
        const hasError = touched[fieldName] && errors[fieldName as keyof ValidationErrors];
        const isValid = touched[fieldName] && !errors[fieldName as keyof ValidationErrors] && formData[fieldName as keyof RegistrationFormData];

        if (hasError) return `form-input form-input-error`;
        if (isValid) return `form-input form-input-success`;
        return 'form-input';
    };

    return (
        <div className={styles.container}>
            {/* Confirmation Modal */}
            {showConfirmation && (
                <div className={styles.confirmationOverlay}>
                    <div className={styles.confirmationModal}>
                        <div className={styles.confirmationIcon}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <polyline points="16 11 18 13 22 9" />
                            </svg>
                        </div>
                        <h3 className={styles.confirmationTitle}>Confirm Registration</h3>
                        <p className={styles.confirmationText}>
                            Please review the information before submitting.
                        </p>

                        <div className={styles.summaryCard}>
                            <div className={styles.summaryRow}>
                                <span className={styles.summaryLabel}>Student ID</span>
                                <span className={styles.summaryValue}>{formData.studentId}</span>
                            </div>
                            <div className={styles.summaryRow}>
                                <span className={styles.summaryLabel}>Full Name</span>
                                <span className={styles.summaryValue}>{formData.fullName}</span>
                            </div>
                            <div className={styles.summaryRow}>
                                <span className={styles.summaryLabel}>RFID Card</span>
                                <span className={styles.summaryValue}>{formData.rfidCardId}</span>
                            </div>
                            <div className={styles.summaryRow}>
                                <span className={styles.summaryLabel}>Guardian</span>
                                <span className={styles.summaryValue}>{formData.guardianName}</span>
                            </div>
                            <div className={styles.summaryRow}>
                                <span className={styles.summaryLabel}>Contact</span>
                                <span className={styles.summaryValue}>{formData.guardianPhone}</span>
                            </div>
                            <div className={styles.summaryRow}>
                                <span className={styles.summaryLabel}>Course/Section</span>
                                <span className={styles.summaryValue}>
                                    {formData.course} - {formData.section} (Year {formData.yearLevel})
                                </span>
                            </div>
                        </div>

                        <div className={styles.confirmationActions}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowConfirmation(false)}
                                disabled={isSubmitting}
                            >
                                Go Back
                            </button>
                            <button
                                className="btn btn-success"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className={styles.spinner} />
                                        Registering...
                                    </>
                                ) : (
                                    'Confirm & Register'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className={styles.header}>
                <h2 className={styles.title}>Student Registration</h2>
                <p className={styles.subtitle}>
                    Register a new student and assign their RFID card
                </p>
            </div>

            {/* Progress Steps */}
            <div className={styles.progress}>
                <div className={`${styles.progressStep} ${step >= 1 ? styles.active : ''} ${step > 1 ? styles.completed : ''}`}>
                    <div className={styles.stepNumber}>
                        {step > 1 ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        ) : '1'}
                    </div>
                    <span className={styles.stepLabel}>Student Info</span>
                </div>
                <div className={styles.progressLine} />
                <div className={`${styles.progressStep} ${step >= 2 ? styles.active : ''} ${step > 2 ? styles.completed : ''}`}>
                    <div className={styles.stepNumber}>
                        {step > 2 ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        ) : '2'}
                    </div>
                    <span className={styles.stepLabel}>Guardian Info</span>
                </div>
                <div className={styles.progressLine} />
                <div className={`${styles.progressStep} ${step >= 3 ? styles.active : ''}`}>
                    <div className={styles.stepNumber}>3</div>
                    <span className={styles.stepLabel}>Academic Info</span>
                </div>
            </div>

            {/* Form Steps */}
            <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
                {/* Step 1: Student Information */}
                {step === 1 && (
                    <div className={styles.stepContent}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="studentId">
                                Student ID <span className={styles.required}>*</span>
                            </label>
                            <input
                                type="text"
                                id="studentId"
                                name="studentId"
                                className={getFieldClass('studentId')}
                                placeholder="YYYY-NNNN (e.g., 2024-0001)"
                                value={formData.studentId}
                                onChange={handleChange}
                                onBlur={handleBlur}
                            />
                            {touched.studentId && errors.studentId && (
                                <p className="form-error">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                    {errors.studentId}
                                </p>
                            )}
                            <p className="form-hint">Format: YYYY-NNNN</p>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="fullName">
                                Full Name <span className={styles.required}>*</span>
                            </label>
                            <input
                                type="text"
                                id="fullName"
                                name="fullName"
                                className={getFieldClass('fullName')}
                                placeholder="Enter full name"
                                value={formData.fullName}
                                onChange={handleChange}
                                onBlur={handleBlur}
                            />
                            {touched.fullName && errors.fullName && (
                                <p className="form-error">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                    {errors.fullName}
                                </p>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="rfidCardId">
                                RFID Card ID <span className={styles.required}>*</span>
                            </label>
                            <div className={styles.rfidInput}>
                                <input
                                    type="text"
                                    id="rfidCardId"
                                    name="rfidCardId"
                                    className={getFieldClass('rfidCardId')}
                                    placeholder="Scan or enter RFID Card ID"
                                    value={formData.rfidCardId}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    readOnly={!!prefilledRfid}
                                />
                                {prefilledRfid && (
                                    <span className={styles.rfidBadge}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="2" y="5" width="20" height="14" rx="2" />
                                            <circle cx="17" cy="12" r="3" />
                                        </svg>
                                        Scanned
                                    </span>
                                )}
                            </div>
                            {touched.rfidCardId && errors.rfidCardId && (
                                <p className="form-error">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                    {errors.rfidCardId}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 2: Guardian Information */}
                {step === 2 && (
                    <div className={styles.stepContent}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="guardianName">
                                Parent/Guardian Name <span className={styles.required}>*</span>
                            </label>
                            <input
                                type="text"
                                id="guardianName"
                                name="guardianName"
                                className={getFieldClass('guardianName')}
                                placeholder="Enter parent/guardian full name"
                                value={formData.guardianName}
                                onChange={handleChange}
                                onBlur={handleBlur}
                            />
                            {touched.guardianName && errors.guardianName && (
                                <p className="form-error">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                    {errors.guardianName}
                                </p>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="guardianPhone">
                                Mobile Number <span className={styles.required}>*</span>
                            </label>
                            <input
                                type="tel"
                                id="guardianPhone"
                                name="guardianPhone"
                                className={getFieldClass('guardianPhone')}
                                placeholder="+639XXXXXXXXX"
                                value={formData.guardianPhone}
                                onChange={handlePhoneChange}
                                onBlur={handleBlur}
                            />
                            {touched.guardianPhone && errors.guardianPhone && (
                                <p className="form-error">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                    {errors.guardianPhone}
                                </p>
                            )}
                            <p className="form-hint">SMS notifications will be sent to this number</p>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="email">
                                Email Address (Optional)
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                className={getFieldClass('email')}
                                placeholder="guardian@email.com"
                                value={formData.email}
                                onChange={handleChange}
                                onBlur={handleBlur}
                            />
                            {touched.email && errors.email && (
                                <p className="form-error">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                    {errors.email}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 3: Academic Information */}
                {step === 3 && (
                    <div className={styles.stepContent}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="course">
                                Course/Program <span className={styles.required}>*</span>
                            </label>
                            <select
                                id="course"
                                name="course"
                                className={getFieldClass('course')}
                                value={formData.course}
                                onChange={handleChange}
                                onBlur={handleBlur}
                            >
                                <option value="">Select a course</option>
                                {COURSES.map(course => (
                                    <option key={course} value={course}>{course}</option>
                                ))}
                            </select>
                            {touched.course && errors.course && (
                                <p className="form-error">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                    {errors.course}
                                </p>
                            )}
                        </div>

                        <div className={styles.splitGroup}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="section">
                                    Section <span className={styles.required}>*</span>
                                </label>
                                <select
                                    id="section"
                                    name="section"
                                    className={getFieldClass('section')}
                                    value={formData.section}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                >
                                    <option value="">Select</option>
                                    {SECTIONS.map(section => (
                                        <option key={section} value={section}>{section}</option>
                                    ))}
                                </select>
                                {touched.section && errors.section && (
                                    <p className="form-error">{errors.section}</p>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="yearLevel">
                                    Year Level <span className={styles.required}>*</span>
                                </label>
                                <select
                                    id="yearLevel"
                                    name="yearLevel"
                                    className="form-input"
                                    value={formData.yearLevel}
                                    onChange={handleChange}
                                >
                                    {[1, 2, 3, 4].map(year => (
                                        <option key={year} value={year}>Year {year}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Form Actions */}
                <div className={styles.actions}>
                    {onCancel && step === 1 && (
                        <button type="button" className="btn btn-ghost" onClick={onCancel}>
                            Cancel
                        </button>
                    )}
                    {step > 1 && (
                        <button type="button" className="btn btn-secondary" onClick={prevStep}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                            Back
                        </button>
                    )}
                    <button type="button" className="btn btn-primary btn-lg" onClick={nextStep}>
                        {step === 3 ? 'Review & Submit' : 'Continue'}
                        {step !== 3 && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
