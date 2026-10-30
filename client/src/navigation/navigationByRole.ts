import { UserRole } from '../types';

export interface NavItem {
  label: string;
  path: string;
  icon: string;
  badge?: string;
  badgeColor?: string;
}

export interface NavGroup {
  groupName: string;
  items: NavItem[];
}

export const navigationByRole: Record<UserRole, NavGroup[]> = {
  student: [
    {
      groupName: 'CAMPUS COMMONS',
      items: [
        { label: 'Collegiate Overview', path: '/app', icon: 'dashboard' },
        { label: 'Campus Feed', path: '/feed', icon: 'newspaper', badge: 'Live' },
        { label: 'Find Senior Mentors', path: '/mentors', icon: 'psychology', badge: 'ML / AI' },
        { label: 'Campus Copilot', path: '/assistant', icon: 'auto_awesome', badge: 'AI' },
        { label: 'Events & Communities', path: '/events', icon: 'calendar_month' },
        { label: 'Report Facility Issue', path: '/facilities', icon: 'build' }
      ]
    },
    {
      groupName: 'SCHOLAR WORKSPACE',
      items: [
        { label: 'Skill Tree & Readiness', path: '/academic', icon: 'school', badge: 'DSA' },
        { label: 'Academic Resources', path: '/academic', icon: 'menu_book' }
      ]
    },
    {
      groupName: 'CAMPUS MOBILITY',
      items: [
        { label: 'Find a Carpool', path: '/rides', icon: 'directions_car', badge: 'Dijkstra' }
      ]
    },
    {
      groupName: 'SOVEREIGN WELLBEING',
      items: [
        { label: 'Focus & Deep Work', path: '/wellbeing', icon: 'timer', badge: 'DP ε=0.8' }
      ]
    },
    {
      groupName: 'COLLEGIATE PRINCIPLES',
      items: [
        { label: 'Architecture & Audits', path: '/architecture', icon: 'hub' },
        { label: 'Workflow Explainer', path: '/how-it-works', icon: 'route' },
        { label: 'Impact & Carbon', path: '/impact', icon: 'analytics' },
        { label: 'Zero-Tax Ethos', path: '/about', icon: 'verified' }
      ]
    },
    {
      groupName: 'ACCOUNT ENCLAVE',
      items: [
        { label: 'Settings & Security', path: '/settings', icon: 'key' }
      ]
    }
  ],

  driver: [
    {
      groupName: 'TRANSIT DISPATCH',
      items: [
        { label: 'Driver Dashboard', path: '/app', icon: 'dashboard' },
        { label: 'Live Trip Dispatch & Rosters', path: '/driver/trips', icon: 'local_taxi', badge: 'Live Ops' },
        { label: 'Publish Route Offer', path: '/rides', icon: 'add_road', badge: 'Active' },
        { label: 'Passenger Requests', path: '/rides', icon: 'group_add' },
        { label: 'Campus Map & Route', path: '/rides', icon: 'map' }
      ]
    },
    {
      groupName: 'CAMPUS MESH',
      items: [
        { label: 'Campus Feed', path: '/feed', icon: 'newspaper' },
        { label: 'Campus Copilot', path: '/assistant', icon: 'auto_awesome' },
        { label: 'Avoided Carbon Telemetry', path: '/sustainability', icon: 'energy_savings_leaf' }
      ]
    },
    {
      groupName: 'DRIVER PROTOCOL',
      items: [
        { label: 'Transit Protocol', path: '/how-it-works', icon: 'route' },
        { label: 'Driver Settings', path: '/settings', icon: 'key' }
      ]
    }
  ],

  proctor: [
    {
      groupName: 'EXAM INTEGRITY TRIBUNAL',
      items: [
        { label: 'Proctor Overview', path: '/app', icon: 'dashboard' },
        { label: 'Assigned Sessions', path: '/exams', icon: 'list_alt' },
        { label: 'Observation Queue', path: '/exams', icon: 'gavel', badge: 'Review', badgeColor: 'bg-error-container text-on-error-container' },
        { label: 'Proctor Audit Trail', path: '/exams', icon: 'history_edu' }
      ]
    },
    {
      groupName: 'ETHICAL AI PROTOCOL',
      items: [
        { label: 'Responsible AI Ethos', path: '/about', icon: 'balance' },
        { label: 'Algorithm Sandbox', path: '/architecture', icon: 'hub' },
        { label: 'Campus Feed', path: '/feed', icon: 'newspaper' },
        { label: 'Account Settings', path: '/settings', icon: 'key' }
      ]
    }
  ],

  ta_faculty: [
    {
      groupName: 'ACADEMIC FACULTY & MENTOR',
      items: [
        { label: 'Faculty Overview', path: '/app', icon: 'dashboard' },
        { label: 'Campus Community Feed', path: '/feed', icon: 'newspaper', badge: 'Active' },
        { label: 'Senior Mentorship Network', path: '/mentors', icon: 'psychology' },
        { label: 'Campus Copilot', path: '/assistant', icon: 'auto_awesome' },
        { label: 'Campus Events & Guilds', path: '/events', icon: 'calendar_month' },
        { label: 'Resource Publisher', path: '/academic', icon: 'upload_file' },
        { label: 'Student Readiness Stats', path: '/academic', icon: 'insights' }
      ]
    },
    {
      groupName: 'CAMPUS MESH',
      items: [
        { label: 'Campus Transit', path: '/rides', icon: 'directions_car' },
        { label: 'Cluster Sustainability', path: '/sustainability', icon: 'energy_savings_leaf' },
        { label: 'Architecture & Specifications', path: '/architecture', icon: 'hub' },
        { label: 'Settings', path: '/settings', icon: 'key' }
      ]
    }
  ],

  warden: [
    {
      groupName: 'CAMPUS LIFE & RESIDENTIAL',
      items: [
        { label: 'Warden Overview', path: '/app', icon: 'dashboard' },
        { label: 'Facility Issues & Defects', path: '/facilities', icon: 'build', badge: 'Triage' },
        { label: 'Campus Feed & Notices', path: '/feed', icon: 'newspaper', badge: 'Notice' },
        { label: 'Events & Facilities Directory', path: '/events', icon: 'calendar_month' },
        { label: 'Campus Mobility Grid', path: '/rides', icon: 'directions_car' },
        { label: 'Facility Energy Load', path: '/sustainability', icon: 'solar_power' },
        { label: 'Safety & Settings', path: '/settings', icon: 'key' }
      ]
    }
  ],

  admin: [
    {
      groupName: 'SYSTEM ENCLAVE',
      items: [
        { label: 'Root System Overview', path: '/app', icon: 'admin_panel_settings' },
        { label: 'Feed Moderation & Posts', path: '/feed', icon: 'newspaper' },
        { label: 'Facility Defect Triage', path: '/facilities', icon: 'build' },
        { label: 'Senior Mentors Enclave', path: '/mentors', icon: 'psychology' },
        { label: 'Campus Copilot', path: '/assistant', icon: 'auto_awesome' },
        { label: 'Events & Communities', path: '/events', icon: 'calendar_month' },
        { label: 'User Directory & Roles', path: '/settings', icon: 'manage_accounts', badge: 'RBAC' },
        { label: 'Security Audit Log', path: '/settings', icon: 'security' },
        { label: 'Slurm Carbon & HPC', path: '/sustainability', icon: 'energy_savings_leaf' },
        { label: 'Algorithm Sandbox', path: '/architecture', icon: 'developer_board' }
      ]
    },
    {
      groupName: 'MODULE SUPERVISION',
      items: [
        { label: 'Academic Supervision', path: '/academic', icon: 'school' },
        { label: 'Transit Mesh Dispatch', path: '/rides', icon: 'directions_car' },
        { label: 'Examination Tribunal', path: '/exams', icon: 'gavel' }
      ]
    }
  ]
};
