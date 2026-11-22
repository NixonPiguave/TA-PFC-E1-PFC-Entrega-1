# TA-PFC-E1 · Revisión Técnica Vehicular

Primera entrega del Proyecto Fin de Curso de Aplicaciones Distribuidas. Este repositorio reúne el informe, el diseño de arquitectura, el esqueleto funcional y las evidencias del Sistema de Revisión Técnica Vehicular (RTV).

El esqueleto demuestra el inicio de una inspección. El servicio de **Inspecciones** solicita autorización por REST a **Turnos y Pagos**, que verifica que el turno exista, esté habilitado y tenga un pago confirmado. Una vez recibida la autorización, Inspecciones registra el inicio en su propia base de datos. Ambos servicios usan Java, Spring Boot y bases PostgreSQL independientes.

El desarrollo de la aplicación RTV, incluido el frontend Angular, se encuentra en el [repositorio principal AppWebRevisionVehicular](https://github.com/NixonPiguave/AppWebRevisionVehicular). Este repositorio contiene el trabajo y las evidencias de la entrega académica.

## Integrantes

| Integrante | Rol |
|---|---|
| Kevin Garcia | Arquitecto |
| Diego Giraldo | Líder de Desarrollo |
| Nixon Piguave | Responsable de Calidad |
| Allison Mera Jumbo | Responsable de Documentación |

## Documentación y evidencias

| Recurso | Contenido |
|---|---|
| [Informe PDF](docs/informe.pdf) | Documento compilado de la entrega. |
| [Informe LaTeX](docs/informe.tex) y [bibliografía](docs/referencias.bib) | Archivos fuente del informe. |
| [Diagramas C4](docs/diagramas/) | Diagramas de contexto y contenedores, con los archivos editables de draw.io. |
| [Decisiones de arquitectura](docs/adr/) | ADR-001 sobre el estilo de arquitectura y ADR-002 sobre la comunicación entre servicios. |
| [Contrato REST](docs/contratos/contrato-inspecciones-turnos-pagos.md) | Peticiones, respuestas, idempotencia y tratamiento de fallos. |
| [Pruebas](pruebas/) y [evidencias](evidencias/) | Suite de integración, capturas y registros de rendimiento. |
| [Bitácora](BITACORA.md) y [tablero](https://github.com/users/NixonPiguave/projects/1) | Avances, aportes y seguimiento de tareas. |

## Ejecutar el esqueleto

### Requisitos

- JDK 21 y Maven 3.9.x.
- PostgreSQL con `initdb`, `pg_ctl` y `psql` disponibles en `PATH`. La demostración se verificó con PostgreSQL 18.
- Node.js 22 o posterior para la suite de integración.
- `curl` para la demostración manual.

Los comandos siguientes usan PowerShell y se ejecutan desde la raíz del repositorio.

| Componente | Dirección local |
|---|---|
| Turnos y Pagos | `http://127.0.0.1:8081` |
| Inspecciones | `http://127.0.0.1:8082` |
| PostgreSQL de demostración | `127.0.0.1:55432` |

### 1. Preparar PostgreSQL

Para crear un clúster dedicado a la demostración:

```powershell
New-Item -ItemType Directory -Force .local | Out-Null
initdb -D .local/pg -U postgres -W -A scram-sha-256 --locale=C --encoding=UTF8
pg_ctl -D .local/pg -l .local/postgres.log -o '-p 55432 -h 127.0.0.1' start
```

`initdb -W` pide la contraseña del administrador local. Carga la configuración y genera dos contraseñas para las bases y un token compartido para la comunicación entre servicios:

```powershell
. .\configurar.examples.ps1
$env:TURNOS_DB_PASSWORD = [guid]::NewGuid().ToString('N')
$env:INSPECCIONES_DB_PASSWORD = [guid]::NewGuid().ToString('N')
$env:RTV_SERVICE_TOKEN = [guid]::NewGuid().ToString('N')
psql -X -U postgres -d postgres -f db/preparar.sql
```

Ejecuta `db/preparar.sql` una vez por clúster nuevo. El script crea `rtv_turnos_pagos` y `rtv_inspecciones` con roles independientes. Cada aplicación inicializa sus tablas mediante su propio `schema.sql` al arrancar. Si reutilizas el clúster, usa las mismas contraseñas con las que creaste los roles.

### 2. Compilar y arrancar

```powershell
mvn package
```

Arranca cada JAR en una terminal distinta. Ambas terminales deben tener las variables de entorno del paso anterior y usar el mismo `RTV_SERVICE_TOKEN`. Puedes abrirlas desde la sesión configurada para que hereden las variables.

**Turnos y Pagos**

```powershell
java -jar src/turnos-pagos/target/turnos-pagos-1.0.0-SNAPSHOT.jar
```

**Inspecciones**

```powershell
java -jar src/inspecciones/target/inspecciones-1.0.0-SNAPSHOT.jar
```

### 3. Cargar datos ficticios y probar

Una vez que Turnos y Pagos esté en ejecución, carga los turnos y pagos de demostración:

```powershell
$env:PGPASSWORD = $env:TURNOS_DB_PASSWORD
psql -X -v ON_ERROR_STOP=1 -U $env:TURNOS_DB_USER -d rtv_turnos_pagos -f src/turnos-pagos/db/demo.sql
Remove-Item Env:PGPASSWORD
```

Envía una solicitud de inicio para el turno ficticio `101`:

```powershell
'{"turnoId":101}' | curl.exe -i http://127.0.0.1:8082/inspecciones -H 'Content-Type: application/json' -H 'Idempotency-Key: demo-101' --data-binary '@-'
```

En una base nueva, la primera solicitud devuelve **HTTP 201** con `inspeccionId`, `turnoId`, `autorizacionId` y `estado`. Al repetir el mismo comando, devuelve **HTTP 200** con los mismos identificadores. El turno `102` permite demostrar el rechazo por pago pendiente.

### 4. Ejecutar la suite de integración

Detén los dos JAR iniciados manualmente, conserva PostgreSQL en ejecución y ejecuta la suite desde la sesión configurada:

```powershell
node pruebas/integracion.mjs
```

La suite arranca y detiene ambos servicios y prepara sus propios datos ficticios. Comprueba el inicio correcto, los rechazos de negocio, los reintentos, las solicitudes simultáneas, la caída y demora de Turnos y Pagos, las credenciales inválidas, la persistencia tras reiniciar y la recuperación de una escritura interrumpida. Si `psql` está fuera de `PATH`, define `PSQL` con la ruta de su ejecutable.

Las evidencias funcionales y los resultados de la medición inicial de rendimiento están en [evidencias/](evidencias/). Los datos y condiciones de la medición se documentan en [evidencias/rendimiento/](evidencias/rendimiento/).

## Compilar el informe

El archivo principal es [`docs/informe.tex`](docs/informe.tex). Usa una distribución LaTeX con **pdfLaTeX**, **Biber**, soporte de `babel` para español y los paquetes del preámbulo, entre ellos `biblatex` con estilo IEEE, `xltabular`, `booktabs`, `graphicx` e `hyperref`. Una instalación completa de TeX Live incluye estas dependencias.

Desde la raíz del repositorio, ejecuta:

```powershell
cd docs
pdflatex informe.tex
biber informe
pdflatex informe.tex
pdflatex informe.tex
```

El resultado es `docs/informe.pdf`. Compila con el repositorio completo para conservar las rutas de las figuras, las evidencias y la bibliografía.

## Video de demostración

[Ver el video de la entrega](https://youtu.be/96_kZjtRLuc)
