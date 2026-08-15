import React, { useState } from 'react';
import { Student, AcademicYear, Section, StudentStatus, normalizeDOB, validateDOB, normalizeSection } from '../../types/student';
import { X, Save, Info } from 'lucide-react';

interface StudentFormModalProps {
  isOpen: boolean;
  studentToEdit?: Student | null;
  onClose: () => void;
  onSave: (data: Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'department' | 'mustChangePassword'>) => Promise<boolean>;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  studentToEdit,
  onClose,
  onSave,
}) => {
  const isEditing = Boolean(studentToEdit);

  const getDefault = () => ({
    name: studentToEdit?.name || '',
    registerNumber: studentToEdit?.registerNumber || '',
    year: studentToEdit?.year || ('III' as AcademicYear),
    section: (studentToEdit?.section ? normalizeSection(studentToEdit.section) : '1') as Section,
    role: studentToEdit?.role || 'Student',
    dateOfBirth: studentToEdit?.dateOfBirth || '',
    email: studentToEdit?.email || '',
    phone: studentToEdit?.phone || '',
    status: studentToEdit?.status || ('Active' as StudentStatus),
  });

  const [form, setForm] = useState(getDefault);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setForm(getDefault());
      setErrorMsg(null);
    }
  }, [isOpen, studentToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!form.name.trim()) { setErrorMsg('Name is required.'); return; }
    if (!form.registerNumber.trim()) { setErrorMsg('Register Number is required.'); return; }
    if (!form.dateOfBirth.trim()) { setErrorMsg('Date of Birth is required.'); return; }
    if (!validateDOB(form.dateOfBirth)) { setErrorMsg('Invalid Date of Birth. Use DD-MM-YYYY format (e.g. 12-05-2005).'); return; }

    setIsSubmitting(true);
    const success = await onSave({
      ...form,
      role: form.role?.trim() || 'Student',
      registerNumber: form.registerNumber.toUpperCase().trim(),
      dateOfBirth: normalizeDOB(form.dateOfBirth),
    });
    setIsSubmitting(false);
    if (success) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-taras-950/70 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden z-10 border border-taras-200">
        <div className="px-6 py-4 bg-taras-900 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base">{isEditing ? 'Edit Student Details' : 'Add New ECE Student'}</h3>
            <p className="text-[11px] text-taras-300 mt-0.5">Department: Electronics &amp; Communication Engineering (ECE)</p>
          </div>
          <button onClick={onClose} className="p-1 rounded text-taras-300 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg font-medium">{errorMsg}</div>
          )}

          {/* DOB Password Info Banner */}
          {!isEditing && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px]">
                The student's initial login password will be automatically set to their <strong>Date of Birth in DDMMYYYY format</strong>.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div className="sm:col-span-2">
              <label className="block font-semibold text-taras-700 mb-1">Student Full Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Arun Kumar"
                className="w-full px-3 py-2 border border-taras-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-taras-800"
              />
            </div>

            {/* Register Number */}
            <div>
              <label className="block font-semibold text-taras-700 mb-1">Register Number *</label>
              <input
                type="text"
                required
                disabled={isEditing}
                value={form.registerNumber}
                onChange={e => setForm({ ...form, registerNumber: e.target.value.toUpperCase() })}
                placeholder="e.g. 24ECE001"
                className="w-full px-3 py-2 border border-taras-200 rounded-lg text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-taras-800 disabled:bg-taras-100 disabled:text-taras-500"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block font-semibold text-taras-700 mb-1">Role / Designation *</label>
              <input
                type="text"
                required
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
                placeholder="e.g. Student, Coordinator, Lead"
                className="w-full px-3 py-2 border border-taras-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-taras-800 font-semibold"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block font-semibold text-taras-700 mb-1">Date of Birth * <span className="text-taras-400 font-normal">(DD-MM-YYYY)</span></label>
              <input
                type="text"
                required
                value={form.dateOfBirth}
                onChange={e => setForm({ ...form, dateOfBirth: e.target.value })}
                placeholder="e.g. 12-05-2005"
                className="w-full px-3 py-2 border border-taras-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-taras-800"
              />
            </div>

            {/* Year */}
            <div>
              <label className="block font-semibold text-taras-700 mb-1">Academic Year</label>
              <select
                value={form.year}
                onChange={e => setForm({ ...form, year: e.target.value as AcademicYear })}
                className="w-full px-3 py-2 border border-taras-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-taras-800"
              >
                <option value="I">I Year</option>
                <option value="II">II Year</option>
                <option value="III">III Year</option>
                <option value="IV">IV Year</option>
              </select>
            </div>

            {/* Section (strictly 1, 2, 3) */}
            <div>
              <label className="block font-semibold text-taras-700 mb-1">Section</label>
              <select
                value={form.section}
                onChange={e => setForm({ ...form, section: e.target.value as Section })}
                className="w-full px-3 py-2 border border-taras-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-taras-800 font-bold text-taras-900"
              >
                <option value="1">Section 1</option>
                <option value="2">Section 2</option>
                <option value="3">Section 3</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block font-semibold text-taras-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value as StudentStatus })}
                className="w-full px-3 py-2 border border-taras-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-taras-800"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Graduated">Graduated</option>
                <option value="Transferred">Transferred</option>
              </select>
            </div>

            {/* Department (Read-only) */}
            <div className="sm:col-span-2">
              <label className="block font-semibold text-taras-700 mb-1">Department</label>
              <div className="w-full px-3 py-2 border border-taras-200 rounded-lg bg-taras-50 text-taras-600 text-sm font-semibold">
                ECE — Electronics &amp; Communication Engineering
              </div>
            </div>

            {/* Optional email & phone */}
            <div>
              <label className="block font-semibold text-taras-700 mb-1">Email <span className="font-normal text-taras-400">(optional)</span></label>
              <input
                type="email"
                value={form.email || ''}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="student@taras.edu"
                className="w-full px-3 py-2 border border-taras-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-taras-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-taras-700 mb-1">Phone <span className="font-normal text-taras-400">(optional)</span></label>
              <input
                type="tel"
                value={form.phone || ''}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 border border-taras-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-taras-800"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-taras-200">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-taras-100 hover:bg-taras-200 text-taras-800 font-semibold transition-colors text-xs">Cancel</button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-taras-900 hover:bg-taras-800 text-white font-semibold text-xs transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save Student'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
