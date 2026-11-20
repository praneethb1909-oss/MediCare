/**
 * Hospital Admin Password Policy Enforcement
 * Enforces rigorous hospital-grade credential security according to
 * clinical EHR access standards and HIPAA compliance guidelines.
 */

export interface PasswordRule {
  id: string;
  label: string;
  description: string;
  validator: (password: string) => boolean;
}

export interface PasswordValidationResult {
  valid: boolean;
  score: number; // 0 to 100
  strength: 'weak' | 'moderate' | 'strong' | 'hospital-grade';
  errors: string[];
  passedChecks: string[];
  failedChecks: string[];
}

export const HOSPITAL_DISALLOWED_PATTERNS = [
  'password',
  'admin',
  'hospital',
  'medicare',
  'olmera',
  'doctor',
  'patient',
  '123456',
  'qwerty'
];

export const HOSPITAL_PASSWORD_RULES: PasswordRule[] = [
  {
    id: 'min-length',
    label: 'Minimum 10 Characters',
    description: 'Hospital security standard mandates at least 10 characters (12+ recommended).',
    validator: (pw) => pw.length >= 10
  },
  {
    id: 'uppercase',
    label: 'Uppercase Letter (A-Z)',
    description: 'Contains at least one uppercase alphabetic character.',
    validator: (pw) => /[A-Z]/.test(pw)
  },
  {
    id: 'lowercase',
    label: 'Lowercase Letter (a-z)',
    description: 'Contains at least one lowercase alphabetic character.',
    validator: (pw) => /[a-z]/.test(pw)
  },
  {
    id: 'digit',
    label: 'Numeric Digit (0-9)',
    description: 'Contains at least one numeric digit.',
    validator: (pw) => /[0-9]/.test(pw)
  },
  {
    id: 'special-char',
    label: 'Special Symbol (!@#$%...)',
    description: 'Contains at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?).',
    validator: (pw) => /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(pw)
  },
  {
    id: 'no-common-terms',
    label: 'No Common Hospital Terms',
    description: 'Does not contain predictable words like "hospital", "admin", or "olmera".',
    validator: (pw) => {
      const lower = pw.toLowerCase();
      return !HOSPITAL_DISALLOWED_PATTERNS.some(term => lower.includes(term));
    }
  }
];

/**
 * Validates a password against hospital administrative standards
 */
export function validateHospitalPassword(password: string): PasswordValidationResult {
  if (!password) {
    return {
      valid: false,
      score: 0,
      strength: 'weak',
      errors: ['Password cannot be empty.'],
      passedChecks: [],
      failedChecks: HOSPITAL_PASSWORD_RULES.map(r => r.id)
    };
  }

  const passedChecks: string[] = [];
  const failedChecks: string[] = [];
  const errors: string[] = [];

  for (const rule of HOSPITAL_PASSWORD_RULES) {
    if (rule.validator(password)) {
      passedChecks.push(rule.id);
    } else {
      failedChecks.push(rule.id);
      errors.push(rule.label);
    }
  }

  // Calculate score (0 - 100)
  let score = (passedChecks.length / HOSPITAL_PASSWORD_RULES.length) * 80;
  if (password.length >= 14) score += 10;
  if (password.length >= 18) score += 10;
  score = Math.min(100, Math.round(score));

  let strength: PasswordValidationResult['strength'] = 'weak';
  if (score >= 90 && passedChecks.length === HOSPITAL_PASSWORD_RULES.length) {
    strength = 'hospital-grade';
  } else if (score >= 75) {
    strength = 'strong';
  } else if (score >= 50) {
    strength = 'moderate';
  }

  return {
    valid: passedChecks.length === HOSPITAL_PASSWORD_RULES.length,
    score,
    strength,
    errors,
    passedChecks,
    failedChecks
  };
}
