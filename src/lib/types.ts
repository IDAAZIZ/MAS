// ============================================================
// e-APRESIASI KKBDA — TypeScript Type Definitions
// ============================================================

export type UserRole = 'admin' | 'panel' | 'management' | 'director';

export type EvaluationStatus = 'draft' | 'submitted';

export type AwardProcessStatus =
  | 'setup'
  | 'evaluation_open'
  | 'evaluation_in_progress'
  | 'evaluation_completed'
  | 'management_review'
  | 'management_completed'
  | 'pending_director'
  | 'director_selected'
  | 'director_approved'
  | 'final';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  username?: string;
  role: UserRole;
  roles?: UserRole[];
  phone: string | null;
  position: string | null;
  division?: string | null;
  is_active: boolean;
  is_dummy?: boolean;
  activation_status?: 'pending' | 'active' | 'inactive';
  invited_at?: string | null;
  activated_at?: string | null;
  created_at: string;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface AwardYear {
  id: string;
  year: number;
  is_active: boolean;
  created_at: string;
}

export interface Award {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  max_candidates: number;
  created_at: string;
  updated_at: string;
}

export interface AwardItemSet {
  id: string;
  name: string;
  award_id: string | null;
  total_max_score: number;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  award_items?: AwardItem[];
  award?: Award;
}

export interface AwardItem {
  id: string;
  item_set_id: string;
  name: string;
  description: string | null;
  max_score: number; // Wajaran (%)
  sort_order: number;
  rubric_levels?: {
    level_5?: string;
    level_4?: string;
    level_3?: string;
    level_2?: string;
    level_1?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface Evaluator {
  id: string;
  profile_id: string | null;
  name: string;
  email: string;
  position: string | null;
  phone: string | null;
  is_active: boolean;
  is_dummy?: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  profile?: Profile;
}

export interface EvaluatorAssignment {
  id: string;
  evaluator_id: string;
  award_id: string;
  award_year_id: string;
  division?: string | null;
  created_at: string;
  // Joined
  evaluator?: Evaluator;
  award?: Award;
}

export interface PanelCandidate {
  id: string;
  award_id: string;
  award_year_id: string;
  panel_id: string;
  candidate_name: string;
  staff_number: string | null;
  division: string;
  position: string | null;
  created_by: string;
  is_dummy?: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  award?: Award;
  evaluation?: Evaluation;
}

export interface Evaluation {
  id: string;
  panel_candidate_id: string;
  panel_id: string;
  award_id: string;
  award_year_id: string;
  total_score: number | null;
  status: EvaluationStatus;
  comments?: string | null;
  is_dummy?: boolean;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  scores?: EvaluationScore[];
  panel_candidate?: PanelCandidate;
}

export interface EvaluationScore {
  id: string;
  evaluation_id: string;
  award_item_id: string;
  score: number | null; // Calculated markah = (raw_score / 5) * max_score
  raw_score?: number | null; // Skor Panel 0-5
  max_score: number; // Wajaran
  created_at: string;
  updated_at: string;
  // Joined
  award_item?: AwardItem;
}

export interface CandidateAggregate {
  id: string;
  award_id: string;
  award_year_id: string;
  candidate_identifier: string;
  candidate_name: string;
  staff_number: string | null;
  division: string;
  score_count: number;
  total_score: number;
  average_score: number;
  individual_scores: number[];
  is_dummy?: boolean;
  updated_at: string;
  // Joined
  award?: Award;
  management_selection?: ManagementSelection;
  director_selection?: DirectorSelection;
}

export interface ManagementSelection {
  id: string;
  award_id: string;
  award_year_id: string;
  candidate_aggregate_id: string;
  selected: boolean;
  selected_by: string | null;
  selected_at: string | null;
}

export interface DirectorSelection {
  id: string;
  award_id: string;
  award_year_id: string;
  candidate_aggregate_id: string;
  selected: boolean;
  selected_by: string | null;
  selected_at: string | null;
  director_note: string | null;
}

export interface DirectorApproval {
  id: string;
  award_id: string;
  award_year_id: string;
  approved: boolean;
  approved_by: string | null;
  approved_at: string | null;
}

export interface FinalResult {
  id: string;
  award_id: string;
  award_year_id: string;
  candidate_aggregate_id: string;
  status: string;
  confirmed_at: string | null;
  // Joined
  award?: Award;
  candidate_aggregate?: CandidateAggregate;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_name: string;
  user_role: string;
  action: string;
  details: string | null;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: unknown;
  updated_at: string;
}

export interface AwardStatus {
  id: string;
  award_id: string;
  award_year_id: string;
  status: AwardProcessStatus;
  updated_at: string;
  // Joined
  award?: Award;
}

// ============================================================
// Form schemas (Zod)
// ============================================================

export interface LoginFormData {
  email: string;
  password: string;
}

export interface CategoryFormData {
  name: string;
  description: string;
  is_active: boolean;
  max_candidates: number;
}

export interface ItemSetFormData {
  name: string;
}

export interface AwardItemFormData {
  name: string;
  description: string;
  max_score: number;
}

export interface EvaluatorFormData {
  name: string;
  email: string;
  position: string;
  phone: string;
}

export interface CandidateFormData {
  candidate_name: string;
  staff_number: string;
  division: string;
  position: string;
}

// ============================================================
// Dashboard stats
// ============================================================

export interface AdminDashboardStats {
  totalCategories: number;
  totalPanels: number;
  totalCandidates: number;
  evaluationProgress: number;
  pendingManagement: number;
  pendingDirector: number;
}

export interface DirectorDashboardStats {
  totalCategories: number;
  pendingDecision: number;
  approved: number;
}
