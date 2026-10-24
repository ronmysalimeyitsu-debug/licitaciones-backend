-- =============================================================================
-- Migración 003: Actualizar constraint de estados para permitir FSM y estados terminales
-- Permite los estados del dominio: PENDING, IN_REVIEW, APPROVED, REJECTED, CLOSED, CANCELLED
-- =============================================================================

ALTER TABLE requests
DROP CONSTRAINT IF EXISTS requests_status_check;

ALTER TABLE requests
ADD CONSTRAINT requests_status_check
CHECK (status = ANY (ARRAY[
  'PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'CLOSED', 'CANCELLED',
  'open', 'in_progress', 'resolved', 'closed', 'cancelled'
]));

