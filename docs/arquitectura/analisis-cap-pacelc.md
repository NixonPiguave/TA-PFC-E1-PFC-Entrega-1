# Análisis CAP y PACELC del sistema de Revisión Técnica Vehicular

**Actividad:** TA-PFC-E1 — PFC Entrega 1  
**Estado:** Propuesta para revisión del equipo.

## 1. Alcance

El RTV propone dos servicios: **Turnos y Pagos**, que comprueba los turnos y sus pagos, e **Inspecciones**, que registra las revisiones. Cada uno tendrá su base de datos PostgreSQL.

Antes de iniciar una revisión, Inspecciones solicitará una autorización a Turnos y Pagos mediante REST. Este análisis establece qué hacer si falla esa comunicación y qué se priorizaría si, en el futuro, se mantienen copias de los mismos datos en varios servidores.

Las bases de dos servicios distintos no son necesariamente réplicas. Una réplica es una copia del mismo conjunto de datos. Tener dos servicios no demuestra, por sí solo, una configuración CAP o PACELC. [1]

## 2. Conceptos necesarios

### CAP: cuando se pierde la comunicación

CAP relaciona tres propiedades de un almacenamiento distribuido: [1], [2]

- **Consistencia (C):** las operaciones deben respetar una visión actualizada y un orden compatible con las escrituras completadas, aunque se acceda por distintos servidores. No significa únicamente que los campos estén bien escritos.
- **Disponibilidad (A):** los servidores que siguen funcionando pueden completar las operaciones solicitadas. Mostrar un error no equivale a completar la operación.
- **Tolerancia a particiones (P):** el diseño contempla que grupos de servidores pierdan comunicación entre sí, aunque sigan encendidos.

Durante una partición no pueden garantizarse simultáneamente consistencia fuerte y disponibilidad para todas las operaciones. Una copia aislada podría desconocer que un pago cambió: debe decidirse si se utiliza información posiblemente antigua o si se suspende la operación que requiere confirmación. [1], [2]

### PACELC: cuando la red funciona

PACELC añade la relación entre consistencia y latencia durante el funcionamiento normal. **Latencia** es el tiempo entre una solicitud y su respuesta. Coordinar copias puede aumentar esa espera; responder desde una copia local puede reducirla, pero exige controlar su actualización. El estudio de Camilleri, Vella y Nezval analiza esta relación y su conexión con PACELC. [1]

- **Con partición:** decidir entre disponibilidad y consistencia.
- **Sin partición:** decidir cuánto tiempo de coordinación se acepta para mantener la consistencia.

## 3. Decisiones propuestas para el RTV

Estas decisiones se plantean por el riesgo de autorizar una revisión incorrectamente o guardar resultados contradictorios. Son propuestas para el proyecto; los artículos fundamentan los conceptos, no demuestran estas decisiones particulares del RTV.

### 3.1. Pago y habilitación del turno

**Si falla la comunicación actual:** Inspecciones no asumirá que el turno está pagado o habilitado. Si no obtiene autorización de Turnos y Pagos, no permitirá un nuevo inicio.

**Si futuras copias del pago quedan separadas por una partición:** se priorizará consistencia. Una copia aislada que no pueda comprobar su autoridad no habilitará el turno. Se acepta suspender temporalmente esa operación para evitar decisiones basadas en información antigua.

**Sin partición:** se consultará la fuente autorizada y se aceptará la coordinación necesaria antes de confirmar la autorización.

**Consecuencia:** el usuario podría esperar o reintentar. Se indicará que no pudo confirmarse la autorización, sin afirmar que no pagó.

### 3.2. Autorización de inicio

**Si se pierde una respuesta:** la autorización podría haberse guardado. Inspecciones conservará el identificador de la solicitud y lo reutilizará al reintentar. Corresponde a la cabecera `Idempotency-Key` del contrato.

Repetir la misma solicitud deberá recuperar la autorización original, sin crear otra. Este comportamiento se denomina **idempotencia**.

**Si futuras copias quedan incomunicadas:** se priorizará consistencia. No se permitirá que dos grupos aislados emitan autorizaciones incompatibles para el mismo turno. La parte que no pueda establecer su autoridad suspenderá nuevas autorizaciones.

**Sin partición:** se priorizará validar y guardar una única autorización, aunque aumente la espera. La clave y la autorización deberán guardarse juntas mediante una operación protegida en la base de datos.

**Consecuencia:** un reintento puede tardar, pero no debe generar un segundo permiso para la misma operación.

### 3.3. Registro del inicio de inspección

**Si falla la comunicación actual:** no se creará una inspección nueva sin autorización confirmada. Si la misma operación ya produjo una inspección, se devolverá el registro existente.

**Si futuras copias quedan incomunicadas:** se priorizará consistencia para evitar dos inspecciones activas incompatibles del mismo turno. Una copia sin autoridad suficiente no confirmará un nuevo inicio.

**Sin partición:** se aceptará la coordinación necesaria para confirmar el registro. La base de datos deberá impedir duplicados incluso ante solicitudes simultáneas.

**Consecuencia:** el usuario solo verá el inicio como guardado después de confirmar el registro. Si el resultado es incierto, se informará que debe reintentarse con la misma clave.

### 3.4. Mediciones y resultado final

Este punto corresponde a la evolución del sistema; registrar el resultado completo no forma parte del intercambio mínimo de autorización.

