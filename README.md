# Team Luca – Baby Tracker

A gamified baby preparation and tracking app for Johnathan & Jordyn. Turn your baby prep checklist into a fun competition with points, badges, and milestones.

## Features

- **Gamification**: Johnathan vs Jordyn leaderboard with 5-tier points (5/10/25/50/100)
- **74 Pre-loaded Tasks**: All tasks from your Baby Checklist.xlsx with automatic point assignment
- **Full CRUD**: Add, edit, delete tasks, shopping items, and goals
- **Claim & Complete**: Tasks can be claimed before completing for tracking
- **Achievement Badges**: Unlock badges like "Nursery Ninja", "Hospital Bag Hero", "Diaper Dynamo"
- **Streak Bonuses**: +5 pts for 3-day completion streaks
- **Team Milestones**: Confetti celebrations at 100, 250, 500, 750, 1000 combined points
- **LocalStorage Persistence**: Data survives page refresh
- **Beautiful UI**: Modern elegant baby theme with Nunito font, soft cream + sage palette
- **Mobile-First**: Responsive design with large touch targets and bottom navigation

## Tech Stack

- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** for styling
- **Zustand** for state management with localStorage persistence
- **Lucide React** for icons
- **canvas-confetti** for celebrations

## Quick Start

### Development

```bash
cd babytracker
npm install
npm run dev
```

Open http://localhost:5173

### Build

```bash
npm run build
npm run preview
```

## Deployment

### Push to GitHub

From your local machine (not in the sandbox):

```bash
cd "c:\Users\jonat\Baby tracker\babytracker"
git push -u origin main
```

When prompted for password, use a [GitHub Personal Access Token](https://github.com/settings/tokens/new) with `repo` scope checked.

### Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Select **"Import Git Repository"**
4. Choose `jsorisho715/babytracker`
5. Click **"Deploy"**

Vercel will auto-deploy on every push to `main`.

## Data

All 74 tasks from Baby Checklist.xlsx are pre-loaded with:

- **Categories**: Nursery, Baby Clothing, Feeding/Bottle Area, Diapering, Postpartum Recovery, Medical/Birth, Car/Leaving Hospital, Hospital Prep, Admin/Orders, House/Organization, Body Prep, Final Prep, After Baby
- **Automatic Point Assignment**: Based on Priority (High/Medium/Low) + Timing (ASAP/Week 35/Daily)
- **Status Tracking**: Claim tasks before completing, track who did what

## Future Phases

- **Phase 4**: Post-birth baby tracker (feeds, sleep, diapers logs)
- **Phase 5**: Streaks, advanced badges, export, reminders, multi-user sync

## License

Built with 💚 for Team Luca
