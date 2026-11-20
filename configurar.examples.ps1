$env:PGHOST = '127.0.0.1'
$env:PGPORT = '55432'
$env:TURNOS_DB_USER = 'e1_turnos'
$env:INSPECCIONES_DB_USER = 'e1_inspecciones'
$env:TURNOS_DB_URL = "jdbc:postgresql://${env:PGHOST}:${env:PGPORT}/rtv_turnos_pagos"
$env:INSPECCIONES_DB_URL = "jdbc:postgresql://${env:PGHOST}:${env:PGPORT}/rtv_inspecciones"
$env:TURNOS_PORT = '8081'
$env:INSPECCIONES_PORT = '8082'
$env:TURNOS_URL = "http://127.0.0.1:$env:TURNOS_PORT"
$env:TURNOS_TIMEOUT = '3s'

//Definir TURNOS_DB_PASSWORD, INSPECCIONES_DB_PASSWORD y RTV_SERVICE_TOKEN en la sesión.
