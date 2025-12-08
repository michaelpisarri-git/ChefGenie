<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app (ChefGenie)

This repository contains a Vite + React TypeScript front-end and Netlify Functions serverless endpoint to safely call Google Generative APIs.

## Run Locally (with Netlify Functions)

Prerequisites: Node.js >= 20

1. Install dependencies:
   npm install

2. Create a `.env.local` file in the project root and add your Gemini API key (do NOT commit this file):
   GEMINI_API_KEY=your_gemini_api_key_here

3. Start the dev server and Netlify functions locally using Netlify CLI (recommended):
   npm install -g netlify-cli
   netlify dev

The dev environment will serve the front-end and forward function requests to `/.netlify/functions/generate`.

## Deploy to Netlify

1. Push this repository to GitHub.
2. In the Netlify dashboard, create a new site from GitHub and pick this repo.
3. Set the following build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`
4. Add an environment variable in Netlify settings:
   - Key: `GEMINI_API_KEY`
   - Value: (your API key)
5. Deploy the site. The front-end will call the serverless endpoint at `/.netlify/functions/generate` which keeps your API key secret.

## Important security notes
- Never put GEMINI_API_KEY into client-side envs (e.g. VITE_*). Keep it server-side only (Netlify environment or `.env.local` for local dev).
- Consider rate-limiting or authentication on the function to avoid abuse and unexpected costs.

## What I prepared
- netlify/functions/generate.js — serverless function to proxy requests to Google Generative API (uses GEMINI_API_KEY from environment).
- netlify.toml — Netlify build/dev configuration (publish dir = dist, functions dir = netlify/functions).
- .env.example — example env file.
- services/generate.ts — client helper that calls the Netlify function endpoint.

## Next steps (local verification)
- Run `npm run build` locally to ensure TypeScript compiles cleanly; fix any tsc errors if they appear.
- Run `netlify dev` and verify a POST to `/.netlify/functions/generate` with a JSON body { "prompt": "..." } returns a valid result.
