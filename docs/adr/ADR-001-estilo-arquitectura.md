# ADR-001 — Separación del RTV en servicios por responsabilidad

- **Estado:** Propuesto, pendiente de revisión con Diego Giraldo.
- **Autor:** Kevin García.
- **Actividad:** TA-PFC-E1 — PFC Entrega 1.

## Contexto

Para la entrega se propone demostrar una evolución del sistema de Revisión Técnica Vehicular hacia una arquitectura distribuida.

El caso seleccionado es el inicio de una inspección: antes de registrarla, es necesario comprobar que el turno existe, que su pago está confirmado y que está habilitado.

Se necesita separar las responsabilidades y demostrar una comunicación real entre dos servicios. Este documento describe la propuesta del prototipo; no afirma que el RTV completo ya tenga esta arquitectura.

## Decisión

Organizar el prototipo como una arquitectura de servicios separados por responsabilidad:

1. **Turnos y Pagos:** administra turnos, estados de pago y autorizaciones para iniciar una inspección.
2. **Inspecciones:** solicita la autorización y registra las inspecciones y sus resultados.

Cada servicio será una aplicación independiente desarrollada con Java y Spring Boot.

Cada uno tendrá su propia base de datos PostgreSQL y credenciales independientes. Ningún servicio accederá directamente a las tablas del otro.

Ambas bases podrán alojarse en una misma instalación de PostgreSQL para la demostración. Esto simplifica el entorno, aunque mantiene una dependencia compartida de infraestructura.

La aplicación web Angular se representa como cliente de los servicios. La entrega se centrará en el intercambio entre ambos servicios, sin reconstruir todo el frontend.

La elección y el comportamiento del mecanismo de comunicación se documentarán en ADR-002 y en el contrato REST.

## Justificación

La separación permite que cada servicio controle sus datos y reglas de negocio.

Inspecciones necesita conocer si puede iniciar una revisión, pero no debe administrar pagos ni interpretar directamente las tablas de Turnos y Pagos.

Turnos y Pagos conserva la responsabilidad de validar las condiciones y emitir la autorización. Inspecciones utiliza esa respuesta para continuar su propio proceso.

Dos servicios son suficientes para demostrar este límite y su comunicación. No se incorporan servicios adicionales sin una necesidad concreta.

## Alternativas consideradas

| Alternativa | Ventajas | Motivo para no elegirla en este prototipo |
|---|---|---|
| Mantener todo en una aplicación modular | Menor complejidad de ejecución y transacciones locales más sencillas. | No demuestra el intercambio entre dos servicios independientes seleccionado para la entrega. |
| Separar aplicaciones compartiendo las mismas tablas | Facilita inicialmente el acceso a los datos. | Acopla los servicios al mismo esquema y permite que uno modifique información del otro. |
| Separar servicios con bases de datos propias | Delimita responsabilidades y evita acceso directo a datos ajenos. | Es la alternativa elegida, aceptando el costo de comunicación y coordinación. |

## Consecuencias positivas

- Responsabilidades y propiedad de datos explícitas.
- Posibilidad de ejecutar y probar cada servicio por separado.
- Contrato de comunicación documentado.
- Fallos de comunicación observables y reproducibles en la demostración.

## Costos y limitaciones

- Se deben configurar y ejecutar dos aplicaciones y dos bases de datos.
- La comunicación puede fallar o perder su respuesta.
- No existe una transacción única que cubra las escrituras de ambos servicios.
- Se necesitan idempotencia y restricciones de persistencia para controlar reintentos y duplicados.
- El inicio de una inspección depende de obtener una autorización válida.
- Compartir una instalación de PostgreSQL no ofrece aislamiento completo ante fallos de infraestructura.
- Esta separación no garantiza, por sí sola, mejor rendimiento ni alta disponibilidad.

## Comprobación de la decisión

La implementación deberá demostrar que:

1. Ambos servicios se ejecutan como procesos independientes.
2. Cada servicio utiliza únicamente sus propias credenciales y base de datos.
3. Inspecciones obtiene la autorización mediante la interfaz de Turnos y Pagos.
4. Una autorización válida permite registrar la inspección.
5. Los rechazos y fallos de comunicación no permiten iniciar una inspección sin autorización.
6. El código, el contrato y el diagrama representan la misma arquitectura.

Estos puntos son criterios de verificación; no representan pruebas ya ejecutadas.

## Documentos relacionados

- [Diagrama de contenedores editable](../diagramas/c4-contenedores-rtv.drawio)
- [Vista del diagrama](../diagramas/c4-contenedores-rtv.png)
- [Contrato REST](../contratos/contrato-inspecciones-turnos-pagos.md)
