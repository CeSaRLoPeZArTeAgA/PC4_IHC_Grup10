/**
 * PC4 / TriageVoz Rural — Identidades solo para la DEMOSTRACIÓN académica.
 *  - DNI artificial de 8 cifras, primera cifra 1-9, aleatorio y no correlativo.
 *  - Completa los casos sin DNI NI nombre.
 *  - Corrige los DNI del generador anterior (00010001, ...) SOLO cuando una
 *    entrada de demo_identity_assignments confirma que fueron autogenerados.
 *  - No toca identidades ingresadas por usuarios ni casos con datos divergentes.
 *  - Copia transaccional de SQLite + CSV de verificación.
 * Requiere Node >= 22.13 y servidor apagado.
 */
import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { randomInt, createHash } from 'node:crypto';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
try { process.loadEnvFile?.(path.join(raiz, '.env')); } catch (e) { if (e?.code !== 'ENOENT') throw e; }
const conectado = puerto => new Promise(resolve => {
  const socket = net.connect({ host: '127.0.0.1', port: puerto });
  socket.setTimeout(800);
  socket.once('connect', () => { socket.destroy(); resolve(true); });
  socket.once('error', () => { socket.destroy(); resolve(false); });
  socket.once('timeout', () => { socket.destroy(); resolve(false); });
});
if (process.env.STORAGE_FILE || process.env.PROFILES_FILE) {
  console.error('ERROR: almacenamiento JSON configurado; revisa STORAGE_FILE / PROFILES_FILE.');
  process.exit(1);
}
if (await conectado(Number(process.env.PORT || 4173))) {
  console.error('ERROR: servidor en ejecución. Detén npm start con Ctrl+C antes de modificar SQLite.');
  process.exit(1);
}
const archivo = path.resolve(raiz, process.env.SQLITE_FILE || 'data/triagevoz.db');
if (!existsSync(archivo)) {
  console.error('ERROR: no existe SQLite:', archivo);
  process.exit(1);
}

const db = new DatabaseSync(archivo);
const marca = () => new Date().toISOString().replace(/[:.]/g, '-');
const csv = x => `"${String(x ?? '').replaceAll('"', '""')}"`;
function nombreDemo(codigo, usados) {
  const base = {
    HUANCA01: 'Rosa Huaman Salas',
    CAJATA02: 'Eusebio Rojas Quispe',
    ANDAHU03: 'Mariela Condori Paredes',
    PAUCAR04: 'Luis Huaman Torres',
    YAUYOS05: 'Pedro Flores Rojas',
    CHUMBI06: 'Eliana Mamani Apaza'
  };
  if (base[codigo] && !usados.has(base[codigo])) return base[codigo];
  const nombres = ['Ana','Carmen','Elena','Gabriela','Ines','Julia','Lucia','Marta','Noelia','Rocio','Silvia','Teresa','Valeria','Adriana','Paola','Marisol','Felipe','Carlos','Daniel','Hugo','Jorge','Julio','Manuel','Mario','Oscar','Pablo','Raul','Victor','Andres','Miguel','Ricardo','Sergio'];
  const apellidos = ['Quispe','Rojas','Mamani','Huaman','Flores','Vargas','Torres','Condori','Paredes','Soto','Castillo','Salazar','Apaza','Ramos','Puma','Lopez','Cruz','Chavez','Ortega','Rivera','Medina','Campos','Silva','Navarro','Morales'];
  const h = createHash('sha256').update('pc4-demostracion-2026:' + codigo).digest();
  for (let i = 0; i < 4096; i++) {
    const a = nombres[(h.readUInt32BE(0) + i) % nombres.length];
    const b = apellidos[(h.readUInt32BE(4) + i * 3) % apellidos.length];
    const c = apellidos[(h.readUInt32BE(8) + i * 7) % apellidos.length];
    const nombre = `${a} ${b} ${c === b ? apellidos[(h.readUInt32BE(12) + i) % apellidos.length] : c}`;
    if (!usados.has(nombre)) return nombre;
  }
  throw new Error('No se pudo generar otro nombre ficticio único');
}

