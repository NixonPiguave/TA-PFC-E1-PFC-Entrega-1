# ADR-002 — Comunicación REST para autorizar el inicio de una inspección

- **Estado:** Aceptado para el esqueleto E1 por arquitectura y desarrollo, 20 de noviembre de 2026.
- **Autor:** Kevin García.
- **Actividad:** TA-PFC-E1 — PFC Entrega 1.

## Contexto

Inspecciones necesita obtener una autorización de Turnos y Pagos antes de registrar el inicio de una revisión.

Turnos y Pagos es responsable de comprobar la existencia del turno, su habilitación y la confirmación del pago. Inspecciones no debe consultar directamente su base de datos.

La comunicación puede fallar, demorarse o perder una respuesta después de que la autorización haya sido guardada. Por ello, el diseño debe contemplar reintentos sin duplicar operaciones.

## Decisión

Utilizar comunicación síncrona mediante REST con HTTP y JSON entre los servicios Java Spring Boot.

Inspecciones realizará la siguiente petición a Turnos y Pagos:

**POST /turnos/{turnoId}/autorizaciones-inspeccion**

Se utilizará POST porque la operación crea una autorización persistente. No es únicamente una consulta del estado del pago.

La petición incluirá:

- Identificador del turno en la ruta.
- Cabecera `Idempotency-Key`, conservada durante los reintentos.
- Credencial del servicio consumidor en la cabecera `Authorization`.
- `Content-Type: application/json` y cuerpo `{}`.
- Identificador `X-Request-Id` para relacionar los registros de la llamada.

La autorización devuelve `autorizacionId` como UUID y `turnoId`: `201` cuando se crea y `200` al recuperar la misma operación. Los errores incluyen el campo `codigo`. Los formatos y códigos exactos se detallan en la versión 0.2 del contrato REST.

HTTP sin cifrado se utilizará únicamente en el entorno local de demostración. Un despliegue fuera de ese entorno requerirá HTTPS.

## Justificación

El flujo necesita una respuesta antes de continuar: Inspecciones no debe iniciar la revisión mientras la autorización no esté confirmada.

REST permite implementar y demostrar este intercambio con las tecnologías seleccionadas. HTTP y JSON también facilitan inspeccionar las peticiones y respuestas mediante herramientas como curl o Postman.

Se mantiene un contrato explícito para evitar que Inspecciones dependa de la estructura interna de la base de datos de Turnos y Pagos.

Esta elección no implica que REST sea siempre superior a otros mecanismos. Responde al alcance y a las necesidades de este prototipo.

## Alternativas consideradas

| Alternativa | Ventajas | Motivo para no elegirla |
|---|---|---|
| REST síncrono con HTTP y JSON | Permite obtener una decisión inmediata y comprobar el intercambio con herramientas sencillas. | Alternativa elegida, aceptando la dependencia temporal entre servicios. |
| gRPC | Ofrece contratos tipados mediante Protocol Buffers y generación de clientes. | No se ha identificado una necesidad que justifique incorporar ese contrato y sus herramientas al prototipo. |
| Mensajería asíncrona | Permite desacoplar temporalmente servicios y procesar solicitudes cuando el consumidor esté disponible. | Requeriría gestionar estados pendientes, correlación y entrega de mensajes. No se selecciona para este flujo de autorización inmediata. |

Las mediciones TCP de PE-U1 permiten analizar el costo de comunicación y la concurrencia. Corresponden a otro protocolo de aplicación y no miden esta API REST; la elección se fundamenta en el contrato y en la integración del prototipo.

## Tiempo de espera y fallos

Se configura `TURNOS_TIMEOUT` inicialmente en **3 segundos** para la llamada REST. Inspecciones distingue falta de disponibilidad (`503`), tiempo agotado (`504`) y respuesta inválida (`502`).

Este valor limita la espera del consumidor; no garantiza que el proveedor responda dentro de ese plazo.

