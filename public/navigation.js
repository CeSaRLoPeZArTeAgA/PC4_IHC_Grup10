// Navegación PC3: bienvenida > opciones > voz/formulario > revisión; personal de salud por separado.
import {mountPersonalityPanel} from './personality-ui.js';
const get=id=>document.getElementById(id);
const main=document.querySelector('main');
const home=document.createElement('section');home.id='welcome';home.className='entry-page';
home.innerHTML=`<div class="entry-symbol" aria-hidden="true">✚</div><p class="eyebrow">UNI · CC451 · PC4</p><h1>TriageVoz Rural</h1><p class="entry-version">Versión PC4 · Pre-triaje en telemedicina rural</p><p class="entry-description">Registra las molestias mediante voz, texto o selección corporal. El profesional de salud revisa el caso.</p><div class="entry-actions"><button id="entryPatient" type="button">Soy paciente</button><button id="entryDoctor" type="button">Personal de salud</button></div><button id="entryReview" type="button" class="entry-review">Revisión de diagnóstico · Consultar mis triajes</button><p class="entry-footnote">Prototipo académico con datos ficticios. No sustituye una evaluación médica.</p>`;
const identity=document.createElement('section');identity.id='patientIdentity';identity.className='entry-page';
identity.innerHTML=`<p class="eyebrow">IDENTIFICACIÓN DEL PACIENTE</p><h1>Antes de comenzar el triaje</h1><p>Ingresa tus datos de prueba. Se asociarán a cada triaje que completes.</p><form id="patientIdForm" class="identity-form"><label for="patientDni">DNI (8 dígitos)<input id="patientDni" inputmode="numeric" maxlength="8" pattern="[0-9]{8}" autocomplete="off" required placeholder="Ejemplo: 12345678"></label><label for="patientFullName">Nombre completo<input id="patientFullName" maxlength="100" autocomplete="off" required placeholder="Nombres y apellidos"></label><p id="patientIdError" class="form-error" role="alert"></p><button type="submit" class="primary">Continuar al triaje</button></form><p class="entry-footnote">Para esta demostración utiliza DNI y nombre ficticios. No ingreses datos personales reales.</p>`;
const choice=document.createElement('section');choice.id='patientOptions';choice.className='entry-page';
choice.innerHTML=`<p class="eyebrow">PASO 1 · PREFERENCIAS</p><h1>¿Cómo deseas comunicarte?</h1><p>Elige el idioma y las ayudas que necesites.</p><div class="choice-settings"><label>Idioma <select id="choiceLanguage"><option value="es">Español</option><option value="qu">Quechua sureño (experimental)</option></select></label><label><input type="checkbox" id="choiceContrast"> Alto contraste</label><label><input type="checkbox" id="choiceLarge"> Texto grande</label><label><input type="checkbox" id="choiceSpeak"> Lectura por voz</label></div><div class="mode-choices"><button id="chooseVoice" type="button"><span class="mode-icon">🎙</span><strong>Asistente de voz</strong><small>Habla y observa la zona del cuerpo en una silueta</small></button><button id="chooseForm" type="button"><span class="mode-icon">👤</span><strong>Formulario táctil</strong><small>Selecciona zonas y responde paso a paso</small></button></div><p class="helper">El modo quechua requiere pruebas de voz; siempre puedes responder por escrito.</p>`;
const doctorLogin=document.createElement('section');doctorLogin.id='doctorLogin';doctorLogin.className='entry-page';
doctorLogin.innerHTML=`<p class="eyebrow">ACCESO DEL PERSONAL DE SALUD</p><h1>Iniciar sesión</h1><p>Selecciona uno de los cuatro profesionales de demostración.</p><form id="doctorLoginForm" class="identity-form"><label for="doctorSelect">Profesional de salud<select id="doctorSelect" required><option value="">Cargando profesionales…</option></select></label><label for="doctorPassword">Contraseña<input type="password" id="doctorPassword" required autocomplete="current-password" placeholder="Contraseña"></label><p id="doctorLoginError" class="form-error" role="alert"></p><button type="submit" class="primary">Ingresar a bandeja de casos</button></form><p class="entry-footnote">Cuentas ficticias de demostración; no es un sistema clínico real.</p>`;
const review=document.createElement('section');review.id='caseReview';review.className='entry-page';
review.innerHTML=`<p class="eyebrow">HISTORIAL DE PRE-TRIAJE</p><h1>Revisión de diagnóstico</h1><p>Ingresa el DNI usado al registrar tus triajes para consultar sus estados y respuestas.</p><form id="reviewForm" class="identity-form"><label for="reviewDni">DNI (8 dígitos)<input id="reviewDni" maxlength="8" inputmode="numeric" pattern="[0-9]{8}" placeholder="DNI ficticio" autocomplete="off" required></label><button type="submit" id="reviewSearch" class="primary">Consultar triajes</button></form><p id="reviewStatus" role="status" aria-live="polite"></p><div id="reviewList" class="review-list" aria-live="polite"></div><p class="entry-footnote">Demostración académica: el DNI no constituye autenticación segura. Para datos reales debe añadirse verificación de identidad.</p>`;
main.prepend(review);main.prepend(doctorLogin);main.prepend(choice);main.prepend(identity);main.prepend(home);
const back=document.createElement('button');back.id='globalBack';back.type='button';back.className='global-back';back.textContent='← Regresar';main.prepend(back);
const caseFinish=document.createElement('button');caseFinish.id='caseFinish';caseFinish.type='button';caseFinish.className='case-finish';caseFinish.textContent='Culminar triaje';
get('p5').append(caseFinish);
caseFinish.onclick=()=>{get('restart').click();render('welcome')};
let page='welcome';
let patientIdentity=null;
window.triagePatientIdentity=()=>patientIdentity?{...patientIdentity}:null;
function syncToChoice(){
 get('choiceLanguage').value=get('language').value;
 get('choiceContrast').checked=get('contrast').checked;
 get('choiceLarge').checked=get('large').checked;
 get('choiceSpeak').checked=get('speak').checked;
}
function render(next){
 if(next==='welcome')patientIdentity=null;
 if(page==='voice'&&next!=='voice')window.triageVoiceStop?.();
 page=next;document.body.dataset.screen=next;
 for(const [el,screen] of [[home,'welcome'],[identity,'identity'],[choice,'options'],[doctorLogin,'doctor-login'],[review,'review']])el.hidden=next!==screen;
 get('globalBack').hidden=next==='welcome';
 get('patient').hidden=!['voice','form'].includes(next);
 get('doctor').hidden=next!=='doctor';
 if(next==='doctor')get('refreshRooms')?.click();
 if(next==='form')document.body.classList.remove('form-hidden');
 if(next==='voice')document.body.classList.add('form-hidden');
 if(next==='options')syncToChoice();
 if(next==='review'&&patientIdentity)get('reviewDni').value=patientIdentity.dni;
 if(next==='form'&&['p0','p1','p2','p3','p4','p5'].every(id=>get(id).hidden))get('p0').hidden=false;
 window.scrollTo({top:0,behavior:'instant'});
}
get('entryPatient').onclick=()=>render('identity');
get('patientIdForm').onsubmit=e=>{
 e.preventDefault();const dni=get('patientDni').value.trim(),nombre=get('patientFullName').value.trim();
 if(!/^\d{8}$/.test(dni)||!/^[\p{L}][\p{L}\p{M} .'-]{2,99}$/u.test(nombre)){get('patientIdError').textContent='Ingresa un DNI de 8 dígitos y un nombre válido.';return}
 patientIdentity={dni,nombre};get('patientIdError').textContent='';get('alias').value=nombre.slice(0,35);
 render('options');
};
async function openDoctorLogin(){
 get('doctorLoginError').textContent='';
 try{
  const me=await fetch('/api/doctor/me');if(me.ok){const info=await me.json();get('doctorLoggedName').textContent=info.doctor.nombre;render('doctor');return}
  const r=await fetch('/api/doctor/list'),items=await r.json();if(!r.ok)throw Error('No se pudo consultar el personal.');
  get('doctorSelect').replaceChildren(new Option('Selecciona un profesional',''));
  for(const doctor of items)get('doctorSelect').append(new Option(doctor.nombre,String(doctor.id)));
  render('doctor-login');
 }catch(e){render('doctor-login');get('doctorLoginError').textContent=e.message}
}
get('entryDoctor').onclick=openDoctorLogin;
get('doctorLoginForm').onsubmit=async e=>{
 e.preventDefault();get('doctorLoginError').textContent='';
 try{
  const r=await fetch('/api/doctor/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:get('doctorSelect').value,password:get('doctorPassword').value})});
  const data=await r.json();if(!r.ok)throw Error(data.error||'Credenciales incorrectas.');
  get('doctorPassword').value='';get('doctorLoggedName').textContent=data.doctor.nombre;
  render('doctor');
 }catch(err){get('doctorLoginError').textContent=err.message}
};
const logout=document.createElement('button');logout.type='button';logout.id='doctorLogout';logout.textContent='Cerrar sesión';logout.className='btn-sm';
const doctorHeader=document.createElement('div');doctorHeader.className='doctor-login-info';
const doctorLoggedName=document.createElement('strong');doctorLoggedName.id='doctorLoggedName';doctorHeader.append(doctorLoggedName,logout);
get('doctor').querySelector('h1').after(doctorHeader);
logout.onclick=async()=>{await fetch('/api/doctor/logout',{method:'POST'}).catch(()=>{});get('caseView').hidden=true;render('welcome')};
get('entryReview').onclick=()=>render('review');
get('reviewForm').onsubmit=async e=>{
 e.preventDefault();const dni=get('reviewDni').value.trim(),status=get('reviewStatus'),list=get('reviewList');
 list.replaceChildren();if(!/^\d{8}$/.test(dni)){status.textContent='Ingresa un DNI válido de 8 dígitos.';return}
 status.textContent='Consultando triajes registrados…';
 try{
  const r=await fetch('/api/cases/by-dni?dni='+encodeURIComponent(dni));const items=await r.json();
  if(!r.ok)throw Error(items.error||'No se pudo obtener el historial.');
  status.textContent=items.length?`Se encontraron ${items.length} triaje(s) para el DNI indicado.`:'No se encontraron triajes para este DNI.';
  for(const item of items){
   const card=document.createElement('article');card.className='review-case';
   const title=document.createElement('h2');title.textContent='Caso SALA-'+item.code;
   const info=document.createElement('p');const date=new Date(item.createdAt);
   info.textContent=`${item.nombre||'Paciente'} · ${Number.isNaN(date.getTime())?'Fecha no disponible':date.toLocaleString('es-PE')} · ${item.region||'Zona no registrada'}`;
   const badge=document.createElement('button');badge.type='button';badge.className='review-state '+(item.attended?'attended':'pending');
   badge.textContent=item.attended?'Atendido · Ver respuesta':'En proceso de respuesta';badge.disabled=!item.attended;
   const responses=document.createElement('div');responses.hidden=true;responses.className='review-response';
   badge.onclick=async()=>{
    if(!responses.hidden){responses.hidden=true;return}
    responses.textContent='Cargando respuesta…';responses.hidden=false;
    try{
     const r=await fetch('/api/cases/by-code?code='+encodeURIComponent(item.code));const c=await r.json();if(!r.ok||c.dni!==dni)throw Error('No se pudo recuperar la respuesta.');
     responses.replaceChildren();for(const answer of c.replies||[]){const text=document.createElement('p');text.className='review-message';text.textContent=(answer.author||'Personal de salud')+': '+answer.message;responses.append(text)}
    }catch(err){responses.textContent=err.message}
   };
   card.append(title,info,badge,responses);list.append(card);
  }
 }catch(err){status.textContent=err.message}
};
get('chooseVoice').onclick=()=>render('voice');get('chooseForm').onclick=()=>render('form');
back.onclick=()=>render(['voice','form'].includes(page)?'options':page==='options'?'identity':'welcome');
for(const [from,to] of [['choiceLanguage','language'],['choiceContrast','contrast'],['choiceLarge','large'],['choiceSpeak','speak']]){
 get(from).addEventListener('change',()=>{get(to)[from==='choiceLanguage'?'value':'checked']=get(from)[from==='choiceLanguage'?'value':'checked'];get(to).dispatchEvent(new Event('change',{bubbles:true}))});
}
// Los roles solo se eligen en la bienvenida; no hay atajos de rol en otras vistas.
window.triageNavigate=render;
// Tarea 1 (Lec-LAB 11): borrador de respuesta al paciente con personalidad graduable.
// Solo rellena el texto; el registro exige la confirmación explícita de app.js.
const replyBox=document.createElement('div');replyBox.className='reply-draft-box';
const replyPanel=mountPersonalityPanel(replyBox,{title:'Borrador de respuesta con IA · personalidad',preset:'profesional',hint:'Propone cuidados generales no farmacológicos, signos de alarma y datos a confirmar, elegidos de un catálogo cerrado por zona. No diagnostica ni receta.'});
const replyDraftButton=document.createElement('button');replyDraftButton.type='button';replyDraftButton.id='replyDraft';replyDraftButton.textContent='Generar borrador de respuesta';
const replyDraftStatus=document.createElement('p');replyDraftStatus.id='replyDraftStatus';replyDraftStatus.className='helper';replyDraftStatus.setAttribute('role','status');
replyBox.append(replyDraftButton,replyDraftStatus);
get('message').closest('label').before(replyBox);
replyDraftButton.onclick=async()=>{
 const code=window.currentDoctorCase?.code;
 if(!code){replyDraftStatus.textContent='Selecciona primero un caso de la bandeja.';return}
 replyDraftButton.disabled=true;replyDraftStatus.textContent='Redactando borrador…';
 try{
  const {personality,preset}=replyPanel.get();
  const r=await fetch('/api/doctor/reply-draft',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({code,personality,preset})});
  const data=await r.json();if(!r.ok)throw Error(data.error||'Error del servicio');
  get('message').value=data.draft;get('message').dispatchEvent(new Event('input',{bubbles:true}));
  const origin=data.generated?'IA remota ('+data.mode+')':'borrador local simulado';
  replyDraftStatus.textContent='Borrador listo · '+origin+' · personalidad '+(data.preset==='personalizada'?'personalizada':data.preset)+'. Revísalo y edítalo; nada se registra hasta que confirmes el envío.'+(data.warning?' '+data.warning:'');
 }catch(e){replyDraftStatus.textContent='No se pudo preparar el borrador: '+e.message}
 finally{replyDraftButton.disabled=false}
};
render('welcome');
