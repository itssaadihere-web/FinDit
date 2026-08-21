export interface AuditFirmSession {
  firmId: string;
  firmName: string;
  licenseId: string;
  partnerName: string;
  email: string;
  isLoggedIn: boolean;
}

export const INITIAL_UNAUTHENTICATED_SESSION: AuditFirmSession = {
  firmId: "",
  firmName: "",
  licenseId: "",
  partnerName: "",
  email: "",
  isLoggedIn: false
};

export const DEMO_FIRM_SESSION: AuditFirmSession = {
  firmId: "firm_saad_994",
  firmName: "Saad & Co. Chartered Accountants",
  licenseId: "ICAP-CA-99412",
  partnerName: "Saad Ahmad, FCA",
  email: "partner@saadco-ca.com",
  isLoggedIn: true
};
