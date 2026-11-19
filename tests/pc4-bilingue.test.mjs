import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {translateUiText,QUECHUA} from '../public/i18n-dictionary.js';
const base=new URL('../public/',import.meta.url);
const read=file=>fs.readFile(new URL(file,base),'utf8');

test('PC4: idioma por defecto español y menú destacado con solo dos opciones',async()=>{
 const nav=await read('navigation.js');
 const i18n=await read('i18n.js');
 const css=await read('styles.css');
 assert.match(nav,/<select id="homeLanguage"[^>]*><option value="es">Español<\/option><option value="qu">Quechua<\/option><\/select>/);
 assert.doesNotMatch(nav,/<p class="entry-version">Versión PC4 · Pre-triaje en telemedicina rural<\/p>/);
 assert.match(i18n,/original\.value='es'/);
 assert.match(css, /\.home-language-box select:focus-visible/);
});
test('PC4: el selector global sincroniza el idioma en todos los flujos',async()=>{
 const i18n=await read('i18n.js');
 const nav=await read('navigation.js');
 const app=await read('app.js');
 const sw=await read('sw.js');
 assert.match(i18n,/original\.dispatchEvent\(new Event\('change'/);
 assert.match(i18n,/original\.addEventListener\('change'/);
 assert.match(i18n,/MutationObserver/);
 assert.match(nav,/\['choiceLanguage','language'\]/);
 assert.match(app,/import\('\.\/i18n\.js'\)/);
 for(const uri of ['/i18n.js','/i18n-dictionary.js'])assert.ok(sw.includes(uri));
});
test('PC4: traducciones de las tres rutas y textos dinámicos',()=>{
 const expected={
  'Soy paciente':'Unquq kani',
  'Personal de salud':'Hampiqkuna',
  'Revisión de diagnóstico':'Hampiqpa kutichiyninta qhaway',
  'Continuar al triaje':'Triajeta qatiy',
  'Contraseña':'Pakay rimay',
  'Consultar triajes':'Triajekunata maskay',
  'Enviar respuesta':'Kutichiyta kachay',
  'Atendido · Ver respuesta':'Hampisqa · Kutichiyta qhaway'
 };
 for(const [es,qu] of Object.entries(expected)){
  assert.equal(translateUiText(es,'qu'),qu);
  assert.equal(translateUiText(es,'es'),es);
 }
 assert.equal(translateUiText('Paso 3 de 5','qu'),'Ñiqi 3 / 5');
 assert.equal(translateUiText('Se encontraron 2 triaje(s) para el DNI indicado.','qu'),'Kay DNIwan 2 triaje tarikusqa.');
});
test('PC4: las respuestas y nombres del paciente no se traducen automáticamente',async()=>{
 const i18n=await read('i18n.js');
 for(const selector of ['#caseDetails dd','#reviewList .review-message','#vuiMessages .vui-bubble p']){
  assert.ok(i18n.includes(selector));
 }
 assert.equal(translateUiText('Julio Quispe Silva','qu'),'Julio Quispe Silva');
 assert.equal(translateUiText('Paciente con dolor de espalda durante tres días','qu'),'Paciente con dolor de espalda durante tres días');
 assert.ok(Object.keys(QUECHUA).length>=125);
});
