# Contrato REST: autorización para iniciar una inspección

**Proyecto:** Sistema de Revisión Técnica Vehicular (RTV)  
**Actividad:** TA-PFC-E1 — PFC Entrega 1  
**Versión:** 0.1  
**Estado:** Borrador para revisión conjunta  
**Responsables:** Kevin García — arquitectura; Diego Giraldo — desarrollo.

## 1. Objetivo

Definir la comunicación mediante la cual el servicio de Inspecciones solicita al servicio de Turnos y Pagos una autorización para iniciar la revisión de un vehículo.

La propuesta separa ambos servicios y sus bases de datos. Inspecciones no consulta directamente las tablas de Turnos y Pagos.

## 2. Responsabilidades

| Servicio | Responsabilidad |
|---|---|
| Turnos y Pagos | Verificar la existencia y habilitación del turno, comprobar su pago y registrar la autorización de inicio. |
| Inspecciones | Solicitar la autorización y, únicamente después de recibirla, registrar la inspección en su propia base de datos. |

La autorización no realiza ni confirma un pago. Consulta el estado de pago previamente registrado.

## 3. Tecnologías propuestas

- Servicios: Java y Spring Boot.
- Comunicación: REST con HTTP y JSON.
- Persistencia: PostgreSQL, con una base de datos y credenciales independientes por servicio.
- HTTP sin cifrado se utilizará únicamente en el entorno local de demostración. Para un despliegue fuera de ese entorno se deberá configurar HTTPS.

Las direcciones, puertos y credenciales se definirán mediante configuración, sin escribir secretos en el repositorio.

## 4. Operación entre servicios

**Servicio consumidor:** Inspecciones.  
**Servicio proveedor:** Turnos y Pagos.

**Método:** `POST`  
**Ruta:** `/turnos/{turnoId}/autorizaciones-inspeccion`

Se utiliza POST porque la operación crea una autorización persistente; no se limita a consultar el pago.

### Parámetro de ruta

| Campo | Tipo | Descripción |
|---|---|---|
| `turnoId` | Entero positivo | Identificador del turno que se desea inspeccionar. |

### Cabeceras

| Cabecera | Uso |
|---|---|
| `Accept: application/json` | Solicita respuestas JSON. |
| `Idempotency-Key` | Identificador único de la operación, generado por Inspecciones y conservado durante sus reintentos. Se propone utilizar un UUID. |
| `Authorization: Bearer <token>` | Credencial del servicio consumidor. El valor real se configura fuera del repositorio. |

La petición no necesita cuerpo: el turno está identificado en la ruta y el consumidor se identifica mediante su credencial.

### Ejemplo de petición

POST /turnos/123/autorizaciones-inspeccion  
Accept: application/json  
Idempotency-Key: 6d243573-882e-4f8e-b858-a801391e5d91  
Authorization: Bearer <credencial-del-servicio>

Los identificadores de este documento son ficticios.

## 5. Validaciones

Turnos y Pagos deberá comprobar:

1. Que la credencial del consumidor sea válida.
2. Que la clave de idempotencia esté presente y tenga el formato acordado.
3. Que el turno exista.
4. Que el pago esté confirmado.
5. Que el turno esté habilitado para iniciar la inspección.
6. Que no exista una autorización previa para ese turno que impida crear otra.

Para el prototipo se propone permitir una sola autorización de inicio por turno. Si el RTV permite reinspecciones, deberán modelarse como operaciones diferenciadas y actualizar este contrato.

La validación y la creación de la autorización deberán protegerse mediante una transacción y restricciones en la base de datos para evitar duplicados ante solicitudes simultáneas.

## 6. Respuesta exitosa

### Nueva autorización

**Código HTTP:** `201 Created`

Ejemplo JSON:

{
  "autorizacionId": "aut-000123",
  "turnoId": 123,
  "estado": "AUTORIZADA",
  "pagoEstado": "CONFIRMADO",
  "fechaAutorizacion": "2026-11-18T20:00:00Z"
}

| Campo | Descripción |
|---|---|
| `autorizacionId` | Identificador único de la autorización. |
| `turnoId` | Turno autorizado. |
| `estado` | Resultado de la autorización. |
| `pagoEstado` | Estado del pago comprobado al emitir la autorización. |
| `fechaAutorizacion` | Fecha y hora en formato ISO 8601 con zona horaria. |

### Reintento de una operación ya completada

Si se recibe la misma clave de idempotencia para el mismo turno, se devolverá **`200 OK`**, con la autorización previamente creada.

No se creará una segunda autorización.

## 7. Respuestas de error

Los errores se devolverán en JSON con esta estructura:

