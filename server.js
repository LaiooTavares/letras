// Referencia: server.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const routes = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 3000;

// === CONFIGURAÇÃO DO BANCO DE DADOS ===
const DB_FILE = path.join(__dirname, 'banco-dados.json');

// Inicializa o banco com estrutura nova (Conteúdo atual + Lista de Templates)
if (!fs.existsSync(DB_FILE)) {
    try {
        const initialData = { 
            conteudo: "", 
            templates: [] // Lista vazia para guardar os salvos
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData), 'utf-8');
        console.log('🆕 Banco de dados criado.');
    } catch (e) {
        console.error('Erro ao criar banco:', e);
    }
}

// === MIDDLEWARES ===
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// === FUNÇÕES AUXILIARES ===
function lerBanco() {
    try {
        if (!fs.existsSync(DB_FILE)) return { conteudo: "", templates: [] };
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    } catch (e) { return { conteudo: "", templates: [] }; }
}

function salvarBanco(dados) {
    fs.writeFileSync(DB_FILE, JSON.stringify(dados, null, 2), 'utf-8');
}

// === ROTAS DA API ===

// 1. Obter tudo (Texto atual + Templates)
app.get('/api/dados', (req, res) => {
    res.json(lerBanco());
});

// 2. Salvar apenas o texto atual (Auto-Save)
app.post('/api/salvar-texto', (req, res) => {
    const db = lerBanco();
    db.conteudo = req.body.texto;
    salvarBanco(db);
    res.json({ status: 'ok' });
});

// 3. Criar novo Template
app.post('/api/templates', (req, res) => {
    const { nome, conteudo } = req.body;
    const db = lerBanco();
    
    // Garante que existe o array
    if (!db.templates) db.templates = [];

    const novoTemplate = {
        id: Date.now(), // ID único baseado no tempo
        nome: nome || 'Sem nome',
        conteudo: conteudo
    };

    db.templates.push(novoTemplate);
    salvarBanco(db);
    res.json(db.templates); // Retorna a lista atualizada
});

// 4. Deletar Template
app.delete('/api/templates/:id', (req, res) => {
    const id = Number(req.params.id);
    const db = lerBanco();
    
    if (db.templates) {
        db.templates = db.templates.filter(t => t.id !== id);
        salvarBanco(db);
    }
    
    res.json(db.templates);
});

// === ROTAS PADRÃO ===
app.get('/favicon.ico', (req, res) => res.status(204).end());
app.use('/', routes);

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta: ${PORT}`);
});