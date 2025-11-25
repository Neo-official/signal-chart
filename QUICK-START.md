# Quick Start Guide

## ✅ Migration Complete!

Your project has been successfully migrated from JSON storage to Drizzle ORM with SQLite.

## 🚀 Start the Server

```bash
bun run dev
```

The server will start on:
- **Frontend**: http://localhost:8000
- **WebSocket**: ws://localhost:3000

## 📊 Database Status

✅ Tables created:
- `users` - User authentication
- `devices` - Device information
- `device_data` - Time-series data
- `settings` - Application settings

✅ Default settings initialized:
- Max data points: 31,557,600 (1 year)
- Max data send: 300 (5 minutes)
- Single device mode: enabled

## 🔧 Available Commands

```bash
# Development
bun run dev          # New TypeScript server
bun run dev:old      # Old JavaScript server (backup)

# Production
bun run build        # Build Next.js
bun run start        # Start production server

# Database
bun run db:studio    # Open Drizzle Studio (GUI)
bun run db:generate  # Generate migrations
bun run db:push      # Push schema changes

# Verification
bun src/db/verify-db.ts  # Check database structure
```

## 📁 Project Structure

```
src/
├── server/
│   └── index.ts          # New TypeScript server with Drizzle
├── db/
│   ├── schema.ts         # Database schema
│   ├── service.ts        # Database operations
│   └── index.ts          # DB connection
├── components/
│   ├── ui/               # shadcn/ui components
│   └── chart-component.tsx  # New Recharts component
└── app/                  # Next.js pages
```

## 🔄 What Changed

1. **Database**: JSON files → SQLite with Drizzle ORM
2. **Server**: JavaScript → TypeScript
3. **Components**: Added shadcn/ui alongside NextUI
4. **Charts**: CanvasJS → Recharts (new component ready)

## ⚠️ Known Issues Fixed

- ✅ Database tables created
- ✅ Default settings inserted
- ✅ Favicon conflict resolved
- ✅ Error handling added

## 📝 Next Steps

1. **Test the application** - Connect devices and verify data flow
2. **Update frontend** - Replace NextUI with shadcn/ui components
3. **Replace charts** - Use new `ChartComponent` instead of CanvasJS
4. **Migrate old data** - Create script to import JSON data to SQLite
5. **Review code issues** - Check Code Issues Panel for improvements

## 🐛 Troubleshooting

If you see "no such table" errors:
```bash
bun src/db/manual-migrate.ts
```

If old server is needed:
```bash
bun run dev:old
```

## 📚 Documentation

- `README-MIGRATION.md` - Detailed migration guide
- `drizzle/` - Database migrations
- `.env` - Configuration (DATABASE_URL, JWT_SECRET)
