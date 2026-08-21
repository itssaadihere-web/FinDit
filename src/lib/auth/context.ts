export interface AuditFirmSession {
  firmId: string;
  firmName: string;
  licenseId: string;
  partnerName: string;
  email: string;
  isLoggedIn: boolean;
}

export const DEFAULT_FIRM_SESSION: AuditFirmSession = {
  firmId: "firm_saad_994",
  firmName: "Saad & Co. Chartered Accountants",
  licenseId: "ICAP-CA-99412",
  partnerName: "Saad Ahmad, FCA",
  email: "partner@saadco-ca.com",
  isLoggedIn: true
};
