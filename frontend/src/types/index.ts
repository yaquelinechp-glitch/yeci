export interface User {
  id: string;
  company_name: string;
  email: string;
  phone: string;
  tax_id: string;
  country?: string;
  contact_name: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  avatar?: string;
  role: 'admin' | 'socio';
  status: string;
  training_track: string;
  commission_rate: number;
  partner_type: string;
  certification_date: string | null;
  why_partner: string;
  sales_approach: string;
  created_at: string;
}

export interface CourseVideo {
  id: string;
  title: string;
  description: string;
  video_url: string;
  duration_seconds: number;
  video_order: number;
  phase: number;
  day: number;
}

export interface PhaseConfig {
  phase: number;
  days: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  category: string;
  level: string;
  status: string;
  track: string;
  related_products: string[];
  pass_mark: number;
  validity_months: number;
  prerequisite_course_id: string;
  prerequisite: { id: string; title: string } | null;
  quiz_questions_count: number;
  exam_questions_count: number;
  phase_config: PhaseConfig[];
  video_count: number;
  videos: CourseVideo[];
  materials: { id: string; name: string; url: string }[];
  progress_pct: number;
  completed: boolean;
  deadline: string | null;
  rating_avg: number;
  rating_count: number;
  rated: boolean;
  total_duration: number;
  max_quiz_attempts: number;
  created_at: string;
}

export interface CourseProgress {
  course_id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  category: string;
  level: string;
  track: string;
  related_products: string[];
  pass_mark: number;
  validity_months: number;
  prerequisite_course_id: string;
  phase_config: PhaseConfig[];
  video_count: number;
  videos: CourseVideo[];
  progress_pct: number;
  completed: boolean;
  completed_videos: string[];
  certificate_url: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  question_type: string;
  correct_index: number;
  correct_indices: number[];
  fill_answer: string;
  order: number;
}

export interface QuizAttempt {
  id: string;
  video_id: string;
  question_id: string;
  selected_index: number;
  is_correct: boolean;
  created_at: string;
}

export interface QuizResult {
  score: number;
  correct: number;
  total: number;
  passed: boolean;
  results: { question_id: string; is_correct: boolean; correct_index: number }[];
}

