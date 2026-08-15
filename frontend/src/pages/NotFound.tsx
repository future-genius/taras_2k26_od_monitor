import React from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { FileQuestion, Home } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <Layout title="Page Not Found" subtitle="Requested resource does not exist">
      <div className="bg-white p-12 rounded-xl border border-taras-200 text-center max-w-md mx-auto space-y-4">
        <FileQuestion className="w-12 h-12 text-taras-400 mx-auto" />
        <h2 className="text-xl font-bold text-taras-900">404 - Page Not Found</h2>
        <p className="text-xs text-taras-500">
          The route you navigated to does not exist or has been moved.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-taras-900 text-white text-xs font-semibold hover:bg-taras-800 transition-colors"
        >
          <Home className="w-4 h-4" /> Return to Dashboard
        </Link>
      </div>
    </Layout>
  );
};
