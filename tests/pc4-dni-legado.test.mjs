import test from 'node:test';
import assert from 'node:assert/strict';
import {createSqliteStore} from '../db/sqlite-store.mjs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
const fixture=(code,dni='',nombre='')=>({id:crypto.randomUUID(),code,alias:nombre||'Paciente ficticio',dni,nombre,region:'Cabeza',answers:{motivo:'Dolor ficticio',inicio:'Hoy',intensidad:'Leve',adicionales:'Ninguno'},summary:'Caso de demostración',priority:'Pendiente',status:'enviado',createdAt:new Date().toISOString(),replies:[]});
test('PC4: SQLite conserva identificaciones sin ofrecer edición médica',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'tv-dni-inmutable-'));
 const params={dbFile:path.join(dir,'triagevoz.db'),legacyCasesFile:path.join(dir,'nunca.json'),legacyProfilesFile:path.join(dir,'nunca-profiles.json')};
 let store;
 try{
  store=await createSqliteStore(params);
  store.saveCases([fixture('ANTERIOR01'),fixture('CASE0202','39314861','Julio Quispe Silva')]);
  assert.equal(store.assignCaseIdentity,undefined,'No se expone método de modificar la identidad');
  assert.ok(store.verifyDoctor(1,'123456'));
  assert.equal(store.readCases().length,2);
  assert.equal(store.readCases().find(c=>c.code==='ANTERIOR01').dni,'');
  assert.equal(store.listCasesByDni('39314861')[0].nombre,'Julio Quispe Silva');
  store.close();store=null;
  store=await createSqliteStore(params);
  assert.equal(store.listCasesByDni('39314861').length,1,'Persistencia del DNI');
  assert.equal(store.readCases().find(c=>c.code==='CASE0202').nombre,'Julio Quispe Silva');
 }finally{store?.close();await fs.rm(dir,{force:true,recursive:true})}
});
