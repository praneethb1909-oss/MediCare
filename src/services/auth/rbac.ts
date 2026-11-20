/**
 * Hospital Role-Based Access Control (RBAC) System
 * Configures clinical administrative roles, granular operational permissions,
 * and access control enforcement for hospital network administration.
 */

export type HospitalAdminRole = 
  | 'super_admin'                  // Regional Health Network Chief / System Overseer
  | 'hospital_director'            // Executive Facility Director
  | 'chief_medical_officer'        // Medical Governance & Doctor Credentialing
  | 'hospital_administrator'       // Operations, Bed Allocation, Staff Scheduling
  | 'department_head'              // Clinical Department Operations
  | 'audit_compliance_officer';    // Security, HIPAA & EHR Access Audit

export type HospitalPermission =
  | 'infra:view'                   // View hospital facility buildings, ICU, beds
  | 'infra:manage'                 // Edit hospital bed capacity, wards, contact info
  | 'doctors:view'                 // View medical practitioners directory
  | 'doctors:manage'               // Approve/credential doctors, assign departments
  | 'patients:view'                // View anonymized or verified patient registry
  | 'patients:manage'              // Manage patient profile records & clinical history
  | 'appointments:view'            // View consultation schedules across departments
  | 'appointments:manage'          // Reschedule, triage, cancel clinical sessions
  | 'billing:view'                 // Review hospital revenue, payments, invoices
  | 'billing:manage'               // Authorize waivers, insurance clearances
  | 'audit:view'                   // Review security access logs & HIPAA compliance
  | 'audit:export'                 // Export tamper-evident audit trails for regulatory bodies
  | 'security:manage'              // Unlock staff accounts, revoke session tokens
  | 'reports:clinical';            // View diagnostic pathology & imaging reports

export interface RoleDefinition {
  id: HospitalAdminRole;
  title: string;
  badge: string;
  description: string;
  level: number; // 1 (lowest) to 5 (highest)
  permissions: HospitalPermission[];
}

export const HOSPITAL_ROLES: Record<HospitalAdminRole, RoleDefinition> = {
  super_admin: {
    id: 'super_admin',
    title: 'Regional Health Director',
    badge: 'Super Admin',
    description: 'Full regional command center governance across Rajam, Vizag, and Srikakulam hubs.',
    level: 5,
    permissions: [
      'infra:view', 'infra:manage',
      'doctors:view', 'doctors:manage',
      'patients:view', 'patients:manage',
      'appointments:view', 'appointments:manage',
      'billing:view', 'billing:manage',
      'audit:view', 'audit:export',
      'security:manage',
      'reports:clinical'
    ]
  },
  hospital_director: {
    id: 'hospital_director',
    title: 'Executive Facility Director',
    badge: 'Hospital Director',
    description: 'Executive facility oversight, departmental budgeting, and incident escalation.',
    level: 4,
    permissions: [
      'infra:view', 'infra:manage',
      'doctors:view', 'doctors:manage',
      'patients:view', 'patients:manage',
      'appointments:view', 'appointments:manage',
      'billing:view', 'billing:manage',
      'audit:view', 'audit:export',
      'reports:clinical'
    ]
  },
  chief_medical_officer: {
    id: 'chief_medical_officer',
    title: 'Chief Medical Officer (CMO)',
    badge: 'CMO',
    description: 'Clinical governance, doctor onboarding, medical ethics, and diagnostic oversight.',
    level: 4,
    permissions: [
      'infra:view',
      'doctors:view', 'doctors:manage',
      'patients:view',
      'appointments:view', 'appointments:manage',
      'reports:clinical',
      'audit:view'
    ]
  },
  hospital_administrator: {
    id: 'hospital_administrator',
    title: 'Hospital Operations Administrator',
    badge: 'Facility Admin',
    description: 'Daily operational management, bed allocation, department queues, and patient intake.',
    level: 3,
    permissions: [
      'infra:view', 'infra:manage',
      'doctors:view',
      'patients:view', 'patients:manage',
      'appointments:view', 'appointments:manage',
      'billing:view',
      'reports:clinical'
    ]
  },
  department_head: {
    id: 'department_head',
    title: 'Clinical Department Head',
    badge: 'Dept Head',
    description: 'Supervision of specialists, consultation duty rosters, and ward occupancy.',
    level: 2,
    permissions: [
      'infra:view',
      'doctors:view',
      'patients:view',
      'appointments:view', 'appointments:manage',
      'reports:clinical'
    ]
  },
  audit_compliance_officer: {
    id: 'audit_compliance_officer',
    title: 'HIPAA & Compliance Auditor',
    badge: 'Compliance Officer',
    description: 'Independent inspection of security transactions, access controls, and authentication logs.',
    level: 3,
    permissions: [
      'audit:view', 'audit:export',
      'infra:view',
      'doctors:view',
      'appointments:view'
    ]
  }
};

/**
 * Checks if a specific hospital role possesses a permission
 */
export function hasHospitalPermission(role: HospitalAdminRole | string, permission: HospitalPermission): boolean {
  const roleDef = HOSPITAL_ROLES[role as HospitalAdminRole];
  if (!roleDef) return false;
  return roleDef.permissions.includes(permission);
}

/**
 * Returns formatted metadata for a hospital admin role
 */
export function getHospitalRoleMetadata(role: HospitalAdminRole | string): RoleDefinition {
  return HOSPITAL_ROLES[role as HospitalAdminRole] || HOSPITAL_ROLES.hospital_administrator;
}
