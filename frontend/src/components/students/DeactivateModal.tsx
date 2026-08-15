import React, { useState } from 'react';
import { Student } from '../../types/student';
import { AlertTriangle, X } from 'lucide-react';

interface DeactivateModalProps {
  isOpen: boolean;
  student: Student | null;
  onClose: () => void;
  onConfirmDeactivate: (id: string) => Promise<boolean>;
}

export const DeactivateModal: React.FC<DeactivateModalProps> = ({
  isOpen,
  student,
  onClose,
  onConfirmDeactivate,
}) => {
  const [isDeactivating, setIsDeactivating] = useState(false);

  if (!isOpen || !student) return null;

  const handleDeactivate = async () => {
    setIsDeactivating(true);
    const success = await onConfirmDeactivate(student.id);
    setIsDeactivating(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-taras-950/70 backdrop-blur-xs" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden z-10 border border-taras-200">
        <div className="p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-base font-bold text-taras-900">Deactivate Student Record?</h3>
            <p className="text-xs text-taras-600 mt-1">
              Are you sure you want to deactivate <strong className="text-taras-900">{student.name}</strong> ({student.registerNumber})?
            </p>
            <p className="text-[11px] text-taras-400 mt-2 bg-taras-50 p-2 rounded border border-taras-200">
              Note: This will perform a soft deactivation by setting the student's status to <strong>Inactive</strong>. The record will be preserved in the system logs.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isDeactivating}
              className="px-5 py-2 rounded-lg bg-taras-100 hover:bg-taras-200 text-taras-800 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeactivate}
              disabled={isDeactivating}
              className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
            >
              {isDeactivating ? 'Deactivating...' : 'Deactivate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
