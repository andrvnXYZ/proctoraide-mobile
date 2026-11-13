export type Role = 'student' | 'proctor';

export type ExamStatus = 'scheduled' | 'ongoing' | 'completed';

export type IncidentStatus = 'pending' | 'reviewed' | 'dismissed';

export interface User {
  id: string;
  name: string;
  first_name?: string | null;
  last_name?: string | null;
  email: string;
  student_id_number?: string | null;
  college?: string | null;
  department?: string | null;
  year_level?: string | null;
  role: Role;
}

export interface ExamSession {
  id: string;
  status: 'in_progress' | 'completed';
  started_at: string | null;
  finished_at: string | null;
  last_seen_at: string | null;
}

export interface Examination {
  id: string;
  title: string;
  subject: string;
  section: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  date_label: string;
  time_range: string;
  schedule: string;
  status: ExamStatus;
  status_label: string;
  access_code: string;
  started_at: string | null;
  ended_at: string | null;
  enrolled_students?: number | null;

  // Student payload additions
  joined?: boolean;
  joined_at?: string | null;
  session?: ExamSession | null;

  // Proctor list/detail additions
  joined_students?: number;
  in_progress_students?: number;
  finished_students?: number;
}

export interface ActivityEvent {
  id: string;
  examination_id?: string;
  examination_title?: string | null;
  student_id?: string;
  student_name?: string | null;
  student_id_number?: string | null;
  type: string;
  type_label: string;
  detail?: string | null;
  occurred_at: string | null;
}

export interface Incident {
  id: string;
  examination_id: string;
  examination_title: string | null;
  student_name: string | null;
  student_id_number: string | null;
  description: string;
  status: IncidentStatus;
  status_label: string;
  reported_at: string | null;
  reviewed_at: string | null;
}

export interface Participant {
  student_id: string;
  student_name: string;
  student_id_number: string | null;
  joined_at: string | null;
  session_status: 'in_progress' | 'completed' | null;
  started_at: string | null;
  finished_at: string | null;
  last_seen_at: string | null;
}

export interface StudentDashboard {
  user: User;
  stats: { upcoming: number; active: number; completed: number };
  active_examination: Examination | null;
  upcoming: Examination[];
  history: Examination[];
}

export interface ProctorDashboard {
  user: User;
  stats: {
    active_examinations: number;
    reported_incidents: number;
    pending_incidents: number;
    active_students: number;
  };
  upcoming_examinations: Examination[];
  total_examinations: number;
  recent_activity: ActivityEvent[];
}

export interface AssignmentPair {
  subject: string;
  section: string;
}
