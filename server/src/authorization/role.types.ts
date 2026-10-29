export type CanonicalRole =
  | 'student'
  | 'driver'
  | 'proctor'
  | 'ta_faculty'
  | 'warden'
  | 'admin';

export type UserRole = CanonicalRole;

export type Permission =
  // Identity & Profile
  | 'identity.profile.read_own'
  | 'identity.profile.update_own'
  | 'identity.sessions.manage_own'
  // Academic & Hub
  | 'academic.profile.read_own'
  | 'academic.profile.update_own'
  | 'academic.milestones.manage_own'
  | 'academic.mentors.search'
  | 'academic.mentorship.request_create'
  | 'academic.mentorship.manage_own'
  | 'academic.mentorship.review_assigned'
  | 'academic.resources.read'
  | 'academic.resources.publish'
  | 'academic.resources.rate'
  // Campus Mobility & Transit
  | 'mobility.rides.search'
  | 'mobility.rides.create_as_driver'
  | 'mobility.rides.manage_own'
  | 'mobility.requests.create'
  | 'mobility.requests.manage_own'
  | 'mobility.bookings.create'
  | 'mobility.bookings.cancel_own'
  | 'mobility.bookings.review_as_driver'
  | 'mobility.graph.read'
  // Sustainability & Computing
  | 'sustainability.metrics.read'
  | 'sustainability.simulation.view'
  | 'sustainability.simulation.configure'
  | 'sustainability.workloads.scale'
  // Digital Wellbeing (Sovereign & Private)
  | 'wellbeing.sessions.manage_own'
  | 'wellbeing.rules.manage_own'
  | 'wellbeing.data.inspect_own'
  | 'wellbeing.data.delete_own'
  | 'wellbeing.cohort.read_anonymized'
  // Responsible Examination Review
  | 'exam.sessions.read_assigned'
  | 'exam.observations.read_assigned'
  | 'exam.observations.review_assigned'
  | 'exam.audit.read_assigned'
  // Campus Operations & Wardens
  | 'warden.transit.overview'
  | 'warden.facilities.read'
  | 'warden.advisories.publish'
  // System Administration
  | 'admin.users.read'
  | 'admin.users.manage'
  | 'admin.roles.assign'
  | 'admin.roles.revoke'
  | 'admin.system.diagnostics'
  | 'admin.demo.reset'
  // Security Audit
  | 'security.audit.read';

export interface RoleAssignment {
  id: string;
  user_id: string;
  role_key: CanonicalRole;
  status: 'active' | 'revoked' | 'expired';
  granted_by_user_id?: string | null;
  granted_at: string;
  expires_at?: string | null;
  revoked_at?: string | null;
  reason?: string | null;
}

export const LEGACY_ROLE_MAP: Record<string, CanonicalRole> = {
  student: 'student',
  driver: 'driver',
  proctor: 'proctor',
  admin: 'admin',
  'transit driver': 'driver',
  'exam proctor': 'proctor',
  'system admin': 'admin',
  reviewer: 'proctor',
  faculty: 'ta_faculty',
  ta: 'ta_faculty',
  ta_faculty: 'ta_faculty',
  warden: 'warden',
  'campus staff': 'warden'
};

export const ROLE_PERMISSIONS: Record<CanonicalRole, Permission[]> = {
  student: [
    'identity.profile.read_own',
    'identity.profile.update_own',
    'identity.sessions.manage_own',
    'academic.profile.read_own',
    'academic.profile.update_own',
    'academic.milestones.manage_own',
    'academic.mentors.search',
    'academic.mentorship.request_create',
    'academic.mentorship.manage_own',
    'academic.resources.read',
    'academic.resources.rate',
    'mobility.rides.search',
    'mobility.requests.create',
    'mobility.requests.manage_own',
    'mobility.bookings.create',
    'mobility.bookings.cancel_own',
    'mobility.graph.read',
    'sustainability.metrics.read',
    'sustainability.simulation.view',
    'wellbeing.sessions.manage_own',
    'wellbeing.rules.manage_own',
    'wellbeing.data.inspect_own',
    'wellbeing.data.delete_own',
    'wellbeing.cohort.read_anonymized'
  ],
  driver: [
    'identity.profile.read_own',
    'identity.profile.update_own',
    'identity.sessions.manage_own',
    'mobility.rides.search',
    'mobility.rides.create_as_driver',
    'mobility.rides.manage_own',
    'mobility.bookings.review_as_driver',
    'mobility.graph.read',
    'sustainability.metrics.read'
  ],
  proctor: [
    'identity.profile.read_own',
    'identity.profile.update_own',
    'identity.sessions.manage_own',
    'exam.sessions.read_assigned',
    'exam.observations.read_assigned',
    'exam.observations.review_assigned',
    'exam.audit.read_assigned'
  ],
  ta_faculty: [
    'identity.profile.read_own',
    'identity.profile.update_own',
    'identity.sessions.manage_own',
    'academic.mentors.search',
    'academic.mentorship.review_assigned',
    'academic.resources.read',
    'academic.resources.publish',
    'academic.resources.rate',
    'mobility.rides.search',
    'mobility.graph.read',
    'sustainability.metrics.read',
    'sustainability.simulation.view',
    'wellbeing.cohort.read_anonymized'
  ],
  warden: [
    'identity.profile.read_own',
    'identity.profile.update_own',
    'identity.sessions.manage_own',
    'mobility.rides.search',
    'mobility.graph.read',
    'warden.transit.overview',
    'warden.facilities.read',
    'warden.advisories.publish',
    'sustainability.metrics.read'
  ],
  admin: [
    'identity.profile.read_own',
    'identity.profile.update_own',
    'identity.sessions.manage_own',
    'academic.profile.read_own',
    'academic.mentors.search',
    'academic.resources.read',
    'academic.resources.publish',
    'mobility.rides.search',
    'mobility.graph.read',
    'sustainability.metrics.read',
    'sustainability.simulation.view',
    'sustainability.simulation.configure',
    'sustainability.workloads.scale',
    'wellbeing.cohort.read_anonymized',
    'exam.sessions.read_assigned',
    'exam.audit.read_assigned',
    'warden.transit.overview',
    'warden.facilities.read',
    'warden.advisories.publish',
    'admin.users.read',
    'admin.users.manage',
    'admin.roles.assign',
    'admin.roles.revoke',
    'admin.system.diagnostics',
    'admin.demo.reset',
    'security.audit.read'
  ]
};
