# Instalação no notebook da loja

Este sistema roda **na máquina do balcão**, não na nuvem. A razão é simples:
internet caindo não pode impedir a loja de vender. O banco é um arquivo no
próprio notebook, e a venda acontece mesmo com o roteador desligado.

## 1. O que precisa ter na máquina

- **Node.js 20 ou mais novo** — [nodejs.org](https://nodejs.org) (baixe a
  versão LTS e instale com as opções padrão)
- **Git** — para receber atualizações

Confira no terminal:

```bash
node --version
```

## 2. Instalação, uma vez só

```bash
git clone https://github.com/LucasPastorizzi/CapivarasBeer-Project.git
cd CapivarasBeer-Project
npm install
```

Crie o arquivo de configuração:

```bash
cp .env.example .env
```

Abra o `.env` e defina, no mínimo:

```
DATABASE_URL="file:./prisma/dev.db"
SESSION_SECRET="cole-aqui-o-resultado-do-comando-abaixo"
```

Gere o segredo com:

```bash
openssl rand -base64 32
```

Prepare o banco e o catálogo inicial:

```bash
npx prisma migrate deploy
npm run db:seed
```

**Troque as senhas antes de usar de verdade.** As do seed estão escritas no
código, que é público.

## 3. Ligar o sistema

```bash
npm run producao
```

O sistema sobe em **http://localhost:3000**.

Como ele escuta em toda a rede, o celular do dono conectado no Wi-Fi da loja
também abre — descubra o endereço da máquina:

```bash
ipconfig getifaddr en0     # macOS
hostname -I                # Linux
ipconfig                   # Windows, procure "Endereço IPv4"
```

E acesse `http://ESSE-IP:3000` do celular. Serve para conferir o caixa de
qualquer canto da loja sem ocupar o computador do balcão.

> Qualquer pessoa no mesmo Wi-Fi alcança a tela de entrada. Ela pede senha,
> mas isso é mais uma razão para não deixar a senha do seed.

## 4. Ligar sozinho quando o computador liga

Ninguém deve precisar lembrar de abrir o terminal antes de abrir a loja.

### macOS

Crie `~/Library/LaunchAgents/com.flypi.capivaras.plist` com este conteúdo,
trocando `SEU-USUARIO`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>com.flypi.capivaras</string>
  <key>WorkingDirectory</key><string>/Users/SEU-USUARIO/CapivarasBeer-Project</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string><string>-lc</string><string>npm run producao</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>/tmp/capivaras.log</string>
  <key>StandardErrorPath</key><string>/tmp/capivaras-erro.log</string>
</dict>
</plist>
```

Ative:

```bash
launchctl load ~/Library/LaunchAgents/com.flypi.capivaras.plist
```

### Windows

O caminho mais simples é o **PM2**:

```bash
npm install -g pm2 pm2-windows-startup
pm2 start npm --name capivaras -- run producao
pm2 save
pm2-startup install
```

### Linux

Crie `/etc/systemd/system/capivaras.service`:

```ini
[Unit]
Description=Capivaras Beer
After=network.target

[Service]
WorkingDirectory=/home/SEU-USUARIO/CapivarasBeer-Project
ExecStart=/usr/bin/npm run producao
Restart=always
User=SEU-USUARIO

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now capivaras
```

## 5. Backup — a parte que ninguém lembra até precisar

O banco inteiro é **um arquivo**. Perder esse arquivo é perder todas as vendas,
todo o estoque e todo o histórico. Não existe cópia na nuvem para socorrer.

```bash
npm run backup
```

O script não copia o arquivo com `cp`: usa a API de backup do SQLite, que sabe
copiar um banco em uso sem corromper. Depois **abre a cópia e verifica a
integridade** antes de dar OK. Backup que ninguém testou não é backup.

Guarda as 30 cópias mais recentes em `backups/` e apaga as antigas sozinho.

### Rodar todo dia, sem depender de memória

**macOS e Linux** — `crontab -e` e acrescente (todo dia às 2h):

```
0 2 * * * cd ~/CapivarasBeer-Project && /usr/local/bin/npm run backup >> /tmp/capivaras-backup.log 2>&1
```

**Windows** — Agendador de Tarefas, tarefa diária executando
`npm run backup` na pasta do projeto.

### Uma cópia fora do notebook

Backup no mesmo disco não protege de disco queimado nem de notebook roubado.
Aponte a pasta `backups/` para um pendrive, um HD externo ou uma pasta do
Google Drive/OneDrive:

```
BACKUP_DIR="/Volumes/PENDRIVE/capivaras"
```

### Restaurar

Pare o sistema, troque o arquivo e suba de novo:

```bash
cp backups/capivaras_2026-08-31_0200.db prisma/dev.db
npm run producao
```

## 6. Atualizar

```bash
git pull
npm install
npx prisma migrate deploy
npm run producao
```

**Depois de toda migração, reinicie o sistema.** O Prisma gera o cliente no
`npm install`, e um processo que já estava rodando continua com o cliente
antigo — campos novos chegam vazios e cálculos silenciosamente erram.

## 7. Sobre a Vercel

O endereço na Vercel **não guarda dados**. Lá o disco é somente-leitura e
efêmero: o banco não existe, ninguém consegue entrar, e se conseguisse, cada
venda sumiria no próximo deploy.

Ele serve como vitrine para mostrar o sistema. A loja de verdade roda aqui, no
balcão.
