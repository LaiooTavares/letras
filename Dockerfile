# Usa uma imagem leve do Node.js (versão 18 é estável e compatível)
FROM node:18-alpine

# Define a pasta de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de dependências primeiro (para aproveitar o cache do Docker)
COPY package*.json ./

# Instala as dependências do projeto
RUN npm install

# Copia todo o restante do código para dentro do container
COPY . .

# Expõe a porta que seu app usa (O padrão geralmente é 3000. 
# Se seu server.js usar outra, ajuste aqui)
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["node", "server.js"]