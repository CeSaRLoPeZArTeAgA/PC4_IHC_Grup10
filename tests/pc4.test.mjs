import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createSqliteStore} from '../db/sqlite-store.mjs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';

test('PC4: migración no destructiva, 4 médicos con hashes y consulta de triajes por DNI',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'triagevoz-pc4-'));
 const dbFile=path.join(dir,'test.sqlite');
 const old=new DatabaseSync(dbFile);
 old.exec(`CREATE TABLE cases (code TEXT PRIMARY KEY,id TEXT NOT NULL UNIQUE,alias TEXT NOT NULL,region TEXT NOT NULL DEFAULT '',motivo TEXT NOT NULL DEFAULT '',inicio TEXT NOT NULL DEFAULT '',intensidad TEXT NOT NULL DEFAULT '',adicionales TEXT NOT NULL DEFAULT '',summary TEXT NOT NULL DEFAULT '',priority TEXT NOT NULL DEFAULT '',status TEXT NOT NULL CHECK(status IN ('enviado','recibido')),created_at TEXT NOT NULL,ack_at TEXT);`);
 old.prepare('INSERT INTO cases VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').run('ANTERIOR01',crypto.randomUUID(),'Caso heredado','Cabeza','Prueba','Ayer','Leve','No','Resumen','Sin prioridad','enviado',new Date().toISOString(),null);
 old.close();
 let store;
 try{
  store=await createSqliteStore({dbFile,legacyCasesFile:path.join(dir,'sin-casos.json'),legacyProfilesFile:path.join(dir,'sin-perfiles.json')});
  assert.equal(store.readCases().length,1,'se conserva el triaje anterior');
  assert.equal(store.readCases()[0].dni,'','el registro antiguo queda sin DNI inventado');
  assert.equal(store.listDoctors().length,4);
  assert.equal(store.verifyDoctor(1,'clave incorrecta'),null);
  assert.equal(store.verifyDoctor(1,'123456').nombre,'Dra. Ana Quispe');
  const raw=new DatabaseSync(dbFile);
  assert.equal(raw.prepare("SELECT COUNT(*) n FROM Personal_Salud WHERE clave_hash='123456'").get().n,0,'no guarda claves planas');
  raw.close();
  store.saveCases([{id:crypto.randomUUID(),code:'PC4-TEST01',alias:'Persona Ficticia',dni:'12345678',nombre:'Persona Ficticia',region:'Brazo',answers:{motivo:'Prueba',inicio:'Hoy',intensidad:'Leve',adicionales:'No'},summary:'Demo',priority:'Pendiente',status:'enviado',createdAt:new Date().toISOString(),replies:[]}]);
  assert.equal(store.listCasesByDni('12345678').length,1);
  assert.equal(store.listCasesByDni('87654321').length,0);
  assert.equal(store.listCasesByDni('12345678')[0].attended,false);
  const rec=store.readCases().find(c=>c.code==='PC4-TEST01');rec.replies=[{author:'Dra. Ana Quispe',message:'Respuesta ficticia.',createdAt:new Date().toISOString()}];store.saveCases([rec]);
  assert.equal(store.listCasesByDni('12345678')[0].attended,true);
 }finally{
  store?.close();
  await fs.rm(dir,{recursive:true,force:true});
 }
});
