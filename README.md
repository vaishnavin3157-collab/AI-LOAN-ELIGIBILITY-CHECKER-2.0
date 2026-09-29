# AI Loan Eligibility Checker & Indian BFSI Financial Suite

A production-grade, single-page Banking, Financial Services & Insurance (BFSI) web platform designed specifically for **Indian borrowers and financial decision-makers**. Built with vanilla HTML5, modern CSS3 animations, and vanilla JavaScript with dark glassmorphism aesthetic, powered by Anthropic's Claude API (`claude-sonnet-4-5`) and dual-mode storage via Google Sheets (Google Apps Script) and browser `localStorage`.

All currency amounts are strictly calculated, displayed, and formatted in **Indian Rupees (INR, symbol ₹)** using the Indian numbering system (`Lakh` and `Crore`).

---

## 🌟 Key Features (Tailored for India)

1. **Loan Eligibility Underwriter**
   - **Comprehensive Underwriting Inputs**: Full name, age, employment type, monthly take-home income (₹), existing monthly EMIs (₹), CIBIL score (300-900), loan type (Home, Personal, Auto, Education, Gold, MSME), requested loan amount (₹), tenure (years), and city.
   - **Indian Banking Metrics**: Evaluates Fixed Obligation to Income Ratio (FOIR, typically 40-50% threshold under RBI rules), CIBIL bureau tiers, and repo-linked lending rates (RLLR).
   - **Visual Outputs**: Animated score ring (0-100), risk status badge (`Low`, `Medium`, `High`), maximum eligible loan power in ₹ and Lakh/Crore, estimated monthly EMI (₹), FOIR percentage, strengths, risk factors, and actionable bank recommendations.

2. **CIBIL Score Diagnostics & Recovery Roadmap**
   - **Indian Credit Bureau Dimensions**: CIBIL score (300-900), on-time payment history (%), credit card utilization ratio (%), credit history vintage (years), active accounts, and recent hard inquiries (past 6 months).
   - **Indian Rating Tiers**: Poor (&lt;550), Fair (550-649), Good (650-749), Excellent (750+).
   - **Visual Outputs**: Animated semi-circular SVG gauge chart with needle pointer, 5-factor bureau breakdown bars, top score bottlenecks, and recovery timeline.

3. **EMI Calculator & Amortization Engine (₹)**
   - **Math Engine**: Interactive sliders and number inputs for Loan Principal (₹50,000 to ₹5 Crore) with live Lakh/Crore labels, Annual Interest Rate (6% to 24% p.a.), and Tenure (1 to 30 years or 12 to 360 months).
   - **Formula**:
     $$EMI = \frac{P \times r \times (1+r)^n}{(1+r)^n - 1}$$
     *(where $r = \frac{\text{annual rate}}{12 \times 100}$ and $n = \text{tenure in months}$)*
   - **Visual Outputs**: Monthly EMI (₹), Total Interest Payable (₹), Total Outflow (₹), interactive SVG Donut Chart with percentage distribution, and year-by-year amortization schedule in ₹.
   - **Claude AI Suggestions**: Recommends prepayment strategies considering the **RBI mandate on zero foreclosure/prepayment charges on floating-rate individual retail loans**, optimal tenure reduction, and repo-rate transmission insights.

4. **Indian Wealth Strategy & 50/30/20 Budgeting**
   - **Goal-Driven Financial Planning**: Age, monthly take-home salary (₹), monthly expenses (₹), existing savings (₹), financial goal (Home Down Payment, Emergency Reserve, Retirement, Debt Freedom, Child Higher Education), and risk appetite.
   - **Visual Outputs**: 50/30/20 benchmark budget recommendation with exact ₹ amounts (Needs, Wants, Savings), target monthly savings velocity (₹), suggested Indian financial instruments (PPF, NPS, ELSS, Index Mutual Fund SIPs, High-Yield FDs), and motivational financial summary.

5. **Submission History & Google Sheets Integration (INR)**
   - Saves all assessments with timestamp, tool name, applicant, inputs, and results in INR.
   - Dual-mode architecture: Syncs with Google Sheets via a Google Apps Script Web App when configured; automatically falls back to `localStorage` when offline or before setup.
   - Filter by tool, inspect past submissions in a modal, export to CSV with INR currency tagging, or clear history.

