# Studio Berean MVP

Local MVP to generate practical Bible workbooks and worksheets using the BEREAN API.

## Features

- Student and Teacher modes with different workflow depth.
- Didactic structure: quick read, guided questions, activity, reflection, micro-challenge, review.
- Teacher advanced builder:
  - workbook type and timeframe (session / weeks / months)
  - prior studies, books to use, reinforcement topics
  - annotations and improvement focus
- Progress checklist + progress bar for each session.
- Pre-made workbook library by audience group (teens, kids, women, men, husbands, wives).
- Clear BEREAN transparency panel (source count, collections, model, runtime).
- Generation trace panel with prompts sent to BEREAN and answer previews.
- Role-based quality panel (Professor, Student, Interested, Critic) with score and feedback.
- Direct link for individual questions to `https://berean.ai`.
- Export to Markdown, HTML, and PDF (browser print).
- In-memory cache (12h) to reduce API calls.
- Automatic fallback mode when BEREAN is unavailable or rate-limited.
- Light and dark themes.

## Run Locally

```bash
npm install
npm start
```

Open: `http://localhost:4173`

## Run with Docker

### Docker CLI

```bash
docker build -t studio-berean .
docker run --rm -p 4173:4173 studio-berean
```

### Docker Compose

```bash
docker compose up --build
```

Open: `http://localhost:4173`

## Scripts

```bash
npm test
npm run audit
```

## Operational Notes

- BEREAN rate limit: `20 requests/day/IP`.
- If the limit is reached, the app switches to fallback generation mode and returns a warning while keeping workbook output available.

## Project Structure

- `src/server.js`: Express server + `/api/generate`
- `src/bereanClient.js`: BEREAN REST client
- `src/workbookEngine.js`: workbook structure and markdown output
- `public/`: web UI
- `test/`: basic tests
- `scripts/audit.js`: minimum quality checks
