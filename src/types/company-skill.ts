/**
 * CompanySkill — skill del catálogo del tenant.
 * Reflejo del JSON de `GET /company-skills`.
 */
export interface CompanySkill {
  id: string;
  companyId: string;
  name: string;
}

export interface CreateCompanySkillPayload {
  name: string;
}
