const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs'); // Módulo para ler arquivos do sistema
const routes = require('./routes/index');

const app = express();
const PORT = 3000;

// === ÁREA DE DIAGNÓSTICO ===
const publicPath = path.join(__dirname, 'public');
const cssPath = path.join(publicPath, 'css', 'style.css');

console.log('\n--- 🔍 INICIANDO DIAGNÓSTICO ---');
console.log(`📂 O servidor está rodando em: ${__dirname}`);
console.log(`📂 Ele está procurando a pasta public em: ${publicPath}`);

if (fs.existsSync(publicPath)) {
    console.log('✅ A pasta "public" foi encontrada!');
    
    if (fs.existsSync(cssPath)) {
        console.log('✅ O arquivo "style.css" foi encontrado dentro de public/css!');
    } else {
        console.log('❌ ERRO CRÍTICO: O arquivo "style.css" NÃO ESTÁ onde deveria.');
        console.log(`   Esperado em: ${cssPath}`);
        console.log('   DICA: Verifique se você criou a pasta "css" dentro de "public".');
    }
} else {
    console.log('❌ ERRO CRÍTICO: A pasta "public" NÃO foi encontrada.');
    console.log('   DICA: Verifique se a pasta "public" está no mesmo nível do arquivo server.js');
}
console.log('-------------------------------\n');
// ============================

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configura arquivos estáticos
app.use(express.static(publicPath));

// Ignora erro de favicon para limpar o console
app.get('/favicon.ico', (req, res) => res.status(204).end());

app.use('/', routes);

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});