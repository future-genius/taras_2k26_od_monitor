import React, { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { useStudents } from '../context/StudentContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  ShieldCheck,
  Lock,
  Download,
  Calendar,
  Clock,
  Building2,
  FileSpreadsheet,
  Save,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  UserCheck,
  Sparkles,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { privacySettings, updatePrivacySettings, allStudents, managedEvents, dailySummaries, clearAllStudentsAndODData } = useStudents();
  const { isPresident, user } = useAuth();
  const { showToast } = useToast();
  const [isClearing, setIsClearing] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Local editable settings
  const [symposiumConfig, setSymposiumConfig] = useState({
    symposiumName: 'TARAS 2K26',
    symposiumDate: '2026-09-26',
    department: 'Electronics and Communication Engineering (ECE)',
    workingHours: '08:30 AM – 04:30 PM',
    targetAuthority: 'Respective Class Advisors & EOT Staff',
    includeContactInReports: false,
  });

  const [isSavedBanner, setIsSavedBanner] = useState(false);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavedBanner(true);
    showToast('Symposium and OD configuration saved successfully.', 'success');
    setTimeout(() => setIsSavedBanner(false), 4000);
  };

  // Full Database Backup JSON download
  const handleExportBackup = () => {
    const backupData = {
      backupTimestamp: new Date().toISOString(),
      symposium: 'TARAS 2K26',
      totalStudents: allStudents.length,
      totalEvents: managedEvents.length,
      totalODSummaries: dailySummaries.length,
      students: allStudents,
      events: managedEvents,
      dailyOD: dailySummaries,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TARAS_2K26_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Complete TARAS database backup downloaded.', 'success');
  };

  if (!isPresident) {
    return (
      <Layout title="System Settings" subtitle="Administrative configuration">
        <div className="bg-white p-8 rounded-xl border border-taras-200 text-center max-w-md mx-auto space-y-3">
          <Lock className="w-10 h-10 text-taras-500 mx-auto" />
          <h3 className="text-base font-bold text-taras-900">President Access Required</h3>
          <p className="text-xs text-taras-500">
            System configuration and privacy settings can only be accessed by the TARAS President.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="System & Administrative Settings"
      subtitle="Configure symposium parameters, OD attendance policies, staff privacy permissions & backups"
    >
      <div className="max-w-4xl space-y-6">
        {/* Success Banner */}
        {isSavedBanner && (
          <div className="flex items-center gap-2.5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Settings and operational defaults updated successfully.</span>
          </div>
        )}

        {/* 1. TARAS 2K26 Symposium & Daily OD Parameters */}
        <div className="bg-white p-6 rounded-2xl border border-taras-200 shadow-sm space-y-5">
          <div className="flex items-center gap-3 border-b border-taras-100 pb-4">
            <div className="p-2.5 rounded-xl bg-taras-900 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-taras-900">TARAS 2K26 Symposium &amp; OD Parameters</h3>
              <p className="text-xs text-taras-500">
                Official headers printed on generated daily OD spreadsheets for Class Advisors
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveGeneral} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-taras-800 mb-1">Symposium Title</label>
                <input
                  type="text"
                  value={symposiumConfig.symposiumName}
                  onChange={e => setSymposiumConfig({ ...symposiumConfig, symposiumName: e.target.value })}
                  className="w-full px-3.5 py-2 border border-taras-200 rounded-lg font-semibold text-sm bg-taras-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-taras-800"
                />
              </div>

              <div>
                <label className="block font-bold text-taras-800 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-taras-500" />
                  <span>Symposium Date</span>
                </label>
                <input
                  type="date"
                  value={symposiumConfig.symposiumDate}
                  onChange={e => setSymposiumConfig({ ...symposiumConfig, symposiumDate: e.target.value })}
                  className="w-full px-3.5 py-2 border border-taras-200 rounded-lg font-semibold text-sm bg-taras-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-taras-800"
                />
              </div>

              <div>
                <label className="block font-bold text-taras-800 mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-taras-500" />
                  <span>Department Lock</span>
                </label>
                <input
                  type="text"
                  readOnly
                  value={symposiumConfig.department}
                  className="w-full px-3.5 py-2 border border-taras-200 rounded-lg font-semibold text-sm bg-taras-100 text-taras-600 cursor-not-allowed"
                />
                <span className="text-[10px] text-taras-400 mt-0.5 block">Locked to ECE (Sections 1, 2, 3)</span>
              </div>

              <div>
                <label className="block font-bold text-taras-800 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-taras-500" />
                  <span>Default OD Duty Hours</span>
                </label>
                <input
                  type="text"
                  value={symposiumConfig.workingHours}
                  onChange={e => setSymposiumConfig({ ...symposiumConfig, workingHours: e.target.value })}
                  placeholder="e.g. 08:30 AM – 04:30 PM"
                  className="w-full px-3.5 py-2 border border-taras-200 rounded-lg font-semibold text-sm bg-taras-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-taras-800"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-taras-800 mb-1">
                  Submission Recipient Note (In Excel Footer)
                </label>
                <input
                  type="text"
                  value={symposiumConfig.targetAuthority}
                  onChange={e => setSymposiumConfig({ ...symposiumConfig, targetAuthority: e.target.value })}
                  placeholder="e.g. Respective Class Advisors & EOT Staff"
                  className="w-full px-3.5 py-2 border border-taras-200 rounded-lg text-sm bg-taras-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-taras-800"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-taras-900 hover:bg-taras-800 text-white font-bold text-xs shadow-md transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Parameters</span>
              </button>
            </div>
          </form>
        </div>

        {/* 2. Student Privacy & Staff Access Controls */}
        <div className="bg-white p-6 rounded-2xl border border-taras-200 shadow-sm space-y-5">
          <div className="flex items-center gap-3 border-b border-taras-100 pb-4">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-taras-900">Student Privacy &amp; Staff Access Controls</h3>
              <p className="text-xs text-taras-500">
                Configure student contact confidentiality rules for read-only staff accounts
              </p>
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Phone Masking */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-taras-50 border border-taras-200">
              <div className="pr-4">
                <span className="font-bold text-taras-900 block text-sm">Allow Staff to View Phone Numbers</span>
                <span className="text-taras-500 text-[11px] mt-0.5 block">
                  When disabled, student phone numbers are masked as (••••••••) for staff reference logins.
                </span>
              </div>
              <input
                type="checkbox"
                checked={privacySettings.allowStaffViewPhone}
                onChange={(e) => updatePrivacySettings({ allowStaffViewPhone: e.target.checked })}
                className="w-5 h-5 accent-taras-900 rounded cursor-pointer shrink-0"
              />
            </div>

            {/* Email Masking */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-taras-50 border border-taras-200">
              <div className="pr-4">
                <span className="font-bold text-taras-900 block text-sm">Allow Staff to View Email Addresses</span>
                <span className="text-taras-500 text-[11px] mt-0.5 block">
                  When disabled, student personal email addresses are masked for staff reference logins.
                </span>
              </div>
              <input
                type="checkbox"
                checked={privacySettings.allowStaffViewEmail}
                onChange={(e) => updatePrivacySettings({ allowStaffViewEmail: e.target.checked })}
                className="w-5 h-5 accent-taras-900 rounded cursor-pointer shrink-0"
              />
            </div>

            {/* Staff Export */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-taras-50 border border-taras-200">
              <div className="pr-4">
                <span className="font-bold text-taras-900 block text-sm">Allow Staff to Export Student Directory</span>
                <span className="text-taras-500 text-[11px] mt-0.5 block">
                  Permits staff reference logins to download student directory rosters.
                </span>
              </div>
              <input
                type="checkbox"
                checked={privacySettings.allowStudentExport}
                onChange={(e) => updatePrivacySettings({ allowStudentExport: e.target.checked })}
                className="w-5 h-5 accent-taras-900 rounded cursor-pointer shrink-0"
              />
            </div>
          </div>
        </div>

        {/* 3. Database Backup & System Snapshot */}
        <div className="bg-white p-6 rounded-2xl border border-taras-200 shadow-sm space-y-5">
          <div className="flex items-center gap-3 border-b border-taras-100 pb-4">
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-700">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-taras-900">Database Backup &amp; Export</h3>
              <p className="text-xs text-taras-500">
                Download an offline snapshot containing all enrolled students, events, and daily OD records
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-sky-50/50 border border-sky-200 text-xs">
            <div>
              <p className="font-bold text-sky-950 text-sm">Full System Backup (.json)</p>
              <p className="text-sky-800 text-[11px] mt-0.5">
                Includes {allStudents.length} Students • {managedEvents.length} Events • {dailySummaries.length} Daily OD Sessions
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportBackup}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-bold shadow-sm transition-colors shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Download Full Backup</span>
            </button>
          </div>
        </div>

        {/* 4. Danger Zone: Wipe Student & OD Records */}
        <div className="bg-white p-6 rounded-2xl border border-rose-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-rose-100 pb-4">
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-950">Reset / Purge Student &amp; Attendance Records</h3>
              <p className="text-xs text-rose-700">
                Permanently delete all enrolled student profiles, authentication credentials, and daily OD records.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-rose-50/50 border border-rose-200 text-xs">
            <div>
              <p className="font-bold text-rose-950 text-sm">Clear Student Roster &amp; Daily OD Data</p>
              <p className="text-rose-700 text-[11px] mt-0.5">
                Current data: {allStudents.length} Students • {dailySummaries.length} Daily OD Sessions
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowConfirmClear(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm transition-colors shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Clear Student &amp; OD Data</span>
            </button>
          </div>

          {showConfirmClear && (
            <div className="p-4 bg-rose-100 border border-rose-300 rounded-xl space-y-3 animate-fade-in text-xs text-rose-950">
              <p className="font-bold">⚠️ Are you absolutely sure?</p>
              <p>
                This will delete all student records and daily OD attendance logs from both the cloud database and local device storage.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={isClearing}
                  onClick={async () => {
                    setIsClearing(true);
                    await clearAllStudentsAndODData();
                    setIsClearing(false);
                    setShowConfirmClear(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold transition-colors disabled:opacity-50"
                >
                  {isClearing ? 'Deleting...' : 'Yes, Delete All Student & OD Data'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmClear(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-rose-300 text-rose-900 font-semibold hover:bg-rose-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 5. President Account Status */}
        <div className="bg-white p-6 rounded-2xl border border-taras-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-taras-900">President Account Authentication</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
            <div className="p-3.5 bg-taras-50 rounded-xl border border-taras-200">
              <span className="text-taras-500 block">Authenticated User</span>
              <span className="font-bold text-taras-900 mt-0.5 block text-sm">{isPresident ? 'President' : (user?.name || 'President')}</span>
              <span className="text-[11px] text-taras-500 font-mono">president@taras.edu</span>
            </div>
            <div className="p-3.5 bg-taras-50 rounded-xl border border-taras-200">
              <span className="text-taras-500 block">Authority Role</span>
              <span className="font-bold text-emerald-700 mt-0.5 block text-sm">TARAS / SYMPo President</span>
              <span className="text-[11px] text-taras-500">Full Master Authority</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
