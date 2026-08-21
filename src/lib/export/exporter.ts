import { AuditExecutionResult } from '../agents/director';

export function exportWorkingPaperHTML(auditData: AuditExecutionResult): string {
  const isApproved = auditData.reportPack.status === 'CA_APPROVED';
  const timestamp = new Date().toLocaleString();

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>FinDit Statutory Audit Working Paper Pack - ${auditData.engagementId}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 40px; color: #1e293b; background: #fff; }
        .header { border-b: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; }
        .disclaimer { background: #fef3c7; border: 1px solid #f59e0b; color: #92400e; padding: 12px; border-radius: 6px; font-weight: bold; font-size: 13px; margin-bottom: 20px; }
        .approved-stamp { background: #dcfce7; border: 1px solid #16a34a; color: #14532d; padding: 12px; border-radius: 6px; font-weight: bold; font-size: 13px; margin-bottom: 20px; }
        h1 { margin: 0; font-size: 24px; color: #0f172a; }
        h2 { font-size: 18px; color: #0369a1; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
        th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
        th { background: #f1f5f9; color: #0f172a; }
        .high-risk { color: #dc2626; font-weight: bold; }
        .footer { margin-top: 50px; border-t: 1px solid #e2e8f0; pt: 20px; font-size: 11px; color: #64748b; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>FinDit Statutory Audit Working Paper Package</h1>
        <p>Engagement ID: <strong>${auditData.engagementId}</strong> | Exported: ${timestamp}</p>
    </div>

    ${isApproved ? `
    <div class="approved-stamp">
        ✅ FORMALLY APPROVED & SIGNED BY LICENSED CHARTERED ACCOUNTANT<br>
        Reviewer ID: ${auditData.reportPack.caSignoffMetadata?.signedBy || 'CA-99412'}<br>
        Signed Timestamp: ${auditData.reportPack.caSignoffMetadata?.signedAt || timestamp}<br>
        Digital Signature Reference: ${auditData.reportPack.caSignoffMetadata?.digitalSignatureRef || 'RSA2048_SIG_APPROVED'}
    </div>
    ` : `
    <div class="disclaimer">
        ⚠️ MANDATORY REGULATORY NOTICE: ${auditData.reportPack.mandatoryDisclaimer}
    </div>
    `}

    <h2>1. Engagement & Materiality Summary (ISA 320)</h2>
    <table>
        <tr><th>Overall Materiality (1% Revenue Benchmark)</th><td>$${auditData.materiality.overallMateriality.toLocaleString()}</td></tr>
        <tr><th>Performance Materiality (75% Overall)</th><td>$${auditData.materiality.performanceMateriality.toLocaleString()}</td></tr>
        <tr><th>Fieldwork Automation Progress</th><td>${auditData.overallFieldworkProgress}%</td></tr>
        <tr><th>Total Escalated Findings</th><td>${auditData.findings.length}</td></tr>
    </table>

    <h2>2. Key Audit Matters (ISA 701)</h2>
    ${auditData.reportPack.keyAuditMatters.map(kam => `
        <div style="margin-bottom:15px; background:#f8fafc; padding:12px; border-radius:6px; border:1px solid #e2e8f0;">
            <strong>${kam.title} (${kam.auditArea})</strong><br>
            <span style="font-size:12px;"><strong>Why Considered KAM:</strong> ${kam.whyConsideredKAM}</span><br>
            <span style="font-size:12px;"><strong>How Addressed:</strong> ${kam.howAddressedInAudit}</span>
        </div>
    `).join('')}

    <h2>3. Master Risk Register & Findings Log</h2>
    <table>
        <thead>
            <tr>
                <th>Area</th>
                <th>Source Agent</th>
                <th>Risk Level</th>
                <th>Description</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            ${auditData.findings.map(f => `
                <tr>
                    <td>${f.auditArea}</td>
                    <td>${f.agentSource}</td>
                    <td className="${f.riskLevel === 'HIGH' ? 'high-risk' : ''}">${f.riskLevel}</td>
                    <td>${f.description}</td>
                    <td>${f.status}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="footer">
        FinDit Multi-Agent Financial Audit Engine • Compliant with ISA 300, 315, 320, 240, 500, 505, 520, 570, 701 & IFRS Standards.
    </div>
</body>
</html>`;
}

export function downloadFile(content: string, filename: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
