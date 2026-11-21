import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash, randomInt, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { hostname, userInfo, cpus, totalmem, platform, release, arch } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';

const archivo = fileURLToPath(import.meta.url);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function estadisticas(filas) {
  if (!filas.length) return null;
  const tiempos = filas.map(f => f.duracionMs).sort((a, b) => a - b);
  assert.ok(tiempos.every(t => Number.isFinite(t) && t >= 0));
  const rango = Math.ceil(0.95 * tiempos.length);
  return {
    n: tiempos.length, minimoMs: tiempos[0], maximoMs: tiempos.at(-1),
    mediaMs: tiempos.reduce((s, t) => s + t, 0) / tiempos.length,
    rangoP95: rango, p95Ms: tiempos[rango - 1],
  };
}

export async function solicitar(url, dato, timeoutMs = 15000) {
  const peticion = JSON.stringify({ turnoId: dato.turnoId });
  const inicioUtc = new Date().toISOString();
  const inicio = performance.now();
  let http = null, texto = '', errorTransporte = '', requestId = '';
  try {
    const respuesta = await fetch(url, {
      method: 'POST', redirect: 'error',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': dato.clave },
      body: peticion, signal: AbortSignal.timeout(timeoutMs),
    });
    http = respuesta.status;
    requestId = respuesta.headers.get('x-request-id') || '';
    texto = await respuesta.text();
  } catch (error) {
    errorTransporte = error.name || 'ErrorTransporte';
  }
  const duracionMs = performance.now() - inicio;
  let cuerpo;
  try { cuerpo = JSON.parse(texto); } catch { cuerpo = null; }
  const valida = http === 201 && !errorTransporte && cuerpo?.turnoId === dato.turnoId
    && cuerpo?.estado === 'INICIADA' && uuid.test(cuerpo?.inspeccionId || '')
    && uuid.test(cuerpo?.autorizacionId || '');
  return {
    ...dato, inicioUtc, duracionMs, http, valida,
    error: errorTransporte || (valida ? '' : http === 201 ? 'RESPUESTA_INVALIDA' : 'HTTP_NO_201'),
    codigo: typeof cuerpo?.codigo === 'string' ? cuerpo.codigo : '', requestId,
    inspeccionId: valida ? cuerpo.inspeccionId : '',
    autorizacionId: valida ? cuerpo.autorizacionId : '',
  };
}

export async function ejecutarLote(datos, concurrencia, enviar) {
  assert.equal(datos.length % concurrencia, 0);
  const porUsuario = datos.length / concurrencia;
  const filas = await Promise.all(Array.from({ length: concurrencia }, async (_, usuario) => {
    const propias = [];
    for (let i = 0; i < porUsuario; i++) {
      const dato = datos[usuario * porUsuario + i];
      propias.push(await enviar({ ...dato, usuario: usuario + 1, ordenUsuario: i + 1 }));
    }
    return propias;
  }));
  return filas.flat().sort((a, b) => a.secuencia - b.secuencia);
}

function ejecutar(comando, argumentos, opciones = {}) {
  return spawnSync(comando, argumentos, { encoding: 'utf8', timeout: 15000, windowsHide: true, ...opciones });
}

function sql(servicio, sentencia) {
  const turnos = servicio === 'turnos';
  const prefijo = turnos ? 'TURNOS' : 'INSPECCIONES';
  const resultado = ejecutar(process.env.PSQL || 'psql', [
    '-XwAt', '-v', 'ON_ERROR_STOP=1', '-U', process.env[`${prefijo}_DB_USER`],
    '-d', turnos ? 'rtv_turnos_pagos' : 'rtv_inspecciones',
  ], { input: sentencia, env: { ...process.env, PGPASSWORD: process.env[`${prefijo}_DB_PASSWORD`] } });
  if (resultado.status !== 0) {
    throw new Error(`PostgreSQL (${servicio}): ${resultado.error?.code || resultado.stderr.trim()}`);
  }
  return resultado.stdout.trim();
}

function csv(filas) {
  const claves = ['fase', 'concurrencia', 'secuencia', 'usuario', 'ordenUsuario', 'turnoId', 'clave',
    'inicioUtc', 'duracionMs', 'http', 'valida', 'error', 'codigo', 'requestId', 'inspeccionId', 'autorizacionId'];
  const escapar = valor => `"${String(valor ?? '').replaceAll('"', '""')}"`;
  return [claves.join(','), ...filas.map(f => claves.map(c => escapar(f[c])).join(','))].join('\n') + '\n';
}

