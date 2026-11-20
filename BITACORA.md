# Bitácora del proyecto RTV

### 2026-11-17 · Mera Jumbo Allison
- **Integrantes presentes:** Mera Jumbo Allison.
- **Commit(s):**
  - `286cd87` — Crea la estructura base del informe LaTex.
- **Qué se hizo:** Creé `docs/informe.tex` con todas las secciones que pide el enunciado de TA-PFC-E1 y en el mismo orden, desde la portada hasta las referencias. En la portada puse a los cuatro integrantes actuales con sus roles y la URL del repositorio. Dejé tablas base para requisitos funcionales, requisitos no funcionales con su característica ISO/IEC 25010, interacciones entre servicios, CAP y PACELC, riesgos, cronograma, aportes y uso de IA. Definí el comando `\pendiente{...}` para que lo que falta salga en rojo y sea fácil de ubicar. Creé `docs/referencias.bib` configurado para biblatex con estilo IEEE, sin entradas, solo con una plantilla. Comprobé que el documento compila con pdflatex → biber → pdflatex → pdflatex. También revisé el documento anterior del proyecto RTV (62 páginas) para ver qué se puede reutilizar: la entrevista de 13 preguntas al personal del CRTVMV sirve como base para el contexto y la trazabilidad de los requisitos.
- **Problema encontrado:** En el documento anterior encontré varias referencias anteriores a 2021 o con datos que no coinciden con la obra citada, requisitos no funcionales sin cifras, el anexo de consentimientos vacío y credenciales publicadas en el anexo de `application.properties`.
- **Solución y comprobación:** Las carpetas `adr`, `diagramas` y `figuras` se crearán cuando se suba su primer archivo. Decidí no reutilizar las referencias anteriores sin verificar cada DOI, y avisé al equipo que hace falta un acta firmada o una entrevista nueva y que las credenciales no deben subirse al repositorio público.
- **Tiempo dedicado:** 25 min.

