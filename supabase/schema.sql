-- ========================================================
-- FinDit - Financial Audit System Database Schema (Supabase)
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Engagements Table
CREATE TABLE IF NOT EXISTS engagements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_name VARCHAR(255) NOT NULL,
    period VARCHAR(50) NOT NULL, -- e.g. "FY2025-2026"
    engagement_type VARCHAR(50) NOT NULL DEFAULT 'STATUTORY_AUDIT', -- STATUTORY_AUDIT, LIMITED_REVIEW, AGREED_UPON_PROCEDURES
    industry_overlay VARCHAR(50) NOT NULL DEFAULT 'MANUFACTURING', -- MANUFACTURING, TRADING, SERVICES
    status VARCHAR(50) NOT NULL DEFAULT 'AI_DRAFT', -- AI_DRAFT, PENDING_REVIEW, CA_APPROVED, CA_OVERRIDDEN
    overall_materiality NUMERIC(15, 2) DEFAULT 0.00,
    performance_materiality NUMERIC(15, 2) DEFAULT 0.00,
    ca_signoff_by UUID REFERENCES auth.users(id),
    ca_signoff_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    audit_area VARCHAR(100) NOT NULL DEFAULT 'UNASSIGNED',
    file_url TEXT NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- PDF, XLSX, CSV, SCAN
    extraction_status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, CLASSIFIED, EXTRACTED, FAILED
    extracted_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. GL Transactions Table (Normalized Ledger)
CREATE TABLE IF NOT EXISTS gl_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    account_code VARCHAR(50) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    audit_area VARCHAR(100) NOT NULL,
    debit NUMERIC(15, 2) DEFAULT 0.00,
    credit NUMERIC(15, 2) DEFAULT 0.00,
    narration TEXT,
    posted_by VARCHAR(100),
    is_anomaly BOOLEAN DEFAULT FALSE,
    anomaly_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Findings Table
CREATE TABLE IF NOT EXISTS findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    audit_area VARCHAR(100) NOT NULL,
    agent_source VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    risk_level VARCHAR(20) NOT NULL DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH
    evidence_refs JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'AI_DRAFT', -- AI_DRAFT, PENDING_REVIEW, CA_APPROVED, CA_OVERRIDDEN
    override_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Dynamic PBC (Prepared-by-Client) Requests Table
CREATE TABLE IF NOT EXISTS pbc_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    audit_area VARCHAR(100) NOT NULL,
    document_needed VARCHAR(255) NOT NULL,
    trigger_reason TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, UPLOADED, WAIVED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Review & Escalation Queue Table
CREATE TABLE IF NOT EXISTS review_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    finding_id UUID REFERENCES findings(id) ON DELETE CASCADE,
    audit_area VARCHAR(100) NOT NULL,
    escalation_reason TEXT NOT NULL,
    suggested_action TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_REVIEW', -- PENDING_REVIEW, CA_APPROVED, CA_OVERRIDDEN
    decision_note TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. LLM Call Log Table (Audit Trail of AI Calls)
CREATE TABLE IF NOT EXISTS llm_call_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    engagement_id UUID REFERENCES engagements(id) ON DELETE CASCADE,
    task_type VARCHAR(100) NOT NULL,
    model_used VARCHAR(100) NOT NULL,
    input_refs JSONB DEFAULT '{}'::jsonb,
    output_summary TEXT,
    confidence_score NUMERIC(4, 2) DEFAULT 1.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. LLM Routing Config Table
CREATE TABLE IF NOT EXISTS llm_routing_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_type VARCHAR(100) UNIQUE NOT NULL,
    primary_model VARCHAR(100) NOT NULL,
    fallback_model VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Standards Knowledge Base Table (ISA / IFRS / ICAP)
