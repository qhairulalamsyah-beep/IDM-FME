---
Task ID: 1
Agent: Main
Task: Implement IDM-FME (IDOL META TARKAM Fan Made Edition) Esports Tournament Platform as PWA

Work Log:
- Cloned the repository https://github.com/qhairulalamsyah-beep/IDM-FME
- Analyzed the full project structure: Next.js + Prisma + Tailwind CSS + shadcn/ui
- Copied Prisma schema with 14 models (User, Tournament, Registration, Team, Match, Ranking, Donation, Sawer, Club, Settings, ActivityLog, PlayerMatchStat, BotLog, WhatsAppSettings)
- Copied all 30+ API routes (tournaments, users, matches, teams, donations, sawer, admin, bots, clubs, etc.)
- Copied all 25 esports components (Navigation, Dashboard, Tournament, Bracket, Leaderboard, GrandFinal, AdminPanel, LiveChat, etc.)
- Copied PWA components (ServiceWorkerRegistration, PWAInstallPrompt)
- Copied effects components (ParticleField/GradientBackground)
- Copied all public assets (manifest.json, sw.js, 15+ icon sizes, IDM logo, 26 avatar images)
- Installed 73 additional dependencies (dnd-kit, qrcode.react, react-markdown, recharts, pusher, socket.io, etc.)
- Pushed database schema to SQLite
- Fixed lint errors (setState in effect, unused eslint-disable directives)
- Verified all API routes return 200 and app compiles successfully

Stage Summary:
- Full IDM-FME esports tournament platform successfully ported
- PWA configured with manifest.json, service worker, and iOS-specific meta tags
- Dark theme with gold/pink accent colors for male/female divisions
- Features: tournament management, bracket system, leaderboard, donations, sawer, live chat, admin panel, WhatsApp bot integration
- App running on dev server at port 3000, all routes functional
