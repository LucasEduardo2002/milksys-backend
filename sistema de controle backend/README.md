# Desafio20 - Backend

Este projeto de backend foi desenvolvido para gerenciar o cadastro de produtores e controle de coletas de leite na empresa Sertão Seridó incluindo os resultados de analise de qualidade. 

# Tecnologias Utilizadas
Node.js: Ambiente de execução JavaScript.

Express.js: Framework para construção das APIs.

MySQL: Banco de dados relacional para armazenamento dos dados.

mysql2: Driver MySQL para Node.js com suporte a promises.

cors: Middleware para habilitar o CORS (Cross-Origin Resource Sharing).

dotenv: Módulo para carregar variáveis de ambiente de um arquivo .env.

# Como Rodar o Projeto
Siga os passos abaixo para configurar e iniciar o backend em seu ambiente local.

# Pré-requisitos
Certifique-se de ter os seguintes programas instalados em sua máquina:

Node.js (versão 18 ou superior)

MySQL Server (versão 8.0 ou superior)

# 1. fazer o clone do repositorio
Navegue até a pasta que deseja baixar o projeto
execute o seguinte comando

git clone https://codelab.ifrn.edu.br/embarcatech/Equipe20/desafio20.a/desafio20.a_backend.git

entrar no projeto

cd desafio20.a_backend/

mude da branch main para a Software/develop/backend

entrar no projeto

cd '.\sistema de controle backend\'

# 2. Instalar Dependências
Abra o terminal na pasta do projeto e execute:

npm install

# 3. Configurar o Banco de Dados

Crie um arquivo .env na raiz do projeto com as suas credenciais do MySQL. Utilize o arquivo .env.example (ou o formato abaixo) como base:

```ini
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASS="sua_senha_aqui"
DB_NAME=controle_leite
```
O banco de dados controle_leite será criado automaticamente na primeira vez que você iniciar o servidor, assim como as tabelas produtores e coletas e as preencherá com dados iniciais..

# 4. Iniciar o Servidor
Para iniciar o servidor, execute o seguinte comando:
 
npm start

# 📖 Rotas da API
### Produtores: 

### Método	   Endpoint	                Descrição
- **GET:**	/produtores	      Lista todos os produtores cadastrados.
- **POST:**	/produtores	      Cadastra um novo produtor. Retorna um erro se o cpfCnpj já existir.
- **PUT:**	/produtores/:id	   Atualiza os dados de um produtor específico.
- **- **GET:**:**	/produtores/:id	Remove um produtor do banco de dados.

### Coletas: 

### Método	   Endpoint	                Descrição
- **GET:**	/coletas      Lista todas as coletas de leite registradas.
- **POST:**	/coletas	  Lista todas as coletas de leite registradas.