export interface Deal {
  id: string;
  partner_id: string;
  partner_name: string;
  client_name: string;
  client_industry: string;
  estimated_value: number;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface AdminStats {
  total_partners: number;
  active_partners: number;
  pending_requests: number;
  total_deals: number;
  total_revenue: number;
  pending_commissions: number;
  total_pipeline_value: number;
  weighted_pipeline_value: number;
  active_opportunities: number;
  pipeline_by_stage: Record<string, { count: number; value: number }>;
  deals_by_status?: Record<string, number>;
  failed_logins_24h: number;
  blacklisted_tokens_count: number;
  top_partners: { name: string; deals: number; revenue: number; id: string }[];
}

export interface PartnerStats {
  my_deals: number;
  active_deals: number;
  closed_deals: number;
  total_revenue: number;
  my_commissions: number;
  pending_commissions: number;
  courses_completed: number;
  total_courses: number;
  status_breakdown: Record<string, number>;
  commissions_earned: number;
  courses_enrolled: number;
  completion_rate: number;
}

export interface Commission {
  id: string;
  deal_id: string;
  partner_id: string;
  partner_name: string;
  client_name: string;
  deal_value: number;
  amount: number;
  paid_date: string | null;
  created_at: string;
}

export const STAGE_CONFIG: { key: string; label: string; probability: number }[] = [
  { key: 'registrada', label: 'pipeline.registrada', probability: 10 },
  { key: 'cualificada', label: 'pipeline.cualificada', probability: 30 },
  { key: 'propuesta_enviada', label: 'pipeline.propuestaEnviada', probability: 55 },
  { key: 'negociacion', label: 'pipeline.negociacion', probability: 75 },
  { key: 'ganada', label: 'pipeline.ganada', probability: 100 },
  { key: 'perdida', label: 'pipeline.perdida', probability: 0 },
];

export interface Product {
  key: string;
  name: Record<string, string>;
  description: Record<string, string>;
  price_usd?: number | string;
  price_eur?: number | string;
  price_chf?: number | string;
  price_otro?: number | string;
  custom_currency?: string;
  category: string;
  active: boolean;
  sort_order: number;
  created_at?: string;
}

export interface Notification {
  id: string;
  partner_id: string;
  type: string;
  title: string;
  message: string;
  link: string;
  read: boolean;
  created_at: string;
}

export interface Opportunity {
  id: string;
  partner_id: string;
  partner_name: string;
  name: string;
  company_name: string;
  company_size: string;
  company_size_label: string;
  products: string[];
  products_labels: string[];
  operation_mode: string;
  stage: string;
  stage_label: string;
  probability: number;
  amount: number;
  scan_one_time_fee: number;
  currency: string;
  custom_currency: string;
  delivery_quarter: string;
  close_date: string | null;
  deal_owner: string;
  channel_manager: string;
  opportunity_type: string;
  forecast_category: string | null;
  lead_source: string;
  conflict: boolean;
  conflict_indicator: boolean;
  protection_end_date: string | null;
  protection_days_left: number | null;
  next_steps: string;
  loss_reason: string;
  notes: string;
  last_activity: string;
  created_at: string;
  updated_at: string;
}

export interface PipelineStats {
  total_value: number;
  weighted_value: number;
  avg_probability: number;
  total_opportunities: number;
  conflicts: number;
  by_stage: Record<string, { count: number; value: number; probability: number }>;
}

export interface Certification {
  id: string;
  partner_id: string;
  partner_name: string;
  level: string;
  status: string;
  certified_at: string;
  valid_until: string;
}

export interface TrainingResult {
  id: string;
  partner_id: string;
  course_id: string;
  course_title: string;
  attempt_number: number;
  score: number;
  passed: boolean;
  certificate_url: string;
  created_at: string;
}

export interface TrackStatus {
  total: number;
  completed: number;
}

export interface LmsOverview {
  certifications: Certification[];
  training_results: TrainingResult[];
  tracks: Record<string, TrackStatus>;
  completed_courses: number;
  won_opportunities: number;
  next_level: {
    level: string;
    requirements: { key: string; label: string; done: boolean }[];
  };
}

export interface PartnerUser {
  id: string;
  partner_id: string;
  email: string;
  contact_name: string;
  role: string;
  status: string;
  created_at: string;
  invite_token?: string;
  invite_url?: string;
}

export interface InviteInfo {
  valid: boolean;
  email: string;
  partner_name: string;
  contact_name: string;
  invite_token: string;
}

export interface OnboardingStep {
  key: string;
  label: string;
  auto: boolean;
  done: boolean;
  overdue: boolean;
  days_left: number | null;
}

export interface OnboardingPhase {
  key: string;
  days: number;
  steps: OnboardingStep[];
  done: number;
  total: number;
}

export interface OnboardingSnapshot {
  started: boolean;
  started_at: string | null;
  days_in: number;
  progress_pct: number;
  completed: boolean;
  completed_at: string | null;
  phases: OnboardingPhase[];
  reminders: string[];
  next_milestone: { phase: string; days_left: number } | null;
}

export interface QuizBankQuestion {
  id: string;
  question: { en: string; es: string; de: string };
  options: { en: string; es: string; de: string }[];
  question_type: string;
  correct_index: number;
  correct_indices: number[];
  fill_answer: { en: string; es: string; de: string };
  track: string;
}

export interface CourseAssignment {
  id: string;
  course_id: string;
  course_title: string;
  partner_id: string;
  partner_name: string;
  deadline: string | null;
  assigned_at: string;
}

export interface CourseRating {
  id: string;
  partner_name: string;
  stars: number;
  comment: string;
  created_at: string;
}

export interface VideoCheckpoint {
  id: string;
  timestamp_seconds: number;
  question: string;
  options: string[];
  correct_index: number;
  on_wrong_timestamp: number;
  order: number;
}

export interface ConflictOpportunity {
  id: string;
  name: string;
  company_name: string;
  stage: string;
  amount: number;
  partner_id: string;
  partner_name: string;
}

export interface ChannelConflict {
  id: string;
  company_name: string;
  status: string;
  opportunity: ConflictOpportunity | null;
  conflicting_opportunity: ConflictOpportunity | null;
  reporter_id: string;
  reporter_name: string;
  winner_opportunity_id: string | null;
  winner_partner_name: string | null;
  notes: string;
  resolution: string;
  created_at: string;
  resolved_at: string | null;
}

export interface ConflictStats {
  role: string;
  total: number;
  open?: number;
  resolved?: number;
  closed?: number;
  by_status?: Record<string, number>;
  by_company?: { company_name: string; count: number }[];
}

export interface LmsAnalytics {
  courses: {
    course_id: string;
    title: string;
    track: string;
    enrolled: number;
    started: number;
    quiz_passed: number;
    completed: number;
    exam_passed: number;
  }[];
}

