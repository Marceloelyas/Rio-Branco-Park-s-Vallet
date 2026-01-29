# Rio-Branco-Park-s-Vallet - Sistema de Gerenciamento de Estacionamento

## 📋 Sobre o Projeto

O **Rio Park Vallet** é um sistema web completo para gerenciamento de estacionamentos vallet. Desenvolvido como uma Progressive Web App (PWA), ele funciona tanto online quanto offline e pode ser instalado como um aplicativo nativo em dispositivos móveis e desktops.

## ✨ Funcionalidades

### 🚗 Gerenciamento de Estacionamento

- Controle de vagas em tempo real
- Registro de entrada e saída de veículos
- Cálculo automático de valores
- Suporte a vagas PCD
- Status por cor (disponível/ocupado/reservado)

### 👥 Gerenciamento de Clientes

- Cadastro de clientes
- Histórico de veículos
- Informações de contato
- Fidelização

### 📊 Dashboard Inteligente

- Estatísticas em tempo real
- Gráficos de ocupação e faturamento
- Atividades recentes
- KPIs importantes

### 📈 Relatórios

- Relatórios diários, semanais e mensais
- Exportação de dados (HTML/JSON)
- Análise de faturamento
- Detalhamento por período

### ⚙️ Configurações

- Personalização de preços
- Configuração de vagas
- Gerenciamento de usuários
- Sistema de backup e restauração

### 🔐 Segurança

- Sistema de autenticação
- Controle por perfil de usuário
- Dados armazenados localmente
- Criptografia básica

## 🚀 Tecnologias Utilizadas

- **HTML5** - Estrutura semântica
- **CSS3** - Estilização moderna com Flexbox/Grid
- **JavaScript (ES6+)** - Lógica da aplicação
- **Chart.js** - Gráficos e visualizações
- **Service Workers** - Funcionalidade offline
- **Web App Manifest** - Instalação como PWA
- **LocalStorage** - Armazenamento local

## 📁 Estrutura do Projeto

rio-branco-park-vallet/
├── index.html          # Página principal do sistema
├── login.html          # Página de login
├── manifest.json       # Configuração do PWA
├── service-worker.js   # Service Worker para offline
├── css/
│ ├── style.css         # Estilos principais
│ ├── auth.css          # Estilos da autenticação
│ └── responsive.css    # Estilos responsivos
├── js/
│ ├── app.js            # Lógica principal da aplicação
│ ├── auth.js           # Sistema de autenticação
│ ├── charts.js         # Configuração dos gráficos
│ ├── pwa.js            # Funcionalidades PWA
│ ├── reports.js        # Geração de relatórios
│ └── init.js           # Inicialização do sistema
├── icons/              # Ícones para PWA (opcional)
│ ├── apple-touch-icon.png
| ├── logo.svg
│ └── favicon.ico
└── README.md           # Documentação

## 🛠️ Instalação e Configuração

### Pré-requisitos

- Navegador moderno (Chrome 70+, Firefox 65+, Safari 12+)
- Servidor web para desenvolvimento (Apache, Nginx, ou Live Server do VSCode)

### Passos para Instalação

1. **Clone ou baixe o projeto:**

  git clone https://github.com/Marceloelyas/rio-park-vallet.git

## Instale em um servidor web:

1. Coloque todos os arquivos na pasta raiz do seu servidor web

2. Configure os ícones (opcional):

3. Adicione os ícones nas dimensões corretas na pasta icons/

4. Gere ícones usando ferramentas como RealFaviconGenerator

# Acesse o sistema:

1. Abra login.html no navegador

2. Use as credenciais padrão:

3. Usuário: *admin*

4. Senha: *admin123*

## 📱 Instalação como PWA

# No Desktop (Chrome/Edge):

Acesse o sistema no navegador

Clique no ícone de instalação (canto superior direito)

Siga as instruções para instalar

# No Mobile (Android/Chrome):

Acesse o sistema no Chrome

No menu, selecione "Adicionar à tela inicial"

Confirme a instalação

# No Mobile (iOS/Safari):

Acesse o sistema no Safari

Clique no ícone de compartilhar

Selecione "Adicionar à tela inicial"

## 👥 Usuários Padrão

O sistema vem pré-configurado com dois usuários:

**Administrador**

Usuário: **admin**

Senha: **admin123**

Permissões: Total

Operador

Usuário: operador

Senha: operador123

Permissões: Operacionais

## 💾 Backup e Restauração

Criar Backup:

Vá para Configurações > Sistema

Clique em "Fazer Backup"

Um arquivo JSON será baixado

Restaurar Backup:

Arraste o arquivo de backup para a tela do sistema

Ou use a opção de restauração nas Configurações

## ⌨️ Atalhos do Teclado

Alt + D - Dashboard

Alt + E - Estacionamento

Alt + C - Clientes

Alt + L - Logout

Escape - Fecha modais

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🐛 Reportar Problemas

Encontrou um bug ou tem uma sugestão? Por favor, abra uma issue.

## 🤝 Contribuindo

Faça um Fork do projeto

Crie uma branch para sua feature (git checkout -b feature/AmazingFeature)

Commit suas mudanças (git commit -m 'Add some AmazingFeature')

Push para a branch (git push origin feature/AmazingFeature)

Abra um Pull Request

## 📞 Suporte

Para suporte, entre em contato:

Email: suporte@rioparkvallet.com

Telefone: (11) 99999-9999

Site: www.riobrancoparkvallet.com.br

Versão: 1.0.0
Última Atualização: ${new Date().toLocaleDateString('pt-BR')}
Desenvolvido por: Sayle Tecnologia.

## 15. `package.json` (Opcional para desenvolvimento)

{
  "name": "rio-park-vallet",
  "version": "1.0.0",
  "description": "Sistema de gerenciamento de estacionamento vallet",
  "main": "index.html",
  "scripts": {
    "start": "live-server --port=8080 --host=localhost",
    "build": "echo 'Build não necessário para projeto estático'",
    "test": "echo 'Testes não configurados'",
    "deploy": "echo 'Configure seu comando de deploy'"
  },
  "keywords": [
    "parking",
    "vallet",
    "management",
    "pwa",
    "javascript",
    "css",
    "html"
  ],
  "author": "Rio Park Vallet Team",
  "license": "MIT",
  "devDependencies": {
    "live-server": "^1.2.2"
  }
}

## Instruções Adicionais:

# Para criar os ícones PWA (opcional):

1. Crie imagens de 192x192 e 512x512 pixels

2. Salve-as como icon-192.png e icon-512.png

3. Coloque na pasta icons/

# Para executar em desenvolvimento:

1. Instale Node.js

2. Instale o live-server: npm install -g live-server

3. Execute: live-server --port=8080

## Características do Sistema:

# 1. Totalmente Responsivo - Funciona em dispositivos móveis, tablets e desktops

# 2. Funciona Offline - Dados são armazenados localmente

# 3. Instalável - Pode ser instalado como um app nativo

# 4. Seguro - Sistema de autenticação com diferentes perfis

# 5. Robusto - Backup e restauração de dados

# 6. Intuitivo - Interface moderna e fácil de usar

## Próximos Passos para Produção:

1. Configure um servidor HTTPS

2. Atualize as URLs no service-worker.js

3. Personalize as cores e logo

4. Configure os preços padrão

5. Adicione mais usuários se necessário

**O sistema está completamente funcional e pronto para uso!**