try {
  db.exec('PRAGMA busy_timeout=2000; PRAGMA foreign_keys=ON;');
  const validacion = db.prepare('PRAGMA integrity_check').get().integrity_check;
  if (validacion !== 'ok') throw new Error('Falló la integridad de SQLite: ' + validacion);
  const columnas = new Set(db.prepare('PRAGMA table_info(cases)').all().map(x => x.name));
  if (!['code','dni','nombre','alias'].every(x => columnas.has(x))) {
    throw new Error('Esquema sin la migración PC4 (cases.code, dni, nombre, alias).');
  }
  if (!db.prepare("SELECT 1 AS ok FROM sqlite_master WHERE type='table' AND name='case_events'").get()) {
    throw new Error('Falta la tabla case_events; primero instala la migración PC4.');
  }
  const pendientes = db.prepare(`SELECT code, alias FROM cases
     WHERE TRIM(COALESCE(dni,''))='' AND TRIM(COALESCE(nombre,''))=''
     ORDER BY created_at, code`).all();
  const existeAuditoria = Boolean(db.prepare("SELECT 1 AS ok FROM sqlite_master WHERE type='table' AND name='demo_identity_assignments'").get());
  const auditados = existeAuditoria ? db.prepare(`
    SELECT c.code,c.dni,c.nombre,c.alias,d.dni AS dni_registrado,d.nombre AS nombre_registrado,d.origin
    FROM cases c JOIN demo_identity_assignments d ON d.case_code=c.code
    WHERE c.dni=d.dni AND c.nombre=d.nombre
  `).all() : [];
  // Solo cambiar los números generados y auditados por el parche anterior.
  const antiguos = auditados.filter(x => /^0\d{7}$/.test(x.dni) && x.origin === 'migracion_demo_pc4');
  const ignorados = db.prepare("SELECT count(*) AS n FROM cases WHERE TRIM(COALESCE(dni,''))='' AND TRIM(COALESCE(nombre,''))<>''").get().n;
  console.log('Base SQLite:', archivo);
  console.log(`Casos sin identidad: ${pendientes.length}; DNI correlativos previamente autogenerados: ${antiguos.length}.`);
  if (!pendientes.length && !antiguos.length) {
    console.log('No hay nada que modificar. DNI de prueba previamente corregidos permanecen intactos.');
    if (ignorados) console.log(`Aviso: ${ignorados} casos tienen nombre pero no DNI; se preservaron.`);
    process.exit(0);
  }

  const usados = new Set(db.prepare("SELECT dni FROM cases WHERE TRIM(COALESCE(dni,''))<>''").all().map(x => String(x.dni)));
  const nombres = new Set(db.prepare("SELECT nombre FROM cases WHERE TRIM(COALESCE(nombre,''))<>''").all().map(x => String(x.nombre)));
  // Los números asignados no deben ser correlativos entre sí, incluso al azar.
  const nums = new Set([...usados].filter(x=>/^[1-9]\d{7}$/.test(x)).map(Number));
  function nuevoDni() {
    for (let intento = 0; intento < 100000; intento++) {
      const n = randomInt(10_000_000, 100_000_000);
      const dni = String(n);
      if (usados.has(dni) || nums.has(n - 1) || nums.has(n + 1)) continue;
      usados.add(dni); nums.add(n);
      return dni;
    }
    throw new Error('No se pudo encontrar un DNI ficticio único y no consecutivo');
  }
  const altas = pendientes.map(x => {
    const nombre = nombreDemo(x.code, nombres);
    nombres.add(nombre);
    return {codigo:x.code, dni:nuevoDni(), nombre, alias:x.alias, accion:'NUEVO'};
  });
  const correcciones = antiguos.map(x => ({
    codigo:x.code, dni:nuevoDni(), nombre:x.nombre, alias:x.alias,
    anterior:x.dni, accion:'CORREGIDO'
  }));

  const carpeta = path.join(path.dirname(archivo), 'respaldos-pc4');
  mkdirSync(carpeta, { recursive: true });
  const fecha = marca();
  const copia = path.join(carpeta, `triagevoz-ANTES-DNI-aleatorios-${fecha}.db`);
  db.exec(`VACUUM INTO '${copia.replaceAll("'", "''")}'`);
  if (!existsSync(copia)) throw new Error('No se pudo crear respaldo; se canceló la actualización.');
  console.log('Respaldo generado:', copia);

  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS demo_identity_assignments (
      case_code TEXT PRIMARY KEY REFERENCES cases(code) ON DELETE CASCADE,
      dni TEXT NOT NULL, nombre TEXT NOT NULL,
      origin TEXT NOT NULL DEFAULT 'migracion_demo_pc4', assigned_at TEXT NOT NULL
    )`);
    const insertarCaso = db.prepare("UPDATE cases SET dni=?, nombre=? WHERE code=? AND TRIM(COALESCE(dni,''))='' AND TRIM(COALESCE(nombre,''))=''");
    const actualizarCaso = db.prepare('UPDATE cases SET dni=? WHERE code=? AND dni=? AND nombre=?');
    const insertarLog = db.prepare('INSERT INTO demo_identity_assignments(case_code,dni,nombre,origin,assigned_at) VALUES(?,?,?,?,?)');
    const actualizarLog = db.prepare("UPDATE demo_identity_assignments SET dni=?,origin=?,assigned_at=? WHERE case_code=? AND dni=? AND nombre=? AND origin='migracion_demo_pc4'");
    const evento = db.prepare('INSERT INTO case_events(case_code,event_type,created_at) VALUES(?,?,?)');
    const ahora = new Date().toISOString();
    for (const x of altas) {
      if (insertarCaso.run(x.dni,x.nombre,x.codigo).changes !== 1) throw new Error('Error en alta: ' + x.codigo);
      insertarLog.run(x.codigo,x.dni,x.nombre,'generador_pc4_no_correlativo',ahora);
      evento.run(x.codigo,'identidad_ficticia_pc4',ahora);
    }
    for (const x of correcciones) {
      if (actualizarCaso.run(x.dni,x.codigo,x.anterior,x.nombre).changes !== 1) throw new Error('Error al corregir: ' + x.codigo);
      if (actualizarLog.run(x.dni,'generador_pc4_no_correlativo',ahora,x.codigo,x.anterior,x.nombre).changes !== 1) {
        throw new Error('Error al actualizar auditoría: ' + x.codigo);
      }
      evento.run(x.codigo,'dni_ficticio_no_correlativo_pc4',ahora);
    }
    db.exec('COMMIT');
  } catch (e) { db.exec('ROLLBACK'); throw e; }

  const salida = path.join(carpeta, `DNI-ficticios-NO-correlativos-${fecha}.csv`);
  const filas = [ ['Codigo','DNI_ficticio','Nombre_ficticio','Accion'], ...[...altas,...correcciones].map(x=>[x.codigo,x.dni,x.nombre,x.accion]) ];
  writeFileSync(salida,'\uFEFF'+ filas.map(f=>f.map(csv).join(';')).join('\r\n')+'\r\n','utf8');
  const resultado = db.prepare('PRAGMA integrity_check').get().integrity_check;
  if (resultado !== 'ok') throw new Error('La verificación final de SQLite falló: ' + resultado);
  console.table([...altas,...correcciones].map(x => ({Caso:x.codigo,DNI:x.dni,Nombre:x.nombre,Accion:x.accion})));
  console.log(`Finalizado: ${altas.length} registros nuevos, ${correcciones.length} DNI correlativos reemplazados.`);
  console.log('Integridad SQLite:', resultado);
  console.log('CSV:', salida);
  if (ignorados) console.log(`Se mantuvieron ${ignorados} casos con nombre sin DNI por seguridad.`);
  console.log('Se conservaron síntomas, fechas, respuestas y códigos. Ejecuta npm start.');
} catch (e) {
  console.error('ERROR:',e.message);
  process.exitCode = 1;
} finally { db.close(); }
