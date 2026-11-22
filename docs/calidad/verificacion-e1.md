# Verificación de Calidad de E1

La comprobación comenzó el 21-11-2026 a las 21:47:02, hora de Ecuador (UTC-5), sobre un clon nuevo del commit [877bb16](https://github.com/NixonPiguave/TA-PFC-E1-PFC-Entrega-1/tree/877bb16de24e18f6d5ae470844603142028425d0). Las fechas UTC del registro comienzan el 22 de noviembre y corresponden a la misma ejecución local del día 21. El inventario de Git al comenzar no tenía modificaciones en archivos rastreados. Los servicios, el contrato, las pruebas existentes y la bibliografía se conservaron sin cambios.

## Resultado de la comprobación

`mvn package` terminó con código 0. Los diez casos de `node pruebas/integracion.mjs` terminaron con código 0. El verificador complementario `node pruebas/verificar-rnf.mjs` comprobó los siguientes casos:

| Requisito | Resultado observado |
|---|---|
| RNF-01 | 100 solicitudes medidas y 10 de calentamiento por concurrencia; 330 respuestas HTTP 201 y vínculos correctos en ambas bases. El criterio de 100 ms estaba fijado antes de esta ejecución. |
| RNF-02 | Servicio detenido: 503; respuesta demorada: 504. Sin inspección antes del reintento. Recuperación con la misma clave. |
| RNF-03 | Tres casos por cada condición inválida: nueve rechazos sin autorización válida ni inspección. Control válido: 201. |
| RNF-04 | Creación inicial y diez reintentos: una autorización y una inspección. Dos peticiones simultáneas con claves distintas: una creación y un rechazo controlado. |
| RNF-05 | Diez inspecciones y sus diez autorizaciones conservaron identificadores, vínculos y estados tras reiniciar ambos servicios y PostgreSQL. |
| RNF-06 | Cinco solicitudes sin credencial y cinco incorrectas: diez respuestas 401 sin cambios de negocio. Control válido: 201. |
| R-02 | Respaldo lógico de ambas bases y restauración en bases nuevas; comparación idéntica del contenido de todas las tablas. No se mide RTO/RPO ni pérdida física. |

| Usuarios simultáneos | Solicitudes medidas | p95 observado (ms) | Errores |
|---|---|---|---|
| 1 | 100 | 14,303 | 0 % |
| 5 | 100 | 26,562 | 0 % |
| 10 | 100 | 54,367 | 0 % |

Es una corrida por escenario en el equipo y entorno registrados. No es una prueba de capacidad sostenida ni una garantía para otro despliegue. Las respuestas, mediciones e inventarios originales se conservan en `evidencias/verificacion-calidad/`; `entorno.json` identifica código, versiones, equipo, puertos y la huella del verificador. La medición inicial del 20 de noviembre no se reemplaza.

## Trazabilidad de RF-01 a RF-05

La encuesta publicada tiene 17 respuestas. Sus preguntas se identifican como E1 a E11 en el informe. Se distingue la necesidad expresada de los criterios técnicos definidos para hacerla comprobable.

| Requisito | Origen disponible | Comprobación de origen pendiente |
|---|---|---|
| RF-01: autenticación | Código previo de ingreso y propuesta técnica de acceso del personal. | Confirmación del responsable del centro sobre cuentas, acceso y estados de usuario. La encuesta no pregunta por credenciales. |
| RF-02: asignación de roles | Código previo de usuarios y roles; cargos descritos en el contexto. | Confirmar quién asigna roles y las reglas de actualización. No se deduce esa aceptación de la existencia de cargos. |
| RF-03: permisos por rol | Código previo de privilegios y conexión por usuario. | Acordar una matriz de operaciones y cargos con el responsable del centro. La encuesta no define permisos internos. |
| RF-04: auditoría | E11 contiene una solicitud de un módulo de auditorías. Respalda la necesidad general de esta función. | Confirmar los campos, filtros, permisos y protección del historial, especificados como propuesta técnica. Una respuesta abierta no equivale a aprobar todos esos criterios. |
| RF-05: placa del vehículo | Código previo de ficha vehicular y normas citadas en el informe. | Confirmar formatos y regla de duplicados por período. La encuesta no recoge esas reglas. |

La validación con el responsable del dominio se documentará cuando exista evidencia de sus respuestas; estos resultados no se presentan como una aceptación que no está registrada. E7, E8 y E10 sí orientan los RNF sobre pago sin confirmar, reintentos y fallos de conexión; no fijan los umbrales de tiempo ni las cantidades de prueba.

## Reproducción del verificador complementario

Usar JDK 21, Maven 3.9.x, Node.js 22 o posterior y PostgreSQL con `initdb`, `pg_ctl`, `psql`, `pg_dump` y `pg_restore` en PATH. En Windows se usaron JDK 21.0.13.1, Node.js 24.15.0 y PostgreSQL 18.1. El código se compiló desde el clon indicado. La regeneración del informe se comprueba por separado con pdfLaTeX, Biber y las repeticiones de pdfLaTeX necesarias para estabilizar las referencias.

En Windows, si la ubicación del clon produce errores por nombres de anexos largos, clonar con `git -c core.longpaths=true clone URL RUTA` y activar `git config core.longpaths true` dentro de esa copia. No hace falta cambiar la configuración global.

Preparar un clúster exclusivamente ficticio y puertos libres. El verificador reinicia ese clúster y crea dos bases adicionales para restaurar respaldos. No usar una instalación con datos reales. Ejecutar desde la raíz de una copia de la entrega que incluya el nuevo verificador:

```powershell
New-Item -ItemType Directory -Force .local | Out-Null
initdb -D .local/pg-calidad -U postgres -W -A scram-sha-256 --locale=C --encoding=UTF8
pg_ctl -D .local/pg-calidad -l .local/postgresql-calidad.log -o '-p 55433 -h 127.0.0.1 -c max_connections=30' -w start
. .\configurar.examples.ps1
$env:PGPORT = '55433'
$env:TURNOS_PORT = '18081'
$env:INSPECCIONES_PORT = '18082'
$env:TURNOS_URL = 'http://127.0.0.1:18081'
$env:TURNOS_DB_URL = 'jdbc:postgresql://127.0.0.1:55433/rtv_turnos_pagos'
$env:INSPECCIONES_DB_URL = 'jdbc:postgresql://127.0.0.1:55433/rtv_inspecciones'
$env:TURNOS_DB_PASSWORD = [guid]::NewGuid().ToString('N')
$env:INSPECCIONES_DB_PASSWORD = [guid]::NewGuid().ToString('N')
$env:RTV_SERVICE_TOKEN = [guid]::NewGuid().ToString('N')
$env:PGPASSWORD = [Net.NetworkCredential]::new('', (Read-Host 'Contraseña del administrador del clúster ficticio' -AsSecureString)).Password
psql -Xw -v ON_ERROR_STOP=1 -U postgres -d postgres -f db/preparar.sql
mvn package
node pruebas/integracion.mjs
$env:RTV_BASES_DE_PRUEBA = 'SI'
$env:RTV_REINICIAR_CLUSTER_PRUEBA = 'SI'
$env:RTV_PGDATA = (Resolve-Path .local/pg-calidad).Path
$env:PG_CTL = (Get-Command pg_ctl).Source
$env:RTV_SALIDA = '.local/resultados-calidad'
node pruebas/verificar-rnf.mjs
pg_ctl -D .local/pg-calidad -m fast -w stop
Remove-Item Env:PGPASSWORD
```

Si un comando falla, revisar su salida antes de continuar. No sobrescribir los resultados publicados con una corrida nueva: conservar otra carpeta de salida. Las aplicaciones iniciadas por las suites se detienen al finalizar; los respaldos se guardan dentro de `.local/` y no se incluyen en el repositorio público. El verificador conserva respuestas sin credenciales y no publica los valores secretos de sesión.
