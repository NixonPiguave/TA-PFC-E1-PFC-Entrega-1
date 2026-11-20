# Modelo de comunicación del sistema RTV

**Actividad:** TA-PFC-E1 — PFC Entrega 1  
**Estado:** Propuesta para revisión conjunta de arquitectura y desarrollo.

## 1. Objetivo y alcance

Describir las relaciones del diagrama de contenedores del sistema de Revisión Técnica Vehicular: quién inicia cada intercambio, qué información envía, qué respuesta necesita y qué ocurre si no puede completarlo.

El diseño propone una aplicación web Angular, los servicios Java Spring Boot de Turnos y Pagos e Inspecciones, y una base de datos PostgreSQL propia para cada servicio.

La demostración de E1 se centra en la comunicación entre los dos servicios. Las operaciones completas del frontend, los pagos y los resultados de la revisión representan el alcance de evolución del RTV; su presencia en el diagrama no significa que ya estén implementadas.

## 2. Cómo leer el modelo

- **Comunicación síncrona:** el proceso necesita recibir el resultado de una operación antes de continuar con el paso que depende de ella.
- **Comunicación asíncrona:** el proceso puede continuar sin esperar el resultado inmediato; requiere gestionar por separado la entrega y el procesamiento posterior.
- **REST sobre HTTP con JSON:** los servicios ofrecen operaciones mediante direcciones y métodos HTTP, y representan los datos intercambiados en JSON.
- **JDBC y SQL:** el servicio utiliza el controlador de PostgreSQL para consultar o modificar su propia base de datos. No se utiliza REST para acceder directamente a las tablas.

El navegador puede realizar una petición sin bloquear la pantalla y mostrar un indicador de espera. Aun así, confirmar un pago o un inicio depende de la respuesta del servidor. Aquí se clasifica esa dependencia del proceso, no la forma en que una librería ejecuta la petición internamente.

## 3. Relaciones del diagrama de contenedores

Cada fila corresponde a una flecha del diseño. La respuesta de una operación queda incluida en la misma relación.

| Origen y destino | Información enviada y recibida | Tipo y mecanismo | Justificación |
|---|---|---|---|
| **Personal de atención → Aplicación web RTV** | Introduce datos del turno y del registro de pago. Recibe confirmaciones o errores. | Interacción humana mediante la interfaz web; no es una llamada entre servicios. | El personal necesita una pantalla que permita operar sin acceder directamente a la base de datos. |
| **Inspector técnico → Aplicación web RTV** | Solicita información del turno, pide iniciar una inspección y registra datos de la revisión. Recibe datos, confirmaciones o rechazos. | Interacción humana mediante la interfaz web; no es una llamada entre servicios. | El inspector debe conocer si puede continuar y distinguir un guardado confirmado de una operación pendiente. |
| **Aplicación web RTV → Turnos y Pagos** | Envía las solicitudes de gestión de turnos y pagos. Recibe los datos consultados, la confirmación del registro o un error. | Petición y respuesta mediante REST sobre HTTP/JSON. La confirmación depende de la respuesta. | Las reglas y los registros de turnos y pagos pertenecen a este servicio. Las rutas concretas de estas operaciones se definirán al implementarlas; no forman parte del contrato mínimo entre servicios. |
| **Aplicación web RTV → Inspecciones** | Solicita iniciar una inspección para un turno e incluye la clave que identifica la operación. Recibe el registro de inspección o el motivo por el que no puede iniciarse. | Síncrona para confirmar el inicio; REST sobre HTTP/JSON. | La interfaz no debe mostrar una inspección como iniciada sin confirmación del servicio responsable. En el esqueleto, curl o Postman pueden representar al cliente. |
| **Inspecciones → Turnos y Pagos** | Envía el identificador del turno, la clave de operación y la credencial de servicio. Recibe una autorización identificada o un rechazo. | Síncrona; REST sobre HTTP/JSON. | Inspecciones necesita la autorización antes de guardar un nuevo inicio. No consulta ni modifica las tablas del otro servicio. |
| **Turnos y Pagos → PostgreSQL de Turnos y Pagos** | Consulta el turno y el pago; guarda la autorización y la clave de operación. Recibe datos y el resultado de las operaciones. | Acceso síncrono mediante JDBC, controlador PostgreSQL y SQL. | El servicio confirma la operación solo después de comprobar su resultado. Las validaciones y la autorización deben protegerse mediante una transacción y restricciones de persistencia. |
| **Inspecciones → PostgreSQL de Inspecciones** | Conserva la clave de operación, consulta registros existentes y guarda la inspección vinculada a su autorización. Recibe datos y confirmaciones o errores. | Acceso síncrono mediante JDBC, controlador PostgreSQL y SQL. | Permite recuperar operaciones repetidas y evitar registros duplicados. Las restricciones deben comprobarse también ante solicitudes simultáneas. |

