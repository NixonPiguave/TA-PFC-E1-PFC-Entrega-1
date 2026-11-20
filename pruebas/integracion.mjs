import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { randomInt } from 'node:crypto';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { mkdirSync, openSync, closeSync } from 'node:fs';
import { setTimeout as esperar } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('../', import.meta.url));
const local = '127.0.0.1';
const token = process.env.RTV_SERVICE_TOKEN;
assert.ok(token, 'Defina RTV_SERVICE_TOKEN y las credenciales de las bases de prueba');
const base = randomInt(1000000, 2000000000);
const turno = n => base + n;
const clave = n => `e1-${base}-${n}`;
const puertos = {
  'turnos-pagos': Number(process.env.TURNOS_PORT || 8081),
  inspecciones: Number(process.env.INSPECCIONES_PORT || 8082),
};
const url = servicio => `http://${local}:${puertos[servicio]}`;
const procesos = new Map();
const logs = new URL('../.local/', import.meta.url);
mkdirSync(logs, { recursive: true });

function ejecutarSql(servicio, sentencia) {
  const turnos = servicio === 'turnos-pagos';
  const prefijo = turnos ? 'TURNOS' : 'INSPECCIONES';
  const baseDatos = turnos ? 'rtv_turnos_pagos' : 'rtv_inspecciones';
  const usuario = process.env[`${prefijo}_DB_USER`];
  const password = process.env[`${prefijo}_DB_PASSWORD`];
  assert.ok(usuario && password, `Faltan credenciales para ${servicio}`);
  const resultado = spawnSync(process.env.PSQL || 'psql', [
    '-XwAt', '-v', 'ON_ERROR_STOP=1', '-U', usuario, '-d', baseDatos,
  ], {
    input: sentencia,
    encoding: 'utf8',
    env: { ...process.env, PGPASSWORD: password },
    timeout: 10000,
  });
  assert.equal(resultado.status, 0, resultado.error?.message || resultado.stderr);
  return resultado.stdout.trim();
}

async function arrancar(servicio, variables = {}) {
  const jar = `src/${servicio}/target/${servicio}-1.0.0-SNAPSHOT.jar`;
  const fd = openSync(new URL(`${servicio}.log`, logs), 'a');
  const proceso = spawn('java', ['-jar', jar], {
    cwd: raiz, stdio: ['ignore', fd, fd], env: { ...process.env, ...variables },
  });
  closeSync(fd);
  procesos.set(servicio, proceso);
  let errorInicio;
  proceso.on('error', error => { errorInicio = error; });
  for (let intento = 0; intento < 100; intento++) {
    if (errorInicio || proceso.exitCode !== null) break;
    try {
      const respuesta = await fetch(url(servicio), { signal: AbortSignal.timeout(500) });
      if (respuesta.status === 404 && proceso.exitCode === null) return;
    } catch {
      // El proceso aún puede estar inicializando.
    }
    await esperar(200);
  }
  throw new Error(`No arrancó ${servicio}. Revise .local/${servicio}.log`, { cause: errorInicio });
}

async function detener(servicio) {
  const proceso = procesos.get(servicio);
  if (proceso && proceso.pid && proceso.exitCode === null && proceso.signalCode === null) {
    const salida = once(proceso, 'exit');
    proceso.kill();
    await salida;
  }
  procesos.delete(servicio);
}

async function post(servicio, ruta, cuerpo, idempotencia, credencial) {
  const headers = { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencia };
  if (credencial) headers.Authorization = `Bearer ${credencial}`;
  const respuesta = await fetch(url(servicio) + ruta, {
    method: 'POST', headers, body: JSON.stringify(cuerpo), signal: AbortSignal.timeout(12000),
  });
  return [respuesta.status, await respuesta.json()];
}