CREATE TABLE IF NOT EXISTS standards_kb (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    standard_id VARCHAR(50) NOT NULL, -- e.g. "ISA 320", "ISA 240", "IFRS 15"
    version VARCHAR(20) NOT NULL DEFAULT '2024.1',
    effective_date DATE,
    title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    guidance_text TEXT NOT NULL,
    source_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Generated Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    engagement_id UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    report_type VARCHAR(100) NOT NULL, -- AUDIT_SUMMARY, MANAGEMENT_LETTER, DISCLOSURE_CHECKLIST, KAM_DRAFT, OPINION_MEMO
    title VARCHAR(255) NOT NULL,
    content_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'AI_DRAFT', -- AI_DRAFT, PENDING_REVIEW, CA_APPROVED, CA_OVERRIDDEN
    ca_signoff_by UUID REFERENCES auth.users(id),
    ca_signoff_at TIMESTAMP WITH TIME ZONE,
    digital_signature_ref VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================================
-- Row Level Security (RLS) Policies
-- ========================================================
ALTER TABLE engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE gl_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pbc_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_call_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Default permissive read/write policies for authenticated engagement members
CREATE POLICY "Allow authenticated user full access on engagements"
    ON engagements FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated user full access on documents"
    ON documents FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated user full access on gl_transactions"
    ON gl_transactions FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated user full access on findings"
    ON findings FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated user full access on pbc_requests"
    ON pbc_requests FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated user full access on review_queue"
    ON review_queue FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated user full access on llm_call_log"
    ON llm_call_log FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated user full access on reports"
    ON reports FOR ALL USING (auth.role() = 'authenticated');

-- ========================================================
-- Seed Initial Routing & Standards Configuration
-- ========================================================

INSERT INTO llm_routing_config (task_type, primary_model, fallback_model, description)
VALUES 
    ('JUDGMENT_STANDARDS_RISK', 'claude-3-5-sonnet', 'gemini-1.5-pro', 'Standards interpretation, risk judgment, materiality reasoning, going concern narrative'),
    ('BULK_NUMERIC_ANALYTICS', 'gemini-1.5-pro', 'claude-3-5-sonnet', 'Bulk numeric ratio analysis, Benfords Law, digit distribution, anomaly detection'),
    ('FAST_TRIAGE_CLASSIFICATION', 'kimi-moonshot-v1', 'claude-3-5-haiku', 'PBC document sorting, OCR text cleanup, contract pre-summarization'),
    ('FINAL_REPORT_SYNTHESIS', 'claude-3-5-sonnet', 'gemini-1.5-pro', 'Final management letter drafting, audit summary synthesis, opinion memo logic')
ON CONFLICT (task_type) DO UPDATE 
SET primary_model = EXCLUDED.primary_model, fallback_model = EXCLUDED.fallback_model;

INSERT INTO standards_kb (standard_id, version, title, summary, guidance_text)
VALUES
    ('ISA 320', '2024.1', 'Materiality in Planning and Performing an Audit', 'Defines overall and performance materiality calculation rules.', 'Materiality must be benchmarked against Financial Statement line items (% Revenue: 0.5-2%, % Profit before Tax: 5-10%, % Total Assets: 0.5-1%). Performance materiality is set at 50-75% of overall materiality.'),
    ('ISA 240', '2024.1', 'The Auditor Responsibilities Relating to Fraud', 'Mandatory fraud risk assessment and journal entry testing.', 'Requires auditors to maintain professional skepticism, perform mandatory management override testing, review unusual journal entries, and evaluate revenue recognition fraud risks.'),
    ('ISA 500', '2024.1', 'Audit Evidence Hierarchy', 'Defines reliability of audit evidence source types.', 'Hierarchy of Evidence Reliability: 1. External Direct Confirmations, 2. External Documents held by entity, 3. Internal Documents, 4. Oral Management Assertions (Cannot close high-risk findings alone).'),
    ('ISA 505', '2024.1', 'External Confirmations', 'Direct third-party verification for Cash, Receivables, and Payables.', 'Auditor must maintain direct control over bank confirmation requests and reconcile responses against general ledger balances.'),
    ('ISA 520', '2024.1', 'Analytical Procedures', 'Evaluation of financial information through analysis of plausible relationships.', 'Includes Year-over-Year trend analysis, ratio analysis, Benfords Law digit testing, and investigation of unexplained material fluctuations.'),
    ('ISA 570', '2024.1', 'Going Concern', 'Assessing management assessment of entity ability to continue as going concern.', 'Auditor must evaluate cash flow forecasts for at least 12 months from reporting date and evaluate liquidity indicators.')
ON CONFLICT DO NOTHING;