**Si no puede confirmarse el guardado:** el resultado no se mostrará como publicado. Si se incorporan borradores locales, se identificarán como pendientes y no tendrán valor de resultado final.

**Si futuras copias quedan incomunicadas:** se priorizará consistencia para publicar el resultado. No se aceptarán dictámenes finales contradictorios para la misma inspección.

**Sin partición:** se aceptará el tiempo necesario para comprobar la versión vigente y confirmar la publicación.

**Consecuencia:** la publicación podría retrasarse; no se presentará un borrador o una versión antigua como resultado final vigente.

### Resumen de prioridades

| Dato crítico | Durante una partición entre futuras copias | Sin partición | Costo aceptado |
|---|---|---|---|
| Pago y habilitación | Consistencia antes de autorizar. | Confirmar el estado en la fuente autorizada. | Espera o suspensión temporal del inicio. |
| Autorización | Una única decisión válida por operación. | Coordinar y guardar sin duplicados. | Tiempo adicional de validación y registro. |
| Inicio de inspección | Evitar dos inicios incompatibles. | Confirmar el registro y su unicidad. | Reintento si el guardado no puede confirmarse. |
| Resultado final | Evitar dictámenes contradictorios. | Confirmar la versión vigente antes de publicar. | Publicación más lenta o suspendida temporalmente. |

La orientación futura para estas operaciones es **PC/EC**: con partición se prioriza consistencia; sin partición se acepta más latencia para mantenerla. Es una intención de diseño. Garantizarla requiere definir y probar la replicación, quién puede escribir y la recuperación tras fallos.

No se clasifica todo el RTV como CP o AP. Una consulta meramente informativa podría admitir datos anteriores si se define expresamente su antigüedad aceptable y se informa al usuario.

## 4. Recuperación de una operación incompleta

Puede ocurrir que Turnos y Pagos guarde la autorización y luego se pierda la respuesta o falle Inspecciones antes de guardar su registro.

La recuperación propuesta es:

1. Conservar la clave de la operación antes de enviarla.
2. Reintentar con la misma clave y el mismo turno.
3. Recuperar la autorización original desde Turnos y Pagos.
4. Completar el registro de Inspecciones o devolver el que ya exista.

Se acepta temporalmente una autorización sin inspección registrada. No se acepta una inspección iniciada sin autorización confirmada.

Las dos bases no realizan una única operación indivisible. Esta solución tampoco resuelve automáticamente una cancelación o un cambio posterior del pago: esos casos requieren acordar la vigencia y la revocación de la autorización.

## 5. Comprobación de las decisiones

Las pruebas siguientes se proponen para verificar el diseño; no se presentan como resultados obtenidos.

| Prueba | Resultado esperado |
|---|---|
| Turno habilitado y pago confirmado. | Una autorización vinculada con una inspección. |
| Pago sin confirmar o turno no habilitado. | Rechazo sin autorización válida ni inicio de inspección. |
| Turnos y Pagos detenido o comunicación interrumpida. | Error comprensible; ningún nuevo inicio sin autorización. |
| Respuesta perdida después de guardar la autorización. | El reintento recupera la autorización original. |
| Fallo antes de guardar la inspección. | La operación puede completarse sin duplicados. |
| Solicitudes simultáneas para el mismo turno. | Ninguna autorización duplicada ni inspecciones activas incompatibles. |
| Partición entre futuras copias del mismo dato. | La parte sin autoridad no confirma operaciones críticas. Requiere implementar replicación. |

Detener un servicio comprueba cómo se maneja una dependencia caída. No demuestra por sí solo el comportamiento de un almacenamiento replicado ante una partición.

El límite de espera de la llamada REST será configurable según el contrato. No constituye una garantía sobre el tiempo de respuesta del proveedor.

## 6. Relación con la arquitectura

El análisis mantiene la separación de datos de ADR-001 y la comunicación síncrona de ADR-002. Los requisitos no funcionales deben reflejar la misma prioridad: proteger pagos, autorizaciones y resultados, aceptando esperas o reintentos cuando no puedan confirmarse.

- [Contrato REST](../contratos/contrato-inspecciones-turnos-pagos.md)
- [ADR-001: arquitectura](../adr/ADR-001-estilo-arquitectura.md)
- [ADR-002: comunicación](../adr/ADR-002-comunicacion.md)
- [Contexto RTV](../diagramas/c4-contexto-rtv.drawio)
- [Contenedores RTV](../diagramas/c4-contenedores-rtv-final.drawio)

## Referencias

[1] C. Camilleri, J. G. Vella y V. Nezval, “Horizontally Scalable Implementation of a Distributed DBMS Delivering Causal Consistency via the Actor Model,” *Electronics*, vol. 13, n.º 17, art. 3367, 2024, doi: [10.3390/electronics13173367](https://doi.org/10.3390/electronics13173367). [Texto completo de acceso abierto](https://www.mdpi.com/2079-9292/13/17/3367).

[2] C. G. Calatrava, Y. B. Fontal y F. M. Cucchietti, “A Holistic Scalability Strategy for Time Series Databases Following Cascading Polyglot Persistence,” *Big Data and Cognitive Computing*, vol. 6, n.º 3, art. 86, 2022, doi: [10.3390/bdcc6030086](https://doi.org/10.3390/bdcc6030086). [Texto completo de acceso abierto](https://www.mdpi.com/2504-2289/6/3/86).
