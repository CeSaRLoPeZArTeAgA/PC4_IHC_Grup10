import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
const tmp=path.join(os.tmpdir(),'tv-dni-api-'+crypto.randomUUID());
process.env.STORAGE_FILE=tmp+'-cases.json';
process.env.PROFILES_FILE=tmp+'-profiles.json';
await fs.writeFile(process.env.STORAGE_FILE,JSON.stringify([{id:crypto.randomUUID(),code:'LEGADO01',alias:'Paciente de prueba',dni:'39314861',nombre:'Julio Quispe Silva',region:'Cabeza',answers:{motivo:'Prueba',inicio:'Ayer',intensidad:'Leve',adicionales:'No'},summary:'Resumen',priority:'Pendiente',status:'enviado',createdAt:new Date().toISOString(),ackAt:null,replies:[]}]),'utf8');
const {handler}=await import('../server.mjs');
after(async()=>{await fs.rm(process.env.STORAGE_FILE,{force:true});await fs.rm(process.env.PROFILES_FILE,{force:true})});

test('API PC4: personal médico consulta DNI, pero no puede alterar identidad ni con sesión válida',async()=>{
 const server=http.createServer(handler);
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const post=(route,body,cookie)=>fetch(base+route,{method:'POST',headers:{'content-type':'application/json',...(cookie?{cookie}:{})},body:JSON.stringify(body)});
 try{
  const payload={code:'LEGADO01',dni:'89765432',nombre:'Nombre cambiado',confirmChange:true};
  let r=await post('/api/doctor/cases/identity',payload);
  assert.equal(r.status,401,'Autenticación exigida');
  const login=await post('/api/doctor/login',{id:1,password:'123456'});
  assert.equal(login.status,200);
  const cookie=login.headers.get('set-cookie').split(';')[0];
  r=await post('/api/doctor/cases/identity',payload,cookie);
  assert.equal(r.status,403,'Prohibida modificación aunque se autentique');
  r=await fetch(base+'/api/rooms',{headers:{cookie}});
  assert.equal(r.status,200);
  const caso=(await r.json()).find(c=>c.code==='LEGADO01');
  assert.equal(caso.dni,'39314861');
  assert.equal(caso.nombre,'Julio Quispe Silva');
  r=await fetch(base+'/api/cases/by-dni?dni=39314861');
  assert.equal(r.status,200);
  assert.equal((await r.json())[0].code,'LEGADO01');
  r=await fetch(base+'/api/cases/by-dni?dni=89765432');
  assert.deepEqual(await r.json(),[]);
 }finally{await new Promise(resolve=>server.close(resolve))}
});
