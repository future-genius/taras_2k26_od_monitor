import React, { useState } from 'react';
import { useStudents } from '../../context/StudentContext';
import { useAuth } from '../../context/AuthContext';
import { TarasEventItem } from '../../types/od';
import {
  Plus,
  Edit3,
  Trash2,
  Calendar,
  MapPin,
  Tag,
  Briefcase,
  Layers,
  X,
  Save,
  AlertTriangle,
} from 'lucide-react';

const CATEGORIES = [
  'Preparation',
  'Media & Video',
  'Promotion & Poster',
  'Technical & Lab Setup',
  'Stage & Auditorium',
  'Logistics & Registration',
  'Department Coordination',
  'Documentation',
  'Symposium Day Event',
  'Other',
];

export const EventManagementSection: React.FC = () => {
  const { isPresident } = useAuth();
  const { managedEvents, addManagedEvent, updateManagedEvent, deleteManagedEvent } = useStudents();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TarasEventItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    name: '',
    category: 'Preparation',
    date: '',
    venue: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingEvent(null);
    setForm({
      name: '',
      category: 'Preparation',
      date: '',
      venue: '',
      description: '',
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (event: TarasEventItem) => {
    setEditingEvent(event);
    setForm({
      name: event.name || '',
      category: event.category || 'Preparation',
      date: event.date || '',
      venue: event.venue || '',
      description: event.description || '',
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrorMsg('Event or work name is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    let success = false;
    if (editingEvent) {
      success = await updateManagedEvent(editingEvent.id, form);
    } else {
      success = await addManagedEvent(form);
    }

    setIsSubmitting(false);
    if (success) {
      setIsModalOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this event/work item?')) return;
    await deleteManagedEvent(id);
    setDeletingId(null);
  };

  return (
    <div className="bg-white rounded-xl border border-taras-200 shadow-sm overflow-hidden space-y-0">
      {/* Header */}
      <div className="p-5 border-b border-taras-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-taras-50/50 to-white">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-taras-900 text-base">Event &amp; Work Management</h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-taras-900 text-white">
              {managedEvents.length} Events
            </span>
          </div>
          <p className="text-xs text-taras-500 mt-0.5">
            TARAS Symposium events and preparation work categories (President authority)
          </p>
        </div>

        {isPresident && (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-taras-900 hover:bg-taras-800 text-white text-xs font-bold shadow-sm transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Event / Work</span>
          </button>
        )}
      </div>

      {/* Events List */}
      <div className="p-5">
        {managedEvents.length === 0 ? (
          <div className="p-8 text-center text-taras-400 text-xs space-y-2 border-2 border-dashed border-taras-200 rounded-xl bg-taras-50/50">
            <Briefcase className="w-8 h-8 text-taras-300 mx-auto" />
            <p className="font-bold text-taras-800 text-sm">No Events or Work Categories Added Yet</p>
            <p className="text-taras-500 max-w-md mx-auto">
              {isPresident
                ? 'Create TARAS preparation tasks or symposium events (e.g. Video Recording, Promotion, Technical Setup) using the "+ Add Event / Work" button above.'
                : 'No TARAS events have been configured by the President yet.'}
            </p>
            {isPresident && (
              <button
                type="button"
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-taras-900 text-white text-xs font-bold mt-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Event / Work</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {managedEvents.map(event => (
              <div
                key={event.id}
                className="bg-taras-50/50 hover:bg-white rounded-xl border border-taras-200 p-4 flex flex-col justify-between space-y-3 transition-all hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-taras-100 text-taras-700 border border-taras-200 mb-1">
                        {event.category || 'Preparation'}
                      </span>
                      <h4 className="font-bold text-taras-900 text-base leading-tight">
                        {event.name}
                      </h4>
                    </div>

                    {isPresident && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(event)}
                          className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors"
                          title="Edit Event"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(event.id)}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
                          title="Delete Event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {event.description && (
                    <p className="text-xs text-taras-600 mt-2 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-taras-200 flex items-center justify-between text-[11px] text-taras-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-taras-400" />
                    {event.date || 'Multiple Days'}
                  </span>
                  {event.venue && (
                    <span className="flex items-center gap-1 truncate max-w-[120px]">
                      <MapPin className="w-3.5 h-3.5 text-taras-400" />
                      {event.venue}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal (President Only) ── */}
      {isModalOpen && isPresident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-taras-950/70 backdrop-blur-xs"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-taras-200 overflow-hidden z-10">
            {/* Header */}
            <div className="px-6 py-4 bg-taras-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  {editingEvent ? 'Edit Event / Work' : 'Add New Event / Work'}
                </h3>
                <p className="text-[11px] text-taras-300 mt-0.5">
                  TARAS Symposium 2K26 — Electronics &amp; Communication Engineering
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-taras-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Event Name */}
              <div>
                <label className="block font-bold text-taras-800 mb-1">
                  Event / Work Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Video Recording, Stage Setup, Promotion, Code Challenge"
                  className="w-full px-3.5 py-2.5 border border-taras-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-taras-800"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block font-bold text-taras-800 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3.5 py-2 border border-taras-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-taras-800"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scheduled Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-taras-800 mb-1">Date (Optional)</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 border border-taras-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-taras-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-taras-800 mb-1">Venue / Location (Optional)</label>
                  <input
                    type="text"
                    value={form.venue}
                    onChange={e => setForm({ ...form, venue: e.target.value })}
                    placeholder="e.g. Auditorium / ECE Lab"
                    className="w-full px-3 py-2 border border-taras-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-taras-800"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-taras-800 mb-1">Description / Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Details about responsibilities, student requirements, etc."
                  className="w-full px-3 py-2 border border-taras-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-taras-800 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-taras-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-taras-100 hover:bg-taras-200 text-taras-800 font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-taras-900 hover:bg-taras-800 text-white font-bold text-xs shadow-sm transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving...' : editingEvent ? 'Save Changes' : 'Create Event'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