function comandoTexto(comando, argumentos, cwd) {
  const r = ejecutar(comando, argumentos, { cwd });
  return r.status === 0 ? (r.stdout + r.stderr).trim() : null;
}

function sistemaWindows() {
  if (platform() !== 'win32') return null;
  const consulta = "$s=Get-CimInstance Win32_OperatingSystem; $p=Get-CimInstance Win32_Processor; [pscustomobject]@{sistema=$s.Caption;version=$s.Version;memoriaLibreBytes=([long]$s.FreePhysicalMemory*1024);procesadores=@($p | Select-Object Name,NumberOfCores,NumberOfLogicalProcessors)} | ConvertTo-Json -Depth 4 -Compress";
  const texto = comandoTexto('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', consulta]);
  try { return JSON.parse(texto); } catch { return { detalle: 'No se pudo obtener información de CIM.' }; }
}

async function main() {
  const proyecto = resolve(process.cwd());
  assert.ok(Number(process.versions.node.split('.')[0]) >= 22, 'Se necesita Node 22 o posterior.');
  assert.ok(existsSync(join(proyecto, 'src/turnos-pagos/db/demo.sql')), 'Ejecuta desde la carpeta prototipo-e1.');
  for (const prefijo of ['TURNOS', 'INSPECCIONES']) {
    assert.ok(process.env[`${prefijo}_DB_PASSWORD`], `Falta ${prefijo}_DB_PASSWORD en esta terminal.`);
  }
  assert.equal(process.env.PGHOST, '127.0.0.1', 'Esta prueba requiere PostgreSQL local de demostración.');
  assert.equal(process.env.PGPORT, '55432', 'Se requiere el puerto dedicado 55432.');
  assert.equal(process.env.TURNOS_DB_USER, 'e1_turnos');
  assert.equal(process.env.INSPECCIONES_DB_USER, 'e1_inspecciones');
  for (const [prefijo, baseDatos] of [['TURNOS', 'rtv_turnos_pagos'], ['INSPECCIONES', 'rtv_inspecciones']]) {
    assert.equal(process.env[`${prefijo}_DB_URL`], `jdbc:postgresql://127.0.0.1:55432/${baseDatos}`);
  }
  assert.equal(process.env.TURNOS_URL, 'http://127.0.0.1:8081');
  assert.equal(process.env.TURNOS_PORT, '8081');
  assert.equal(process.env.INSPECCIONES_PORT, '8082');
  const java = comandoTexto('java', ['-version'], proyecto);
  assert.ok(/version "21(?:\.|\")/.test(java || ''), 'Esta terminal debe utilizar Java 21.');

  const runId = randomUUID();
  const fecha = new Date().toISOString();
  const salida = join(dirname(archivo), 'resultados', fecha.replaceAll(':', '-').replaceAll('.', '-') + '-' + runId.slice(0, 8));
  mkdirSync(salida, { recursive: true });
  const guardarJson = (nombre, valor) => writeFileSync(join(salida, nombre), JSON.stringify(valor, null, 2) + '\n');
  const todas = [], resumenes = [];
  const entorno = {
    runId, inicioUtc: fecha, zonaHoraria: Intl.DateTimeFormat().resolvedOptions().timeZone,
    usuario: userInfo().username, equipo: hostname(), proyecto,
    sistema: { plataforma: platform(), version: release(), arquitectura: arch(),
      cpu: cpus()[0]?.model, procesadoresLogicos: cpus().length, ramBytes: totalmem(), windows: sistemaWindows() },
    node: process.version, java,
    commitCodigo: comandoTexto('git', ['rev-parse', 'HEAD'], proyecto),
    cambiosRastreados: comandoTexto('git', ['--no-optional-locks', 'status', '--porcelain', '--untracked-files=no'], proyecto),
    hashMedidorSha256: createHash('sha256').update(readFileSync(archivo)).digest('hex'),
    ubicacion: 'Cliente, servicios y ambas bases en el mismo equipo; HTTP loopback; PostgreSQL puerto 55432.',
    endpoint: 'http://127.0.0.1:8082/inspecciones',
    alcance: 'Tiempo observado por el cliente: justo antes de fetch hasta terminar de recibir el cuerpo. Incluye HTTP, servicio Inspecciones y autorización remota. No es tiempo interno medido en el servidor.',
    metodo: { concurrencias: [1, 5, 10], solicitudesMedidasPorEscenario: 100,
      calentamientoPorEscenario: 10, calentamientoExcluidoDelP95: true,
      solicitudesPorUsuario: [100, 20, 10], modelo: 'Usuarios cerrados sin pausa: cada usuario espera su respuesta antes de enviar la siguiente.',
      temporizador: 'performance.now() monotónico en milisegundos', timeoutClienteMs: 15000,
      percentil: 'Rango más próximo: ordenar N duraciones y tomar ceil(0.95*N); rango95 para100.',
      fallos: 'Se conservan todas las duraciones y errores. Los tiempos agotados son observaciones censuradas; no respuestas exitosas.',
      criterioAceptacion: 'Pendiente de acuerdo con Diego y Kevin; esta ejecución no declara RNF-01 cumplido.',
      limitaciones: 'Una ejecución inicial por escenario, orden fijo1/5/10, sin prueba de capacidad sostenida ni instrumentación interna.' },
    jars: {},
  };
  for (const servicio of ['turnos-pagos', 'inspecciones']) {
    const jar = join(proyecto, `src/${servicio}/target/${servicio}-1.0.0-SNAPSHOT.jar`);
    assert.ok(existsSync(jar), `Falta compilar ${servicio}.`);
    entorno.jars[servicio] = { sha256: createHash('sha256').update(readFileSync(jar)).digest('hex') };
  }
  guardarJson('entorno.json', entorno);
  console.log(`Ejecución: ${runId}\nEquipo: ${hostname()} | Usuario: ${userInfo().username}\nFecha UTC: ${fecha}`);
  console.log(`Código: ${entorno.commitCodigo}\nSalida: ${salida}`);
  console.log('Medición CLIENTE del POST completo; umbral de aceptación PENDIENTE.');
  const guardarAvance = () => {
    writeFileSync(join(salida, 'mediciones.csv'), csv(todas));
    guardarJson('mediciones.json', todas);
    guardarJson('resumen.json', { runId, completo: false, criterioAceptacion: 'PENDIENTE', escenarios: resumenes });
  };
  try {
    entorno.postgresql = { turnos: sql('turnos', 'select version();'), inspecciones: sql('inspecciones', 'select version();') };
    const pom = readFileSync(join(proyecto, 'pom.xml'), 'utf8');
    entorno.springBoot = pom.match(/<artifactId>spring-boot-starter-parent<\/artifactId>\s*<version>([^<]+)<\/version>/)?.[1] || 'Consultar pom.xml';
    guardarJson('entorno.json', entorno);
    for (const puerto of [8081, 8082]) {
      const r = await fetch(`http://127.0.0.1:${puerto}/`, { signal: AbortSignal.timeout(5000) });
      await r.text();
      assert.equal(r.status, 404, `Servicio en puerto ${puerto}: arranque no confirmado.`);
    }
    const base = randomInt(10_000_000_000, 900_000_000_000);
    let secuencia = 0;
    for (const concurrencia of [1, 5, 10]) {
      const datos = Array.from({ length: 110 }, (_, i) => {
        secuencia++;
        return { fase: i < 10 ? 'calentamiento' : 'medicion', concurrencia, secuencia,
          turnoId: base + secuencia, clave: `p95-${runId}-${secuencia}` };
      });
      const ids = datos.map(d => d.turnoId).join(',');
      sql('turnos', `begin; insert into turnos(id,habilitado) select id,true from unnest(ARRAY[${ids}]::bigint[]) as t(id); insert into pagos(turno_id,confirmado) select id,true from unnest(ARRAY[${ids}]::bigint[]) as t(id); commit;`);
      console.log(`\nEscenario ${concurrencia} usuario(s): calentamiento10 + medición100.`);
      const enviar = dato => solicitar(entorno.endpoint, dato);
      const calientes = await ejecutarLote(datos.slice(0, 10), concurrencia, enviar);
      todas.push(...calientes);
      guardarAvance();
      assert.ok(calientes.every(f => f.valida), 'Falló el calentamiento. Revisa mediciones.csv y los servicios antes de medir.');
      const inicioLote = performance.now();
      const medidas = await ejecutarLote(datos.slice(10), concurrencia, enviar);
      const loteMs = performance.now() - inicioLote;
      todas.push(...medidas);
      guardarAvance();
      const exitosas = medidas.filter(f => f.valida);
      const autorizaciones = JSON.parse(sql('turnos', `select coalesce(json_agg(t),'[]'::json) from (select turno_id, id::text as autorizacion_id from autorizaciones where turno_id in (${ids})) t;`));
      const inspecciones = JSON.parse(sql('inspecciones', `select coalesce(json_agg(t),'[]'::json) from (select turno_id, id::text as inspeccion_id, autorizacion_id::text from inspecciones where turno_id in (${ids})) t;`));
      const porTurnoA = new Map(autorizaciones.map(r => [Number(r.turno_id), r]));
      const porTurnoI = new Map(inspecciones.map(r => [Number(r.turno_id), r]));
      const validas = [...calientes, ...medidas].filter(f => f.valida);
      const vinculosValidos = validas.every(f => porTurnoA.get(f.turnoId)?.autorizacion_id === f.autorizacionId
        && porTurnoI.get(f.turnoId)?.autorizacion_id === f.autorizacionId && porTurnoI.get(f.turnoId)?.inspeccion_id === f.inspeccionId);
      const resumen = { concurrencia, solicitudes: medidas.length, exitosas201: exitosas.length,
        errores: medidas.length - exitosas.length, erroresPorcentaje: 100 * (medidas.length - exitosas.length) / medidas.length,
        estadosHttp: medidas.reduce((s, f) => { const k = String(f.http ?? 'SIN_RESPUESTA'); s[k] = (s[k] || 0) + 1; return s; }, {}),
        todosLosIntentos: estadisticas(medidas), soloExitosas201: estadisticas(exitosas),
        tiemposAgotados: medidas.filter(f => f.error === 'TimeoutError').length,
        duracionLoteMs: loteMs, solicitudesPorSegundo: medidas.length / (loteMs / 1000),
        verificacionPersistencia: { autorizaciones: autorizaciones.length, inspecciones: inspecciones.length, esperadasConCalentamiento: 110, vinculosValidos },
        criterioAceptacion: 'PENDIENTE; no se declara cumplimiento del RNF-01.' };
      resumenes.push(resumen);
      guardarAvance();
      guardarJson(`persistencia-${concurrencia}.json`, { autorizaciones, inspecciones });
      console.log(`n=${medidas.length} | 201 válidos=${exitosas.length} | errores=${resumen.erroresPorcentaje.toFixed(2)}% | p95 de intentos=${resumen.todosLosIntentos.p95Ms.toFixed(3)} ms`);
      assert.ok(vinculosValidos, 'Una respuesta no coincide con los registros de ambas bases.');
      assert.equal(exitosas.length, 100, 'Hubo fallos medidos: se conservaron; esta ejecución requiere revisión.');
      assert.equal(autorizaciones.length, 110);
      assert.equal(inspecciones.length, 110);
    }
    guardarJson('resumen.json', { runId, completo: true, criterioAceptacion: 'PENDIENTE', escenarios: resumenes });
    console.log('\nRESULTADOS REALES: p95 observado por el cliente');
    console.table(resumenes.map(r => ({ usuarios: r.concurrencia, solicitudes: r.solicitudes,
      exitosas201: r.exitosas201, erroresPorcentaje: r.erroresPorcentaje,
      p95Ms: Number(r.todosLosIntentos.p95Ms.toFixed(3)),
      mediaMs: Number(r.todosLosIntentos.mediaMs.toFixed(3)), maximoMs: Number(r.todosLosIntentos.maximoMs.toFixed(3)) })));
    console.log('Fin de medición. Límite de aceptación pendiente; RNF-01 no aprobado aún.');
  } catch (error) {
    guardarAvance();
    guardarJson('error.json', { fechaUtc: new Date().toISOString(), error: error.message, escenariosCompletados: resumenes.length });
    throw error;
  } finally {
    console.log(`Archivos conservados en: ${salida}`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(archivo)) {
  main().catch(error => { console.error(`ERROR: ${error.message}`); process.exitCode = 1; });
}
