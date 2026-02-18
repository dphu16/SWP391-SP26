-- =====================================================================
-- Employee Change Requests Table
-- Stores pending/approved/rejected change requests for employee data
-- =====================================================================

CREATE TABLE IF NOT EXISTS employee_change_requests (
    id              UUID            DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id     UUID            NOT NULL,
    old_data        JSONB           NOT NULL,
    new_data        JSONB           NOT NULL,
    status          VARCHAR(20)     NOT NULL DEFAULT 'PENDING',
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    created_by      UUID,
    approved_at     TIMESTAMPTZ,
    approved_by     UUID,

    CONSTRAINT fk_ecr_employee
        FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_ecr_status
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_ecr_employee_id ON employee_change_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_ecr_status ON employee_change_requests(status);

-- Composite index for the common lookup: pending requests per employee
CREATE INDEX IF NOT EXISTS idx_ecr_employee_pending
    ON employee_change_requests(employee_id)
    WHERE status = 'PENDING';

COMMENT ON TABLE employee_change_requests IS 'Stores employee self-service change requests requiring HR approval';
COMMENT ON COLUMN employee_change_requests.old_data IS 'Snapshot of current employee data at request time (JSONB)';
COMMENT ON COLUMN employee_change_requests.new_data IS 'Proposed new values requested by employee (JSONB)';
