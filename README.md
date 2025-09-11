# Car Wash Dashboard System

Um sistema completo de dashboard para lava-jato desenvolvido com React (frontend) e Node.js (backend), incluindo autenticação JWT, gerenciamento de serviços, clientes e relatórios.

## 📋 Funcionalidades

### 🔐 Autenticação e Autorização
- Login com email/senha
- JWT para sessões seguras
- Dois níveis de acesso: Admin e Funcionário
- Middleware de proteção de rotas

### 👨‍💼 Dashboard Admin
- Visão geral com gráficos modernos (pizza, linha, barras)
- Estatísticas de serviços realizados (dia/semana/mês/total)
- Receita gerada por período
- Filtros dinâmicos de período
- Gestão completa de clientes
- Gestão de serviços do dia
- Gestão de usuários (criar/editar/excluir)
- Controle de solicitações de exclusão

### 👷‍♂️ Dashboard Funcionário
- Adicionar novos serviços
- Visualizar serviços do dia
- Editar próprios serviços
- Solicitar exclusão de serviços (requer aprovação admin)
- Histórico pessoal de serviços

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** com TypeScript
- **Tailwind CSS** para estilização
- **React Router DOM** para navegação
- **Axios** para requisições HTTP
- **Chart.js + react-chartjs-2** para gráficos
- **React Toastify** para notificações
- **Heroicons** para ícones

### Backend
- **Node.js** com Express
- **PostgreSQL** com queries otimizadas
- **JWT** para autenticação
- **bcryptjs** para hash de senhas
- **CORS** e **Helmet** para segurança
- **dotenv** para variáveis de ambiente

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais
- **users**: Usuários do sistema (admin/funcionário)
- **clientes**: Informações dos clientes
- **servicos**: Registro de serviços realizados
- **solicitacoes_exclusao**: Controle de exclusões

## 🚀 Instalação e Configuração

### 1. Pré-requisitos
- Node.js (versão 16 ou superior)
- PostgreSQL (versão 12 ou superior)
- npm ou yarn

### 2. Clone o Repositório
```bash
git clone <repository-url>
cd lv
```

### 3. Configuração do Backend

#### 3.1. Instalar Dependências
```bash
cd backend
npm install
```

#### 3.2. Configurar Banco de Dados PostgreSQL
1. Instale o PostgreSQL em sua máquina
2. Crie um banco de dados chamado `lavajato_db`
3. Execute o schema SQL:
```bash
psql -U postgres -d lavajato_db -f db/schema.sql
```

#### 3.3. Configurar Variáveis de Ambiente
Copie o arquivo `.env.example` para `.env` e configure suas variáveis:
```bash
cp .env.example .env
```

Edite o arquivo `.env`:
```env
PORT=88
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-in-production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lavajato_db
DB_USER=postgres
DB_PASSWORD=your-postgres-password
BCRYPT_ROUNDS=10
```

#### 3.4. Iniciar o Servidor Backend
```bash
npm start
# ou para desenvolvimento com auto-reload:
npm run dev
```

O servidor será executado na porta 88: `http://localhost:88`

### 4. Configuração do Frontend

#### 4.1. Instalar Dependências
```bash
cd frontend
npm install
```

#### 4.2. Configurar Variáveis de Ambiente
Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

#### 4.3. Iniciar o Servidor Frontend
```bash
npm start
```

O frontend será executado na porta 3000: `http://localhost:3000`

## 👥 Usuários de Teste

O sistema vem com usuários pré-configurados para teste:

### Administrador
- **Email:** `admin@lavajato.com`
- **Senha:** `admin123`

### Funcionário
- **Email:** `funcionario@lavajato.com`
- **Senha:** `func123`

## 🎨 Design e Interface

- **Gradiente de fundo:** #141525 → #191820
- **Tipografia:** Inter e Roboto via Google Fonts
- **Design responsivo** e moderno
- **Animações sutis** com Tailwind CSS
- **Tema escuro** otimizado para uso profissional

## 📊 Funcionalidades dos Gráficos

### Dashboard Admin
- **Gráfico de Receita:** Evolução da receita ao longo do tempo
- **Gráfico de Serviços:** Distribuição de tipos de serviços
- **Cards de Estatísticas:** KPIs principais em tempo real
- **Filtros de Período:** Dia, semana, mês ou total

## 🔒 Segurança Implementada

- **JWT** para autenticação stateless
- **bcrypt** para hash de senhas com salt
- **Queries parametrizadas** para prevenção de SQL injection
- **Middleware de autorização** baseado em roles
- **CORS** configurado adequadamente
- **Helmet** para headers de segurança
- **Controle de exclusão** para auditoria ("Caixa 2")

## 📝 Estrutura de Arquivos

```
/
├── backend/
│   ├── db/
│   │   ├── database.js      # Configuração do PostgreSQL
│   │   └── schema.sql       # Esquema do banco de dados
│   ├── middleware/
│   │   └── auth.js          # Middleware de autenticação JWT
│   ├── routes/
│   │   ├── auth.js          # Rotas de autenticação
│   │   ├── users.js         # Gestão de usuários
│   │   ├── clientes.js      # Gestão de clientes
│   │   ├── servicos.js      # Gestão de serviços
│   │   ├── dashboard.js     # Dados do dashboard
│   │   └── exclusao.js      # Controle de exclusões
│   ├── .env.example         # Exemplo de variáveis de ambiente
│   ├── package.json
│   └── server.js            # Servidor principal
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout/      # Componentes de layout
│   │   │   └── Charts/      # Componentes de gráficos
│   │   ├── pages/           # Páginas da aplicação
│   │   ├── context/         # Context API (Auth)
│   │   └── utils/           # Utilitários (API, Auth)
│   ├── public/
│   ├── .env.example
│   ├── package.json
│   └── tailwind.config.js   # Configuração do Tailwind CSS
└── README.md
```

## 🔧 Scripts Disponíveis

### Backend
```bash
npm start          # Iniciar servidor de produção
npm run dev        # Iniciar servidor de desenvolvimento (com nodemon)
```

### Frontend
```bash
npm start          # Iniciar servidor de desenvolvimento
npm run build      # Criar build de produção
npm test           # Executar testes
```

## 🚀 Deploy em Produção

### Backend
1. Configure as variáveis de ambiente de produção
2. Configure um banco PostgreSQL em produção
3. Execute `npm start` na porta 88
4. Configure proxy reverso (nginx/apache) se necessário

### Frontend
1. Execute `npm run build` para criar o build otimizado
2. Sirva os arquivos estáticos da pasta `build/`
3. Configure o `REACT_APP_API_URL` para apontar para o backend em produção

## 📞 Suporte

Para suporte ou dúvidas sobre o sistema, entre em contato através dos canais apropriados da empresa.

## 📄 Licença

Este projeto é propriedade privada e não deve ser distribuído sem autorização.