Cada base tendrá credenciales independientes. Los servicios no accederán directamente a las tablas ajenas. Una respuesta con error de base de datos no se interpretará como un guardado correcto.

## 4. Intercambio principal: autorización de inicio

### Paso 1. Solicitud a Inspecciones

El cliente solicita iniciar una inspección mediante:

`POST /inspecciones`

Incluye la cabecera `Idempotency-Key` y un cuerpo JSON con el identificador del turno, por ejemplo:

```json
{
  "turnoId": 123
}
```

El identificador es ficticio. El cliente debe conservar la clave para reconocer los reintentos de la misma operación. Si ya existe una inspección asociada a esa operación, se devolverá el registro existente.

### Paso 2. Solicitud de autorización a Turnos y Pagos

Para una operación nueva, Inspecciones llama a:

`POST /turnos/{turnoId}/autorizaciones-inspeccion`

La petición identifica el turno en la dirección e incluye:

- `Idempotency-Key`: la misma clave de la operación.
- `Authorization`: la credencial del servicio consumidor, configurada fuera del repositorio.

Los campos y las respuestas se detallan en el contrato REST. Se utiliza POST porque se registra una autorización; no es una consulta que se limite a leer el estado del pago.

### Paso 3. Validación en Turnos y Pagos

El proveedor comprobará que el turno existe, que está habilitado y que su pago está confirmado. También verificará la credencial y el uso de la clave de operación.

Si corresponde, guardará una autorización y la devolverá con `201 Created`. Si la misma operación ya produjo una autorización, devolverá la original con `200 OK`.

Si las condiciones no se cumplen, devolverá el rechazo definido en el contrato. Solicitar autorización no realiza un cobro ni convierte un pago pendiente en confirmado.

### Paso 4. Registro en Inspecciones

Después de recibir y validar la autorización, Inspecciones guardará el inicio en su propia base y vinculará los identificadores del turno, de la autorización y de la inspección.

Solo después de confirmar el registro responderá al cliente con el resultado. No existe una transacción única que abarque las dos bases.

## 5. Fallos, reintentos y seguridad

| Situación | Comportamiento propuesto |
|---|---|
| Turnos y Pagos no responde o no puede alcanzarse. | Finalizar la espera de forma controlada e informar que no pudo confirmarse la autorización. No crear un nuevo inicio sin autorización válida. |
| La respuesta supera el límite de espera. | Aplicar el tiempo configurable del contrato, propuesto inicialmente en tres segundos. No asumir que el proveedor canceló lo que estaba haciendo. |
| La autorización se guardó, pero su respuesta se perdió. | Reintentar con la misma clave y el mismo turno para recuperar la autorización original. |
| La autorización llegó, pero falló el registro local de la inspección. | No anunciar un inicio guardado. Permitir la recuperación posterior utilizando la misma clave. |
| La misma clave llega con otro turno. | Rechazar su reutilización para una operación diferente. |
| Llegan solicitudes simultáneas. | Aplicar transacciones y restricciones de unicidad, además de reconocer las claves, para evitar autorizaciones o inspecciones incompatibles. |
| La credencial está ausente o es inválida. | Rechazar el acceso sin modificar los datos de negocio. |
| La respuesta no tiene el formato esperado. | Tratarla como un error de integración y no confirmar una nueva inspección a partir de datos inválidos. |