### 2026-11-18 · Piguave Nixon
- **Integrantes presentes:** Piguave Nixon.
- **Commit(s):**
  - [`a006ab7`](https://github.com/NixonPiguave/TA-PFC-E1-PFC-Entrega-1/commit/a006ab76bab6962875b5a5b507d002377b2dd8ca) — Agrego RF-01 a RF-05 con criterios de aceptación y fuentes, junto con la bitacora.
- **Qué se hizo:** Redacté las historias de usuario RF-01 a RF-05: autenticación de usuarios, asignación de roles, control de acceso, trazabilidad de acciones y registro de placa vehicular, con 21 criterios de aceptación en total. Las incorporé en la tabla de requisitos funcionales de `docs/informe.tex` con actor, necesidad, beneficio, criterios y fuente. Revisé los documentos publicados en el repositorio y enlacé cada fuente con los apartados de ISO/IEC/IEEE 29148:2018 sobre seguridad, perfiles de usuario y auditoría, y con los artículos de la Resolución 008-DIR-2017-ANT sobre datos del vehículo e identificación de placas. Mantuve los identificadores RF-01 a RF-05 y un formato común para que el equipo complete RF-06 a RF-10.
- **Problema encontrado:** Las historias no tienen todavía un respaldo directo en el levantamiento: faltan confirmar roles y permisos, acciones y campos de auditoría, formatos de placa, excepciones, duplicados y reinspecciones.
- **Solución y comprobación:** Separé los documentos de apoyo técnico de la evidencia del levantamiento y dejé las historias marcadas como propuestas pendientes de validación con el responsable del centro. Queda pendiente vincular cada historia con el acta, el audio o la retroalimentación, y añadir el enlace al issue.
- **Uso de IA:** Codex, para analizar el material de los anexos, corregir la gramática y estructurar el LaTeX. Lo verifiqué contrastando los resultados con los documentos publicados.
- **Tiempo dedicado:** 1 hora 40 minutos.

### 2026-11-18 · Mera Jumbo Allison
- **Integrantes presentes:** Mera Jumbo Allison.
- **Commit(s):**
  - `8547b6c` — Add files via upload (contexto, objetivos, RF-06 a RF-10 y trabajos relacionados).
- **Qué se hizo:** Redacté la sección de contexto y problema a partir de la entrevista al personal del CRTVMV: organización, flujo de atención en cinco puestos, verificaciones que dependen de la ANT y el SRI, tabla de consecuencias medibles y tabla de diez interesados. Cada afirmación cita la pregunta de la entrevista de la que sale (P1 a P13). Redacté el objetivo general y cuatro objetivos específicos, cada uno vinculado a una entrega (E1 a E4) y con su indicador. Escribí RF-06 a RF-10 (tipo, uso, número de ejes, peso y clasificación según NTE INEN 2656) con el formato de Nixon, con 20 criterios de aceptación y con la fuente en la entrevista. Redacté los trabajos relacionados con cuatro artículos de revistas indexadas de acceso abierto y agregué sus entradas a `referencias.bib`, revisando los datos de cada DOI. Convertí las tablas del informe a `xltabular` para que se puedan partir entre páginas. Creé mis 8 issues de E1 en GitHub y cerré del #1 al #5.
- **Problema encontrado:** Nixon había subido RF-01 a RF-05 al `informe.tex` del repo mientras yo trabajaba sobre la versión anterior. Una de las referencias que encontré primero era de conferencia y de pago. Las tablas saltaban a la página siguiente y dejaban espacios en blanco. No pude vincular un tablero de GitHub Projects porque el repositorio pertenece a la cuenta de Nixon, y la sección de etiquetas aparecía vacía. Además, el commit de hoy se subió con el mensaje automático de GitHub.
- **Solución y comprobación:** Combiné mis secciones con la versión del repo para no borrar el trabajo de Nixon. Reemplacé la referencia de pago por artículos de acceso abierto en IEEE Access, Applied Sciences, Telecom y Empirical Software Engineering. Con `xltabular` las tablas empiezan donde hay espacio, y comprobé que el documento compila sin errores. Creé los issues sin tablero y sin etiquetas; el tablero queda pendiente hasta que Nixon cree el Project en su cuenta y lo vincule al repo. Las cifras que dependen del levantamiento quedaron en el issue #8. Para los próximos commits reviso el mensaje antes de confirmar.
- **Uso de IA:** Claude (Opus 5.5), para redactar borradores de las secciones a partir de la entrevista y estructurar el LaTeX. 
- **Tiempo dedicado:** 1 h 55 min.

### 2026-11-18 · Diego Giraldo
- Integrantes presentes: Diego Giraldo.
- Commit(s):
  - 8971b04 — Sube el código del servicio de Inspecciones.
- **Qué se hizo**: Revisé el backend del RTV y el diagrama C4 elaborado por Kevin. Preparé una propuesta de contrato REST para revisión con el arquitecto e implementé el flujo de inicio de inspección en un prototipo separado del proyecto principal. Inspecciones recibe el identificador del turno, solicita autorización a Turnos y Pagos y registra el inicio en su propia base PostgreSQL. Ese día dejé en GitHub únicamente el servicio de Inspecciones.
- **Problema encontrado**: La autorización y la inspección se guardan en bases separadas. Si la autorización queda guardada pero la respuesta se demora o falla el registro local, la operación puede quedar incompleta.
- **Solución y comprobación**: Implementé el reintento con la misma Idempotency-Key. Verifiqué en las pruebas locales que, después de una demora o de un fallo de escritura, el reintento recupera el UUID de la autorización y registra una sola inspección.
- **Tiempo dedicado**: 2 horas y 15 minutos.

### 2026-11-19 · Piguave Nixon
- **Integrantes presentes:** Piguave Nixon.
- **Commit(s):**
  - [`a43419d`](https://github.com/NixonPiguave/TA-PFC-E1-PFC-Entrega-1/commit/a43419d67af47e1b9a15730ff89d63fecd51fcbc) — Redacción de los seis RNF con métricas y criterios de verificación, con la bitacora.
- **Qué se hizo:** Redacté RNF-01 a RNF-06 a partir de la propuesta técnica del equipo: rendimiento de la autorización de inicio, fallos de comunicación, integridad del estado de negocio, control de duplicados, persistencia tras reinicios y acceso entre servicios. Para cada requisito indiqué característica de ISO/IEC 25010:2023, métrica, umbral o estado pendiente, condiciones y método de comprobación. Documenté el flujo de autorización mediante REST con HTTP/JSON, la clave de idempotencia, el tratamiento de una respuesta perdida y los datos del entorno que deben registrarse. Incorporé las referencias ISO/IEC 25010:2023 y el artículo de Giamattei, Guerriero, Pietrantuono y Russo, publicado en Journal of Systems and Software en 2024, con DOI 10.1016/j.jss.2023.111857.
- **Problema encontrado:** La propuesta de rendimiento no incluye todavía un máximo aceptable de p95 y las demás metas requieren confirmación técnica. OE-4 mide la consulta del estado del turno, mientras el ensayo propuesto mide autorización de inicio. Todavía no hay resultados reales de las pruebas de calidad.
- **Solución y comprobación:** Separé las metas propuestas de los resultados medidos y dejé pendiente el límite de p95. Definí los escenarios de rechazo, reintento, concurrencia y reinicio, junto con los registros que permitirán comprobarlos. Queda pendiente acordar las metas con el equipo, conciliar el indicador de OE-4 y ejecutar las pruebas cuando exista la implementación. El hash del segundo commit y el enlace al issue se añadirán después de su publicación.
- **Uso de IA:** Codex, para verificar mis borradores de los requisitos no funcionales y corregir una mala redacción y estructurar el LaTeX. Verifiqué su coherencia con la propuesta técnica del equipo y las fuentes publicadas
- **Tiempo dedicado:** 2 horas

### 2026-11-19 · Diego Giraldo
- Integrantes presentes: Diego Giraldo.
- Commit(s):
  - cccabfc — Sube el servicio de Turnos y Pagos.
- Qué se hizo: Subí a GitHub el servicio de Turnos y Pagos. Este servicio comprueba que el turno exista, que el pago ya esté confirmado y que el turno esté habilitado antes de generar la autorización. Organicé los dos servicios bajo prototipo-e1/src/, separé el código de los archivos de dependencias y configuración, y ubiqué los datos ficticios en la carpeta de Turnos y Pagos.
- Problema encontrado: Al mover los servicios, las rutas anteriores de compilación, arranque y pruebas dejaron de corresponder con la nueva estructura.
- Solución y comprobación: Actualicé las rutas en Maven, el README y la suite de integración. Volví a compilar los dos servicios y pasaron los diez escenarios de prueba con PostgreSQL, incluidos los de solicitudes simultáneas, credenciales incorrectas, reinicio de las aplicaciones y recuperación de una operación interrumpida.
- Tiempo dedicado: 3 horas.


### 2026-11-18 · García Bazurto Kevin Leonel

- **Integrantes presentes:** Kevin García. Coordinación con Diego Giraldo para definir la comunicación entre servicios.
- **Commit(s):**
  - [`6c5ba01`](https://github.com/NixonPiguave/TA-PFC-E1-PFC-Entrega-1/commit/6c5ba0184d3d50b105838405e91506b0145a26a8), [`2aa8878`](https://github.com/NixonPiguave/TA-PFC-E1-PFC-Entrega-1/commit/2aa88785fe350c9a50f511cefe86f281bcf6e5d5) y [`76e77d3`](https://github.com/NixonPiguave/TA-PFC-E1-PFC-Entrega-1/commit/76e77d3f9b4e85f81da9c5e555bc1eca7dabb66f) — Publicación del bosquejo inicial del RTV.
  - [`7982f4b`](https://github.com/NixonPiguave/TA-PFC-E1-PFC-Entrega-1/commit/7982f4b48517d52920e8c513e65dad069ad93764) — Contrato REST entre Inspecciones y Turnos y Pagos.
  - [`89c99a7`](https://github.com/NixonPiguave/TA-PFC-E1-PFC-Entrega-1/commit/89c99a719679527a62045aa38cffb02f388de0b3) — Diagrama C4 de contenedores editable.
  - [`d19acd9`](https://github.com/NixonPiguave/TA-PFC-E1-PFC-Entrega-1/commit/d19acd927e7cc4921685a1d7cd7db3a0d9b5e3ed) — Imagen del diagrama de contenedores.
  - [`8fab8bc`](https://github.com/NixonPiguave/TA-PFC-E1-PFC-Entrega-1/commit/8fab8bcdcbc453cfa4789f78aeff85d76c5a7eef) — ADR-001: propuesta de arquitectura.
  - [`6e7c6be`](https://github.com/NixonPiguave/TA-PFC-E1-PFC-Entrega-1/commit/6e7c6be744d91225d31186cdad69485c063b918e) — ADR-002: comunicación REST.

- **Qué se hizo:** Publiqué el bosquejo inicial de la distribución del RTV y preparé su evolución al diagrama C4 de contenedores en draw.io. El diseño representa la aplicación web, los servicios de Turnos y Pagos e Inspecciones y sus bases PostgreSQL independientes. Coordiné con Diego el intercambio principal: Inspecciones solicita autorización antes de iniciar una revisión. Documenté el contrato REST con petición, respuestas, validaciones, idempotencia y tratamiento de fallos. Preparé los ADR de arquitectura y comunicación, indicando las alternativas consideradas y sus consecuencias.

- **Problema encontrado:** Una autorización puede guardarse aunque su respuesta no llegue o falle después el registro de la inspección. También era necesario delimitar qué parte debía implementar Diego sin reconstruir todo el RTV.

- **Solución y comprobación:** Delimité el prototipo al intercambio de autorización y documenté el reintento con la misma clave para recuperar el resultado original sin duplicarlo. Mantuve la responsabilidad de validar pagos en Turnos y Pagos. Revisé el diagrama editable y su imagen, y contrasté su contenido con el contrato. Las decisiones quedaron como propuestas para revisión conjunta; esta sesión no acredita pruebas de ejecución del código.

- **Uso de IA:** ChatGPT Sol 6.1  mediante Codex, como apoyo para preparar y mejorar los borradores del contrato y los ADR, y de apoyo a tomar decisiones para elaborar correctamente el diagrama editable y revisar la coherencia del diseño.

- **Tiempo dedicado:** 3 horas

### 2026-11-19 · García Bazurto Kevin Leonel

- **Integrantes presentes:** Kevin García.
- **Commit(s):**
  - [`9ea028f`](https://github.com/NixonPiguave/TA-PFC-E1-PFC-Entrega-1/commit/9ea028fef922461f3cadaa6d53108b9e6bf2f0e2) — Diagrama C4 de contexto editable e imagen.
  - [`207bb6c`](https://github.com/NixonPiguave/TA-PFC-E1-PFC-Entrega-1/commit/207bb6c9989cf11a61ef57f2cb35e1b966132d8d) — Análisis CAP y PACELC.
  - [`f219bc8`](https://github.com/NixonPiguave/TA-PFC-E1-PFC-Entrega-1/commit/f219bc8c332ab6a99764089a1b7d5f09fc690bec) — Referencias del análisis CAP y PACELC.
  - [`ddbb53d`](https://github.com/NixonPiguave/TA-PFC-E1-PFC-Entrega-1/commit/ddbb53d035de110779fda4d53b880b6dc1b72a9a) — Justificación de la arquitectura distribuida.
  - [`6f4ee3f`](https://github.com/NixonPiguave/TA-PFC-E1-PFC-Entrega-1/commit/6f4ee3f1c331fd9fa4e2eb1dab4f45684fdfaac0) — Modelo de comunicación del RTV.

- **Qué se hizo:** Completé el diagrama de contexto con el personal de atención, el inspector técnico y el RTV, mostrando por separado la información enviada y recibida. Preparé el análisis CAP/PACELC para pagos, autorizaciones, inicio de inspecciones y resultados. Documenté la justificación de la arquitectura distribuida, su relación con los requisitos no funcionales y sus ventajas y costos frente a un monolito modular. Elaboré el modelo de comunicación con las interacciones del diagrama, los mecanismos seleccionados y el manejo de fallos y reintentos. Incorporé dos artículos de 2022 y 2024 mediante sus DOI en Zotero y exporté sus referencias en BibLaTeX.

- **Problema encontrado:** Tener dos servicios no permite afirmar automáticamente que el RTV sea CP o AP. Era necesario distinguir las decisiones para el prototipo de las propuestas para una futura replicación. También debía evitarse afirmar que REST es más rápido basándose en una práctica que compara TCP y gRPC.

- **Solución y comprobación:** Separé el comportamiento ante fallos entre servicios de las decisiones sobre futuras copias de un mismo dato. Expliqué las consecuencias para el usuario y reconocí que distribuir no garantiza mejor rendimiento. Contrasté, con apoyo de Codex, los títulos, autores, revistas, años y DOI con las páginas editoriales, Crossref y los datos recuperados por Zotero. Revisé los requisitos de la actividad en el SGA y mantuve diferenciadas las propuestas de las pruebas realmente ejecutadas. Los documentos quedaron disponibles en el repositorio para su integración al informe LaTeX y revisión posterior.

- **Uso de IA:** ChatGPT Sol 6.1 mediante Codex, como apoyo para preparar y mejorar la documentación de arquitectura, y apoyo para ajustar el diagrama de contexto y verificar si las referencias agregadas son coherentes mediante las páginas editoriales. También apoyó la revisión de coherencia entre documentos.

- **Tiempo dedicado:** 2 horas
