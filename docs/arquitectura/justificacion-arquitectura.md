# Justificación de la arquitectura distribuida del RTV

**Actividad:** TA-PFC-E1 — PFC Entrega 1  
**Estado:** Propuesta para revisión del equipo.

## 1. Necesidad del sistema

El sistema de Revisión Técnica Vehicular administra turnos, pagos e inspecciones. Estas funciones están relacionadas, pero tienen responsabilidades diferentes.

Turnos y Pagos determina si un turno existe, está habilitado y tiene un pago confirmado. Inspecciones necesita esa información para decidir si puede iniciar una revisión, pero no debe modificar los pagos ni administrar sus reglas.

El diseño propuesto busca separar esas responsabilidades y establecer una comunicación explícita entre ellas.

## 2. Arquitectura propuesta

El prototipo se organizará en dos servicios independientes:

| Servicio | Responsabilidad | Datos que administra |
|---|---|---|
| **Turnos y Pagos** | Gestionar los turnos y sus pagos, comprobar las condiciones de inicio y emitir autorizaciones. | Turnos, estados de pago y autorizaciones. |
| **Inspecciones** | Solicitar autorización y registrar las inspecciones y sus resultados. | Inspecciones, vínculo con la autorización y resultados de la revisión. |

Cada servicio tendrá una aplicación Java con Spring Boot y una base de datos PostgreSQL propia. No se permitirá que un servicio consulte o modifique directamente las tablas del otro.

La separación también permitirá ejecutar y desplegar cada aplicación por separado, siempre que sus cambios mantengan la compatibilidad del contrato.

Para la demostración, ambas bases podrán estar en una misma instalación de PostgreSQL. Esto facilita la ejecución, pero mantiene una dependencia compartida: una caída de esa instalación puede afectar a los dos servicios.

## 3. Interacción seleccionada

El intercambio principal será la autorización para iniciar una inspección:

1. Inspecciones recibe una solicitud de inicio para un turno.
2. Solicita autorización a Turnos y Pagos mediante REST.
3. Turnos y Pagos comprueba el turno, su habilitación y el pago.
4. Si se cumplen las condiciones, registra y devuelve una autorización.
5. Inspecciones guarda el inicio en su propia base de datos.

La operación entre servicios será:

**POST /turnos/{turnoId}/autorizaciones-inspeccion**

Se utiliza POST porque se crea una autorización persistente. No se trata únicamente de consultar el estado del pago.

El contrato REST define los datos, las respuestas, los rechazos y el tratamiento de los reintentos.

## 4. Razones para separar los servicios

### Propiedad de las reglas y los datos

Turnos y Pagos será la fuente responsable del estado de pago y de la autorización. Inspecciones utilizará esa decisión sin duplicar las reglas que la producen.

Esto permite modificar las validaciones del proveedor sin obligar al consumidor a conocer su estructura de tablas, siempre que se conserve el contrato acordado.

### Independencia de despliegue

Una modificación interna de Inspecciones podrá desplegarse sin sustituir la aplicación de Turnos y Pagos, y viceversa.

Esta independencia exige mantener compatibles las interfaces y las estructuras de respuesta. No significa que cualquier cambio pueda realizarse sin coordinación.

### Posibilidad de evolución diferenciada

Si las mediciones futuras muestran cargas distintas entre la gestión de pagos y el procesamiento de inspecciones, se podrá estudiar el aumento de recursos de cada servicio por separado.

No se afirma que el prototipo ya necesite varias instancias ni que la separación mejore automáticamente el rendimiento. Esa decisión requerirá medir la carga y revisar también las limitaciones de las bases de datos.

### Delimitación de fallos

La separación permite identificar qué servicio falla y aplicar una respuesta específica. Por ejemplo, Inspecciones puede informar que no pudo confirmar la autorización cuando Turnos y Pagos no responde.

Sin embargo, el inicio de nuevas inspecciones seguirá dependiendo del proveedor. Separar aplicaciones no elimina esa dependencia ni garantiza que el proceso completo permanezca disponible.

## 5. Relación con los requisitos no funcionales

| Requisito | Relación con la arquitectura | Límite de la decisión |
|---|---|---|
| **RNF-01: rendimiento** | El intercambio completo puede medirse para conocer el costo de la llamada y de las operaciones de cada servicio. | La comunicación añade trabajo y tiempo de red. El límite de aceptación debe acordarse a partir de las necesidades y las mediciones. |
| **RNF-02: fallos de comunicación** | La llamada REST tendrá una espera limitada y un tratamiento explícito de errores. Sin autorización confirmada no se iniciará una inspección nueva. | Un tiempo de espera agotado no demuestra que el proveedor haya cancelado su operación. |
| **RNF-03: integridad del estado de negocio** | Turnos y Pagos valida las condiciones que administra; Inspecciones respeta la autorización recibida. | Separar servicios no sustituye las validaciones ni las transacciones locales. |
| **RNF-04: control de duplicados** | Ambos servicios deberán reconocer los reintentos y proteger la unicidad de sus registros. | La idempotencia requiere persistencia y restricciones que funcionen también con solicitudes simultáneas. |
| **RNF-05: persistencia tras reinicios** | Cada servicio conservará sus registros confirmados en PostgreSQL. | Tener bases separadas no garantiza recuperación ante pérdida de discos ni sustituye los respaldos. |
| **RNF-06: acceso entre servicios** | El punto de autorización exigirá una credencial válida. Cada servicio utilizará credenciales propias para su base. | Las credenciales deben protegerse y la autenticación debe implementarse y probarse. |

