// Cookie de sesión ficticia para las pruebas de integración PC4.
export async function loginDoctor(base){
  const r=await fetch(base+'/api/doctor/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:1,password:'123456'})});
  if(!r.ok)throw Error('No se pudo autenticar personal de prueba');
  return r.headers.get('set-cookie').split(';')[0];
}
export const patient={dni:'12345678',nombre:'Paciente De Prueba'};
