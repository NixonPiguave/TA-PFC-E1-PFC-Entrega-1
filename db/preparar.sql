\set ON_ERROR_STOP on
\getenv turnos_password TURNOS_DB_PASSWORD
\getenv inspecciones_password INSPECCIONES_DB_PASSWORD

CREATE ROLE e1_turnos LOGIN PASSWORD :'turnos_password';
CREATE ROLE e1_inspecciones LOGIN PASSWORD :'inspecciones_password';
CREATE DATABASE rtv_turnos_pagos OWNER e1_turnos;
CREATE DATABASE rtv_inspecciones OWNER e1_inspecciones;
REVOKE CONNECT ON DATABASE rtv_turnos_pagos FROM PUBLIC;
REVOKE CONNECT ON DATABASE rtv_inspecciones FROM PUBLIC;