const iniciar = (n, k = n) => post('inspecciones', '/inspecciones', { turnoId: turno(n) }, clave(k));
const autorizar = (n, k, credencial) => post('turnos-pagos',
  `/turnos/${turno(n)}/autorizaciones-inspeccion`, {}, clave(k), credencial);
const autorizaciones = n => ejecutarSql('turnos-pagos',
  `select id from autorizaciones where turno_id = ${turno(n)};`);
const inspecciones = n => ejecutarSql('inspecciones',
  `select autorizacion_id from inspecciones where turno_id = ${turno(n)};`);

function comprobarError(respuesta, estado, codigo) {
  assert.deepEqual(respuesta, [estado, { codigo }]);
}

function comprobarInicio([estado, cuerpo], n) {
  assert.equal(estado, 201, JSON.stringify(cuerpo));
  assert.equal(cuerpo.turnoId, turno(n));
  assert.equal(cuerpo.estado, 'INICIADA');
  assert.match(cuerpo.inspeccionId, /^[0-9a-f-]{36}$/);
  assert.match(cuerpo.autorizacionId, /^[0-9a-f-]{36}$/);
  assert.equal(autorizaciones(n), cuerpo.autorizacionId);
  assert.equal(inspecciones(n), cuerpo.autorizacionId);
  return cuerpo;
}

// Solo para la prueba. Reenvía una solicitud real y retarda su respuesta después del commit.
let retrasar = true;
const intermediario = createServer(async (peticion, respuesta) => {
  try {
    const fragmentos = [];
    for await (const fragmento of peticion) fragmentos.push(fragmento);
    const headers = Object.fromEntries(['content-type', 'idempotency-key', 'authorization', 'x-request-id']
      .map(nombre => [nombre, peticion.headers[nombre]]));
    const remota = await fetch(url('turnos-pagos') + peticion.url, {
      method: 'POST', headers, body: Buffer.concat(fragmentos), signal: AbortSignal.timeout(8000),
    });
    const cuerpo = await remota.text();
    if (retrasar && headers['idempotency-key'] === clave(8)) await esperar(4500);
    if (!respuesta.destroyed) {
      respuesta.writeHead(remota.status, { 'Content-Type': 'application/json' });
      respuesta.end(cuerpo);
    }
  } catch {
    if (!respuesta.destroyed) respuesta.writeHead(503).end();
  }
});

