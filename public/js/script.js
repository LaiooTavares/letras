document.addEventListener('DOMContentLoaded', () => {
    const btnStart = document.getElementById('btn-start');
    const textInput = document.getElementById('text-input'); 
    const presentationLayer = document.getElementById('presentation-layer');
    const displayText = document.getElementById('display-text');
    const btnLogout = document.getElementById('btn-logout');
    
    // Novos Elementos para Templates
    const btnSaveTemplate = document.getElementById('btn-save-template');
    const templateListEl = document.getElementById('template-list');

    // Seleciona botões de inserção
    const insertButtons = document.querySelectorAll('.btn-insert');

    let phrases = [];
    let currentIndex = 0;
    let touchStartY = 0;
    let touchEndY = 0;
    let saveTimeout;

    // === 1. SISTEMA DE DADOS (AUTO-SAVE + TEMPLATES) ===

    async function carregarDadosIniciais() {
        try {
            const response = await fetch('/api/dados');
            const data = await response.json();
            
            // 1. Carrega o texto que estava sendo editado (Auto-Save)
            if (data.conteudo && textInput) {
                textInput.value = data.conteudo;
            }

            // 2. Renderiza a lista de modelos salvos
            renderizarTemplates(data.templates || []);

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        }
    }

    // Função para salvar APENAS o texto atual (Auto-Save invisível)
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
    }

    // === 2. GERENCIADOR DE TEMPLATES (MODELOS) ===

    // Função visual para mostrar a lista
    function renderizarTemplates(lista) {
        if (!templateListEl) return;
        templateListEl.innerHTML = '';

        if (lista.length === 0) {
            templateListEl.innerHTML = '<p style="font-size: 0.8rem; color: #666; text-align:center;">Nenhum modelo salvo.</p>';
            return;
        }

        lista.forEach(template => {
            const div = document.createElement('div');
            div.className = 'template-item';
            div.innerHTML = `
                <span class="template-name">📄 ${template.nome}</span>
                <div>
                    <button class="btn-action-sm btn-load">Carregar</button>
                    <button class="btn-action-sm btn-delete">🗑️</button>
                </div>
            `;

            // Botão Carregar
            div.querySelector('.btn-load').addEventListener('click', () => {
                if(confirm(`Substituir texto atual pelo modelo "${template.nome}"?`)) {
                    textInput.value = template.conteudo;
                    autoSave(); // Salva o novo estado
                }
            });

            // Botão Deletar
            div.querySelector('.btn-delete').addEventListener('click', () => {
                if(confirm(`Apagar o modelo "${template.nome}"?`)) {
                    deletarTemplate(template.id);
                }
            });

            templateListEl.appendChild(div);
        });
    }

    // Ação do Botão "Salvar Modelo"
    if (btnSaveTemplate) {
        btnSaveTemplate.addEventListener('click', async () => {
            const nome = prompt("Dê um nome para este modelo:");
            if (!nome) return; // Cancelou

            const conteudo = textInput.value;
            
            try {
                const res = await fetch('/api/templates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome, conteudo })
                });
                const novaLista = await res.json();
                renderizarTemplates(novaLista);
                alert("Modelo salvo com sucesso!");
            } catch (err) {
                alert("Erro ao salvar modelo.");
            }
        });
    }

    async function deletarTemplate(id) {
        try {
            const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
            const novaLista = await res.json();
            renderizarTemplates(novaLista);
        } catch (err) {
            console.error("Erro ao deletar", err);
        }
    }

    // Inicialização
    if (textInput) {
        carregarDadosIniciais();

        // Gatilho do Auto-Save
        textInput.addEventListener('input', () => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(autoSave, 1000);
        });
    }

    // === 3. LÓGICA DE EDIÇÃO E APRESENTAÇÃO (MANTIDA IGUAL) ===
    
    insertButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tag = btn.getAttribute('data-tag'); 
            const start = textInput.selectionStart;
            const end = textInput.selectionEnd;
            const text = textInput.value;
            const selectedText = text.substring(start, end);

            if (selectedText.length > 0) {
                const replacement = `[${tag}]${selectedText}[/${tag}]`;
                textInput.value = text.substring(0, start) + replacement + text.substring(end);
                autoSave();
            } else {
                alert(`Selecione o texto para aplicar: ${tag.toUpperCase()}`);
            }
        });
    });

    if (btnLogout) {
        btnLogout.addEventListener('click', () => { window.location.href = '/'; });
    }

    function formatText(text) {
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

            phrases = rawText.split('\n').filter(line => line.trim() !== '');
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
        } else {
            exitFullScreen();
        }
    }

    function goPrev() {
        if (currentIndex > 0) {
            currentIndex--;
            updateDisplay();
        }
    }

    if (presentationLayer) {
        presentationLayer.addEventListener('touchstart', e => {
            touchStartY = e.changedTouches[0].screenY;
        }, {passive: true});

        presentationLayer.addEventListener('touchend', e => {
            touchEndY = e.changedTouches[0].screenY;
            handleSwipe();
        }, {passive: true});

        presentationLayer.addEventListener('click', (e) => {
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