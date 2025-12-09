# SidMail

My personal webmail client for managing email accounts via IMAP/SMTP. Built for privacy and control over my email workflow.

## What It Does

A modern webmail interface that connects to any IMAP/SMTP server. Supports multiple accounts, full email management, and a clean dark UI. All credentials are encrypted and stored locally.

## Tech Stack

**Frontend:**
- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4
- TipTap for rich text editing

**Backend:**
- Express.js API server
- ImapFlow for IMAP
- Nodemailer for SMTP
- SQLite (via sql.js) for local storage
- JWT for session management

## Features

- ✅ Multiple account support
- ✅ Full email management (read, compose, delete, flag, spam)
- ✅ Rich text editor with formatting
- ✅ Attachment support
- ✅ HTML email rendering (sanitized)
- ✅ Responsive design
- ✅ Encrypted credential storage
- ✅ Session persistence

## Security

- Credentials encrypted with AES-256-GCM
- JWT tokens for sessions
- HttpOnly, Secure, SameSite cookies
- Rate limiting on auth/send endpoints
- CORS protection
- Helmet security headers
- Input validation with Zod
- HTML sanitization for email bodies

## Troubleshooting

**Can't connect to email server:**
- Check IMAP/SMTP settings
- Verify credentials
- Check firewall/network settings
- For Gmail, ensure "Less secure app access" is enabled or use App Password

**Session expires:**
- Sessions last 30 days, just re-login
- Check cookie settings if using HTTPS

**Database issues:**
- Database is in `apps/api/data/app.db`
- Delete the file to reset (loses all accounts)

## License

MIT License - See [LICENSE](LICENSE) file for details.

