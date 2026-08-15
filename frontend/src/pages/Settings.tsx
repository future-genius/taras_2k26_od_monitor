import React from 'react';
import { Layout } from '../components/layout/Layout';
import { useStudents } from '../context/StudentContext';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, Eye, Save } from 'lucide-react';

export const Settings: React.FC = () => {
  const { privacySettings, updatePrivacySettings } = useStudents();
  const { isPresident } = useAuth();

  if (!isPresident) {
    return (
      <Layout title="System Settings" subtitle="Administrative configuration">
        <div className="bg-white p-8 rounded-xl border border-taras-200 text-center max-w-md mx-auto space-y-3">
          <Lock className="w-10 h-10 text-taras-500 mx-auto" />
          <h3 className="text-base font-bold text-taras-900">President Access Required</h3>
          <p className="text-xs text-taras-500">
            System privacy configurations and role permissions can only be managed by the TARAS President.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="System & Privacy Settings" subtitle="Manage student data access policies and staff permissions">
      <div className="max-w-3xl space-y-6">
        {/* Student Privacy Protection Card */}
        <div className="bg-white p-6 rounded-xl border border-taras-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-taras-100 pb-4">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-taras-900">Student Contact Privacy Controls</h3>
              <p className="text-xs text-taras-500">
                Configure which restricted student contact details are visible to read-only Staff members.
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* Toggle Phone View */}
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-taras-50 border border-taras-200">
              <div>
                <span className="font-bold text-taras-900 block text-sm">Allow Staff to View Phone Numbers</span>
                <span className="text-taras-500 text-[11px]">
                  When disabled, phone numbers are masked as (••••••••) for all staff logins.
                </span>
              </div>
              <input
                type="checkbox"
                checked={privacySettings.allowStaffViewPhone}
                onChange={(e) => updatePrivacySettings({ allowStaffViewPhone: e.target.checked })}
                className="w-5 h-5 accent-taras-900 rounded cursor-pointer"
              />
            </div>

            {/* Toggle Email View */}
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-taras-50 border border-taras-200">
              <div>
                <span className="font-bold text-taras-900 block text-sm">Allow Staff to View Email Addresses</span>
                <span className="text-taras-500 text-[11px]">
                  When disabled, personal email addresses are masked for staff logins.
                </span>
              </div>
              <input
                type="checkbox"
                checked={privacySettings.allowStaffViewEmail}
                onChange={(e) => updatePrivacySettings({ allowStaffViewEmail: e.target.checked })}
                className="w-5 h-5 accent-taras-900 rounded cursor-pointer"
              />
            </div>

            {/* Toggle Staff Export */}
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-taras-50 border border-taras-200">
              <div>
                <span className="font-bold text-taras-900 block text-sm">Allow Staff to Export Student Directory</span>
                <span className="text-taras-500 text-[11px]">
                  Permits staff accounts to download CSV reports.
                </span>
              </div>
              <input
                type="checkbox"
                checked={privacySettings.allowStudentExport}
                onChange={(e) => updatePrivacySettings({ allowStudentExport: e.target.checked })}
                className="w-5 h-5 accent-taras-900 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* System Information Card */}
        <div className="bg-white p-6 rounded-xl border border-taras-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-taras-900">Institutional System Status</h3>
          <div className="grid grid-cols-2 gap-4 text-xs font-medium">
            <div className="p-3 bg-taras-50 rounded-lg border border-taras-200">
              <span className="text-taras-500 block">System Version</span>
              <span className="font-bold text-taras-900 mt-0.5 block">TARAS Monitoring v1.0.0</span>
            </div>
            <div className="p-3 bg-taras-50 rounded-lg border border-taras-200">
              <span className="text-taras-500 block">Security Protocol</span>
              <span className="font-bold text-emerald-700 mt-0.5 block">Database RLS Active</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
