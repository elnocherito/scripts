/* =========================================================
   GS_USUARIO.js
   ÚNICO JS COMPARTIDO POR TIENDA / CUPONES / USUARIO
   Barra + sesión + login + registro + navegación
   ========================================================= */
(function (w, d) {
  'use strict';

  var WORKER_URL_USUARIO = 'https://gsadmin-elnocherito.elnocheritomayorista.workers.dev/';
  var API_USUARIO = String(WORKER_URL_USUARIO).replace(/\/+$/, '') + '/store';
  var URL_TIENDA = '/p/tienda.html';
  var URL_CUPONES = '/p/cupones.html';
  var URL_USUARIO = '/p/usuario.html';
  var pagina = String(w.GS_USUARIO_PAGINA || '').toLowerCase();

  // Compatibilidad con los widgets existentes.
  if (typeof w.usuarioLogueado === 'undefined') w.usuarioLogueado = null;
  if (typeof w.datosClienteLogueado === 'undefined') w.datosClienteLogueado = null;
  if (typeof w.verificandoSesion === 'undefined') w.verificandoSesion = false;
  if (typeof w.registroPublico === 'undefined') w.registroPublico = false;

  function fetchUsuario(url, opciones, ms) {
    if (typeof w.fetchConTimeout === 'function') return w.fetchConTimeout(url, opciones, ms);
    opciones = Object.assign({}, opciones || {});
    var controller = new AbortController();
    var timeoutId = setTimeout(function () { controller.abort(); }, ms || 15000);
    opciones.signal = controller.signal;
    opciones.cache = 'no-store';
    opciones.credentials = 'omit';
    opciones.referrerPolicy = 'no-referrer';
    return fetch(url, opciones).finally(function () { clearTimeout(timeoutId); });
  }

  function postUsuario(accion, datos, ms) {
    if (typeof w.storePost === 'function') return w.storePost(accion, datos, ms);
    var payload = Object.assign({}, datos || {}, { accion: accion });
    return fetchUsuario(API_USUARIO, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    }, ms || 15000).then(function (r) { return r.json(); });
  }

  function asegurarEstiloBarra() {
    if (d.getElementById('gsUsuarioEstiloBarra')) return;
    var st=d.createElement('style');
    st.id='gsUsuarioEstiloBarra';
    st.textContent='.gs-mi-cuenta-texto{display:none;}@media (min-width:768px){.gs-mi-cuenta-texto{display:inline;}}';
    (d.head||d.documentElement).appendChild(st);
  }

  function asegurarBarra() {
    if (d.getElementById('barraUsuarioGlobal')) return;
    d.body.insertAdjacentHTML('afterbegin', '<div id="barraUsuarioGlobal" class="sticky-top"><div id="barraUsuarioDinamica" class="p-0 pb-1 bg-white d-flex flex-column justify-content-center align-items-center text-center gap-1" style="display:none;"><span id="barraUsuarioTexto" class="p-0 m-0"></span><div class="d-flex gap-1 flex-wrap justify-content-center w-100" id="barraUsuarioBotones"></div></div></div>');
  }

  function asegurarModales() {
    if (d.getElementById('modalLogin')) return;
    d.body.insertAdjacentHTML('beforeend', `
<div class="modal fade" id="modalLogin" tabindex="-1"><div class="modal-dialog modal-dialog-centered"><div class="modal-content">
<div class="modal-header"><h5 class="modal-title"><i class="bi bi-person-lock"></i> Iniciar sesión</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
<div class="modal-body"><div id="loginError" class="alert alert-danger d-none"></div><form id="formLogin" autocomplete="off" onsubmit="return false;">
<div class="mb-3"><label class="form-label">Usuario</label><input id="loginUsuario" type="text" class="form-control" placeholder="Tu usuario" autocomplete="username"></div>
<div class="mb-3"><label class="form-label">Contraseña</label><div class="input-group"><input id="loginPassword" type="password" class="form-control" placeholder="••••••••" autocomplete="current-password"><button class="btn btn-outline-secondary" type="button" onclick="alternarVisibilidadPassword('loginPassword', this)" title="Mostrar contraseña"><i class="bi bi-eye"></i></button></div></div>
<button type="button" class="btn btn-primary w-100" onclick="login()"><i class="bi bi-box-arrow-in-right"></i> Iniciar sesión</button></form>
<div id="loginRegistroContainer" class="mt-3 text-center d-none"><hr><p class="mb-0">¿No tenés cuenta?</p><button class="btn btn-warning btn-sm mt-1" onclick="mostrarRegistro()"><i class="bi bi-person-plus"></i> Registrarse</button></div></div></div></div></div>
<div class="modal fade" id="modalRegistro" tabindex="-1"><div class="modal-dialog modal-dialog-centered modal-lg"><div class="modal-content">
<div class="modal-header"><h5 class="modal-title"><i class="bi bi-person-plus"></i> Registrarse</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
<div class="modal-body"><div id="registroError" class="alert alert-danger d-none"></div><form id="formRegistro" autocomplete="off" onsubmit="return false;"><div class="row g-3">
<div class="col-md-6"><label class="form-label">Usuario *</label><input id="regUsuario" type="text" class="form-control" autocomplete="username"></div>
<div class="col-md-6"><label class="form-label">Contraseña *</label><div class="input-group"><input id="regPassword" type="password" class="form-control" autocomplete="new-password"><button class="btn btn-outline-secondary" type="button" onclick="alternarVisibilidadPassword('regPassword', this)"><i class="bi bi-eye"></i></button></div></div>
<div class="col-md-6"><label class="form-label">Repetir contraseña *</label><div class="input-group"><input id="regPasswordRepetir" type="password" class="form-control" autocomplete="new-password"><button class="btn btn-outline-secondary" type="button" onclick="alternarVisibilidadPassword('regPasswordRepetir', this)"><i class="bi bi-eye"></i></button></div></div>
<div class="col-md-6"><label class="form-label">Nombre *</label><input id="regNombre" type="text" class="form-control"></div>
<div class="col-md-6"><label class="form-label">Teléfono *</label><input id="regTelefono" type="tel" class="form-control"></div>
<div class="col-md-6"><label class="form-label">Email <span class="text-muted fw-normal">(opcional)</span></label><input id="regEmail" type="email" class="form-control" autocomplete="email"></div>
<div class="col-md-6"><label class="form-label">Dirección</label><input id="regDireccion" type="text" class="form-control"></div>
<div class="col-md-4"><label class="form-label">Localidad</label><input id="regLocalidad" type="text" class="form-control"></div>
<div class="col-md-4"><label class="form-label">Provincia</label><input id="regProvincia" type="text" class="form-control"></div>
<div class="col-md-4"><label class="form-label">Código postal</label><input id="regCodigoPostal" type="text" class="form-control"></div>
</div></form></div><div class="modal-footer"><button class="btn btn-secondary" onclick="mostrarLogin()"><i class="bi bi-arrow-left"></i> Volver al login</button><button class="btn btn-primary" id="btnRegistrar" onclick="registrar()"><i class="bi bi-check-lg"></i> Registrarse</button></div></div></div></div>`);
  }

  function navegar(url) { w.location.href = url; }

  w.actualizarBarraUsuario = function () {
    asegurarBarra();
    var barra = d.getElementById('barraUsuarioDinamica');
    var texto = d.getElementById('barraUsuarioTexto');
    var botones = d.getElementById('barraUsuarioBotones');
    if (!barra || !texto || !botones) return;
    barra.style.display = 'flex';
    texto.innerHTML = '';
    if (w.verificandoSesion) {
      texto.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Verificando sesión...';
      botones.innerHTML = '';
      return;
    }
    var logueado = !!(w.datosClienteLogueado && w.usuarioLogueado);
    var esMinorista = String(w.modoOperacion || '').toLowerCase() === 'minorista';
    var h=[];
    h.push('<button class="btn btn-sm btn-primary" '+(pagina==='tienda'?'disabled':'onclick="window.location.href=\''+URL_TIENDA+'\'"')+'><i class="bi bi-shop"></i> Tienda</button>');
    if (!esMinorista && logueado) {
      h.push('<div class="btn-group" role="group"><button class="btn btn-sm btn-secondary" '+(pagina==='usuario'?'disabled':'onclick="window.location.href=\''+URL_USUARIO+'\'"')+' title="Mi cuenta"><i class="bi bi-person-circle"></i><span class="gs-mi-cuenta-texto"> Mi Cuenta</span></button><button class="btn btn-sm btn-warning" onclick="cerrarSesion()" title="Cerrar sesión"><i class="bi bi-box-arrow-right"></i></button></div>');
    } else if (!esMinorista) {
      h.push('<div class="btn-group" role="group"><button class="btn btn-sm btn-secondary" onclick="mostrarLogin()"><i class="bi bi-box-arrow-in-right"></i> Ingresar</button><button class="btn btn-sm btn-warning" onclick="mostrarRegistro()"><i class="bi bi-person-plus"></i></button></div>');
    }
    botones.innerHTML=h.join('');
    if (typeof w.actualizarContadores === 'function') w.actualizarContadores();
    if (typeof w.GSUsuarioEstadoCambiado === 'function') w.GSUsuarioEstadoCambiado();
  };

  w.verificarSesionGuardada = function () {
    var sesion=null; try { sesion=JSON.parse(localStorage.getItem('sesionUsuarioV5')||'null'); } catch(e){}
    if (!sesion || !sesion.usuario || !sesion.token) { w.verificandoSesion=false; w.actualizarBarraUsuario(); return; }
    w.verificandoSesion=true; w.actualizarBarraUsuario();
    postUsuario('verificar_sesion',{token:sesion.token},10000).then(function(data){
      w.verificandoSesion=false;
      if(data && data.ok && data.cliente){ w.usuarioLogueado=sesion.usuario; w.datosClienteLogueado=data.cliente; w.actualizarBarraUsuario(); if(pagina==='usuario' && typeof w.verResumenCuenta==='function') w.verResumenCuenta(); }
      else w.cerrarSesion(false);
    }).catch(function(){ w.verificandoSesion=false; w.cerrarSesion(false); });
  };

  w.cerrarSesion = function (mostrarAviso) {
    w.usuarioLogueado=null; w.datosClienteLogueado=null; localStorage.removeItem('sesionUsuarioV5'); localStorage.removeItem('misPedidosV5'); w.actualizarBarraUsuario();
    if (mostrarAviso !== false && typeof w.avisar==='function') w.avisar('Sesión cerrada');
  };

  w.alternarVisibilidadPassword=function(inputId,boton){var input=d.getElementById(inputId);if(!input)return;var mostrar=input.type==='password';input.type=mostrar?'text':'password';var i=boton?boton.querySelector('i'):null;if(i){i.classList.toggle('bi-eye',!mostrar);i.classList.toggle('bi-eye-slash',mostrar);}input.focus({preventScroll:true});};
  function err(id,msg){var e=d.getElementById(id);if(e){e.innerText=msg;e.classList.remove('d-none');}}
  w.mostrarErrorLogin=function(m){err('loginError',m);}; w.mostrarErrorRegistro=function(m){err('registroError',m);};

  w.mostrarLogin=function(){asegurarModales(); var mr=bootstrap.Modal.getInstance(d.getElementById('modalRegistro'));if(mr)mr.hide();d.getElementById('loginUsuario').value='';d.getElementById('loginPassword').value='';d.getElementById('loginError').classList.add('d-none');d.getElementById('loginRegistroContainer').classList.toggle('d-none',!w.registroPublico);bootstrap.Modal.getOrCreateInstance(d.getElementById('modalLogin')).show();};
  w.mostrarRegistro=function(){asegurarModales(); if(!w.registroPublico){if(typeof w.mostrarAlerta==='function')w.mostrarAlerta('El registro de clientes está deshabilitado.');return;}var ml=bootstrap.Modal.getInstance(d.getElementById('modalLogin'));if(ml)ml.hide();['regUsuario','regPassword','regPasswordRepetir','regNombre','regTelefono','regEmail','regDireccion','regLocalidad','regProvincia','regCodigoPostal'].forEach(function(id){var x=d.getElementById(id);if(x)x.value='';});d.getElementById('registroError').classList.add('d-none');bootstrap.Modal.getOrCreateInstance(d.getElementById('modalRegistro')).show();};

  w.login=function(){var u=d.getElementById('loginUsuario').value.trim(),p=d.getElementById('loginPassword').value.trim();if(!u||!p){w.mostrarErrorLogin('Completá todos los campos');return;}var b=d.querySelector('#modalLogin .btn-primary');b.disabled=true;b.innerHTML='<span class="spinner-border spinner-border-sm"></span> Verificando...';postUsuario('login_cliente',{usuario:u,password:p},15000).then(function(data){b.disabled=false;b.innerHTML='<i class="bi bi-box-arrow-in-right"></i> Iniciar sesión';if(!data.ok){w.mostrarErrorLogin(data.error||'Error al iniciar sesión');return;}w.usuarioLogueado=u;w.datosClienteLogueado=data.cliente;localStorage.setItem('sesionUsuarioV5',JSON.stringify({usuario:u,token:data.cliente.token}));var m=bootstrap.Modal.getInstance(d.getElementById('modalLogin'));if(m)m.hide();w.actualizarBarraUsuario();if(pagina==='usuario'&&typeof w.verResumenCuenta==='function')w.verResumenCuenta();}).catch(function(){b.disabled=false;b.innerHTML='<i class="bi bi-box-arrow-in-right"></i> Iniciar sesión';w.mostrarErrorLogin('No se pudo confirmar el inicio de sesión. Intentá nuevamente.');});};

  w.registrar=function(){var u=d.getElementById('regUsuario').value.trim(),p=d.getElementById('regPassword').value.trim(),pr=d.getElementById('regPasswordRepetir').value.trim(),n=d.getElementById('regNombre').value.trim(),t=d.getElementById('regTelefono').value.trim(),em=d.getElementById('regEmail');if(!u||!p||!pr||!n||!t){w.mostrarErrorRegistro('Completá todos los campos obligatorios (*)');return;}if(p.length<4){w.mostrarErrorRegistro('La contraseña debe tener al menos 4 caracteres');return;}if(p!==pr){w.mostrarErrorRegistro('Las contraseñas no coinciden.');return;}if(em.value.trim()&&!em.checkValidity()){w.mostrarErrorRegistro('Ingresá una dirección de email válida.');return;}var b=d.getElementById('btnRegistrar');b.disabled=true;b.innerHTML='<span class="spinner-border spinner-border-sm"></span> Registrando...';postUsuario('registrar_cliente',{usuario:u,password:p,nombre:n,telefono:t,email:em.value.trim(),direccion:d.getElementById('regDireccion').value.trim(),localidad:d.getElementById('regLocalidad').value.trim(),provincia:d.getElementById('regProvincia').value.trim(),codigo_postal:d.getElementById('regCodigoPostal').value.trim()},18000).then(function(data){b.disabled=false;b.innerHTML='<i class="bi bi-check-lg"></i> Registrarse';if(!data.ok){w.mostrarErrorRegistro(data.error||'Error al registrar');return;}var m=bootstrap.Modal.getInstance(d.getElementById('modalRegistro'));if(m)m.hide();w.mostrarLogin();d.getElementById('loginUsuario').value=u;}).catch(function(){b.disabled=false;b.innerHTML='<i class="bi bi-check-lg"></i> Registrarse';w.mostrarErrorRegistro('No se pudo confirmar el registro.');});};

  function cargarConfigUsuario(){
    // En tienda/usuario el widget ya carga Config. En cupones la cargamos acá.
    if (typeof w.configTienda==='object' && w.configTienda && Object.keys(w.configTienda).length) { w.registroPublico=String(w.configTienda.registro_publico||'NO').toUpperCase()==='SI'; w.modoOperacion=String(w.configTienda.modo_operacion||w.modoOperacion||'').trim().toLowerCase(); return Promise.resolve(); }
    return fetchUsuario(API_USUARIO+'?config=1',{},12000).then(function(r){return r.json();}).then(function(c){w.registroPublico=!!(c&&String(c.registro_publico||'NO').toUpperCase()==='SI'); w.modoOperacion=String((c&&c.modo_operacion)||'').trim().toLowerCase(); w.actualizarBarraUsuario();}).catch(function(){});
  }

  function iniciar(){asegurarEstiloBarra();asegurarBarra();asegurarModales();var s=null;try{s=JSON.parse(localStorage.getItem('sesionUsuarioV5')||'null');}catch(e){}w.verificandoSesion=!!(s&&s.usuario&&s.token);w.actualizarBarraUsuario();cargarConfigUsuario().finally(function(){w.verificarSesionGuardada();});}
  if(d.readyState==='loading') d.addEventListener('DOMContentLoaded',iniciar); else iniciar();

  w.GSUsuario={actualizarBarra:w.actualizarBarraUsuario,verificarSesion:w.verificarSesionGuardada,login:w.login,logout:w.cerrarSesion,getClienteActual:function(){return w.datosClienteLogueado;}};
})(window,document);