Estos requisitos orientan los controles del prototipo. Su cumplimiento depende de la implementación y las pruebas; no queda garantizado por el diagrama.

## 6. Comparación con una aplicación monolítica

Un monolito modular podría resolver la autorización dentro de una sola aplicación. Simplificaría el despliegue y permitiría utilizar una transacción local para operaciones que compartan una misma base de datos.

Por tanto, las funciones de turnos, pagos e inspecciones no obligan, por sí solas, a distribuir el sistema. Tampoco los requisitos actuales demuestran que un único servidor sea insuficiente.

La propuesta distribuida se elige como base de evolución del PFC para demostrar servicios independientes, propiedad de datos y un contrato de comunicación. Su conveniencia operativa deberá confirmarse con necesidades verificadas de despliegue independiente, carga o distribución de usuarios.

| Aspecto | Monolito modular | Servicios separados |
|---|---|---|
| Ejecución inicial | Una aplicación que preparar y desplegar. | Dos aplicaciones y su comunicación. |
| Cambios internos | Pueden mantenerse módulos separados dentro de la aplicación. | Cada servicio puede evolucionar y desplegarse por separado si conserva el contrato. |
| Operaciones relacionadas | Pueden coordinarse en una transacción local si comparten almacenamiento. | Requieren coordinar escrituras independientes y recuperarse de operaciones incompletas. |
| Rendimiento | Evita la llamada de red entre módulos. | Permite estudiar recursos por servicio, pero añade comunicación y coordinación. |
| Fallos | Una caída del proceso puede afectar al conjunto. | Puede aislar algunos fallos, aunque los procesos dependientes siguen afectados. |

La comparación de Blinowski, Ojdowska y Przybyłek estudia rendimiento y escalabilidad en arquitecturas monolíticas y de microservicios. Se utiliza como fundamento para evaluar la elección mediante mediciones; sus resultados no se presentan como resultados del RTV. [1]

## 7. Costos y medidas necesarias

La separación introduce costos que deben asumirse expresamente:

- **Fallos de red:** una solicitud puede demorarse o perder su respuesta. Se necesitan límites de espera y mensajes comprensibles.
- **Operaciones incompletas:** una autorización puede quedar guardada antes de que se registre la inspección.
- **Duplicados:** un reintento debe utilizar la misma clave de operación para recuperar el resultado original.
- **Mayor configuración:** deben documentarse las direcciones, los puertos, las bases y las variables necesarias para ejecutar ambos servicios.
- **Cambios de contrato:** proveedor y consumidor deben mantener compatibles los campos, los identificadores y los códigos de error.

La recuperación propuesta acepta temporalmente una autorización sin inspección registrada. Después, el reintento recuperará la autorización original y completará el registro local sin duplicarlo.

No se afirma que las escrituras de ambas bases formen una única transacción.

## 8. Alcance de la decisión

En E1 se demostrará la comunicación entre dos servicios mínimos. No se requiere reconstruir todo el RTV ni completar todas sus funciones de negocio.

La elección se considerará coherente cuando:

1. Ambos servicios puedan ejecutarse siguiendo el README.
2. Cada servicio acceda únicamente a su propia base de datos.
3. La interacción corresponda al contrato y al diagrama de contenedores.
4. Se observe una respuesta correcta y un fallo de comunicación controlado.
5. Las capacidades todavía no implementadas se distingan de las comprobadas.

Las pruebas de carga, duplicados, recuperación y seguridad deberán registrar resultados reales antes de declarar el cumplimiento de los requisitos correspondientes.

## Documentos relacionados

- [ADR-001: estilo de arquitectura](../adr/ADR-001-estilo-arquitectura.md)
- [ADR-002: comunicación](../adr/ADR-002-comunicacion.md)
- [Contrato REST](../contratos/contrato-inspecciones-turnos-pagos.md)
- [C4 de contexto](../diagramas/c4-contexto-rtv.drawio)
- [C4 de contenedores](../diagramas/c4-contenedores-rtv-final.drawio)
- [Análisis CAP y PACELC](analisis-cap-pacelc.md)

## Referencia

[1] G. Blinowski, A. Ojdowska y A. Przybyłek, “Monolithic vs. Microservice Architecture: A Performance and Scalability Evaluation,” *IEEE Access*, vol. 10, pp. 20357–20374, 2022, doi: [10.1109/ACCESS.2022.3152803](https://doi.org/10.1109/ACCESS.2022.3152803).
