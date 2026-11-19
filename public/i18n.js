// PC4: idioma global de la PWA (Español/Quechua sureño).
// Traduce la interfaz, nunca el relato clínico ni los mensajes del paciente/médico.
import {translateUiText} from './i18n-dictionary.js';
const $=id=>document.getElementById(id);
const sourceTexts=new WeakMap();
const sourceAttributes=new WeakMap();
let current='es';
const rawTextExcludedSelector=[
 '#caseDetails dd','#review dd','#replyHistory li p','#replyConfirmText',
 '#summaryText','#doctorResponse','#reviewList .review-message',
 '#reviewList .review-case>p',
 '#roomList .room-alias','#vuiMessages .vui-bubble p',
 '#message','#answer','#region', '#receipt', '#voiceReceipt',
 '#replyDraftStatus', '#profileState' // textos redactados o recibidos que pueden incluir datos variables
].join(',');
function notClinical(node){
 const parent=node.parentElement;
 return parent && !parent.closest('script,style,code,pre,svg') && !parent.closest(rawTextExcludedSelector);
}
function restoreText(node){
 if(!notClinical(node)||node.parentElement?.closest('#homeLanguage,#choiceLanguage,#language'))return;
 const currentValue=node.nodeValue;
 let prev=sourceTexts.get(node);
 if(!prev||currentValue!==prev.display){
  prev={original:currentValue,display:currentValue};
 }
 const clean=prev.original.trim();
 if(!clean){sourceTexts.set(node,prev);return}
 const result=translateUiText(clean,current);
 const next=prev.original.replace(clean,result);
 if(currentValue!==next)node.nodeValue=next;
 sourceTexts.set(node,{original:prev.original,display:next});
}
function restoreAttr(el,name){
 if(el.matches('input[type="password"]')&&name==='value')return;
 const currentValue=el.getAttribute(name);if(currentValue===null)return;
 let bag=sourceAttributes.get(el);
 if(!bag){bag={};sourceAttributes.set(el,bag)}
 let prev=bag[name];
 if(!prev||currentValue!==prev.display)prev={original:currentValue,display:currentValue};
 const next=translateUiText(prev.original,current);
 if(currentValue!==next)el.setAttribute(name,next);
 bag[name]={original:prev.original,display:next};
}
function walk(root){
 if(!root)return;
 if(root.nodeType===Node.TEXT_NODE){restoreText(root);return}
 if(root.nodeType!==Node.ELEMENT_NODE&&root.nodeType!==Node.DOCUMENT_NODE)return;
 const el=root.nodeType===Node.ELEMENT_NODE?root:null;
 if(el&&el.matches('script,style,code,pre'))return;
 if(el){for(const attr of ['placeholder','aria-label','title'])restoreAttr(el,attr)}
 const tw=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
 let node;while((node=tw.nextNode()))restoreText(node);
 if(el)for(const descendant of el.querySelectorAll('[placeholder],[aria-label],[title]')){
  for(const attr of ['placeholder','aria-label','title'])restoreAttr(descendant,attr);
 }
}
function apply(lang){
 current=lang==='qu'?'qu':'es';
 document.documentElement.lang=current==='qu'?'qu-PE':'es-PE';
 document.body.dataset.uiLanguage=current;
 if($('homeLanguage')&&$('homeLanguage').value!==current)$('homeLanguage').value=current;
 if($('choiceLanguage')&&$('choiceLanguage').value!==current)$('choiceLanguage').value=current;
 walk(document.body);
}
window.triageTranslate=(text)=>translateUiText(text,current);
window.triageUILanguage=()=>current;
const original=$('language');
const home=$('homeLanguage');
// Cada recarga de la aplicación inicia en español; la elección se mantiene entre pantallas.
// Se reemplaza cualquier preferencia de idioma que haya quedado guardada en una sesión anterior.
original.value='es';
if(home)home.value='es';
original.dispatchEvent(new Event('change',{bubbles:true}));
original.addEventListener('change',()=>apply(original.value));
home?.addEventListener('change',()=>{
 original.value=home.value;
 original.dispatchEvent(new Event('change',{bubbles:true}));
});
apply('es');
let scheduled=false;
const observer=new MutationObserver(records=>{
 if(scheduled)return;
 // Traducción diferida para textos que aparecen al recibir respuestas de la API.
 // La aplicación puede seguir creando elementos en español, mientras la vista permanece en quechua.
 if(!records.some(r=>r.type==='childList'||r.type==='characterData'))return;
 scheduled=true;
 queueMicrotask(()=>{
  scheduled=false;
  if(current==='qu')walk(document.body);
 });
});
observer.observe(document.body,{subtree:true,childList:true,characterData:true});
