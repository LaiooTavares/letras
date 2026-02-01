document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTOS DO DOM ---
    const btnStart = document.getElementById('btn-start');
    const textInput = document.getElementById('text-input'); 
    const presentationLayer = document.getElementById('presentation-layer');
    const displayText = document.getElementById('display-text');
    const btnLogout = document.getElementById('btn-logout');
    
    // Elementos de Templates
    const btnSaveTemplate = document.getElementById('btn-save-template');
    const templateListEl = document.getElementById('template-list');

    // Botões de Inserção (Toolbar)
    const insertButtons = document.querySelectorAll('.btn-insert');

    // --- VARIÁVEIS DE CONTROLE ---
    let phrases = [];
    let currentIndex = 0;
    let touchStartY = 0;
    let touchEndY = 0;
    let saveTimeout;
    
    // Variável para evitar recarregar a lista se eu estiver digitando
    let isEditing = false;

    // === 1. CARREGAMENTO E SINCRONIA DE DADOS ===

    async function carregarDados(apenasLista = false) {
        try {
            // Adiciona timestamp para evitar cache forçado do navegador
            const response = await fetch(`/api/dados?t=${Date.now()}`);
            const data = await response.json();
            
            // Se for carregamento inicial, preenche o texto
            if (!apenasLista && data.conteudo && textInput) {
                // Só atualiza o texto principal se não estiver vazio
                if(textInput.value === "") textInput.value = data.conteudo;
            }

            // Atualiza a lista de templates
            renderizarTemplates(data.templates || []);

        } catch (error) {
            console.error('Erro de conexão:', error);
        }
    }

    // Auto-Save do Texto Principal
    async function autoSave() {
        if(!textInput) return;
        const texto = textInput.value;
        try {
            await fetch('/api/salvar-texto', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ texto: texto })
            });
            console.log('✅ Sincronizado.');
        } catch (error) {
            console.error('Erro ao salvar:', error);
        }
        isEditing = false;
    }

    // === ATIVAÇÃO DA SINCRONIA AUTOMÁTICA ===
    // 1. Carrega tudo ao abrir
    if (textInput) {
        carregarDados(false); 

        // 2. A cada 5 segundos, busca novos modelos criados em outros dispositivos
        setInterval(() => {
            // Só atualiza a lista em background, não mexe no texto que você está digitando
            carregarDados(true); 
        }, 5000);

        // 3. Gatilho de digitação
        textInput.addEventListener('input', () => {
            isEditing = true;
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(autoSave, 1000);
        });
    }

    // === 2. GERENCIADOR DE TEMPLATES ===

    function renderizarTemplates(lista) {
        if (!templateListEl) return;
        
        // Verifica se a lista mudou antes de redesenhar (para não piscar a tela)
        const currentHTML = templateListEl.innerHTML;
        
        // Cria o HTML na memória primeiro
        if (lista.length === 0) {
            if(!currentHTML.includes('Nenhum modelo')) {
                templateListEl.innerHTML = '<p style="font-size: 0.8rem; color: #666; text-align:center;">Nenhum modelo salvo.</p>';
            }
            return;
        }

        // Ordena: mais recentes primeiro (baseado no ID timestamp)
        lista.sort((a, b) => b.id - a.id);

        let html = '';
        lista.forEach(template => {
            html += `
                <div class="template-item">
                    <span class="template-name" onclick="carregarModelo(${template.id})">📄 ${template.nome}</span>
                    <div>
                        <button class="btn-action-sm btn-load" data-id="${template.id}">Carregar</button>
                        <button class="btn-action-sm btn-delete" data-id="${template.id}">🗑️</button>
                    </div>
                </div>
            `;
        });

        // Só atualiza o DOM se houve mudança real (comparação simples de string)
        // Isso evita que a lista "pisque" a cada 5 segundos se nada mudou
        // (Nota: para simplificar, vamos substituir sempre, mas o ideal seria Diff)
        templateListEl.innerHTML = html;

        // Re-adiciona os eventos aos botões
        document.querySelectorAll('.btn-load').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = Number(btn.dataset.id);
                const item = lista.find(t => t.id === id);
                if(item && confirm(`Carregar modelo "${item.nome}"?`)) {
                    textInput.value = item.conteudo;
                    autoSave();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = Number(btn.dataset.id);
                if(confirm('Apagar este modelo permanentemente?')) {
                    deletarTemplate(id);
                }
            });
        });
    }

    // Botão Salvar Modelo
    if (btnSaveTemplate) {
        btnSaveTemplate.addEventListener('click', async () => {
            const nome = prompt("Nome do Modelo:");
            if (!nome) return;

            const conteudo = textInput.value;
            try {
                const res = await fetch('/api/templates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome, conteudo })
                });
                const novaLista = await res.json();
                renderizarTemplates(novaLista);
            } catch (err) { alert("Erro ao salvar."); }
        });
    }

    async function deletarTemplate(id) {
        try {
            const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
            const novaLista = await res.json();
            renderizarTemplates(novaLista);
        } catch (err) { console.error("Erro ao deletar", err); }
    }

    // === 3. LÓGICA DE APRESENTAÇÃO (MANTIDA) ===
    
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
        text = text.replace(/\n/g, '<br>'); // Suporte a quebra de linha
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
            // Separa por quebra de linha dupla ou usa um separador específico se preferir
            // Aqui usa quebra simples, mas mantém o HTML
            phrases = rawText.split('\n\n').filter(l => l.trim() !== ''); // Usei \n\n para separar slides, ou \n se preferir linha a linha
            if(phrases.length <= 1) phrases = rawText.split('\n').filter(l => l.trim() !== ''); // Fallback para linha a linha

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