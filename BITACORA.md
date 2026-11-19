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
