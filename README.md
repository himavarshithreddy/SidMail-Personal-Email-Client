# SidMail - Custom IMAP/SMTP Webmail Client

A modern, secure webmail client built with Next.js and Express for custom IMAP and SMTP servers.

## Features

- ✅ Custom IMAP/SMTP server support
- ✅ Modern, glassy dark UI with Tailwind CSS
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Secure authentication with encrypted credentials
- ✅ Full email management (read, compose, delete, flag)
- ✅ HTML email rendering with sanitization
- ✅ Attachment support with download
- ✅ Keyboard shortcuts (C=compose, R=refresh, J/K=navigate, ?=help)
- ✅ Loading states and error boundaries
- ✅ Session persistence with cookies
- ✅ Rate limiting and security headers
- ✅ Email validation (CC/BCC support)
- ✅ Performance optimized (React.memo, lazy loading)

## Tech Stack

### Frontend
- **Next.js 16** (App Router, JavaScript)
- **Tailwind CSS 4** (glassy dark theme)
- **React hooks** for state management

### Backend
- **Express** (Node.js server)
- **ImapFlow** (IMAP client)
- **Nodemailer** (SMTP client)
- **SQLite** via sql.js (session storage)
- **JWT** (authentication)
- **Helmet** & **CORS** (security)

## Getting Started

### Prerequisites

- Node.js 20+ LTS
- pnpm (or npm)
- Docker (optional, for dev mail servers)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd SidMail
```

2. Install dependencies:
```bash
pnpm install
```

3. Configure environment variables:

**Backend (`apps/api/.env`):**
```env
JWT_SECRET=your_jwt_secret_here
APP_ENC_KEY=your_encryption_key_here
DATABASE_URL=file:./data/app.db
API_PORT=4000
CORS_ORIGIN=http://localhost:3000
COOKIE_SECURE=false

# Optional: Default IMAP/SMTP settings
IMAP_HOST=
IMAP_PORT=993
IMAP_SECURE=true
SMTP_HOST=
SMTP_PORT=465
SMTP_SECURE=true
```

**Frontend (`apps/web/.env.local`):**
```env
NEXT_PUBLIC_API_BASE=http://localhost:4000
```

4. Generate secrets:
```bash
# JWT Secret (32-byte hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Encryption Key (32-byte base64)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Development

1. Start the dev mail servers (optional):
```bash
docker compose -f docker-compose.dev.yml up -d
```

2. Start the backend:
```bash
pnpm dev:api
```

3. Start the frontend (in another terminal):
```bash
pnpm dev:web
```

4. Open http://localhost:3000

### Keyboard Shortcuts

SidMail includes keyboard shortcuts for efficient navigation:

- **C** - Compose new message
- **R** - Refresh message list  
- **J** - Navigate to next message
- **K** - Navigate to previous message
- **ESC** - Close modal/compose window
- **?** - Show keyboard shortcuts help

Press **?** in the app to see the shortcuts reference.

### Testing with Dev Mail Servers

The included docker-compose provides:
- **Greenmail** (IMAP/SMTP): 
  - IMAP: localhost:3143 (plaintext)
  - SMTP: localhost:3025 (plaintext)
  - Test user: `test` / `pass`
- **Mailpit** (SMTP sink with web UI):
  - SMTP: localhost:1025
  - Web UI: http://localhost:18025

## Using with Real Mail Servers

### Gmail (with App Password)
```
Email: your.email@gmail.com
Password: <16-char app password>
IMAP: imap.gmail.com:993 (secure)
SMTP: smtp.gmail.com:465 (secure)
```

### Outlook/Office 365
```
Email: your.email@outlook.com
Password: <your password>
IMAP: outlook.office365.com:993 (secure)
SMTP: smtp.office365.com:587 (secure)
```

### Custom cPanel/Hosting
```
Email: your@yourdomain.com
Password: <email password>
IMAP: mail.yourdomain.com:993 (secure)
SMTP: mail.yourdomain.com:465 (secure)
```

## Production Deployment

### Build

```bash
# Build frontend
pnpm build:web

# Start production servers
pnpm start:api
pnpm start:web
```

### Environment Configuration

**Production settings:**
- Set `NODE_ENV=production`
- Set `COOKIE_SECURE=true` (requires HTTPS)
- Use strong, unique secrets
- Configure proper CORS origin
- Use a reverse proxy (Nginx/Caddy) for TLS

### Recommended Setup

```
[Internet] → [Nginx/Caddy with TLS]
                ├─→ Frontend (Next.js) :3000
                └─→ Backend (Express) :4000
```

## Project Structure

```
SidMail/
├── apps/
│   ├── api/              # Express backend
│   │   ├── src/
│   │   │   ├── config.js
│   │   │   ├── server.js
│   │   │   ├── auth.js
│   │   │   ├── db.js
│   │   │   ├── crypto.js
│   │   │   ├── services/
│   │   │   │   ├── imap.js
│   │   │   │   └── smtp.js
│   │   │   └── utils/
│   │   └── tests/
│   │
│   └── web/              # Next.js frontend
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.jsx
│       │   │   ├── page.jsx
│       │   │   └── globals.css
│       │   ├── components/
│       │   │   ├── ui/
│       │   │   ├── LoginForm.jsx
│       │   │   ├── FolderList.jsx
│       │   │   ├── MessageList.jsx
│       │   │   ├── MessageDetail.jsx
│       │   │   └── ComposeModal.jsx
│       │   ├── hooks/
│       │   │   ├── useAuth.js
│       │   │   └── useMail.js
│       │   └── lib/
│       │       ├── api.js
│       │       └── validation.js
│       └── public/
│
├── data/                 # SQLite database
├── docker-compose.dev.yml
├── pnpm-workspace.yaml
└── package.json
```

## Security Considerations

- Credentials are encrypted at rest using AES-256-GCM
- JWT tokens for session management
- HttpOnly, Secure, SameSite cookies
- Rate limiting on auth and send endpoints
- CORS protection
- Helmet security headers
- Input validation with Zod
- HTML sanitization for email bodies

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