El límite de espera no es una promesa sobre el tiempo de respuesta del proveedor. Una cancelación del lado consumidor tampoco revierte automáticamente una escritura ya realizada por el proveedor.

Las credenciales no se guardarán en archivos versionados ni se mostrarán en las evidencias. HTTP sin cifrado se limita al entorno local de demostración; para desplegar fuera de ese entorno se deberá configurar HTTPS.

## 6. Alternativas y motivo de la elección

| Alternativa | Qué aportaría | Decisión para este intercambio |
|---|---|---|
| **REST con HTTP/JSON** | Un intercambio explícito de solicitud y respuesta, inspeccionable con curl o Postman y coherente con el contrato definido. | Seleccionado porque el inicio depende de obtener una autorización y encaja con las tecnologías acordadas. No se afirma que sea el mecanismo más rápido. |
| **gRPC** | Un contrato tipado y clientes generados para invocar operaciones remotas. | Es una alternativa válida. La necesidad de esperar autorización no lo descarta; el equipo ha elegido REST por la integración y el contrato propuestos. |
| **Mensajería asíncrona** | Posibilidad de procesar una solicitud cuando el consumidor esté disponible. | No se incorpora al flujo mínimo. Requeriría mostrar un inicio pendiente, identificar la respuesta posterior y gestionar la entrega de mensajes. |
| **Sockets TCP directos** | Control del formato y del intercambio de bytes. | No se seleccionan para esta integración. El equipo tendría que definir y mantener el protocolo de aplicación, la separación de mensajes y los errores que ya organiza el contrato HTTP propuesto. |

Una librería puede enviar internamente una petición sin bloquear su hilo. Eso no convierte el proceso en mensajería asíncrona si Inspecciones sigue necesitando el resultado antes de registrar el inicio.

## 7. Relación con la práctica experimental PE-U1

La práctica experimental PE-U1 estudia la comunicación entre procesos mediante sockets TCP y gRPC. Sus escenarios consideran tamaños de mensaje, solicitudes simultáneas y tiempos de ida y vuelta: aspectos relevantes para evaluar el costo de las llamadas entre los servicios del RTV.

En este diseño, REST se selecciona por el contrato HTTP/JSON y porque Inspecciones necesita obtener una autorización antes de registrar un nuevo inicio. La comparación experimental entre TCP y gRPC no establece por sí sola el rendimiento de esta API REST.

## 8. Comprobación del modelo

Para validar el intercambio, se conservarán peticiones y respuestas, registros de los dos servicios y verificaciones de sus datos. Debe comprobarse:

1. Una autorización válida que permita registrar una inspección.
2. Un turno rechazado sin un nuevo inicio de inspección.
3. Una caída o demora del proveedor con respuesta controlada al cliente.
4. Un reintento que conserve los identificadores y no duplique registros.
5. El acceso de cada servicio únicamente a su propia base.

Estas son comprobaciones propuestas; no constituyen resultados de ejecución. El contrato, el código y las pruebas deberán utilizar los mismos formatos de identificador y los mismos códigos de error.

## Documentos relacionados

- [Diagrama C4 de contenedores](../diagramas/c4-contenedores-rtv-final.drawio)
- [Contrato REST entre servicios](../contratos/contrato-inspecciones-turnos-pagos.md)
- [ADR-001: arquitectura](../adr/ADR-001-estilo-arquitectura.md)
- [ADR-002: comunicación](../adr/ADR-002-comunicacion.md)
- [Justificación de arquitectura](justificacion-arquitectura.md)
- [Análisis CAP y PACELC](analisis-cap-pacelc.md)
- [Contrato experimental de PE-U1](https://github.com/yaser-uwu/GA-SUM-02-PE-U1/blob/main/docs/CONTRATO.md)
- [Datos experimentales de PE-U1](https://github.com/yaser-uwu/GA-SUM-02-PE-U1/tree/main/data)
