const C=window.CFG,sb=supabase.createClient(C.SUPABASE_URL,C.SUPABASE_KEY);
const CATS=[["aneis","Anéis"],["brincos","Brincos"],["colares","Colares"],["pulseiras","Pulseiras"],["novidades","Novidades"],["moissanites","Moissanites"],["prata-rodinada","Prata Rodinada"],["banho-de-ouro","Banho de Ouro"]];
const $=s=>document.querySelector(s),app=$("#app"),top_=$("#top"),dlg=$("#dlg");
let user=null,prods=[];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const brl=n=>n==null?"":Number(n).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const toast=(m,e)=>{const t=document.createElement("div");t.className="toast"+(e?" err":"");t.textContent=m;document.body.append(t);setTimeout(()=>t.remove(),3500)};
async function load(){const{data,error}=await sb.from("produtos").select("*").order("criado_em",{ascending:false});if(error)toast("Não foi possível carregar as peças.",1);prods=data||[]}
const card=p=>`<article class="card"><div class="ph" data-zoom="${esc(p.imagem_url)}"><img src="${esc(p.imagem_url)}" alt="${esc(p.nome)}" loading="lazy">${p.esgotado?'<span class="sold">Esgotado</span>':""}</div><div class="in"><h3>${esc(p.nome)}</h3><p class="pr">${brl(p.preco)}</p><p class="ds">${esc(p.descricao)}</p>${p.esgotado?"":`<a class="btn" target="_blank" rel="noopener" href="https://wa.me/${C.WHATSAPP}?text=${encodeURIComponent("Olá! Tenho interesse na peça: "+p.nome)}">Tenho interesse</a>`}${user?`<div class="ed"><button data-edit="${p.id}">Editar</button><button class="dng" data-del="${p.id}">Excluir</button></div>`:""}</div></article>`;
function render(){
  const r=location.hash.replace(/^#\/?/,""),cat=CATS.find(c=>c[0]===r);
  const title=cat?cat[1]:r==="editor"?"Editor":r==="todas"?"Todas as peças":"Catálogo";
  document.title=title+" | Adriana Resende Joias";
  top_.innerHTML=`<div class="bar"><a href="${esc(C.LANDING)}">← Voltar ao site</a><h1>${title}</h1><span></span></div><nav class="chips"><a href="#/" class="${r===""?"on":""}">Início</a><a href="#/todas" class="${r==="todas"?"on":""}">Todas</a>${CATS.map(c=>`<a href="#/${c[0]}" class="${r===c[0]?"on":""}">${c[1]}</a>`).join("")}</nav>${user?`<div class="edbar">Modo editor<span style="display:flex;gap:8px"><button data-new>+ Nova peça</button><button data-out style="background:var(--dk)">Sair</button></span></div>`:""}`;
  let h="";
  if(r==="editor"&&!user)h=`<form class="login" id="lf"><h2>Área do editor</h2><label>E-mail<input type="email" name="e" required autocomplete="username"></label><label>Senha<input type="password" name="s" required autocomplete="current-password"></label><button type="submit">Entrar</button></form>`;
  else if(r==="editor")h=`<p class="empty">Você está logada. Escolha uma categoria para editar as peças.</p>`;
  else if(cat||r==="todas"){const l=cat?prods.filter(p=>(p.categorias||[]).includes(r)):prods;h=l.length?`<div class="grid">${l.map(card).join("")}</div>`:`<p class="empty">Em breve novas peças nesta coleção ✨</p>`}
  else h=`<div class="cats">${CATS.map(c=>{const p=prods.find(p=>(p.categorias||[]).includes(c[0]));return`<a class="cat" href="#/${c[0]}">${p?`<img src="${esc(p.imagem_url)}" alt="" loading="lazy">`:""}<span>${c[1]}</span></a>`}).join("")}</div>`;
  app.innerHTML=`<div class="wrap">${h}</div>`;scrollTo(0,0);
  const lf=$("#lf");if(lf)lf.onsubmit=async e=>{e.preventDefault();const{error}=await sb.auth.signInWithPassword({email:lf.e.value,password:lf.s.value});if(error)toast("E-mail ou senha incorretos.",1)};
}
const shrink=f=>new Promise((ok,no)=>{const i=new Image();i.onload=()=>{const k=Math.min(1,1200/i.width),c=document.createElement("canvas");c.width=i.width*k;c.height=i.height*k;c.getContext("2d").drawImage(i,0,0,c.width,c.height);c.toBlob(b=>b?ok(b):no(Error("Foto inválida.")),"image/jpeg",.82)};i.onerror=()=>no(Error("Foto inválida."));i.src=URL.createObjectURL(f)});
const rmImg=u=>sb.storage.from("fotos-produtos").remove([decodeURIComponent((u.split("/fotos-produtos/")[1]||"").split("?")[0])]);
function form(old){
  dlg.className="";dlg.innerHTML=`<form><h2>${old?"Editar peça":"Nova peça"}</h2><label>Nome<input type="text" name="nome" required value="${esc(old?.nome)}"></label><label>Preço (opcional)<input type="number" name="preco" step="0.01" min="0" value="${old?.preco??""}"></label><label>Descrição curta<textarea name="descricao">${esc(old?.descricao)}</textarea></label><div><label>Categorias</label><div class="chk">${CATS.map(c=>`<label><input type="checkbox" name="cat" value="${c[0]}" ${(old?.categorias||[]).includes(c[0])?"checked":""}>${c[1]}</label>`).join("")}</div></div><label>Foto ${old?"(deixe vazio para manter a atual)":""}<input type="file" name="foto" accept="image/*"></label><div class="chk"><label><input type="checkbox" name="esgotado" ${old?.esgotado?"checked":""}>Esgotado</label></div><div class="row"><button type="button" class="sec" data-close>Cancelar</button><button type="submit">Salvar</button></div></form>`;
  dlg.showModal();
  dlg.querySelector("form").onsubmit=async e=>{e.preventDefault();const f=e.target,b=f.querySelector("[type=submit]");b.disabled=true;
    try{const cats=[...f.querySelectorAll("[name=cat]:checked")].map(i=>i.value);if(!cats.length)throw Error("Escolha ao menos uma categoria.");
      let url=old?.imagem_url;const file=f.foto.files[0];
      if(file){const blob=await shrink(file),path=Date.now()+".jpg",u=await sb.storage.from("fotos-produtos").upload(path,blob,{contentType:"image/jpeg"});if(u.error)throw u.error;url=sb.storage.from("fotos-produtos").getPublicUrl(path).data.publicUrl;if(old)await rmImg(old.imagem_url)}
      if(!url)throw Error("Escolha uma foto.");
      const row={nome:f.nome.value.trim(),preco:f.preco.value===""?null:Number(f.preco.value),descricao:f.descricao.value.trim(),categorias:cats,esgotado:f.esgotado.checked,imagem_url:url};
      const r=old?await sb.from("produtos").update(row).eq("id",old.id):await sb.from("produtos").insert(row);if(r.error)throw r.error;
      toast(old?"Peça atualizada.":"Peça adicionada.");dlg.close();await load();render()}
    catch(x){toast(x.message||"Erro ao salvar.",1);b.disabled=false}};
}
document.addEventListener("click",async e=>{const t=e.target.closest("[data-edit],[data-del],[data-new],[data-out],[data-close],[data-zoom]");if(!t)return;const d=t.dataset;
  if("close"in d)dlg.close();
  else if("new"in d)form();
  else if("out"in d)await sb.auth.signOut();
  else if(d.edit)form(prods.find(p=>p.id===d.edit));
  else if(d.zoom){dlg.className="zoom";dlg.innerHTML=`<img src="${esc(d.zoom)}" alt="" data-close>`;dlg.showModal()}
  else if(d.del){const p=prods.find(p=>p.id===d.del);if(!confirm("Tem certeza que deseja excluir?"))return;const r=await sb.from("produtos").delete().eq("id",p.id);if(r.error)return toast("Não foi possível excluir.",1);await rmImg(p.imagem_url);toast("Peça excluída.");await load();render()}
});
addEventListener("hashchange",render);
sb.auth.onAuthStateChange((_,s)=>{user=s?.user||null;render()});
load().then(render);
