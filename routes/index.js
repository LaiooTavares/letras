const express = require('express');
const path = require('path');
const router = express.Router();

// SENHA HARDCODED
const SENHA_SECRETA = "Dm-290615";

// Rota da tela de Login (GET)
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Rota para validar login (POST)
router.post('/login', (req, res) => {
    const { senha } = req.body;
    
    if (senha === SENHA_SECRETA) {
        // Envia o arquivo do App se a senha estiver correta
        res.sendFile(path.join(__dirname, '../public/app.html'));
    } else {
        // Redireciona com erro se falhar
        res.redirect('/?erro=senha_incorreta');
    }
});

module.exports = router;