{
  "codigo": "PAGO_NO_CONFIRMADO",
  "mensaje": "El turno no tiene un pago confirmado.",
  "turnoId": 123
}

Cuando no corresponda o no se conozca el turno, el campo `turnoId` podrá omitirse.

| HTTP | Código de aplicación | Significado |
|---|---|---|
| `400` | `SOLICITUD_INVALIDA` | Identificador incorrecto o clave de idempotencia ausente o inválida. |
| `401` | `NO_AUTENTICADO` | Credencial ausente o inválida. |
| `403` | `ACCESO_DENEGADO` | Consumidor autenticado sin permiso para esta operación. |
| `404` | `TURNO_NO_ENCONTRADO` | El turno solicitado no existe. |
| `409` | `PAGO_NO_CONFIRMADO` | El pago todavía no está confirmado. |
| `409` | `TURNO_NO_HABILITADO` | El estado del turno impide iniciar la inspección. |
| `409` | `AUTORIZACION_EXISTENTE` | Ya existe una autorización para el turno asociada a otra operación. |
| `409` | `CLAVE_REUTILIZADA` | La misma clave de idempotencia se utilizó para un turno diferente. |
| `500` | `ERROR_INTERNO` | El proveedor no pudo completar la operación por un fallo interno. |

Los mensajes no expondrán contraseñas, consultas SQL ni detalles internos del servidor.

## 8. Idempotencia y concurrencia

Inspecciones deberá conservar la clave de idempotencia asociada a la operación antes de realizar la llamada.

- Misma clave y mismo turno: devolver la autorización existente.
- Misma clave y otro turno: rechazar con `409 CLAVE_REUTILIZADA`.
- Otra clave para un turno ya autorizado: rechazar con `409 AUTORIZACION_EXISTENTE`.
- Solicitudes simultáneas: las restricciones de persistencia deberán impedir la creación de autorizaciones duplicadas.

Inspecciones también deberá evitar que los reintentos generen más de una inspección activa para el mismo turno.

La clave y el resultado de las autorizaciones emitidas se conservarán en la base de datos durante el prototipo.

## 9. Fallos de comunicación

Se propone configurar inicialmente un tiempo máximo de espera de **3 segundos** para la llamada REST. Este valor es configurable y no representa una garantía de rendimiento del proveedor.

Si ocurre una desconexión o se agota el tiempo de espera:

1. Inspecciones no registrará el inicio como autorizado.
2. Informará: “No se pudo confirmar la autorización. Intente nuevamente”.
3. No cambiará el estado del pago.
4. Conservará la clave de idempotencia.
5. Un reintento utilizará la misma clave y el mismo turno.

Una respuesta perdida no demuestra que el proveedor haya rechazado la operación: la autorización podría haberse guardado antes del fallo de comunicación.

Para el prototipo, los reintentos serán explícitos; no se realizarán reintentos automáticos ilimitados.

## 10. Registro local y recuperación

Después de recibir una autorización válida, Inspecciones registrará, como mínimo:

- Identificador de la inspección.
- Identificador del turno.
- Identificador de la autorización.
- Estado de la inspección.
- Fecha y hora de inicio.

Las escrituras en las dos bases de datos no forman una transacción única.

Si Turnos y Pagos guarda la autorización, pero Inspecciones falla antes de registrar su inspección, se repetirá la solicitud con la misma clave. El proveedor devolverá la autorización existente y el consumidor podrá completar el registro local sin duplicarlo.

Este prototipo demuestra una autorización de inicio. La cancelación, revocación de autorizaciones y coordinación de cambios posteriores de pago requieren reglas adicionales y quedan fuera de esta versión.

## 11. Verificación del contrato

| Caso | Resultado esperado |
|---|---|
| Turno existente, pagado y habilitado | `201`; una autorización y una inspección vinculada. |
| Repetición con misma clave y turno | `200`; mismos identificadores y sin duplicados. |
| Misma clave para otro turno | `409 CLAVE_REUTILIZADA`. |
| Turno inexistente | `404`; sin autorización ni inspección. |
| Pago sin confirmar | `409 PAGO_NO_CONFIRMADO`; sin autorización ni inspección. |
| Turno no habilitado | `409 TURNO_NO_HABILITADO`; sin autorización ni inspección. |
| Solicitudes simultáneas para el mismo turno | Una sola autorización y ninguna inspección activa duplicada. |
| Credencial ausente o inválida | `401`; sin modificaciones de datos. |
| Proveedor detenido o demorado | Error controlado en Inspecciones; no iniciar la inspección. |
| Fallo después de guardar la autorización | El reintento recupera la misma autorización y permite completar el registro local. |

Esta tabla define resultados esperados. No constituye evidencia de pruebas ejecutadas.
