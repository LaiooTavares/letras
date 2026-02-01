// Referencia: server.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const routes = require('./routes/index');

const app = express();

// MELHORIA: Define a porta baseada no ambiente (Easypanel/Docker) ou usa 3000 como fallback
const PORT = process.env.PORT || 3000;

// === ÁREA DE DIAGNÓSTICO (Aprimorada) ===
const publicPath = path.join(__dirname, 'public');
const cssPath = path.join(publicPath, 'css', 'style.css');

console.log('\n--- 🔍 INICIANDO DIAGNÓSTICO DO SERVIDOR ---');
console.log(`📂 Diretório Raiz (__dirname): ${__dirname}`);
console.log(`📂 Caminho da pasta Public: ${publicPath}`);

if (fs.existsSync(publicPath)) {
    console.log('✅ A pasta "public" foi encontrada!');
    
    // Lista arquivos na raiz da pasta public para conferência (ajuda a ver se o sw.js está lá)
    try {
        const files = fs.readdirSync(publicPath);
        console.log('📄 Arquivos encontrados na raiz de public:', files.join(', '));
    } catch (err) {
        console.log('⚠️ Erro ao listar arquivos:', err.message);
    }

    if (fs.existsSync(cssPath)) {
        console.log('✅ O arquivo "style.css" foi confirmado em public/css!');
    } else {
        console.log('❌ ERRO: "style.css" não encontrado.');
        console.log(`   Esperado em: ${cssPath}`);
    }
} else {
    console.log('❌ ERRO CRÍTICO: A pasta "public" NÃO existe no diretório atual.');
    console.log('   Verifique se o Dockerfile está copiando a pasta corretamente (COPY . .).');
}
console.log('----------------------------------------------\n');
// ==========================================

// MODERNIZAÇÃO: Substituição do body-parser pelos métodos nativos do Express
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configura o diretório de arquivos estáticos (CSS, JS, Imagens, PWA)
app.use(express.static(publicPath));

// Tratamento de favicon para não sujar o log
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Rotas da aplicação
app.use('/', routes);

// Rota de fallback para 404 (Opcional, mas útil para debug)
app.use((req, res, next) => {
    res.status(404).send(`Página não encontrada. Verifique se o caminho ${req.url} está correto.`);
});

// Inicialização do Servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta: ${PORT}`);
    console.log(`🌐 Acesse localmente em: http://localhost:${PORT}`);
});