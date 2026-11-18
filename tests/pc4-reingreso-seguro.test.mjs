import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import http from 'node:http';
import {loginDoctor} from './pc4-auth-helper.mjs';

const tmp=path.join(os.tmpdir(),'pc4-reingreso-'+crypto.randomUUID()+'.json');
process.env.STORAGE_FILE=tmp;
const {handler}=await import('../server.mjs');
const server=http.createServer(handler);
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
after(async()=>{await new Promise(resolve=>server.close(resolve));await fs.rm(tmp,{force:true})});

test('PC4: salir del rol médico invalida la cookie y exige credenciales para reingresar',async()=>{
 const cookie=await loginDoctor(base);
 const headers={cookie};
 assert.equal((await fetch(base+'/api/doctor/me',{headers})).status,200);
 assert.equal((await fetch(base+'/api/rooms',{headers})).status,200);
 const logout=await fetch(base+'/api/doctor/logout',{method:'POST',headers});
 assert.equal(logout.status,200);
 assert.match(logout.headers.get('set-cookie')||'',/Max-Age=0/);
 assert.equal((await fetch(base+'/api/doctor/me',{headers})).status,401);
 assert.equal((await fetch(base+'/api/rooms',{headers})).status,401);
 const another=await loginDoctor(base);
 assert.equal((await fetch(base+'/api/doctor/me',{headers:{cookie:another}})).status,200);
});

test('PC4: reinicia historial al salir o volver a consultar, y nunca reutiliza login anterior',async()=>{
 const nav=await fs.readFile(new URL('../public/navigation.js',import.meta.url),'utf8');
 assert.match(nav,/function resetReview\(\)/);
 assert.match(nav,/get\('reviewForm'\)\.reset\(\)/);
 assert.match(nav,/get\('reviewList'\)\.replaceChildren\(\)/);
 assert.match(nav,/reviewController\?\.abort\(\)/);
 assert.match(nav,/page==='review'&&next!=='review'/);
 assert.match(nav,/next==='review'&&page!=='review'/);
 assert.doesNotMatch(nav,/if\(next==='review'&&patientIdentity\)get\('reviewDni'\)\.value/);
 assert.match(nav,/function closeDoctorSession\(\)/);
 assert.match(nav,/get\('doctorLoginForm'\)\.reset\(\)/);
 assert.match(nav,/doctorExitPromise=doctorExitPromise/);
 assert.match(nav,/await doctorExitPromise;/);
 assert.match(nav,/fetch\('\/api\/doctor\/logout'/);
 assert.doesNotMatch(nav,/fetch\('\/api\/doctor\/me'/);
});
