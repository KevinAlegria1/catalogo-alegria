document.addEventListener('DOMContentLoaded', () => {
    mostrarProductos();
    
    if(document.getElementById('lista-admin')) {
        mostrarListaAdmin();
        document.getElementById('admin-search').addEventListener('input', (e) => mostrarListaAdmin(e.target.value));
    }

    const catalogoSearch = document.getElementById('catalogo-search');
    if(catalogoSearch) {
        catalogoSearch.addEventListener('input', (e) => mostrarProductos('Todos', e.target.value));
    }

    const imgInput = document.getElementById('img-file');
    if(imgInput) {
        imgInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const preview = document.getElementById('img-preview');
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                }
                reader.readAsDataURL(file);
            }
        });
    }
});

const DB_NAME = 'chocolates_alegria_db';

function obtenerProductos() {
    try {
        const datos = localStorage.getItem(DB_NAME);
        return datos ? JSON.parse(datos) : [];
    } catch (e) { return []; }
}

function pedirWhatsApp(nombre, precio) {
    const numero = "527221234567"; 
    const mensaje = encodeURIComponent(`¡Hola Alegría! Me gustaría pedir el chocolate: "${nombre}" ($${precio}).`);
    window.open(`https://wa.me/${numero}?text=${mensaje}`, '_blank');
}

async function optimizarImagen(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                let width = img.width, height = img.height;
                if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                canvas.width = width; canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
        };
    });
}

const form = document.getElementById('form-producto');
if(form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-submit');
        const textOrig = btn.innerText;
        btn.innerText = "Sincronizando...";
        btn.disabled = true;

        const editId = document.getElementById('edit-id').value;
        const file = document.getElementById('img-file').files[0];
        let productos = obtenerProductos();
        let imgFinal = null;

        try {
            if (file) imgFinal = await optimizarImagen(file);
            const data = {
                nombre: document.getElementById('nombre').value,
                desc: document.getElementById('desc').value,
                precio: document.getElementById('precio').value,
                categoria: document.getElementById('categoria').value,
                stock: document.getElementById('stock').value || 0,
                etiqueta: document.getElementById('etiqueta').value
            };

            if (editId) {
                productos = productos.map(p => p.id == editId ? { ...p, ...data, img: file ? imgFinal : p.img } : p);
            } else {
                productos.push({ ...data, id: Date.now(), img: imgFinal || 'img/default.jpg' });
            }

            localStorage.setItem(DB_NAME, JSON.stringify(productos));
            resetForm();
            mostrarListaAdmin();
            alert('¡Inventario Alegría actualizado!');
        } catch (err) { alert('Error al guardar.'); }
        finally { btn.innerText = textOrig; btn.disabled = false; }
    });
}

function mostrarProductos(filtro = 'Todos', query = '') {
    const grid = document.getElementById('catalogo-grid');
    if(!grid) return;
    
    let productos = obtenerProductos();
    if(filtro !== 'Todos') productos = productos.filter(p => p.categoria === filtro);
    if(query) productos = productos.filter(p => p.nombre.toLowerCase().includes(query.toLowerCase()));
    
    grid.innerHTML = productos.map((p) => {
        const srcReal = p.img.startsWith('data:') ? p.img : `img/${p.img}`;
        return `
        <div class="card-shadow overflow-hidden group hover:-translate-y-2 transition-all duration-500">
            <div class="h-64 overflow-hidden relative">
                <img src="${srcReal}" alt="${p.nombre}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                <div class="absolute top-4 right-4 bg-[#bf9b30] text-[#1a110a] text-[10px] font-bold px-3 py-1 rounded-full shadow-lg">$${p.precio}</div>
            </div>
            <div class="p-8 text-center bg-black/10">
                <span class="text-[#bf9b30] text-[9px] font-black uppercase tracking-[0.3em] mb-2 block">${p.categoria}</span>
                <h3 class="text-xl font-serif text-[#f1ede4] mb-3 leading-tight">${p.nombre}</h3>
                <p class="text-[#f1ede4]/80 text-xs leading-relaxed mb-6 h-12 line-clamp-2 italic">${p.desc}</p>
                <button onclick="pedirWhatsApp('${p.nombre}', '${p.precio}')" 
                        class="w-full py-4 border-2 border-[#bf9b30] bg-[#bf9b30]/10 text-[#bf9b30] rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-[#bf9b30] hover:text-[#1a110a] transition-all">
                    Solicitar Pedido
                </button>
            </div>
        </div>`;
    }).join('');
}

