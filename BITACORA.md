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
  - `[hash]` — [mensaje del commit de RF-01 a RF-05].
- **Qué se hizo:** Redacté las historias de usuario RF-01 a RF-05: autenticación de usuarios, asignación de roles, control de acceso, trazabilidad de acciones y registro de placa vehicular, con 21 criterios de aceptación en total. Las incorporé en la tabla de requisitos funcionales de `docs/informe.tex` con actor, necesidad, beneficio, criterios y fuente. Revisé los documentos publicados en el repositorio y enlacé cada fuente con los apartados de ISO/IEC/IEEE 29148:2018 sobre seguridad, perfiles de usuario y auditoría, y con los artículos de la Resolución 008-DIR-2017-ANT sobre datos del vehículo e identificación de placas. Mantuve los identificadores RF-01 a RF-05 y un formato común para que el equipo complete RF-06 a RF-10.
- **Problema encontrado:** Las historias no tienen todavía un respaldo directo en el levantamiento: faltan confirmar roles y permisos, acciones y campos de auditoría, formatos de placa, excepciones, duplicados y reinspecciones.
- **Solución y comprobación:** Separé los documentos de apoyo técnico de la evidencia del levantamiento y dejé las historias marcadas como propuestas pendientes de validación con el responsable del centro. Queda pendiente vincular cada historia con el acta, el audio o la retroalimentación, y añadir los enlaces al commit y al issue.
- **Uso de IA:** Codex, para analizar el material de los anexos, corregir la gramática y estructurar el LaTeX. Lo verifiqué contrastando los resultados con los documentos publicados.
- **Tiempo dedicado:** [X h Y min].

### 2026-11-18 · Mera Jumbo Allison
- **Integrantes presentes:** Mera Jumbo Allison.
- **Commit(s):**
  - `8547b6c` — Add files via upload (contexto, objetivos, RF-06 a RF-10 y trabajos relacionados).
- **Qué se hizo:** Redacté la sección de contexto y problema a partir de la entrevista al personal del CRTVMV: organización, flujo de atención en cinco puestos, verificaciones que dependen de la ANT y el SRI, tabla de consecuencias medibles y tabla de diez interesados. Cada afirmación cita la pregunta de la entrevista de la que sale (P1 a P13). Redacté el objetivo general y cuatro objetivos específicos, cada uno vinculado a una entrega (E1 a E4) y con su indicador. Escribí RF-06 a RF-10 (tipo, uso, número de ejes, peso y clasificación según NTE INEN 2656) con el formato de Nixon, con 20 criterios de aceptación y con la fuente en la entrevista. Redacté los trabajos relacionados con cuatro artículos de revistas indexadas de acceso abierto y agregué sus entradas a `referencias.bib`, revisando los datos de cada DOI. Convertí las tablas del informe a `xltabular` para que se puedan partir entre páginas. Creé mis 8 issues de E1 en GitHub y cerré del #1 al #5.
- **Problema encontrado:** Nixon había subido RF-01 a RF-05 al `informe.tex` del repo mientras yo trabajaba sobre la versión anterior. Una de las referencias que encontré primero era de conferencia y de pago. Las tablas saltaban a la página siguiente y dejaban espacios en blanco. No pude vincular un tablero de GitHub Projects porque el repositorio pertenece a la cuenta de Nixon, y la sección de etiquetas aparecía vacía. Además, el commit de hoy se subió con el mensaje automático de GitHub.
- **Solución y comprobación:** Combiné mis secciones con la versión del repo para no borrar el trabajo de Nixon. Reemplacé la referencia de pago por artículos de acceso abierto en IEEE Access, Applied Sciences, Telecom y Empirical Software Engineering. Con `xltabular` las tablas empiezan donde hay espacio, y comprobé que el documento compila sin errores. Creé los issues sin tablero y sin etiquetas; el tablero queda pendiente hasta que Nixon cree el Project en su cuenta y lo vincule al repo. Las cifras que dependen del levantamiento quedaron en el issue #8. Para los próximos commits reviso el mensaje antes de confirmar.
- **Uso de IA:** Claude (Opus 5.5), para redactar borradores de las secciones a partir de la entrevista y estructurar el LaTeX. 
- **Tiempo dedicado:** 1 h 55 min.
