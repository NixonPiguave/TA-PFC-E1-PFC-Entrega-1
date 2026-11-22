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
  - [`35ebdfb`](https://github.com/NixonPiguave/TA-PFC-E1-PFC-Entrega-1/commit/35ebdfb16aa8b1949abcc294bb6586744b52b03e) — Agrego riesgos técnicos vinculados con FORM-AC-01.
- **Qué se hizo:** Redacté RNF-01 a RNF-06 a partir de la propuesta técnica del equipo: rendimiento de la autorización de inicio, fallos de comunicación, integridad del estado de negocio, control de duplicados, persistencia tras reinicios y acceso entre servicios. Para cada requisito indiqué característica de ISO/IEC 25010:2023, métrica, umbral o estado pendiente, condiciones y método de comprobación. Documenté el flujo de autorización mediante REST con HTTP/JSON, la clave de idempotencia, el tratamiento de una respuesta perdida y los datos del entorno que deben registrarse. Incorporé las referencias ISO/IEC 25010:2023 y el artículo de Giamattei, Guerriero, Pietrantuono y Russo, publicado en Journal of Systems and Software en 2024, con DOI 10.1016/j.jss.2023.111857. Elaboré seis riesgos técnicos con probabilidad, impacto, mitigación y comprobación propuesta. Vinculé R-01, R-02 y R-03 con las lecciones 1, 2 y 3 de la sección 6 de FORM-AC-01, sobre el incidente de GitHub de octubre de 2018, y adapté esas lecciones al flujo de autorización del RTV.
- **Problema encontrado:** La propuesta de rendimiento no incluye todavía un máximo aceptable de p95 y las demás metas requieren confirmación técnica. OE-4 mide la consulta del estado del turno, mientras el ensayo propuesto mide autorización de inicio. Todavía no hay resultados reales de las pruebas de calidad. La versión publicada del esqueleto todavía no contiene todos los archivos necesarios para reproducir la ejecución.
- **Solución y comprobación:** Separé las metas propuestas de los resultados medidos y dejé pendiente el límite de p95. Definí los escenarios de rechazo, reintento, concurrencia y reinicio, junto con los registros que permitirán comprobarlos. Queda pendiente acordar las metas con el equipo, conciliar el indicador de OE-4 y ejecutar las pruebas cuando exista la implementación. El commit de los RNF quedó enlazado; faltan el enlace al issue y el hash del avance de riesgos cuando se publique. Contrasté la trazabilidad de los tres riesgos con FORM-AC-01 y el informe oficial del incidente. Definí comprobaciones de reintento, concurrencia, recuperación, caída del proveedor y rechazo de credenciales, y un flujo de demostración propuesto. Las probabilidades son estimaciones y no se presentan pruebas como ejecutadas.
- **Uso de IA:** Codex, para verificar mis borradores de los requisitos no funcionales y corregir una mala redacción y estructurar el LaTeX. Verifiqué su coherencia con la propuesta técnica del equipo y las fuentes publicadas. También se utilizó para preparar un borrador de la matriz de riesgos y su estructura en LaTeX, se contrastaron las lecciones con FORM-AC-01 y la fuente oficial del incidente.
- **Tiempo dedicado:** 4 horas

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


### 2026-11-19 · Mera Jumbo Allison

- **Integrantes presentes:** Mera Jumbo Allison.
- **Commit(s):**
  - [`6544135`](https://github.com/NixonPiguave/TA-PFC-E1-PFC-Entrega-1/commit/65441353c9f86c041bd3867eb0decc4cda5bdc5c) — Integra la arquitectura en el informe #6.
  - [`ddd30c0`](https://github.com/NixonPiguave/TA-PFC-E1-PFC-Entrega-1/commit/ddd30c05b670ce52b78e6749a3ac3e927eb1e0f0) — Elimina la versión anterior del informe.
  - [`ee4d089`](https://github.com/NixonPiguave/TA-PFC-E1-PFC-Entrega-1/commit/ee4d089cc2c2634fd814e0ca572a390f2d559229) — Renombra main.tex a informe.tex.

- **Qué se hizo:** Integré al informe LaTeX los documentos de arquitectura de Kevin, conservando lo que ya habían trabajado Nixon y Diego. Pasé a LaTeX la justificación de la arquitectura distribuida, el modelo de comunicación y el análisis CAP/PACELC, con sus tablas, y convertí las citas del Markdown a citas de LaTeX. Inserté como figuras el diagrama C4 de contexto, el de contenedores y el bosquejo inicial, con sus títulos, y redacté la descripción de cada diagrama y la evolución del diseño desde el bosquejo. Resumí ADR-001 y ADR-002 con contexto, opciones, decisión y consecuencias. Añadí a `referencias.bib` las dos referencias exportadas de Zotero, sin borrar las existentes. Mantuve en el análisis CAP/PACELC la diferencia entre decisiones propuestas y capacidades implementadas. Compilé el documento en Overleaf con pdflatex → biber → pdflatex → pdflatex.

- **Problema encontrado:** La referencia de Ayas tenía el apellido del autor cambiado y no coincidía con el artículo publicado. En Overleaf, el bosquejo no se encontraba porque la carpeta `evidencias` quedaba en otra ubicación que en el repositorio. Al subir los archivos, el informe se cargó como `main.tex` y quedaron dos versiones en `docs/`. Además, noté que el diagrama de contexto no muestra sistemas externos, aunque el enunciado los pide en el nivel 1.

- **Solución y comprobación:** Corregí el autor de Ayas (`Ayas, Hamdy Michael`) en el `.bib` y en el texto, comparándolo con el PDF del artículo en Springer, y se lo comuniqué a Nixon. Agregué `evidencias/` al `\graphicspath` para que las figuras se encuentren tanto en Overleaf como en el repositorio. Eliminé el `informe.tex` anterior y renombré `main.tex` a `informe.tex`. Comprobé que el PDF muestra las tres figuras, las 8 referencias numeradas y ninguna cita sin resolver. Le avisé a Kevin para que revise la integración y lo de los sistemas externos en el C4 de contexto.

- **Uso de IA:** Claude (Opus 5.5), como apoyo para ubicar las secciones en el informe y revisar los datos de las referencias. Verifiqué el resultado compilando en Overleaf, revisando el PDF y contrastando las referencias con las páginas de los artículos.

- **Tiempo dedicado:** 1 h 15 min.

2026-11-20 · Diego Giraldo
- Integrantes presentes: Diego Giraldo.
- Commit(s):
  - 9d31b51 — Ignora archivos de compilación y configuración local. Este fue el commit usado para la verificación.
- Qué se hizo: Compilé los servicios de Inspecciones y Turnos y Pagos desde una copia limpia del código publicado. Se generaron ambos JAR y ejecuté node pruebas/integracion.mjs con las dos bases PostgreSQL de demostración ya preparadas. También preparé las instrucciones de arranque y los ejemplos curl para reproducir el intercambio.
- Problema encontrado: El script configurar.examples.ps1 usaba // para un comentario, lo que causaba un error al cargarlo en PowerShell. Además, era necesario comprobar que Inspecciones pudiera recuperarse si Turnos y Pagos dejaba de responder o si fallaba el registro local.
- Solución y comprobación: Definí las variables de entorno en la sesión para ejecutar la prueba y corregí el comentario en GitHub usando #. La suite terminó con código 0 y pasaron los diez escenarios, incluidos solicitudes simultáneas, caída y demora del servicio, reinicio de ambas aplicaciones y recuperación tras un fallo de escritura. En el caso de recuperación, el reintento con la misma clave reutilizó el UUID de la autorización y registró una sola inspección.
- Pendiente de cierre: Revisar con Kevin que el flujo coincida con el C4 y el ADR-002 y la medición de p95 quedó a cargo de otro integrante.
- Tiempo dedicado: 1 h 30 min.

### 2026-11-20 · Piguave Nixon
- **Integrantes presentes:** Piguave Nixon.
- **Commit(s):**   - [`02b2b96`](https://github.com/NixonPiguave/TA-PFC-E1-PFC-Entrega-1/commit/02b2b968e2fbaeb56779c2eb82ceee47b2e7996e) — Documentación del p95 y las evidencias de comunicación del RTV
- **Qué se hizo:** Recuperé los seis riesgos técnicos y su relación con las tres lecciones de FORM-AC-01 en el informe integrado. Ejecuté personalmente la compilación y los diez escenarios de integración del prototipo de AppWebRevisionVehicular, commit 77d1ff6, y comprobé manualmente el inicio, el reintento y el rechazo por pago pendiente. Medí POST /inspecciones completo desde el cliente con 1, 5 y 10 usuarios simultáneos, 100 solicitudes por escenario y 10 solicitudes de calentamiento independientes por escenario. Los p95 fueron 14,256 ms, 25,982 ms y 47,432 ms, con 300 respuestas HTTP 201 y 0 % de errores. Establecí un criterio inicial de p95 máximo de 100 ms para este entorno local y documenté el método, las condiciones, las limitaciones y los archivos de comprobación.

- **Problema encontrado:** La terminal utilizaba un JRE de Java 8 y la suite no tenía cargadas las variables de conexión. La integración del informe había dejado la matriz de riesgos como plantilla. El límite de rendimiento no estaba definido al iniciar la medición y todavía no he comprobado un clon limpio del repositorio de entrega.
- **Solución y comprobación:** Configuré Temurin JDK 21 en la terminal y preparé un clúster PostgreSQL dedicado en el puerto 55432, con bases y credenciales separadas. La compilación y la suite terminaron correctamente. Guardé tres capturas funcionales, una de rendimiento y los registros originales. Recalculé el p95 como la observación 95 de cada conjunto de 100 duraciones y contrasté las respuestas con las autorizaciones e inspecciones de ambas bases. Los tres escenarios quedaron por debajo del criterio inicial de 100 ms, definido después de revisar esta prueba exploratoria. La medición corresponde al tiempo observado por el cliente y no al tiempo interno instrumentado en el servidor. Quedan pendientes contrastar el criterio con la necesidad del inspector, la reproducción desde un clon limpio de la entrega y las condiciones de los otros RNF que esta prueba no cubre.
- **Uso de IA:** Codex, como apoyo para recuperar mi sección de riesgos, preparar el medidor de rendimiento y estructurar los resultados. Ejecuté las pruebas en mi equipo y verifiqué las capturas, las mediciones originales, el cálculo del p95, los registros de ambas bases y las diferencias del informe.
- **Tiempo dedicado:** 2 h


### 2026-11-20 · García Bazurto Kevin Leonel

- **Integrantes presentes:** García Bazurto Kevin Leonel. Acuerdo con Diego Giraldo sobre los formatos del contrato.
- **Qué se hizo:** Se contrastaron el esqueleto, el C4, el ADR-002 y el contrato REST. La compilación y los diez casos de integración finalizaron correctamente en una copia limpia con bases de prueba independientes. Se publicó la revisión de arquitectura y el registro original de resultados. Después de acordarlo con Diego, se actualizó el contrato a la versión 0.2: cuerpo `{}`, autorización identificada por UUID, respuesta con `autorizacionId` y `turnoId`, y errores con el campo `codigo`. Se ajustaron el ADR-002, el formato de la clave, la reserva persistente y el manejo de los errores de comunicación.
- **Problema encontrado:** El contrato 0.1 describía campos y nombres de errores diferentes de los que utilizaban ambos servicios. En Windows, el lanzador de Java también dejó activo el proceso real durante la primera prueba de servicio detenido.
- **Solución y comprobación:** Se acordó documentar la interfaz mínima implementada, conservando las reglas de autorización y recuperación. Se ejecutó la suite con el ejecutable directo del JDK 21 y pasaron los diez casos, incluidos concurrencia, servicio detenido, respuesta demorada y fallo de escritura local. El código de los servicios se mantuvo sin cambios.
- **Uso de IA:** Utilicé ChatGPT Sol 6.1 mediante Codex como apoyo para contrastar la arquitectura con la implementación y mejorar la documentación. La compilación y las pruebas de integración se ejecutaron desde Codex en el entorno de prueba.

### 2026-11-20 · Mera Jumbo Allison

- **Integrantes presentes:** Mera Jumbo Allison.
- **Commit(s):**
  - [`7bd1139`](https://github.com/NixonPiguave/TA-PFC-E1-PFC-Entrega-1/commit/7bd113936dad9c237780a87d2a16d9c6d14386f2) — Integra el contrato 0.2 y el ADR-002 #6.

- **Qué se hizo:** Integré en el informe LaTeX la versión 0.2 del contrato REST y el ADR-002 actualizado por Kevin. En el intercambio principal agregué las cabeceras de la solicitud (`Content-Type`, `Idempotency-Key`, `Authorization` y `X-Request-Id`), la respuesta de Turnos y Pagos con `autorizacionId` y `turnoId`, la tabla de códigos de error del proveedor y la respuesta de Inspecciones. Actualicé la tabla de fallos con los códigos que devuelve Inspecciones (`503`, `504` y `502`), cambié el estado del ADR-002 a aceptado y añadí su verificación con los diez casos de integración. Configuré TeXstudio con Biber para compilar el informe en mi computadora. También revisé qué partes del documento siguen pendientes y busqué en el repositorio la evidencia del levantamiento.

- **Problema encontrado:** Al integrar ayer la arquitectura de Kevin, trabajé sobre una versión del informe descargada antes de que Nixon subiera sus riesgos técnicos, y al subir el archivo completo su sección quedó sin contenido. En TeXstudio las citas aparecían como no definidas porque la herramienta bibliográfica no estaba configurada. 

- **Solución y comprobación:** Nixon restauró su sección de riesgos. Para evitar que se repita, antes de subir el informe reviso en el historial de `docs/informe.tex` que nadie haya hecho cambios después de mi descarga, y aviso en el grupo cuando estoy editando. Antes de subir el commit de hoy comprobé que el último cambio al informe era el de Nixon y que su contenido se conservaba. Configuré Biber como herramienta bibliográfica y compilé con pdflatex → biber → pdflatex → pdflatex: el PDF quedó en 45 páginas, sin citas sin resolver. 

- **Uso de IA:** Claude (Opus 5.5), como apoyo para identificar los cambios del contrato 0.2 que debían reflejarse en el informe, comparar mi versión con la del repositorio antes de subirla. Verifiqué el resultado compilando en TeXstudio y revisando el PDF.

- **Tiempo dedicado:** 1 h.

### 2026-11-21 · Mera Jumbo Allison

- **Integrantes presentes:** Mera Jumbo Allison. En la grabación del video: Garcia Kevin, Giraldo Diego, Piguave Nixon y Mera Jumbo Allison.
- **Commit(s):**
  - [`e94c419`](https://github.com/NixonPiguave/TA-PFC-E1-PFC-Entrega-1/commit/e94c4196ddce61a3b22331ae69365f154696d3d8) — Completa plan, esqueleto, aportes y resumen #6.
  - [`491a92a`](https://github.com/NixonPiguave/TA-PFC-E1-PFC-Entrega-1/commit/491a92adddcf7fd156ce897a3aafd59bea806751) — Actualización de pequeños detalles.
  - [`91df0a2`](https://github.com/NixonPiguave/TA-PFC-E1-PFC-Entrega-1/commit/91df0a269277b1ad8a62b5cbc4697d376febfde8) — Enlaza el tablero del proyecto (closes #6).
  - [`6795eb4`](https://github.com/NixonPiguave/TA-PFC-E1-PFC-Entrega-1/commit/6795eb4f4301e96d2facd389134d84b763ca39eb) — Integra la captura del tablero.
  - [`489e29c`](https://github.com/NixonPiguave/TA-PFC-E1-PFC-Entrega-1/commit/489e29c2bbbafc2f936d9e38c9fc81d4545c3d96) — Elimina el PDF con nombre duplicado.
  - [`f33e943`](https://github.com/NixonPiguave/TA-PFC-E1-PFC-Entrega-1/commit/f33e943359688fcd83ba0d0ee5ae1cc686ae95c9) — Integra la encuesta y el enlace del video (#8).
  - [`a2cf206`](https://github.com/NixonPiguave/TA-PFC-E1-PFC-Entrega-1/commit/a2cf206f66a94c8fdfd5eddafff11d528af15063) — Agrega el enlace del video al README.

- **Qué se hizo:** Completé las secciones del informe que podían llenarse con el material del repositorio: el resumen ejecutivo, los objetivos OE-3 y OE-4 alineados con los RNF de Nixon, los roles y responsabilidades, los servicios mínimos, la evidencia de ejecución con las capturas, las evidencias de autoría, la tabla de aportes con enlaces a los commits e issues de cada integrante y la declaración de uso de IA del equipo. Completé la portada y el cronograma con las fechas oficiales del encuadre (semanas 9, 13 y 17) y enlacé el tablero del proyecto. Preparé el PDF de una página para el SGA. Integré la captura del tablero subida por Nixon, los resultados de la encuesta de 17 respuestas en el contexto y en la tabla de consecuencias, y el enlace del video en el informe y en el README. Participé en la grabación del video explicando mi parte como responsable de documentación.

- **Problema encontrado:** El PDF del informe se había subido como `informe.pdf.pdf`, con lo que el enlace del README quedaba roto. Al subir el PDF para el SGA me equivoqué de archivo y elegí el informe completo en lugar del de una página. 

- **Solución y comprobación:** Volví a compilar y subí el informe como `docs/informe.pdf`, y eliminé el archivo con nombre duplicado.  Subí al SGA el PDF de una sola página (111 KB).  Con la encuesta completé la tabla de consecuencias con porcentajes calculados sobre las 17 respuestas.

2026-11-21 · Diego Giraldo
- Integrantes presentes: Diego Giraldo.
- Qué se hizo: Preparé mi parte de la presentación de la Entrega 1. Levanté PostgreSQL y los servicios de Turnos y Pagos e Inspecciones, preparé turnos ficticios con pago confirmado y ensayé el flujo con curl. Organicé la demostración en tres casos: inicio autorizado, reintento con la misma clave de idempotencia y solicitud con Turnos y Pagos detenido.
- Problema encontrado: Las ventanas de PowerShell se abrieron en la raíz del proyecto RTV, por lo que Java no encontraba los JAR del prototipo. Además, al abrir /inspecciones en el navegador recibí un 405, porque la barra de direcciones envía GET y la operación requiere POST.
- Solución y comprobación: Arranqué las aplicaciones con rutas absolutas y ejecuté las solicitudes desde la terminal. Comprobé el 201 de inicio autorizado y preparé dos turnos nuevos para grabar el flujo sin reutilizar inspecciones de ensayos anteriores. En el guion expliqué cómo el 200 del reintento conserva los identificadores y cómo el 503 muestra que Inspecciones necesita una autorización de Turnos y Pagos para registrar un inicio nuevo.
- **Uso de IA:** ChatGPT (6.2 Sol), como apoyo para resolver los problemas encontrados al ejecutar los JAR del prototipo
- Tiempo dedicado: 1 hora 25 min.


### 2026-11-21 · Piguave Nixon

- **Commit(s):** [`e7b18ee`](https://github.com/NixonPiguave/TA-PFC-E1-PFC-Entrega-1/commit/e7b18ee97b478d54edb50d999ceb9237607ae942) — Agregué evidencias del tablero de issues.
- **Qué se hizo:** Agregué evidencias del tablero de issues. Se contrastaron las respuestas de la encuesta con RF-01 a RF-05 y se incorporó la solicitud de auditoría de E11 como origen de esa necesidad, manteniendo diferenciados los criterios técnicos y la confirmación del centro. Se verificó un clon nuevo del repositorio de entrega: compilación, diez escenarios de integración, nueva medición de p95 y cantidades previstas de los otros RNF. Se comprobaron el reinicio de PostgreSQL con diez inspecciones confirmadas y la restauración de respaldos en bases ficticias nuevas. Se agregó al informe la referencia a la revisión grupal del 21 de noviembre y se regeneró el PDF.

- **Comprobación:** pruebas sobre el commit `877bb16`, con registros en `evidencias/verificacion-calidad/` y procedimiento en `docs/calidad/verificacion-e1.md`.
- **Declaración de uso de IA:** Codex, como apoyo para revisar la trazabilidad. Se ejecutaron las comprobaciones en un clúster ficticio separado, se contrastaron las respuestas y los inventarios y se verificaron las diferencias con la versión del repositorio.

