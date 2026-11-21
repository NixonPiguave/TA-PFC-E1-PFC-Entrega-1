# Revisión arquitectónica del esqueleto RTV

**Rol:** Arquitectura.  
**Actividad:** TA-PFC-E1.  
**Fecha:** 20 de noviembre de 2026.

## Flujo comprobado

El cliente envía `POST /inspecciones` con el identificador del turno y una clave de idempotencia. Inspecciones conserva esa clave y solicita autorización a Turnos y Pagos mediante `POST /turnos/{turnoId}/autorizaciones-inspeccion`.

Turnos y Pagos comprueba el turno, su habilitación y el pago confirmado. Guarda la autorización en su base y devuelve su identificador. Inspecciones utiliza esa respuesta para guardar el inicio en su propia base. La misma clave permite recuperar la operación sin duplicar los registros.

## Correspondencia con el C4 y los ADR

| Elemento del diseño | Implementación revisada |
| --- | --- |
| Dos servicios Java Spring Boot | Módulos `src/turnos-pagos/` y `src/inspecciones/`, compilados como aplicaciones independientes. |
| Inspecciones llama a Turnos y Pagos | `ClienteTurnos.java` realiza la petición HTTP con JSON, token y clave de idempotencia. |
| Comunicación síncrona del proceso | Inspecciones espera la autorización antes de guardar el inicio, aunque el cliente HTTP utilice `sendAsync`. |
| Una base por servicio | `rtv_turnos_pagos` y `rtv_inspecciones`, con usuarios y configuración separados. |
| Unicidad de autorizaciones e inspecciones | Restricciones de unicidad, bloqueo del turno y reconocimiento de la clave de operación. |
| Recuperación entre dos transacciones locales | El reintento recupera la autorización existente y completa el registro local. |
| Cliente web de la arquitectura propuesta | El esqueleto se prueba mediante peticiones HTTP; la integración de la interfaz completa queda fuera del intercambio mínimo de E1. |

## Resultados de ejecución

La compilación de los tres módulos finalizó correctamente con Java 21 y Spring Boot 4.0.1. Se ejecutó `pruebas/integracion.mjs` en una copia limpia, con bases de prueba PostgreSQL 18 independientes del RTV existente.

El entorno de prueba utilizó los puertos HTTP 18081 y 18082, PostgreSQL en 55432 y el ejecutable directo del JDK 21. La llamada se configuró con un límite de espera de tres segundos.

| Caso ejecutado | Resultado |
| --- | --- |
| Inicio válido y vínculo persistido entre los registros | Correcto. |
| Turno inexistente | `404 TURNO_INEXISTENTE`, sin autorización ni inspección. |
| Pago pendiente | `409 PAGO_NO_CONFIRMADO`; el pago sigue sin confirmar. |
| Turno no habilitado | `409 TURNO_NO_HABILITADO`, sin inicio. |
| Reintento y reutilización de clave con otro turno | Se conserva la operación original y se rechaza el cambio de turno. |
| Solicitudes simultáneas con claves iguales y distintas | Una sola autorización y una sola inspección por turno. |
| Servicio detenido y respuesta demorada después de guardar | `503` o `504`; el reintento recupera la autorización existente. |
| Credencial ausente o incorrecta entre servicios | `401 CREDENCIAL_INVALIDA`, sin autorización. |
| Reinicio de ambas aplicaciones | Se conservan los identificadores y los datos persistidos. |
| Fallo de escritura local en Inspecciones | Se conserva la autorización y el reintento completa el inicio. |

Los diez casos finalizaron correctamente. El registro original está en [resultado-integracion-kevin.txt](resultado-integracion-kevin.txt).

## Diferencias que debe recoger el contrato

El comportamiento de autorización coincide con el flujo del diseño. La versión 0.1 del contrato propone algunos detalles distintos de la interfaz implementada:

| Aspecto | Contrato 0.1 | Implementación comprobada |
| --- | --- | --- |
| Cuerpo de la autorización | Petición sin cuerpo. | `Content-Type: application/json` y cuerpo `{}`. |
| Identificador de autorización | Ejemplo `aut-000123`. | Cadena con UUID. |
| Respuesta de Turnos y Pagos | Incluye estado, estado de pago y fecha, además de identificadores. | Devuelve `autorizacionId` y `turnoId`. |
| Turno inexistente | `TURNO_NO_ENCONTRADO`. | `TURNO_INEXISTENTE`. |
| Otra clave para un turno autorizado | `AUTORIZACION_EXISTENTE`. | `TURNO_YA_AUTORIZADO`. |
| Credencial inválida | `NO_AUTENTICADO`. | `CREDENCIAL_INVALIDA`. |
| Cuerpo de error | Código y mensaje, con turno opcional. | Objeto con el campo `codigo`. |
| Formato de la clave | Se propone UUID. | Entre 1 y 128 caracteres: letras ASCII, números, punto, guion y guion bajo. |
| Reserva de clave | Conservación antes del envío. | Ambos servicios reservan la clave antes del procesamiento y mantienen su asociación al turno incluso si la operación posterior falla. |

Para E1 propongo ajustar el contrato a la respuesta mínima comprobada y a los códigos que usan ambos servicios. Si mantenemos los campos adicionales de la versión 0.1, también deben incorporarse al código.

## Criterio de arquitectura

Mantengo la separación de servicios porque cada uno controla sus datos y sus reglas. Como las escrituras se confirman en bases distintas, puede quedar una autorización guardada antes de registrar la inspección. El reintento con la misma clave permite completar ese registro sin duplicarlo.

Si Turnos y Pagos no responde, el nuevo inicio se detiene hasta obtener autorización. Prefiero esa espera antes que iniciar una revisión sin confirmar el pago. Las pruebas comprueban este comportamiento entre servicios. El análisis CAP/PACELC de futuras réplicas corresponde a la evolución de la arquitectura.

La elección de REST se basa en el intercambio de autorización y en el contrato HTTP/JSON. Los resultados TCP de PE-U1 sirven para discutir el costo de comunicación y la concurrencia, pero no miden esta API REST.

## Documentos relacionados

- [Contrato REST](../contratos/contrato-inspecciones-turnos-pagos.md).
- [Modelo de comunicación](modelo-comunicacion.md).
- [CAP y PACELC](analisis-cap-pacelc.md).
- [ADR-001](../adr/ADR-001-estilo-arquitectura.md).
- [ADR-002](../adr/ADR-002-comunicacion.md).
- [C4 de contenedores](../diagramas/c4-contenedores-rtv-final.drawio).

## Declaración de IA

Utilicé ChatGPT Sol 6.1 mediante Codex como apoyo para preparar la revisión de arquitectura, contrastar los documentos y organizar los resultados. La compilación y las pruebas de integración se ejecutaron desde Codex en un entorno de prueba independiente.
