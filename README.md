

PROJECT DETAILS
- Name: AI Loan Eligibility Checker
- Description: An AI-powered BFSI (Banking, Financial Services & Insurance) web platform for Indian users that simplifies and speeds up personal financial decision-making. All amounts are in Indian Rupees (₹ INR) only.
- Four core tools in one seamless interface:
  1. Loan Eligibility Checker: eligibility score, maximum eligible amount, suggested interest range, risk level, strengths and recommendations
  2. Credit Score Analyzer: CIBIL-style (300-900) analysis with gauge chart, factor breakdown and improvement steps
  3. EMI Calculator: instant EMI, total interest, donut chart, year-wise amortization table and AI suggestions
  4. AI Financial Tips: personalized tips, 50/30/20 budget in ₹, savings target and Indian investment ideas (PPF, ELSS, SIP, FD, NPS)
- Extra: History tab, with user data stored via Google Sheets (localStorage fallback)
- Tech stack: HTML5, CSS3 (animations), JavaScript, Claude API (Anthropic), Google Sheets via Google Apps Script
- Design: dark glassmorphism UI, fully responsive
- Live demo link: https://ai-loan-eligibility-checker.ai.studio
- Author: vaishnavi vijay naikwade

README STRUCTURE (use these sections with relevant emojis and clean markdown)
1. Title with badges (HTML5, CSS3, JavaScript, Claude API, Google Sheets, License MIT)
2. Short overview and a "Live Demo" link
3. Screenshots section with placeholders like ![Home](screenshots/home.png)
4. Features (bullet list per tool)
5. Tech stack (table)
6. Architecture (a short text flow: User Input → Frontend (HTML/CSS/JS) → Claude API → JSON result → UI + Google Sheets storage)
7. Project structure (file tree with index.html, style.css, script.js, apps-script/Code.gs, screenshots/, README.md)
8. Getting started: prerequisites, clone command, adding CLAUDE_API_KEY and SHEETS_WEBAPP_URL (via the Settings modal), running locally
9. Google Sheets setup: step-by-step for creating the Apps Script web app and getting the URL
10. Deployment: GitHub Pages steps (also mention Netlify)
11. How it works: the EMI formula EMI = P × r × (1+r)^n / ((1+r)^n − 1)
12. Security note: never commit real API keys; use a backend or serverless proxy for production
13. Future improvements (PDF export, multi-language support, bank comparison, login)
14. Disclaimer: AI-generated estimates for educational purposes only, not financial advice
15. Author and contact section, and License (MIT)

RULES
- Keep the tone professional, clear and beginner-friendly.
- Use ₹ in all examples; never use $.
- Output only the final README.md content inside one markdown code block, ready to copy and paste.