const restriccion = `e1_bloqueo_${base}`;
const config = { TURNOS_TIMEOUT: '3s' };
try {
  await arrancar('turnos-pagos');
  await arrancar('inspecciones', config);
  ejecutarSql('turnos-pagos', `
    begin;
    insert into turnos (id, habilitado)
    select ${base} + n, n <> 3 from generate_series(1, 10) as n;
    insert into pagos (turno_id, confirmado)
    select ${base} + n, n <> 2 from generate_series(1, 10) as n;
    commit;`);

  const creada = comprobarInicio(await iniciar(1), 1);
  console.log('OK 01 inicio y vínculo persistido');
  comprobarError(await iniciar(99), 404, 'TURNO_INEXISTENTE');
  console.log('OK 02 turno inexistente');
  comprobarError(await iniciar(2), 409, 'PAGO_NO_CONFIRMADO');
  assert.equal(ejecutarSql('turnos-pagos', `select confirmado from pagos where turno_id = ${turno(2)};`), 'f');
  console.log('OK 03 pago pendiente sin confirmación automática');
  comprobarError(await iniciar(3), 409, 'TURNO_NO_HABILITADO');
  for (const n of [99, 2, 3]) {
    assert.equal(autorizaciones(n), '');
    assert.equal(inspecciones(n), '');
  }
  console.log('OK 04 turno no habilitado');

  assert.deepEqual(await iniciar(1), [200, creada]);
  assert.deepEqual(await autorizar(1, 1, token), [200, { autorizacionId: creada.autorizacionId, turnoId: turno(1) }]);
  comprobarError(await iniciar(4, 1), 409, 'CLAVE_REUTILIZADA');
  comprobarError(await autorizar(4, 1, token), 409, 'CLAVE_REUTILIZADA');
  comprobarError(await iniciar(4, 99), 409, 'CLAVE_REUTILIZADA');
  console.log('OK 05 reintento y rechazo de clave con otro turno');

  const mismaClave = await Promise.all(Array.from({ length: 8 }, () => iniciar(4)));
  const primerInicio = comprobarInicio(mismaClave.find(([estado]) => estado === 201), 4);
  assert.equal(mismaClave.filter(([estado]) => estado === 201).length, 1);
  for (const [estado, cuerpo] of mismaClave) {
    assert.ok(estado === 200 || estado === 201);
    assert.deepEqual(cuerpo, primerInicio);
  }
  const variasClaves = await Promise.all(Array.from({ length: 8 }, (_, i) => iniciar(5, 50 + i)));
  assert.equal(variasClaves.filter(([estado]) => estado === 201).length, 1);
  comprobarInicio(variasClaves.find(([estado]) => estado === 201), 5);
  for (const resultado of variasClaves.filter(([estado]) => estado !== 201)) {
    comprobarError(resultado, 409, 'TURNO_YA_AUTORIZADO');
  }
  console.log('OK 06 simultaneidad con claves iguales y distintas');

  await detener('turnos-pagos');
  comprobarError(await iniciar(6), 503, 'TURNOS_NO_DISPONIBLE');
  assert.equal(inspecciones(6), '');
  await arrancar('turnos-pagos');
  comprobarInicio(await iniciar(6), 6);

  intermediario.listen(0, local);
  await once(intermediario, 'listening');
  await detener('inspecciones');
  await arrancar('inspecciones', { ...config, TURNOS_URL: `http://${local}:${intermediario.address().port}` });
  comprobarError(await iniciar(8), 504, 'TURNOS_TIEMPO_AGOTADO');
  const autorizacionTrasDemora = autorizaciones(8);
  assert.match(autorizacionTrasDemora, /^[0-9a-f-]{36}$/);
  assert.equal(inspecciones(8), '');
  retrasar = false;
  assert.equal(comprobarInicio(await iniciar(8), 8).autorizacionId, autorizacionTrasDemora);
  console.log('OK 07 servicio detenido y respuesta demorada después de guardar');

  comprobarError(await autorizar(7, 7), 401, 'CREDENCIAL_INVALIDA');
  comprobarError(await autorizar(7, 7, 'token-de-prueba-incorrecto'), 401, 'CREDENCIAL_INVALIDA');
  assert.equal(autorizaciones(7), '');
  console.log('OK 08 credencial ausente e incorrecta');

  await detener('inspecciones');
  await arrancar('inspecciones', config);
  assert.deepEqual(await iniciar(1), [200, creada]);
  assert.equal(autorizaciones(1), creada.autorizacionId);
  assert.equal(inspecciones(1), creada.autorizacionId);
  console.log('OK 09 datos conservados tras reiniciar ambas aplicaciones');

  ejecutarSql('inspecciones', `alter table inspecciones add constraint ${restriccion} check (turno_id <> ${turno(9)});`);
  let autorizacionPendiente;
  try {
    comprobarError(await iniciar(9), 503, 'PERSISTENCIA_NO_DISPONIBLE');
    autorizacionPendiente = autorizaciones(9);
    assert.match(autorizacionPendiente, /^[0-9a-f-]{36}$/);
    assert.equal(inspecciones(9), '');
  } finally {
    ejecutarSql('inspecciones', `alter table inspecciones drop constraint ${restriccion};`);
  }
  assert.equal(comprobarInicio(await iniciar(9), 9).autorizacionId, autorizacionPendiente);
  console.log('OK 10 recuperación de autorización tras fallo de escritura local');
} finally {
  intermediario.close();
  await Promise.all([...procesos.keys()].map(detener));
}
