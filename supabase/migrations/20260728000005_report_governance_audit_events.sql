-- Report governance audit events for issue #41 TSE workflow (dual control, assignment, SLA escalation, exports).

ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'report_rejected';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'report_assigned';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'report_pending_second_approval';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'report_second_approved';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'report_sla_escalated';
ALTER TYPE audit_event_type ADD VALUE IF NOT EXISTS 'report_exported';
