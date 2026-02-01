document.addEventListener('DOMContentLoaded', () => {
    // === ELEMENTOS ===
    const btnStart = document.getElementById('btn-start');
    const textInput = document.getElementById('text-input'); 
    const presentationLayer = document.getElementById('presentation-layer');
    const displayText = document.getElementById('display-text');
    const btnLogout = document.getElementById('btn-logout');
    
    // Elementos de Templates
    const btnSaveTemplate = document.getElementById('btn-save-template');
    const templateListEl = document.getElementById('template-list');

    // Botões de Inserção
    const insertButtons = document.querySelectorAll('.btn-insert');

    // === VARIÁVEIS ===
    let phrases = [];
    let currentIndex = 0;
    let touchStartY = 0;
    let touchEndY = 0;
    let saveTimeout;
    let isEditing = false;

    // === 1. CARREGAMENTO E SINCRONIA ===

    async function carregarDados(apenasLista = false, tentativas = 3) {
        try {
            const response = await fetch(`/api/dados?t=${Date.now()}`);
            
            if (!response.ok) throw new Error("Erro na API");

            const data = await response.json();
            
            if (!apenasLista && data.conteudo && textInput) {
                // Só preenche se o campo estiver vazio para não sobrescrever o que você está digitando
                if(textInput.value === "") textInput.value = data.conteudo;
            }

            renderizarTemplates(data.templates || []);

        } catch (error) {
            console.error('Erro de conexão:', error);
            if (tentativas > 0) {
                setTimeout(() => carregarDados(apenasLista, tentativas - 1), 1000);
            } else if (templateListEl && !apenasLista) {
                templateListEl.innerHTML = '<p style="color: #ff4444; text-align:center; font-size: 0.8rem;">Erro ao carregar dados.</p>';
            }
        }
    }

    async function autoSave() {
        if(!textInput) return;
        const texto = textInput.value;
        try {
            await fetch('/api/salvar-texto', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ texto: texto })
            });
            console.log('✅ Auto-save ok.');
        } catch (error) {
            console.error('Erro no auto-save:', error);
        }
        isEditing = false;
    }

    // Inicialização
    if (textInput) {
        setTimeout(() => carregarDados(false), 500);

        setInterval(() => {
            if (!isEditing) carregarDados(true); 
        }, 5000);

        textInput.addEventListener('input', () => {
            isEditing = true;
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(autoSave, 1000);
        });
    }

    // === 2. GERENCIADOR DE TEMPLATES ===

    function renderizarTemplates(lista) {
        if (!templateListEl) return;
        
        if (lista.length === 0) {
            templateListEl.innerHTML = '<p style="font-size: 0.8rem; color: #666; text-align:center;">Nenhum modelo salvo.</p>';
            return;
        }

        // Ordena por mais recente
        lista.sort((a, b) => b.id - a.id);

        let html = '';
        lista.forEach(template => {
            html += `
                <div class="template-item">
                    <span class="template-name" title="${template.nome}">📄 ${template.nome}</span>
                    <div>
                        <button class="btn-action-sm btn-load" data-id="${template.id}">Carregar</button>
                        <button class="btn-action-sm btn-delete" data-id="${template.id}">🗑️</button>
                    </div>
                </div>
            `;
        });

        templateListEl.innerHTML = html;

        // Eventos dos botões da lista
        document.querySelectorAll('.btn-load').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = Number(e.target.dataset.id);
                const item = lista.find(t => t.id === id);
                if(item && confirm(`Carregar modelo "${item.nome}"?`)) {
                    textInput.value = item.conteudo;
                    autoSave();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = Number(e.target.dataset.id);
                if(confirm('Apagar este modelo?')) {
                    deletarTemplate(id);
                }
            });
        });
    }

    // Lógica do Botão Salvar
    if (btnSaveTemplate) {
        btnSaveTemplate.addEventListener('click', async () => {
            const nome = prompt("Digite um nome para este modelo:");
            if (!nome) return;

            const conteudo = textInput.value;
            const textoOriginal = btnSaveTemplate.textContent;
            btnSaveTemplate.textContent = "Salvando...";

            try {
                const res = await fetch('/api/templates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome, conteudo })
                });

                if (!res.ok) throw new Error('Erro no servidor');

                const novaLista = await res.json();
                renderizarTemplates(novaLista);
                alert("Modelo salvo com sucesso!");
            } catch (err) {
                console.error(err);
                alert("Erro ao salvar.");
            } finally {
                btnSaveTemplate.textContent = textoOriginal;
            }
        });
    }

    async function deletarTemplate(id) {
        try {
            const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
            const novaLista = await res.json();
            renderizarTemplates(novaLista);
        } catch (err) { console.error("Erro ao deletar", err); }
    }

    // === 3. EDIÇÃO E TELA CHEIA (CORRIGIDO AQUI) ===
    
    insertButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tag = btn.getAttribute('data-tag'); 
            const start = textInput.selectionStart;
            const end = textInput.selectionEnd;
            const text = textInput.value;
            const selectedText = text.substring(start, end);

            const replacement = `[${tag}]${selectedText}[/${tag}]`;
            textInput.value = text.substring(0, start) + replacement + text.substring(end);
            autoSave();
        });
    });

    if (btnLogout) btnLogout.addEventListener('click', () => { window.location.href = '/'; });

    function formatText(text) {
        text = text.replace(/\n/g, '<br>');
        text = text.replace(/\[b\](.*?)\[\/b\]/g, '<strong>$1</strong>');
        text = text.replace(/\[i\](.*?)\[\/i\]/g, '<em>$1</em>');
        text = text.replace(/\[u\](.*?)\[\/u\]/g, '<u>$1</u>');
        text = text.replace(/\[c\](.*?)\[\/c\]/g, '<div class="align-center">$1</div>');
        text = text.replace(/\[j\](.*?)\[\/j\]/g, '<div class="align-justify">$1</div>');
        text = text.replace(/\[(yellow|red|green|cyan)\](.*?)\[\/\1\]/g, '<span style="color: $1">$2</span>');
        return text;
    }

    if (btnStart) {
        btnStart.addEventListener('click', () => {
            const rawText = textInput.value.trim();
            if (!rawText) return alert("Escreva algo primeiro!");
            
            // === CORREÇÃO: DIVISÃO SIMPLES POR LINHA ===
            // Removemos a lógica de parágrafos duplos. Agora cada Enter é um slide.
            phrases = rawText.split('\n').filter(l => l.trim() !== '');

            currentIndex = 0;
            if (phrases.length > 0) enterFullScreen();
        });
    }

    function enterFullScreen() {
        presentationLayer.style.display = 'flex';
        updateDisplay();
        const elem = document.documentElement;
        if (elem.requestFullscreen) elem.requestFullscreen();
        else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
    }

    function exitFullScreen() {
        presentationLayer.style.display = 'none';
        if (document.exitFullscreen && document.fullscreenElement) document.exitFullscreen();
    }

    function updateDisplay() {
        if (currentIndex < phrases.length) {
            displayText.innerHTML = formatText(phrases[currentIndex]);
        } else {
            displayText.innerText = "Fim. Deslize p/ cima para sair.";
        }
    }

    function goNext() {
        if (currentIndex < phrases.length) {
            currentIndex++;
            updateDisplay();
        } else { exitFullScreen(); }
    }
    
    function goPrev() {
        if (currentIndex > 0) {
            currentIndex--;
            updateDisplay();
        }
    }

    if (presentationLayer) {
        presentationLayer.addEventListener('touchstart', e => { touchStartY = e.changedTouches[0].screenY; }, {passive: true});
        presentationLayer.addEventListener('touchend', e => { 
            touchEndY = e.changedTouches[0].screenY; 
            handleSwipe(); 
        }, {passive: true});
        presentationLayer.addEventListener('click', () => {
             if (Math.abs(touchStartY - touchEndY) < 30) goNext();
        });
    }

    function handleSwipe() {
        const diff = touchStartY - touchEndY;
        if (Math.abs(diff) < 50) return;
        if (diff > 0) goNext();
        else goPrev();
    }
    
    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) presentationLayer.style.display = 'none';
    });
});