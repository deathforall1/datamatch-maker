// Database types for Perfect Date app

export type GenderType = 'male' | 'female' | 'non_binary';

export type AppRole = 'admin' | 'participant';

export interface Participant {
  id: string;
  user_id: string;
  name: string;
  email: string;
  age: number;
  gender: GenderType;
  partner_preference: GenderType[];
  consent_given: boolean;
  registration_complete: boolean;
  questionnaire_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuestionnaireResponses {
  id: string;
  user_id: string;
  // Section A: MCQ
  q1_friday_night: string | null;
  q2_humour: string | null;
  q3_conflict_style: string | null;
  // Section B: Rankings
  q4_life_pillars: string[] | null;
  q5_love_languages: string[] | null;
  // Section C: Sliders
  q6_social_battery: number | null;
  q7_spontaneity: number | null;
  q8_ambition: number | null;
  q9_productivity: number | null;
  q10_date_preference: number | null;
  // Metadata
  current_step: number;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  participant_id: string;
  match_1_id: string | null;
  match_1_score: number | null;
  match_2_id: string | null;
  match_2_score: number | null;
  match_3_id: string | null;
  match_3_score: number | null;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface AppSetting {
  id: string;
  key: string;
  value: unknown;
  updated_at: string;
}

// Question options
export const FRIDAY_NIGHT_OPTIONS = [
  { value: 'library', label: 'T-School/Library', emoji: '📚' },
  { value: 'bistro', label: 'Bistro/CCD', emoji: '☕' },
  { value: 'party', label: 'Regional Night/Party', emoji: '🎉' },
  { value: 'netflix', label: 'Room/Netflix', emoji: '🎬' },
];

export const HUMOUR_OPTIONS = [
  { value: 'sarcasm', label: 'Sarcasm', emoji: '😏' },
  { value: 'wholesome', label: 'Wholesome/Kind', emoji: '🥰' },
  { value: 'intellectual', label: 'Intellectual/Nerd', emoji: '🤓' },
  { value: 'goofy', label: 'Goofy/Dad Jokes', emoji: '🤪' },
];

export const CONFLICT_OPTIONS = [
  { value: 'mediator', label: 'Mediator', emoji: '🤝' },
  { value: 'driver', label: 'Driver', emoji: '🎯' },
  { value: 'avoider', label: 'Avoider', emoji: '🏃' },
  { value: 'analyzer', label: 'Analyzer', emoji: '🔍' },
];

export const LIFE_PILLARS = [
  { value: 'career', label: 'Career', emoji: '💼' },
  { value: 'growth', label: 'Personal Growth', emoji: '🌱' },
  { value: 'friendships', label: 'Friendships', emoji: '👥' },
  { value: 'family', label: 'Family', emoji: '👨‍👩‍👧‍👦' },
  { value: 'adventure', label: 'Adventure', emoji: '🌍' },
];

export const LOVE_LANGUAGES = [
  { value: 'words', label: 'Words of Affirmation', emoji: '💬' },
  { value: 'acts', label: 'Acts of Service', emoji: '🛠️' },
  { value: 'time', label: 'Quality Time', emoji: '⏰' },
  { value: 'gifts', label: 'Gifts', emoji: '🎁' },
  { value: 'touch', label: 'Physical Touch', emoji: '🤗' },
];

export const SLIDER_QUESTIONS = [
  { 
    key: 'q6_social_battery', 
    question: 'Social Battery', 
    leftLabel: 'Introvert', 
    rightLabel: 'Extrovert',
    emoji: '⚡'
  },
  { 
    key: 'q7_spontaneity', 
    question: 'Spontaneity', 
    leftLabel: 'Planned', 
    rightLabel: 'Spontaneous',
    emoji: '🎲'
  },
  { 
    key: 'q8_ambition', 
    question: 'Ambition', 
    leftLabel: 'Balanced', 
    rightLabel: 'Hyper-Ambitious',
    emoji: '🚀'
  },
  { 
    key: 'q9_productivity', 
    question: 'Productivity', 
    leftLabel: 'Early Bird', 
    rightLabel: 'Night Owl',
    emoji: '🌙'
  },
  { 
    key: 'q10_date_preference', 
    question: 'Date Preference', 
    leftLabel: 'Quiet Talk', 
    rightLabel: 'High Activity',
    emoji: '💑'
  },
];

export const GENDER_OPTIONS = [
  { value: 'male' as GenderType, label: 'Male' },
  { value: 'female' as GenderType, label: 'Female' },
  { value: 'non_binary' as GenderType, label: 'Non-Binary' },
];
