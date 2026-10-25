(function(){
  var cfg = window.EPE || {};
  var MESES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
  function fecha(f){ var p = String(f).slice(0,10).split("-").map(Number); return p[2] + " " + MESES[p[1]-1] + " " + p[0]; }

  /* Correo ofuscado */
  var c = document.getElementById("contacto");
  if (c){ var m = "contacto" + "@" + ["escribirporescribir","com"].join("."); c.innerHTML = '<a href="mailto:' + m + '">' + m + '</a>'; }

  /* Un solo desplegable abierto a la vez: compartir, comentar o suscribirme */
  var menu = document.getElementById("share-menu");
  var fSus = document.getElementById("sus-form");
  var sec = document.getElementById("comments");
  var slot = document.getElementById("form-slot");
  function cerrarShare(){ if (menu) menu.hidden = true; }
  function cerrarSus(){ if (fSus) fSus.hidden = true; }
  function cerrarCom(){
    if (!sec || !slot) return;
    slot.innerHTML = "";
    if (!document.querySelector("#comments-list .comment")) sec.hidden = true;
  }

  /* Compartir: menú nativo en móvil, desplegable en ordenador */
  var bShare = document.querySelector("[data-share]");
  if (bShare && menu){
    bShare.addEventListener("click", function(){
      cerrarSus(); cerrarCom();
      if (navigator.share && matchMedia("(pointer: coarse)").matches){
        navigator.share({ title: bShare.dataset.titulo, url: bShare.dataset.url }).catch(function(){});
        return;
      }
      menu.hidden = !menu.hidden;
    });
    document.addEventListener("click", function(ev){
      if (!menu.hidden && !ev.target.closest(".share")) menu.hidden = true;
    });
  }

  /* Suscripción */
  var bSus = document.querySelector("[data-suscribir]");
  if (bSus && fSus){
    bSus.addEventListener("click", function(){
      cerrarShare(); cerrarCom();
      fSus.hidden = !fSus.hidden;
      if (!fSus.hidden) fSus.querySelector("input").focus();
    });
    fSus.addEventListener("submit", function(ev){
      ev.preventDefault();
      var email = fSus.querySelector("input").value;
      var hecho = function(){ fSus.outerHTML = '<p class="sus-ok">Gracias. Revisa tu correo para confirmar.</p>'; };
      if (!cfg.newsletter){ hecho(); return; }
      var fd = new FormData(); fd.append("email", email);
      fetch(cfg.newsletter, { method: "POST", body: fd, mode: "no-cors" }).then(hecho, hecho);
    });
  }

  /* Comentarios */
  if (sec){
    var slug = sec.dataset.slug, lista = document.getElementById("comments-list");
    function form(padre){
      return '<form class="form" data-padre="' + (padre || "") + '">' +
        '<input type="text" name="nombre" placeholder="Nombre" required maxlength="60">' +
        '<textarea name="texto" placeholder="' + (padre ? "Tu respuesta" : "Tu comentario") + '" required maxlength="2000"></textarea>' +
        '<div class="row"><small>Se publica tras revisión.</small><div>' +
        '<button type="button" class="cancel">Cancelar</button><button type="submit">Enviar</button></div></div></form>';
    }
    function pinta(cs){
      var raiz = cs.filter(function(x){ return !x.padre; });
      lista.innerHTML = raiz.map(function(x){
        var resp = cs.filter(function(r){ return r.padre === x.id; });
        return '<div class="comment"><div class="who">' + esc(x.nombre) + '<span>' + fecha(x.fecha) + '</span></div><p>' + esc(x.texto) + '</p>' +
          '<button type="button" class="reply-btn" data-id="' + x.id + '">Responder</button><div class="reply-slot"></div>' +
          (resp.length ? '<div class="replies">' + resp.map(function(r){
            return '<div class="comment"><div class="who">' + esc(r.nombre) + '<span>' + fecha(r.fecha) + '</span></div><p>' + esc(r.texto) + '</p></div>';
          }).join("") + '</div>' : '') + '</div>';
      }).join("");
      if (raiz.length) sec.hidden = false;
    }
    if (cfg.api) fetch(cfg.api + "/comentarios?slug=" + encodeURIComponent(slug)).then(function(r){ return r.json(); }).then(pinta).catch(function(){});
    var bCom = document.querySelector("[data-comentar]");
    if (bCom) bCom.addEventListener("click", function(){
      cerrarShare(); cerrarSus();
      if (slot.innerHTML){ cerrarCom(); return; }
      sec.hidden = false;
      slot.innerHTML = form(null);
      slot.scrollIntoView({ behavior: "smooth", block: "center" });
      slot.querySelector("input").focus({ preventScroll: true });
    });
    sec.addEventListener("click", function(ev){
      var t = ev.target;
      if (t.classList.contains("reply-btn")){
        var s = t.nextElementSibling;
        document.querySelectorAll(".reply-slot").forEach(function(x){ if (x !== s) x.innerHTML = ""; });
        s.innerHTML = s.innerHTML ? "" : form(t.dataset.id);
        var i = s.querySelector("input"); if (i) i.focus();
      }
      if (t.classList.contains("cancel")){
        t.closest(".reply-slot, #form-slot").innerHTML = "";
        if (!lista.querySelector(".comment")) sec.hidden = true;
      }
    });
    sec.addEventListener("submit", function(ev){
      ev.preventDefault();
      var f = ev.target, datos = { slug: slug, padre: f.dataset.padre || null, nombre: f.nombre.value, texto: f.texto.value };
      var gracias = function(){ f.outerHTML = '<p class="thanks">Gracias. Tu comentario aparecerá cuando se revise.</p>'; };
      if (!cfg.api){ gracias(); return; }
      fetch(cfg.api + "/comentarios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos) })
        .finally(gracias);
    });
  }

  /* Contador de visitas */
  var v = document.getElementById("visitas");
  if (v && cfg.contador && cfg.api){
    fetch(cfg.api + "/visita", { method: "POST" }).then(function(r){ return r.json(); }).then(function(d){
      v.textContent = "visitas · " + String(d.total).padStart(6, "0").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }).catch(function(){});
  }
})();