Si el proveedor no responde o se pierde la conexión:

1. Inspecciones no registrará el inicio como autorizado.
2. Informará que no pudo confirmar la autorización.
3. No modificará el estado del pago.
4. Mantendrá la clave de idempotencia para un reintento seguro.

Un fallo de comunicación no demuestra que la autorización no exista. El proveedor podría haberla guardado antes de perderse la respuesta.

El prototipo utiliza reintentos explícitos con la misma clave y el mismo turno.

## Idempotencia y prevención de duplicados

Inspecciones conserva la clave antes de enviar la petición. Ambos servicios reservan su asociación al turno antes del procesamiento y la mantienen aunque falle un paso posterior. La clave admite de 1 a 128 caracteres: letras ASCII, números, punto, guion y guion bajo.

Turnos y Pagos aplicará estas reglas:

- Misma clave y mismo turno: devolver la autorización previamente creada.
- Misma clave y otro turno: rechazar la reutilización.
- Otra clave para un turno ya autorizado: rechazar la creación de una segunda autorización.

La autorización se protege con una transacción, bloqueo del turno y restricciones de unicidad. La reserva de la clave se confirma antes de esa transacción. Inspecciones utiliza sus propias restricciones para mantener un único registro por turno, autorización y clave.

Inspecciones también impedirá que un reintento genere más de una inspección activa para el mismo turno.

## Consistencia y recuperación

Cada servicio realizará transacciones únicamente en su propia base de datos.

Si Turnos y Pagos guarda la autorización y después falla el registro en Inspecciones, el consumidor podrá recuperar la misma autorización utilizando la clave original y completar su registro local.

Se acepta que pueda existir temporalmente una autorización sin una inspección registrada. No se permitirá iniciar una inspección sin una autorización confirmada.

## Seguridad

La operación entre servicios requerirá una credencial válida.

Las credenciales se proporcionarán mediante configuración externa y no se incluirán en el repositorio ni en los registros de diagnóstico.

Para E1 se utiliza una credencial de servicio compartida, definida en `RTV_SERVICE_TOKEN`. Turnos y Pagos comprueba la cabecera Bearer y rechaza credenciales ausentes o incorrectas con `401 CREDENCIAL_INVALIDA`. Esta validación corresponde a la comunicación entre servicios.

## Consecuencias

### Beneficios

- Intercambio explícito y coherente con el diagrama C4.
- Validación del turno y del pago en el servicio responsable.
- Peticiones y respuestas fáciles de observar durante la demostración.
- Recuperación de reintentos mediante idempotencia.

### Costos y limitaciones

- Inspecciones depende de la disponibilidad de Turnos y Pagos para autorizar nuevos inicios.
- Se deben gestionar demoras, desconexiones y respuestas inciertas.
- No existe atomicidad entre las dos bases de datos.
- La idempotencia exige persistir información y controlar la concurrencia.
- El rendimiento deberá medirse en un entorno documentado.

## Verificación

La suite de integración comprobó:

1. Una autorización exitosa mediante REST.
2. Los rechazos definidos en el contrato.
3. Reintentos sin duplicar autorizaciones ni inspecciones.
4. Solicitudes simultáneas para el mismo turno.
5. Comportamiento con Turnos y Pagos detenido o demorado.
6. Recuperación después de perder una respuesta o fallar el registro local.
7. Rechazo de peticiones sin credenciales válidas.

Los diez casos de integración ejecutados finalizaron correctamente. El detalle y el registro se encuentran en [la revisión del esqueleto](../arquitectura/revision-esqueleto.md).

## Documentos relacionados

- [ADR-001: estilo de arquitectura](ADR-001-estilo-arquitectura.md)
- [Contrato REST](../contratos/contrato-inspecciones-turnos-pagos.md)
- [Diagrama C4 de contenedores](../diagramas/c4-contenedores-rtv-final.drawio)

