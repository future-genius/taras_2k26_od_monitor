import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { useStudents } from '../context/StudentContext';
import { apiService } from '../services/api';
import { ArrowLeft } from 'lucide-react';
import { StudentProfileDrawer } from '../components/students/StudentProfileDrawer';

export const StudentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { deactivateStudent } = useStudents();

  // Look up student directly from apiService (handles all students, not just current page)
  const student = id ? apiService.getStudentById(id) : undefined;

  if (!student) {
    return (
      <Layout title="Student Profile" subtitle="ECE Student — TARAS">
        <div className="bg-white p-8 rounded-xl border border-taras-200 text-center space-y-4">
          <h3 className="text-lg font-bold text-taras-900">Student Record Not Found</h3>
          <p className="text-xs text-taras-500">The requested student ID or Register Number does not exist.</p>
          <Link
            to="/students"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-taras-900 text-white text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Student Directory
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Profile: ${student.name}`} subtitle={`Register No: ${student.registerNumber} — ECE`}>
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/students')}
          className="flex items-center gap-1.5 text-xs text-taras-600 hover:text-taras-900 font-semibold mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Student Directory
        </button>

        {/* Render profile drawer inline as full profile view */}
        <StudentProfileDrawer
          student={student}
          onClose={() => navigate('/students')}
          onEditStudent={(s) => navigate(`/students/${s.id}`)}
          onDeactivateStudent={async (s) => {
            await deactivateStudent(s.id);
            navigate('/students');
          }}
        />
      </div>
    </Layout>
  );
};
