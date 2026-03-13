# MedConnect Doctor-Patient Portal

Government medical services portal with a React frontend and a Node + MongoDB backend.

## Structure
- `index.html` Vite entry point
- `src/` React app (pages, components, utils)
- `server.js` Node API server
- `vite.config.js` Vite config

## Setup
1. Install dependencies
   - `npm install`
2. Set MongoDB connection
   - `MONGODB_URI=mongodb://localhost:27017`
3. Start servers
   - API: `npm run server`
   - UI: `npm run dev`

## Build
- `npm run build`
- Production server serves `dist/` automatically via `server.js`

## Mock Accounts
Default password for mock accounts: `Welcome123!`

Doctors:
- `doctor@test.com`
- `priya.nair@medconnect.gov`
- `miguel.alvarez@medconnect.gov`
- `hannah.lee@medconnect.gov`
- `omar.siddiqui@medconnect.gov`
- `sofia.chen@medconnect.gov`
- `nathan.brooks@medconnect.gov`
- `aisha.rahman@medconnect.gov`
- `kavita.rao@medconnect.gov`
- `ethan.miller@medconnect.gov`
- `layla.hassan@medconnect.gov`
- `victor.petrov@medconnect.gov`
- `grace.kim@medconnect.gov`

Patients:
- `alex@test.com`
- `maya.patel@patient.gov`
- `jordan.lee@patient.gov`
- `chris.ramirez@patient.gov`
- `lila.cohen@patient.gov`
- `arjun.mehta@patient.gov`
- `sophia.nguyen@patient.gov`
- `rohan.das@patient.gov`
- `neha.singh@patient.gov`
- `fatima.noor@patient.gov`
- `daniel.wright@patient.gov`
- `priyanka.iyer@patient.gov`
- `marco.silva@patient.gov`

## Notes
- Mock data is seeded on server start if not present.