// Lógica para botones de categoría persistentes
function cambiarCategoria(cat, btnAlClick) {
    const botones = document.querySelectorAll('.btn-categoria');
    botones.forEach(b => {
        b.classList.remove('active-category');
        b.classList.add('glass');
    });
    btnAlClick.classList.add('active-category');
    btnAlClick.classList.remove('glass');

    const grid = document.getElementById('catalogo-grid');
    if(!grid) return;
    grid.style.opacity = '0';
    setTimeout(() => {
        mostrarProductos(cat);
        grid.style.opacity = '1';
    }, 200);
}

function mostrarListaAdmin(query = '') {
    const lista = document.getElementById('lista-admin');
    if(!lista) return;
    const productos = obtenerProductos().filter(p => p.nombre.toLowerCase().includes(query.toLowerCase()));
    lista.innerHTML = productos.map(p => {
        const srcReal = p.img.startsWith('data:') ? p.img : `img/${p.img}`;
        return `
        <div class="bg-item flex justify-between items-center p-5 rounded-[2rem] transition-all">
            <div class="flex items-center gap-5">
                <img src="${srcReal}" class="w-16 h-16 rounded-2xl object-cover border-2 border-[#1a110a]">
                <div>
                    <p class="font-bold text-[#f1ede4] text-sm">${p.nombre}</p>
                    <p class="text-[10px] text-[#f1ede4]/50">Stock: ${p.stock} | <span class="text-gold font-bold">${p.categoria}</span></p>
                </div>
            </div>
            <div class="flex gap-4">
                <button onclick="cargarEdicion(${p.id})" class="text-[#bf9b30] text-[10px] font-bold uppercase tracking-widest bg-[#bf9b30]/10 px-4 py-2 rounded-lg hover:bg-[#bf9b30] hover:text-black transition">Editar</button>
                <button onclick="eliminar(${p.id})" class="text-red-400 text-[10px] font-bold uppercase tracking-widest bg-red-400/10 px-4 py-2 rounded-lg hover:bg-red-400 hover:text-white transition">Borrar</button>
            </div>
        </div>`;
    }).join('');
}

function cargarEdicion(id) {
    const p = obtenerProductos().find(item => item.id == id);
    if(p) {
        document.getElementById('edit-id').value = p.id;
        document.getElementById('nombre').value = p.nombre;
        document.getElementById('desc').value = p.desc;
        document.getElementById('precio').value = p.precio;
        document.getElementById('categoria').value = p.categoria;
        document.getElementById('stock').value = p.stock || 0;
        document.getElementById('etiqueta').value = p.etiqueta || "Ninguna";
        const preview = document.getElementById('img-preview');
        preview.src = p.img.startsWith('data:') ? p.img : `img/${p.img}`;
        preview.style.display = 'block';
        document.getElementById('form-title').innerText = "Editando Registro";
        document.getElementById('btn-submit').innerText = "Actualizar Chocolate";
        document.getElementById('btn-cancel').classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function resetForm() {
    if(form) form.reset();
    document.getElementById('edit-id').value = "";
    document.getElementById('img-preview').style.display = 'none';
    document.getElementById('form-title').innerText = "Nuevo Chocolate";
    document.getElementById('btn-submit').innerText = "Guardar en Inventario";
    document.getElementById('btn-cancel').classList.add('hidden');
}

function eliminar(id) {
    if(confirm('¿Eliminar permanentemente?')) {
        let db = obtenerProductos().filter(p => p.id != id);
        localStorage.setItem(DB_NAME, JSON.stringify(db));
        mostrarListaAdmin();
    }
}