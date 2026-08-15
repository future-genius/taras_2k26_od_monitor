export type EventCategory =
  | 'Technical'
  | 'Workshop'
  | 'Competition'
  | 'Paper Presentation'
  | 'Project'
  | 'Quiz'
  | 'Coding'
  | 'Other';

export type EventStatus =
  | 'Upcoming'
  | 'Registration Open'
  | 'Registration Closed'
  | 'Ongoing'
  | 'Completed'
  | 'Cancelled';

export type ParticipationStatus = 'Registered' | 'Present' | 'Absent';

export type EventResult = 'Winner' | 'Runner-up' | 'Finalist' | 'Participant' | '';

export interface TarasEvent {
  id: string;
  eventName: string;
  eventCode: string;
  category: EventCategory;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  coordinator: string;
  maxParticipants: number;
  registrationStatus: 'Open' | 'Closed';
  eventStatus: EventStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Computed stats (populated from participants)
  registeredCount?: number;
  presentCount?: number;
  absentCount?: number;
}

export interface EventParticipant {
  id: string;
  eventId: string;
  studentId: string;
  registerNumber: string;
  studentName: string;
  section: string;
  year: string;
  participationStatus: ParticipationStatus;
  result: EventResult;
  position?: number;
  prize?: string;
  remarks?: string;
  createdAt: string;
}

// For student profile: computed event history
export interface StudentEventRecord {
  eventId: string;
  eventName: string;
  eventCode: string;
  category: EventCategory;
  date: string;
  participationStatus: ParticipationStatus;
  result: EventResult;
  position?: number;
  remarks?: string;
}

// For dashboard summary
export interface EventStats {
  totalEvents: number;
  totalRegistrations: number;
  totalPresent: number;
  completedEvents: number;
  upcomingEvents: number;
  ongoingEvents: number;
}

// Backward compat alias (old activity type)
export type ActivityCategory = EventCategory;
export interface Activity extends TarasEvent {}
