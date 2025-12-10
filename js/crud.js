// CRUD en localStorage para 'contacts'
(function(){
  const LS_KEY = 'contacts';
  let contacts = [];

  // Helpers
  function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
  function save(){ localStorage.setItem(LS_KEY, JSON.stringify(contacts)); }
  function load(){ try{ contacts = JSON.parse(localStorage.getItem(LS_KEY)) || []; }catch(e){ contacts = []; } }

  // DOM
  const form = document.getElementById('contact-form');
  const idField = document.getElementById('contact-id');
  const nameField = document.getElementById('name');
  const emailField = document.getElementById('email');
  const phoneField = document.getElementById('phone');
  const noteField = document.getElementById('note');
  const tableBody = document.querySelector('#contacts-table tbody');
  const search = document.getElementById('search');
  const sortSel = document.getElementById('sort');
  const exportBtn = document.getElementById('export-btn');
  const importFile = document.getElementById('import-file');
  const clearBtn = document.getElementById('clear-btn');

  function render(){
    const q = (search.value || '').toLowerCase();
    const sorted = [...contacts];
    const sort = sortSel.value;
    if(sort === 'name_asc') sorted.sort((a,b)=> a.name.localeCompare(b.name));
    else if(sort === 'name_desc') sorted.sort((a,b)=> b.name.localeCompare(a.name));

    const filtered = sorted.filter(c=> c.name.toLowerCase().includes(q) || (c.email||'').toLowerCase().includes(q));

    tableBody.innerHTML = '';
    if(filtered.length === 0){
      const tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="5" style="text-align:center;color:var(--muted)">No hay contactos</td>';
      tableBody.appendChild(tr);
      return;
    }

    filtered.forEach(c=>{
      const tr = document.createElement('tr');
      tr.dataset.id = c.id;
      tr.innerHTML = `
        <td class="cell-name">${escapeHtml(c.name)}</td>
        <td class="cell-email">${escapeHtml(c.email||'')}</td>
        <td class="cell-phone">${escapeHtml(c.phone||'')}</td>
        <td class="cell-note">${escapeHtml(c.note||'')}</td>
        <td style="white-space:nowrap">
          <button class="edit-btn btn">Editar</button>
          <button class="delete-btn btn" style="background:transparent;border:1px dashed #f3d3e0;color:var(--muted);">Eliminar</button>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  }

  function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function addContact(data){
    const contact = Object.assign({id: uid()}, data);
    contacts.push(contact);
    save(); render();
  }

  function updateContact(id, data){
    const i = contacts.findIndex(c=> c.id === id);
    if(i>-1){ contacts[i] = Object.assign({}, contacts[i], data); save(); render(); }
  }

  function deleteContact(id){
    contacts = contacts.filter(c=> c.id !== id); save(); render();
  }

  // Events
  form.addEventListener('submit', function(e){
    e.preventDefault();
    const id = idField.value;
    const data = {
      name: nameField.value.trim(),
      email: emailField.value.trim(),
      phone: phoneField.value.trim(),
      note: noteField.value.trim()
    };
    if(!data.name){ alert('El nombre es obligatorio'); return; }

    if(id){ updateContact(id, data); formReset(); }
    else{ addContact(data); formReset(); }
  });

  clearBtn.addEventListener('click', formReset);

  function formReset(){ idField.value=''; nameField.value=''; emailField.value=''; phoneField.value=''; noteField.value=''; document.querySelector('#contact-form button[type=submit]').textContent='Agregar'; }

  tableBody.addEventListener('click', function(e){
    const tr = e.target.closest('tr'); if(!tr) return;
    const id = tr.dataset.id;
    if(e.target.classList.contains('delete-btn')){
      if(confirm('Eliminar contacto?')) deleteContact(id);
      return;
    }
    if(e.target.classList.contains('edit-btn')){
      enterEditMode(tr, id); return;
    }
  });

  function enterEditMode(tr, id){
    const c = contacts.find(x=> x.id === id); if(!c) return;
    tr.innerHTML = `
      <td><input class="edit-name" value="${escapeAttr(c.name)}"></td>
      <td><input class="edit-email" value="${escapeAttr(c.email||'')}"></td>
      <td><input class="edit-phone" value="${escapeAttr(c.phone||'')}"></td>
      <td><input class="edit-note" value="${escapeAttr(c.note||'')}"></td>
      <td style="white-space:nowrap">
        <button class="save-btn btn">Guardar</button>
        <button class="cancel-btn btn" style="background:transparent;border:1px dashed #f3d3e0;color:var(--muted);">Cancelar</button>
      </td>
    `;

    tr.querySelector('.save-btn').addEventListener('click', function(){
      const data = {
        name: tr.querySelector('.edit-name').value.trim(),
        email: tr.querySelector('.edit-email').value.trim(),
        phone: tr.querySelector('.edit-phone').value.trim(),
        note: tr.querySelector('.edit-note').value.trim()
      };
      if(!data.name){ alert('El nombre es obligatorio'); return; }
      updateContact(id, data);
    });

    tr.querySelector('.cancel-btn').addEventListener('click', function(){ render(); });
  }

  function escapeAttr(s){ return String(s||'').replace(/"/g,'&quot;').replace(/</g,'&lt;'); }

  search.addEventListener('input', render);
  sortSel.addEventListener('change', render);

  exportBtn.addEventListener('click', function(){
    const dataStr = JSON.stringify(contacts, null, 2);
    const blob = new Blob([dataStr], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'contacts.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  });

  importFile.addEventListener('change', function(){
    const f = this.files[0]; if(!f) return;
    const reader = new FileReader();
    reader.onload = function(){
      try{
        const imported = JSON.parse(reader.result);
        if(!Array.isArray(imported)){ alert('JSON inválido: se esperaba un arreglo'); return; }
        if(!confirm('¿Reemplazar los contactos actuales con los del archivo importado?')) return;
        // sanitize items, ensure id
        contacts = imported.map(item=>({
          id: item.id || uid(),
          name: String(item.name||'').trim(),
          email: String(item.email||'').trim(),
          phone: String(item.phone||'').trim(),
          note: String(item.note||'').trim()
        }));
        save(); render();
      }catch(err){ alert('Error al leer JSON: '+err.message); }
    };
    reader.readAsText(f);
    this.value = null;
  });

  // init
  load(); render();
})();
