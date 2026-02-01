const btnStart = document.getElementById('btn-start');
const textInput = document.getElementById('text-input');
const presentationLayer = document.getElementById('presentation-layer');
const displayText = document.getElementById('display-text');
const btnLogout = document.getElementById('btn-logout');

// Seleciona botões de inserção
const insertButtons = document.querySelectorAll('.btn-insert');

let phrases = [];
let currentIndex = 0;
// Variáveis para controlar o deslize (swipe)
let touchStartY = 0;
let touchEndY = 0;

// === 1. LÓGICA DE INSERÇÃO DE TAGS ===
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
        } else {
            alert(`Selecione o texto para aplicar: ${tag.toUpperCase()}`);
        }
    });
});

if (btnLogout) {
    btnLogout.addEventListener('click', () => { window.location.href = '/'; });
}

// === 2. FORMATADOR DE TEXTO ===
function formatText(text) {
    text = text.replace(/\[b\](.*?)\[\/b\]/g, '<strong>$1</strong>');
    text = text.replace(/\[i\](.*?)\[\/i\]/g, '<em>$1</em>');
    text = text.replace(/\[u\](.*?)\[\/u\]/g, '<u>$1</u>');
    text = text.replace(/\[c\](.*?)\[\/c\]/g, '<div class="align-center">$1</div>');
    text = text.replace(/\[j\](.*?)\[\/j\]/g, '<div class="align-justify">$1</div>');
    text = text.replace(/\[(yellow|red|green|cyan)\](.*?)\[\/\1\]/g, '<span style="color: $1">$2</span>');
    return text;
}

// === 3. APRESENTAÇÃO E NAVEGAÇÃO ===
if (btnStart) {
    btnStart.addEventListener('click', () => {
        const rawText = textInput.value.trim();
        if (!rawText) return alert("Escreva algo primeiro!");

        phrases = rawText.split('\n').filter(line => line.trim() !== '');
        currentIndex = 0;

        if (phrases.length > 0) {
            enterFullScreen();
        }
    });
}

function enterFullScreen() {
    presentationLayer.style.display = 'flex';
    updateDisplay();
    
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    }
}

function exitFullScreen() {
    presentationLayer.style.display = 'none';
    if (document.exitFullscreen && document.fullscreenElement) {
        document.exitFullscreen();
    }
}

function updateDisplay() {
    if (currentIndex < phrases.length) {
        displayText.innerHTML = formatText(phrases[currentIndex]);
    } else {
        displayText.innerText = "Fim. Deslize p/ cima para sair ou p/ baixo para voltar.";
    }
}

// --- AÇÕES DE NAVEGAÇÃO ---
function goNext() {
    if (currentIndex < phrases.length) {
        currentIndex++;
        updateDisplay();
    } else {
        exitFullScreen(); // Sai se tentar ir além do fim
    }
}

function goPrev() {
    if (currentIndex > 0) {
        currentIndex--;
        updateDisplay();
    }
}

// === 4. CONTROLES DE TOQUE (SWIPE VERTICAL) ===
if (presentationLayer) {
    
    // Detecta onde o toque começou
    presentationLayer.addEventListener('touchstart', e => {
        touchStartY = e.changedTouches[0].screenY;
    }, {passive: true});

    // Detecta onde o toque terminou e calcula a direção
    presentationLayer.addEventListener('touchend', e => {
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
    }, {passive: true});

    // Mantém o clique funcionando (para Desktop ou toque rápido)
    presentationLayer.addEventListener('click', (e) => {
        // Só ativa o clique se NÃO foi um deslize (diferença pequena de pixels)
        if (Math.abs(touchStartY - touchEndY) < 30) {
            goNext();
        }
    });
}

function handleSwipe() {
    const diff = touchStartY - touchEndY;
    const threshold = 50; // Sensibilidade (mínimo de pixels para contar como swipe)

    if (Math.abs(diff) < threshold) return; // Foi só um toque tremido, ignora

    if (diff > 0) {
        // Dedo subiu (Swipe Up) -> PRÓXIMO
        goNext();
    } else {
        // Dedo desceu (Swipe Down) -> ANTERIOR (VOLTAR)
        goPrev();
    }
}

document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
        presentationLayer.style.display = 'none';
    }
});