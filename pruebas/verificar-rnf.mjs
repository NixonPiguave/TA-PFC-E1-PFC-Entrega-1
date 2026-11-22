import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { randomInt, randomUUID, createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, openSync, closeSync, realpathSync } from 'node:fs';
import { hostname, userInfo, cpus, totalmem, platform, release } from 'node:os';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { setTimeout as esperar } from 'node:timers/promises';

const root = process.cwd();
assert.equal(process.env.RTV_BASES_DE_PRUEBA, 'SI', 'Usar exclusivamente bases ficticias dedicadas y definir RTV_BASES_DE_PRUEBA=SI.');
assert.equal(process.env.PGHOST, '127.0.0.1');
assert.ok(process.env.PGPORT && process.env.RTV_PGDATA && process.env.PG_CTL);
assert.equal(process.env.RTV_REINICIAR_CLUSTER_PRUEBA, 'SI', 'Esta prueba reinicia el cluster dedicado: autorizar con RTV_REINICIAR_CLUSTER_PRUEBA=SI.');
const pgdata = realpathSync(process.env.RTV_PGDATA);
const pid = readFileSync(join(pgdata, 'postmaster.pid'), 'utf8').split(/\r?\n/);
assert.equal(realpathSync(pid[1]).toLowerCase(), pgdata.toLowerCase());
assert.equal(pid[3], process.env.PGPORT, 'El cluster no coincide con el puerto configurado.');
for (const p of ['TURNOS', 'INSPECCIONES']) {
  assert.ok(process.env[`${p}_DB_USER`] && process.env[`${p}_DB_PASSWORD`]);
  const dbname = p === 'TURNOS' ? 'rtv_turnos_pagos' : 'rtv_inspecciones';
  assert.equal(process.env[`${p}_DB_URL`], `jdbc:postgresql://127.0.0.1:${process.env.PGPORT}/${dbname}`);
}
assert.ok(process.env.RTV_SERVICE_TOKEN);
const { solicitar, estadisticas, ejecutarLote } = await import(pathToFileURL(join(root, 'pruebas/rendimiento.mjs')));
const runId = randomUUID();
const output = resolve(process.env.RTV_SALIDA || `evidencias/verificacion-calidad/${runId}`);
mkdirSync(output, { recursive: true });
const save = (name, data) => writeFileSync(join(output, name), JSON.stringify(data, null, 2) + '\n');
const exec = (cmd, args, extra = {}) => {
  const r = spawnSync(cmd, args, { cwd: root, windowsHide: true, encoding: 'utf8', timeout: 60000, ...extra });
  assert.equal(r.status, 0, r.error?.message || r.stderr || r.stdout);
  return (r.stdout + (r.stderr || '')).trim();
};
const java = process.env.JAVA_HOME ? join(process.env.JAVA_HOME, 'bin', process.platform === 'win32' ? 'java.exe' : 'java') : 'java';
const ports = { turnos: Number(process.env.TURNOS_PORT), inspecciones: Number(process.env.INSPECCIONES_PORT) };
assert.ok(Object.values(ports).every(p => p > 1024 && p < 65536));
assert.notEqual(ports.turnos, ports.inspecciones);
const url = name => `http://127.0.0.1:${ports[name]}`;
assert.equal(process.env.TURNOS_URL, url('turnos'));
const services = { turnos: 'turnos-pagos', inspecciones: 'inspecciones' };
const processes = new Map();
const sql = (name, text) => {
  const prefix = name === 'turnos' ? 'TURNOS' : 'INSPECCIONES';
  return exec(process.env.PSQL || 'psql', ['-XwAt', '-v', 'ON_ERROR_STOP=1', '-U', process.env[`${prefix}_DB_USER`], '-d', `rtv_${name === 'turnos' ? 'turnos_pagos' : 'inspecciones'}`], {
    input: text, env: { ...process.env, PGPASSWORD: process.env[`${prefix}_DB_PASSWORD`] },
  });
};
async function start(name, extra = {}) {
  const fd = openSync(join(root, '.local', `calidad-${name}.log`), 'a');
  const p = spawn(java, ['-jar', `src/${services[name]}/target/${services[name]}-1.0.0-SNAPSHOT.jar`], {
    cwd: root, windowsHide: true, stdio: ['ignore', fd, fd], env: { ...process.env, TURNOS_TIMEOUT: '3s', ...extra },
  });
  closeSync(fd);
  processes.set(name, p);
  let startError;
  p.on('error', e => { startError = e; });
  for (let n = 0; n < 120; n++) {
    if (startError || p.exitCode !== null) break;
    try {
      const r = await fetch(url(name), { signal: AbortSignal.timeout(500) });
      await r.text();
      if (r.status === 404) return;
    } catch {}
    await esperar(250);
  }
  throw new Error(`No arranco ${name}: consultar .local/calidad-${name}.log`, { cause: startError });
}
async function stop(name) {
  const p = processes.get(name);
  if (p && p.exitCode === null && p.signalCode === null) {
    const end = once(p, 'exit');
    p.kill();
    await end;
  }
  processes.delete(name);
}
const base = randomInt(10000000, 900000000);
const id = n => base + n;
const key = n => `calidad-${runId}-${n}`;
const evidence = [];
async function post(name, path, body, k, credential) {
  const headers = { 'Content-Type': 'application/json', 'Idempotency-Key': k };
  if (credential) headers.Authorization = `Bearer ${credential}`;
  const r = await fetch(url(name) + path, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(12000) });
  const result = { http: r.status, body: await r.json() };
  evidence.push({ instanteUtc: new Date().toISOString(), servicio: name, ruta: path, clave: k, cuerpo: body, respuesta: result });
  return result;
}
const inspect = (n, k = n) => post('inspecciones', '/inspecciones', { turnoId: id(n) }, key(k));
const authorize = (n, k, credential) => post('turnos', `/turnos/${id(n)}/autorizaciones-inspeccion`, {}, key(k), credential);
const counts = n => ({ autorizaciones: Number(sql('turnos', `select count(*) from autorizaciones where turno_id=${id(n)};`)), inspecciones: Number(sql('inspecciones', `select count(*) from inspecciones where turno_id=${id(n)};`)) });
const rejected = (r, http, codigo) => assert.deepEqual(r, { http, body: { codigo } });
const confirmed = r => {
  assert.equal(r.http, 201);
  assert.equal(r.body.estado, 'INICIADA');
  assert.match(r.body.inspeccionId, /^[0-9a-f-]{36}$/);
  assert.match(r.body.autorizacionId, /^[0-9a-f-]{36}$/);
  return r.body;
};
const prepare = (n, enabled = true, paid = true) => sql('turnos', `begin; insert into turnos values (${id(n)},${enabled}); insert into pagos values (${id(n)},${paid}); commit;`);
const results = [];
const pass = (rnf, detalles) => { results.push({ requisito: rnf, resultado: 'COMPROBACION_EJECUTADA', ...detalles }); console.log(`OK ${rnf}: ${JSON.stringify(detalles)}`); save('resumen.json', { runId, completo: false, resultados: results }); };
mkdirSync(join(root, '.local'), { recursive: true });
const env = {
  runId, inicioUtc: new Date().toISOString(), zonaHoraria: Intl.DateTimeFormat().resolvedOptions().timeZone,
  equipo: hostname(), usuario: userInfo().username, sistema: { plataforma: platform(), version: release(), cpu: cpus()[0]?.model, procesadoresLogicos: cpus().length, ramBytes: totalmem() },
  java: exec(java, ['-version']), node: process.version, postgresql: exec(process.env.PSQL || 'psql', ['--version']),
  commitBase: exec('git', ['rev-parse', 'HEAD']), cambiosRastreados: exec('git', ['--no-optional-locks', 'status', '--porcelain', '--untracked-files=no']),
  hashVerificador: createHash('sha256').update(readFileSync(new URL(import.meta.url))).digest('hex'),
  red: { host: '127.0.0.1', postgresql: Number(process.env.PGPORT), turnos: ports.turnos, inspecciones: ports.inspecciones },
  alcance: 'Cliente, servicios y bases dedicadas en el mismo equipo. Datos ficticios. Unica corrida por escenario; no acredita validacion de reglas por el CRTVMV ni capacidad en produccion.',
  criterioP95: { maximoMs: 100, fijadoAntesDeEstaEjecucion: true, origen: 'Criterio tecnico inicial ya publicado en RNF-01; se aplica exclusivamente al entorno local documentado.' },
};
save('entorno.json', env);
let proxy;
try {
  await start('turnos'); await start('inspecciones');

  // Se reutiliza el medidor publicado sin modificarlo y sin alterar sus registros anteriores.
  const measurements = [], performanceResults = [];
  for (const concurrency of [1, 5, 10]) {
    const data = Array.from({ length: 110 }, (_, i) => ({ turnoId: id(1000 * concurrency + i), clave: key(`p95-${concurrency}-${i}`), secuencia: i + 1, concurrencia: concurrency, fase: i < 10 ? 'calentamiento' : 'medicion' }));
    const ids = data.map(d => d.turnoId).join(',');
    sql('turnos', `begin; insert into turnos select n,true from unnest(ARRAY[${ids}]::bigint[]) n; insert into pagos select n,true from unnest(ARRAY[${ids}]::bigint[]) n; commit;`);
    const send = d => solicitar(url('inspecciones') + '/inspecciones', d);
    const warm = await ejecutarLote(data.slice(0,10), concurrency, send);
    const measured = await ejecutarLote(data.slice(10), concurrency, send);
    measurements.push(...warm, ...measured);
    save('mediciones-p95.json', measurements);
    assert.ok([...warm, ...measured].every(d => d.valida));
    const a = JSON.parse(sql('turnos', `select json_agg(t) from (select turno_id,id::text as autorizacion_id from autorizaciones where turno_id in (${ids}) order by turno_id) t;`));
    const b = JSON.parse(sql('inspecciones', `select json_agg(t) from (select turno_id,id::text as inspeccion_id,autorizacion_id::text from inspecciones where turno_id in (${ids}) order by turno_id) t;`));
    assert.equal(a.length,110); assert.equal(b.length,110);
    const am = new Map(a.map(d=>[Number(d.turno_id),d]));
    const bm = new Map(b.map(d=>[Number(d.turno_id),d]));
    assert.ok([...warm,...measured].every(d=>am.get(d.turnoId)?.autorizacion_id===d.autorizacionId && bm.get(d.turnoId)?.autorizacion_id===d.autorizacionId && bm.get(d.turnoId)?.inspeccion_id===d.inspeccionId));
    save(`persistencia-p95-${concurrency}.json`, { autorizaciones:a,inspecciones:b });
    const stats = estadisticas(measured);
    performanceResults.push({ usuarios:concurrency, solicitudes:100, calentamiento:10, errores:0, ...stats, umbralMs:100, satisfaceUmbral:stats.p95Ms<=100 });
  }
  save('p95.json', performanceResults);
  pass('RNF-01', { escenarios:performanceResults, todosSatisfacenUmbral:performanceResults.every(d=>d.satisfaceUmbral) });

  for (const [offset, enabled, paid, code, http] of [[100,false,true,'TURNO_NO_HABILITADO',409],[200,true,false,'PAGO_NO_CONFIRMADO',409],[300,null,null,'TURNO_INEXISTENTE',404]]) {
    for (let i=0;i<3;i++) {
      const n=offset+i;
      if (enabled!==null) prepare(n,enabled,paid);
      rejected(await inspect(n),http,code);
      assert.deepEqual(counts(n),{autorizaciones:0,inspecciones:0});
      if(paid===false) assert.equal(sql('turnos',`select confirmado from pagos where turno_id=${id(n)};`),'f');
    }
  }
  prepare(400); confirmed(await inspect(400));
  pass('RNF-03',{casosNegativos:9,casosPorCondicion:3,autorizacionesNegativas:0,inspeccionesNegativas:0,controlValido:201});

  prepare(401);
  const first=confirmed(await inspect(401));
  for(let i=0;i<10;i++) assert.deepEqual(await inspect(401),{http:200,body:first});
  assert.deepEqual(counts(401),{autorizaciones:1,inspecciones:1});
  prepare(402);
  const concurrent=await Promise.all([inspect(402,'concurrente-a'),inspect(402,'concurrente-b')]);
  assert.deepEqual(concurrent.map(r=>r.http).sort(),[201,409]);
  assert.deepEqual(counts(402),{autorizaciones:1,inspecciones:1});
  pass('RNF-04',{creacionInicial:1,reintentosConMismaClave:10,registrosTrasReintentos:counts(401),solicitudesSimultaneas:2,registrosTrasConcurrencia:counts(402)});

  prepare(403);
  const securityBefore={turnos:sql('turnos','select json_agg(t) from (select * from turnos order by id) t;'),pagos:sql('turnos','select json_agg(t) from (select * from pagos order by turno_id) t;'),autorizaciones:sql('turnos','select json_agg(t) from (select * from autorizaciones order by turno_id) t;')};
  for(let i=0;i<5;i++) rejected(await authorize(403,`sin-${i}`),401,'CREDENCIAL_INVALIDA');
  for(let i=0;i<5;i++) rejected(await authorize(403,`invalida-${i}`,'credencial-ficticia-incorrecta'),401,'CREDENCIAL_INVALIDA');
  const securityAfter={turnos:sql('turnos','select json_agg(t) from (select * from turnos order by id) t;'),pagos:sql('turnos','select json_agg(t) from (select * from pagos order by turno_id) t;'),autorizaciones:sql('turnos','select json_agg(t) from (select * from autorizaciones order by turno_id) t;')};
  assert.deepEqual(securityBefore,securityAfter);
  save('control-acceso.json',{antes:securityBefore,despues:securityAfter,datosIdenticos:true});
  assert.equal((await authorize(403,'valida',process.env.RTV_SERVICE_TOKEN)).http,201);
  pass('RNF-06',{sinCredencial:5,credencialIncorrecta:5,rechazos401:10,datosDeNegocioIdenticos:true,controlValido:201});

  prepare(404); await stop('turnos');
  rejected(await inspect(404),503,'TURNOS_NO_DISPONIBLE');
  assert.equal(sql('inspecciones',`select count(*) from inspecciones where turno_id=${id(404)};`),'0');
  await start('turnos'); assert.equal(counts(404).autorizaciones,0);
  confirmed(await inspect(404));
  prepare(405);
  proxy=createServer(async(req,res)=>{
    try {
      const chunks=[]; for await(const c of req) chunks.push(c);
      const headers=Object.fromEntries(['content-type','authorization','idempotency-key','x-request-id'].filter(k=>req.headers[k]).map(k=>[k,req.headers[k]]));
      const r=await fetch(url('turnos')+req.url,{method:'POST',headers,body:Buffer.concat(chunks)});
      const text=await r.text(); await esperar(4500);
      if(!res.destroyed) res.writeHead(r.status,{'Content-Type':'application/json'}).end(text);
    }catch{ if(!res.destroyed) res.writeHead(503).end(); }
  });
  proxy.listen(0,'127.0.0.1'); await once(proxy,'listening');
  await stop('inspecciones'); await start('inspecciones',{TURNOS_URL:`http://127.0.0.1:${proxy.address().port}`});
  rejected(await inspect(405),504,'TURNOS_TIEMPO_AGOTADO');
  assert.deepEqual(counts(405),{autorizaciones:1,inspecciones:0});
  const remoteId=sql('turnos',`select id from autorizaciones where turno_id=${id(405)};`);
  await stop('inspecciones'); await start('inspecciones');
  assert.equal(confirmed(await inspect(405)).autorizacionId,remoteId);
  proxy.close(); proxy.closeAllConnections(); proxy=null;
  pass('RNF-02',{casos:2,servicioDetenido:503,respuestaDemorada:504,inspeccionesAntesDelReintento:0,recuperacionConMismaClave:true,esperaConfigurada:'3s'});

  const persistentIds=[];
  for(let i=0;i<10;i++){prepare(500+i); confirmed(await inspect(500+i)); persistentIds.push(id(500+i));}
  const inventory=()=>({autorizaciones:JSON.parse(sql('turnos',`select json_agg(t) from (select * from autorizaciones where turno_id in (${persistentIds}) order by turno_id) t;`)),inspecciones:JSON.parse(sql('inspecciones',`select json_agg(t) from (select * from inspecciones where turno_id in (${persistentIds}) order by turno_id) t;`)),turnos:JSON.parse(sql('turnos',`select json_agg(t) from (select * from turnos where id in (${persistentIds}) order by id) t;`)),pagos:JSON.parse(sql('turnos',`select json_agg(t) from (select * from pagos where turno_id in (${persistentIds}) order by turno_id) t;`))});
  const before=inventory(); assert.equal(before.inspecciones.length,10); assert.equal(before.autorizaciones.length,10);
  save('reinicio-antes.json',before);
  await stop('inspecciones'); await stop('turnos');
  const restart=exec(process.env.PG_CTL,['restart','-D',pgdata,'-l',join(root,'.local','calidad-postgresql.log'),'-m','fast','-w','-t','30']);
  await start('turnos'); await start('inspecciones');
  const after=inventory(); assert.deepEqual(after,before); save('reinicio-despues.json',after);
  pass('RNF-05',{inspeccionesConfirmadas:10,autorizacionesAsociadas:10,conservacionPorcentaje:100,identificadoresYEstadosIdenticos:true,reinicios:['Turnos y Pagos','Inspecciones','PostgreSQL'],reinicioPostgresql:restart});
  assert.ok(process.env.PGPASSWORD, 'Definir la credencial del administrador del cluster dedicado para restaurar en bases nuevas.');
  const backups=join(root,'.local',`respaldos-${runId}`);
  mkdirSync(backups,{recursive:true});
  const restored=[];
  for(const [name,tables] of [['turnos',['turnos','pagos','claves','autorizaciones']],['inspecciones',['claves','inspecciones']]]){
    const prefix=name==='turnos'?'TURNOS':'INSPECCIONES';
    const sourceDb=name==='turnos'?'rtv_turnos_pagos':'rtv_inspecciones';
    const targetDb=`rtv_restaura_${name}_${runId.replaceAll('-','').slice(0,8)}`;
    const dump=join(backups,`${sourceDb}.dump`);
    exec(process.env.PG_DUMP||'pg_dump',['-w','-U',process.env[`${prefix}_DB_USER`],'-d',sourceDb,'-Fc','-f',dump],{env:{...process.env,PGPASSWORD:process.env[`${prefix}_DB_PASSWORD`]}});
    exec(process.env.PSQL||'psql',['-Xw','-v','ON_ERROR_STOP=1','-U',process.env.RTV_PGADMIN_USER||'postgres','-d','postgres','-c',`create database ${targetDb};`]);
    exec(process.env.PG_RESTORE||'pg_restore',['-w','-U',process.env.RTV_PGADMIN_USER||'postgres','--no-owner','--no-privileges','--exit-on-error','-d',targetDb,dump]);
    const checked=[];
    for(const table of tables){
      const statement=`select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]'::jsonb) from ${table} t;`;
      const original=JSON.parse(sql(name,statement));
      const copy=JSON.parse(exec(process.env.PSQL||'psql',['-XwAt','-v','ON_ERROR_STOP=1','-U',process.env.RTV_PGADMIN_USER||'postgres','-d',targetDb],{input:statement}));
      assert.deepEqual(copy,original);
      checked.push({tabla:table,registros:original.length,sha256:createHash('sha256').update(JSON.stringify(original)).digest('hex'),contenidoIdentico:true});
    }
    restored.push({origen:sourceDb,destino:targetDb,hashRespaldo:createHash('sha256').update(readFileSync(dump)).digest('hex'),tablas:checked});
  }
  save('restauracion-respaldos.json',{bases:restored,alcance:'Respaldo logico y restauracion controlada en bases nuevas del cluster ficticio; no simula perdida fisica ni mide RTO o RPO.'});
  pass('R-02',{basesRestauradas:2,contenidoDeTodasLasTablasIdentico:true});
  save('resumen.json',{runId,completo:true,finUtc:new Date().toISOString(),resultados:results,alcance:'Verificacion tecnica de los casos ejecutados y restauracion controlada de datos ficticios; no sustituye validacion de requisitos por el centro ni recuperacion de infraestructura en produccion.'});
}catch(e){
  save('error.json',{instanteUtc:new Date().toISOString(),error:e.message,stack:e.stack});
  console.error(e.message); process.exitCode=1;
}finally{
  if(proxy){proxy.close();proxy.closeAllConnections();}
  await Promise.all([...processes.keys()].map(stop));
  save('peticiones-respuestas.json',evidence);
}
