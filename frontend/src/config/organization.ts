const env = import.meta.env;
const read = (name: string) => String(env[name] || '').trim();

export const organization = {
  legalName: read('VITE_ORG_LEGAL_NAME'),
  cin: read('VITE_ORG_CIN'),
  section8Registration: read('VITE_ORG_SECTION8_REGISTRATION'),
  urn12A: read('VITE_ORG_12A_URN'),
  urn80G: read('VITE_ORG_80G_URN'),
  darpanId: read('VITE_ORG_DARPAN_ID'),
  csr1Registration: read('VITE_ORG_CSR1_REG_NO'),
  gstin: read('VITE_ORG_GSTIN'),
  deductionPercent: read('VITE_ORG_80G_DEDUCTION_PERCENT'),
  authorizedSignatory: read('VITE_ORG_AUTHORIZED_SIGNATORY'),
  bankAccountName: read('VITE_ORG_BANK_ACCOUNT_NAME'),
  bankName: read('VITE_ORG_BANK_NAME'),
  bankAccountNumber: read('VITE_ORG_BANK_ACCOUNT_NUMBER'),
  bankIfsc: read('VITE_ORG_BANK_IFSC'),
  bankBranch: read('VITE_ORG_BANK_BRANCH'),
  escrowAccountLabel: read('VITE_ORG_ESCROW_ACCOUNT_LABEL'),
  auditDescription: read('VITE_ORG_AUDIT_DESCRIPTION'),
  orderNumber80G: read('VITE_ORG_80G_ORDER_NUMBER'),
};

export const displayValue = (value: string, fallback = 'Not configured') => value || fallback;