6. **In-App Settings & Built-in Indian BFSI Simulation**
   - Settings modal allows pasting Anthropic Claude API Key and Google Sheets Web App URL without editing source code.
   - Built-in simulation fallback mode allows full interactive testing of all Indian BFSI features prior to entering an Anthropic key.

---

## 🚀 Quick Start Guide

### Running Locally

```bash
# Clone or open the repository
npm install

# Start development server
npm run dev

# Open in browser:
# http://localhost:3000
```

To build for production:
```bash
npm run build
```

---

## 🔑 Anthropic Claude API Configuration

The application connects to Anthropic's Claude API via browser `fetch` to:
`https://api.anthropic.com/v1/messages`

Headers required:
- `content-type`: `application/json`
- `x-api-key`: `YOUR_ANTHROPIC_API_KEY`
- `anthropic-version`: `2023-06-01`
- `anthropic-dangerous-direct-browser-access`: `true`

### Adding Your API Key:

#### Option A: In the Web UI (Recommended)
1. Launch the app in your browser.
2. Click the **Settings** (gear icon) in the top-right navbar.
3. Paste your Claude API key (`sk-ant-...`).
4. Click **Save Configuration**. The key is stored locally in your browser.

#### Option B: In `script.js`
Open `script.js` and set the constant at the top:
```javascript
export const CLAUDE_API_KEY = 'sk-ant-api03-...';
export const CLAUDE_MODEL = 'claude-sonnet-4-5';
```

---

## 📊 Google Sheets Apps Script Setup (Currency: INR)

Follow these simple steps to configure automated logging to your personal Google Sheet:

1. **Create a Google Sheet**:
   - Visit [sheets.new](https://sheets.new) and create a new blank spreadsheet.
   - Rename it to: `AI Loan Eligibility Submissions (India)`.

2. **Open Apps Script Editor**:
   - In the Google Sheets menu, click **Extensions** > **Apps Script**.

3. **Paste the Code**:
   - Clear any code in `Code.gs`.
   - Copy the entire contents of the `GoogleAppsScript.gs` file from this project and paste it into `Code.gs`.

4. **Deploy as Web App**:
   - In the top right of the Apps Script editor, click **Deploy** > **New deployment**.
   - Select type: **Web app** (gear icon).
   - Configuration:
     - **Description**: `AI Loan Eligibility API v1 (India)`
     - **Execute as**: `Me (<your-email>)`
     - **Who has access**: `Anyone` *(Crucial: Choose 'Anyone' so the web app can submit POST requests)*.
   - Click **Deploy**.
   - If prompted, click **Authorize access**, select your Google account, click **Advanced**, and proceed.

5. **Copy Web App URL**:
   - Copy the generated Web app URL (`https://script.google.com/macros/s/AKfycb.../exec`).

6. **Connect to the Web App**:
   - In the web app, click **Settings** in the navbar.
   - Paste the Web App URL into the **Google Sheets Web App URL** field.
   - Click **Save Configuration** & **Test Sheets URL**.
   - Done! All submissions will now log into your Google Sheet and synchronize into the History tab.

---

## 🌐 Deployment Options

### 1. GitHub Pages
1. Push this repository to a GitHub repository.
2. Go to **Settings** > **Pages**.
3. Under **Branch**, select `main` (or run `npm run build` and deploy `/dist` with GitHub Actions).
4. Save and your site will be live.

### 2. Netlify
1. Log into [Netlify](https://www.netlify.com/).
2. Click **Add new site** > **Import an existing project**.
3. Select your GitHub repository.
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Click **Deploy Site**.

### 3. Firebase Hosting
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Initialize Firebase: `firebase init hosting`
3. Specify `dist` as public directory and configure single-page app rewrite: `Yes`.
4. Build and deploy:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

---

## ⚖️ Indian Financial Disclaimer

*This tool provides AI-generated estimates in INR for educational purposes only and is not financial advice. Actual loan approval depends on the lender's policies, CIBIL report verification, and formal underwriting.*
