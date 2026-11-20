INSERT INTO turnos (id, habilitado) VALUES (101, true), (102, true), (103, false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO pagos (turno_id, confirmado) VALUES (101, true), (102, false), (103, true)
ON CONFLICT (turno_id) DO NOTHING;
