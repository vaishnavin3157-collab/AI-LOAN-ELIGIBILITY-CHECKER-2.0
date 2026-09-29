/**
 * =========================================================================
 * AI LOAN ELIGIBILITY CHECKER & BFSI FINANCIAL SUITE (INDIA / INR)
 * Complete vanilla JavaScript controller tailored for Indian banking context
 * =========================================================================
 */

// CONFIGURATION CONSTANTS (Configure here or override via in-app Settings modal)
export let CLAUDE_API_KEY = ''; // Leave blank to enter via Settings modal or use simulation
export let SHEETS_WEBAPP_URL = ''; // Leave blank to enter via Settings modal or use localStorage
export const CLAUDE_MODEL = 'claude-sonnet-4-5'; // Configurable Anthropic Claude Model

// Storage Keys
const STORAGE_KEYS = {
  CLAUDE_KEY: 'ai_loan_inr_claude_api_key',
  SHEETS_URL: 'ai_loan_inr_sheets_webapp_url',
  MODEL: 'ai_loan_inr_claude_model',
  HISTORY: 'ai_loan_inr_history_records_v1'
};

// Global App State
const state = {
  activeTab: 'loan',
  activeToolFilter: 'all',
  claudeApiKey: localStorage.getItem(STORAGE_KEYS.CLAUDE_KEY) || CLAUDE_API_KEY || '',
  sheetsUrl: localStorage.getItem(STORAGE_KEYS.SHEETS_URL) || SHEETS_WEBAPP_URL || '',
  claudeModel: localStorage.getItem(STORAGE_KEYS.MODEL) || CLAUDE_MODEL,
  localHistory: [],
  currentEmiData: null,
  currentEmiMode: 'yearly',
  lastLoanRequest: null,
  lastCreditRequest: null,
  lastEmiAiRequest: null,
  lastTipsRequest: null
};

// =========================================================================
// Currency Formatter & Indian Number Helpers (INR / ₹)
// =========================================================================
const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
});

export function formatINR(val) {
  const num = Number(val);
  if (isNaN(num)) return typeof val === 'string' ? val : '₹0';
  return inrFormatter.format(Math.round(num));
}

export function formatINRLargeWords(val) {
  const num = Number(val);
  if (isNaN(num) || num <= 0) return '';
  if (num >= 10000000) { // 1 Crore = 1,00,00,000
    const cr = num / 10000000;
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Crore`;
  }
  if (num >= 100000) { // 1 Lakh = 1,00,000
    const lk = num / 100000;
    return `₹${lk % 1 === 0 ? lk.toFixed(0) : lk.toFixed(2)} Lakh`;
  }
  if (num >= 1000) { // 1 Thousand = 1,000
    const k = num / 1000;
    return `₹${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return formatINR(num);
}

// Indian Financial Persona System Prompt
const INDIAN_BFSI_SYSTEM_PROMPT = `The user is in India. All monetary values must be in Indian Rupees (INR, ₹) as plain numbers. Never use USD or any other currency. Use Indian financial context: CIBIL score (300-900), Indian banks and NBFCs (such as SBI, HDFC, ICICI, Axis, PNB, Bajaj Finance), RBI norms, FOIR (fixed obligation to income ratio, typically 40-50%), and Indian products such as PPF, EPF, NPS, ELSS, FDs, SIPs and mutual funds. You must output STRICT JSON ONLY with no markdown code fences, no wrappers, and no preamble.`;

// =========================================================================
// Initialization
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
  loadLocalHistory();
  initNavigation();
  initTool1LoanEligibility();
  initTool2CreditScore();
  initTool3EmiCalculator();
  initTool4FinancialTips();
  initHistoryView();
  initSettingsModal();
  initAppsScriptModal();
  initDetailModal();
  updateStatusIndicators();
});

// =========================================================================
// UI Helpers & Notifications
// =========================================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>`;
  } else if (type === 'error') {
    iconSvg = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  } else {
    iconSvg = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="8"/></svg>`;
  }

  toast.innerHTML = `${iconSvg}<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

function updateStatusIndicators() {
  const aiStatusDot = document.getElementById('heroAiStatusDot');
  const aiStatusText = document.getElementById('heroAiStatusText');
  const storageStatusDot = document.getElementById('heroStorageStatusDot');
  const storageStatusText = document.getElementById('heroStorageStatusText');
  const navSettingsDot = document.getElementById('navSettingsDot');

  const hasKey = Boolean(state.claudeApiKey && state.claudeApiKey.trim().length > 5);
  const hasSheets = Boolean(state.sheetsUrl && state.sheetsUrl.trim().startsWith('http'));

  if (aiStatusDot && aiStatusText) {
    if (hasKey) {
      aiStatusDot.style.background = '#10b981';
      aiStatusText.textContent = `Claude API (${state.claudeModel})`;
    } else {
      aiStatusDot.style.background = '#f59e0b';
      aiStatusText.textContent = 'Indian BFSI Simulation (Set API Key)';
    }
  }

  if (storageStatusDot && storageStatusText) {
    if (hasSheets) {
      storageStatusDot.style.background = '#10b981';
      storageStatusText.textContent = 'Google Sheets Connected (INR)';
    } else {
      storageStatusDot.style.background = '#06b6d4';
      storageStatusText.textContent = 'Local Storage Active';
    }
  }

  if (navSettingsDot) {
    if (hasKey && hasSheets) {
      navSettingsDot.className = 'status-dot';
    } else {
      navSettingsDot.className = 'status-dot offline';
    }
  }
}

// =========================================================================
// Navigation & Tab Switching
// =========================================================================
function initNavigation() {
  const tabButtons = document.querySelectorAll('.nav-tab-btn');
  const jumpChips = document.querySelectorAll('.jump-chip');

  function switchTab(tabId) {
    state.activeTab = tabId;

    tabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    document.querySelectorAll('.tool-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `panel-${tabId}`);
    });

    if (tabId === 'history') {
      refreshHistoryDisplay();
    }
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  jumpChips.forEach(chip => {
    chip.addEventListener('click', () => switchTab(chip.dataset.tab));
  });
}

// =========================================================================
// Anthropic Claude API Client Helper
// =========================================================================
async function callClaudeAPI(prompt, systemPrompt = '') {
  const key = state.claudeApiKey ? state.claudeApiKey.trim() : '';

  // If no API key provided, fall back to realistic Indian BFSI simulation
  if (!key) {
    console.info('[AI Loan Engine] No Anthropic API Key provided. Running in Indian BFSI simulation mode.');
    await new Promise(resolve => setTimeout(resolve, 1300));
    return generateIndianSimulationResponse(prompt);
  }

  const endpoint = 'https://api.anthropic.com/v1/messages';
  const body = {
    model: state.claudeModel || 'claude-sonnet-4-5',
    max_tokens: 2500,
    system: systemPrompt || INDIAN_BFSI_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: prompt + '\n\nIMPORTANT: Return ONLY a valid JSON object matching the requested schema. All monetary figures must be in Indian Rupees (INR, ₹). Do not enclose in markdown code fences.'
      }
    ]
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    let errorDetail = `Status ${response.status} (${response.statusText})`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.error && errJson.error.message) {
        errorDetail = errJson.error.message;
      }
    } catch (e) {
      // ignore JSON parse error on non-ok
    }
    throw new Error(`Claude API Error: ${errorDetail}`);
  }

  const data = await response.json();
  const textContent = data?.content?.[0]?.text;
  if (!textContent) {
    throw new Error('Claude API returned an empty text content structure.');
  }

  return safeParseJSON(textContent);
}

function safeParseJSON(rawText) {
  let cleaned = rawText.trim();

  // Strip code fences if present
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  try {
    return JSON.parse(cleaned);
  } catch (initialErr) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (secondErr) {
        throw new Error(`Failed to parse AI JSON response: ${secondErr.message}`);
      }
    }
    throw new Error(`Could not find valid JSON in AI response.`);
  }
}

/**
 * Realistic Indian BFSI Simulation Engine (Zero USD / 100% INR)
 */
function generateIndianSimulationResponse(prompt) {
  if (prompt.includes('LOAN_ELIGIBILITY_REQUEST')) {
    return {
      eligible: 'yes',
      eligibility_score: 86,
      max_eligible_amount: 4800000, // ₹48 Lakh
      suggested_interest_range: '8.40% - 9.15% p.a.',
      estimated_emi: 41480,
      foir_percent: 38,
      risk_level: 'low',
      risk_factors: [
        'Tenure of 20 years incurs higher cumulative interest outflow under repo-linked benchmark rates (RLLR).',
        'Existing EMIs consume approximately 20% of net monthly take-home salary.'
      ],
      strengths: [
        'Healthy FOIR (Fixed Obligation to Income Ratio) of 38%, well within the RBI and Indian bank ceiling of 50%.',
        'Strong CIBIL score (750+) reflecting disciplined on-time repayment history across credit lines.',
        'Stable salaried employment track record in a Category-A recognized employer.'
      ],
      recommendations: [
        'Include a co-applicant (spouse/mother) to avail lower concession rates (5-10 bps discount) and double tax deductions under Section 24(b) and 80C.',
        'Explore SBI, HDFC, or ICICI repo-linked floating home loans which feature zero prepayment penalty as per RBI guidelines.',
        'Park 3 months of EMI cushion in an auto-sweep fixed deposit for emergency payment continuity.'
      ]
    };
  }

  if (prompt.includes('CREDIT_SCORE_ANALYSIS_REQUEST')) {
    return {
      rating: 'good',
      factor_breakdown: {
        payment_history: 92,
        credit_utilization: 74,
        credit_age: 70,
        credit_mix: 80,
        hard_inquiries: 88
      },
      top_issues: [
        'Revolving credit card utilization touched 38% during the recent festive quarter (ideally maintain under 30%).',
        'Recent hard inquiries logged from multiple consumer loan applications within the past 6 months.'
      ],
      actionable_steps: [
        'Request an unutilized credit limit enhancement on your primary credit card to immediately compress utilization below 25%.',
        'Avoid triggering unnecessary Buy-Now-Pay-Later (BNPL) micro-loans on e-commerce platforms which report as unsecured personal loans.',
        'Keep your oldest credit card active to preserve your 6+ year bureau vintage on TransUnion CIBIL.'
      ],
      estimated_improvement_timeline: '3 to 6 months for a 35 to 50 point CIBIL score enhancement'
    };
  }

  if (prompt.includes('EMI_AI_SUGGESTIONS_REQUEST')) {
    return {
      tips_to_reduce_interest: [
        'Leverage RBI mandate: No prepayment penalty or foreclosure charges can be levied on floating-rate individual term loans by banks or NBFCs.',
        'Paying just one extra EMI per year (or stepping up EMI by 5% annually) can shave off up to 4.5 years from a 20-year home loan.'
      ],
      ideal_tenure_suggestion: '15 Years (Saves approx ₹12.8 Lakh in total interest while keeping EMI comfortable at ~₹34,500/month)',
      prepayment_advice: 'Direct annual Diwali bonus, tax refunds, or performance incentives directly into principal prepayment during the first 5 years when the interest component is heaviest.',
      loan_insights: 'Ensure your loan is mapped to RBI\'s External Benchmark Lending Rate (EBLR/RLLR) for prompt downward rate transmission when monetary policy eases.'
    };
  }

  if (prompt.includes('FINANCIAL_TIPS_REQUEST')) {
    return {
      personalized_tips: [
        {
          title: 'Establish a 6-Month Liquid Emergency Reserve in FDs/Liquid Funds',
          description: 'Park 6 months of mandatory living expenses in high-yield auto-sweep FDs or liquid debt mutual funds before deploying capital into equity.',
          priority: 'high'
        },
        {
          title: 'Automate Equity SIPs on Salary Credit Day',
          description: 'Set up automated SIP mandates in broad-market Nifty 50 or Large & Midcap index funds to systematically compound long-term wealth.',
          priority: 'medium'
        },
        {
          title: 'Optimize Section 80C & 80D Tax Deductions',
          description: 'Pair PPF or ELSS mutual funds with comprehensive private health insurance coverage (super top-up) for tax-efficient financial security.',
          priority: 'low'
        }
      ],
      budget_50_30_20: {
        needs: '₹42,500 (50%)',
        wants: '₹25,500 (30%)',
        savings: '₹17,000 (20%)'
      },
      savings_target: '₹17,000 / month (₹2.04 Lakh annually)',
      suggested_instruments: [
        'Nifty 50 Index Mutual Fund SIP',
        'PPF (Public Provident Fund) for guaranteed EEE tax-free return',
        'ELSS (Equity Linked Savings Scheme) for 3-year lock-in growth',
        'High-Yield Scheduled Bank Fixed Deposits'
      ],
      motivational_summary: 'With your disciplined savings velocity and regular deployment into diversified equity SIPs alongside PPF, reaching your core Indian wealth milestones within 3 to 5 years is firmly on track.'
    };
  }

  return { status: 'ok', message: 'Indian BFSI simulation completed.' };
}

// =========================================================================
// Storage Manager (Google Apps Script & localStorage)
// =========================================================================
function loadLocalHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    state.localHistory = raw ? JSON.parse(raw) : [];
  } catch (e) {
    state.localHistory = [];
  }
}

async function saveSubmission(record) {
  state.localHistory.unshift(record);
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(state.localHistory));
  } catch (err) {
    console.warn('LocalStorage save failed:', err);
  }

  const sheetsUrl = state.sheetsUrl ? state.sheetsUrl.trim() : '';
  if (sheetsUrl && sheetsUrl.startsWith('http')) {
    try {
      await fetch(sheetsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(record)
      });
      console.log('[Storage] Record saved to Google Sheets Apps Script (INR)');
    } catch (sheetErr) {
      console.warn('[Storage] Google Sheets sync failed, record saved locally:', sheetErr);
    }
  }
}

async function fetchHistoryFromStorage() {
  const sheetsUrl = state.sheetsUrl ? state.sheetsUrl.trim() : '';
  if (sheetsUrl && sheetsUrl.startsWith('http')) {
    try {
      const response = await fetch(sheetsUrl, { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        if (data && data.records && Array.isArray(data.records)) {
          const timestamps = new Set(data.records.map(r => r.timestamp));
          const localOnly = state.localHistory.filter(r => !timestamps.has(r.timestamp));
          return [...data.records, ...localOnly];
        }
      }
    } catch (err) {
      console.warn('Fetch from Google Sheets failed, using local records:', err);
    }
  }
  return state.localHistory;
}

// =========================================================================
// TOOL 1: LOAN ELIGIBILITY CHECKER (INDIAN UNDERWRITING)
// =========================================================================
function initTool1LoanEligibility() {
  const form = document.getElementById('formLoanEligibility');
  const loadingOverlay = document.getElementById('loadingLoanEligibility');
  const errorBanner = document.getElementById('errorLoanEligibility');
  const retryBtn = document.getElementById('retryLoanEligibility');
  const placeholder = document.getElementById('placeholderLoanEligibility');
  const content = document.getElementById('contentLoanEligibility');

  // Dynamic live words for requested loan amount
  const loanAmtInput = document.getElementById('loanAmount');
  const loanAmtWords = document.getElementById('loanAmountWords');
  if (loanAmtInput && loanAmtWords) {
    const updateWords = () => {
      const val = parseFloat(loanAmtInput.value) || 0;
      loanAmtWords.textContent = val > 0 ? `(${formatINRLargeWords(val)})` : '';
    };
    loanAmtInput.addEventListener('input', updateWords);
    updateWords();
  }

  // Dynamic live words for monthly income
  const incomeInput = document.getElementById('loanIncome');
  const incomeWords = document.getElementById('loanIncomeWords');
  if (incomeInput && incomeWords) {
    const updateIncomeWords = () => {
      const val = parseFloat(incomeInput.value) || 0;
      incomeWords.textContent = val > 0 ? `(${formatINRLargeWords(val)})` : '';
    };
    incomeInput.addEventListener('input', updateIncomeWords);
    updateIncomeWords();
  }

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateLoanForm()) return;

    const formData = {
      fullName: document.getElementById('loanFullName').value.trim(),
      age: parseInt(document.getElementById('loanAge').value, 10),
      employmentType: document.getElementById('loanEmployment').value,
      monthlyIncome: parseFloat(document.getElementById('loanIncome').value),
      monthlyEmis: parseFloat(document.getElementById('loanEmis').value || 0),
      creditScore: parseInt(document.getElementById('loanCreditScore').value, 10),
      loanType: document.getElementById('loanType').value,
      loanAmount: parseFloat(document.getElementById('loanAmount').value),
      tenureYears: parseInt(document.getElementById('loanTenure').value, 10),
      city: document.getElementById('loanCity').value.trim()
    };

    state.lastLoanRequest = formData;
    await executeLoanAssessment(formData);
  });

  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      if (state.lastLoanRequest) executeLoanAssessment(state.lastLoanRequest);
    });
  }

  function validateLoanForm() {
    let isValid = true;
    const fields = [
      { id: 'loanFullName', condition: v => v.length >= 2, msg: 'Please enter a valid full name' },
      { id: 'loanAge', condition: v => Number(v) >= 18 && Number(v) <= 75, msg: 'Age must be between 18 and 75' },
      { id: 'loanIncome', condition: v => Number(v) > 0, msg: 'Monthly income must be greater than ₹0' },
      { id: 'loanCreditScore', condition: v => Number(v) >= 300 && Number(v) <= 900, msg: 'Enter a CIBIL score between 300 and 900' },
      { id: 'loanAmount', condition: v => Number(v) >= 25000, msg: 'Loan amount must be at least ₹25,000' },
      { id: 'loanTenure', condition: v => Number(v) >= 1 && Number(v) <= 35, msg: 'Tenure must be between 1 and 35 years' },
      { id: 'loanCity', condition: v => v.length >= 2, msg: 'Please provide your city (e.g., Mumbai, Bengaluru)' }
    ];

    fields.forEach(f => {
      const el = document.getElementById(f.id);
      const feedback = el?.parentElement?.querySelector('.invalid-feedback');
      const val = el ? el.value.trim() : '';
      if (!f.condition(val)) {
        isValid = false;
        el?.classList.add('is-invalid');
        if (feedback) {
          feedback.textContent = f.msg;
          feedback.classList.add('visible');
        }
      } else {
        el?.classList.remove('is-invalid');
        if (feedback) feedback.classList.remove('visible');
      }
    });

    return isValid;
  }

  async function executeLoanAssessment(data) {
    loadingOverlay.classList.add('active');
    errorBanner.classList.remove('active');
    if (placeholder) placeholder.style.display = 'none';

    const prompt = `
[LOAN_ELIGIBILITY_REQUEST]
Indian Loan Applicant Profile:
- Full Name: ${data.fullName}
- Age: ${data.age} Years
- Employment Type: ${data.employmentType}
- Monthly Net Take-Home Income: ₹${data.monthlyIncome}
- Existing Monthly EMIs / Debts: ₹${data.monthlyEmis}
- CIBIL Score: ${data.creditScore} (Range 300-900)
- Requested Loan Type: ${data.loanType}
- Requested Loan Amount: ₹${data.loanAmount}
- Requested Tenure: ${data.tenureYears} Years
- City: ${data.city}

Evaluate the applicant under Indian banking norms (RBI limits, FOIR threshold of 40-50%, CIBIL tiers, repo rate linkage).
Return STRICT JSON with this exact schema:
{
  "eligible": "yes" | "no" | "maybe",
  "eligibility_score": number (0-100),
  "max_eligible_amount": number (plain INR amount without currency symbols, e.g. 4800000),
  "suggested_interest_range": string (e.g. "8.50% - 9.25% p.a."),
  "estimated_emi": number (plain INR amount, e.g. 41500),
  "foir_percent": number (calculated FOIR percentage, e.g. 38),
  "risk_level": "low" | "medium" | "high",
  "risk_factors": [string, string],
  "strengths": [string, string, string],
  "recommendations": [string, string, string]
}
`;

    try {
      const result = await callClaudeAPI(prompt, INDIAN_BFSI_SYSTEM_PROMPT);
      renderLoanResult(result, data);

      const submissionRecord = {
        id: 'loan_' + Date.now(),
        timestamp: new Date().toISOString(),
        tool: 'Loan Eligibility Checker',
        userName: data.fullName,
        inputs: data,
        result: result
      };
      await saveSubmission(submissionRecord);
      showToast('Eligibility assessed in INR & recorded', 'success');
    } catch (err) {
      console.error(err);
      errorBanner.classList.add('active');
      document.getElementById('errorLoanEligibilityMsg').textContent = err.message || 'Failed to process eligibility.';
      if (placeholder) placeholder.style.display = 'flex';
      if (content) content.style.display = 'none';
    } finally {
      loadingOverlay.classList.remove('active');
    }
  }

  function renderLoanResult(result, input) {
    if (content) content.style.display = 'block';

    const scoreVal = Math.min(100, Math.max(0, parseInt(result.eligibility_score, 10) || 50));
    const scoreNumberEl = document.getElementById('loanResultScoreNum');
    const scoreCircleEl = document.getElementById('loanScoreCircle');

    if (scoreNumberEl) animateNumber(scoreNumberEl, 0, scoreVal, 1200);
    if (scoreCircleEl) {
      const circumference = 2 * Math.PI * 45; // ~282.74
      const offset = circumference - (scoreVal / 100) * circumference;
      scoreCircleEl.style.strokeDashoffset = offset;
    }

    const decisionBadge = document.getElementById('loanDecisionBadge');
    if (decisionBadge) {
      const decision = (result.eligible || 'maybe').toLowerCase();
      decisionBadge.className = 'decision-badge';
      if (decision === 'yes') {
        decisionBadge.classList.add('decision-approved');
        decisionBadge.textContent = 'Eligible for Approval';
      } else if (decision === 'no') {
        decisionBadge.classList.add('decision-rejected');
        decisionBadge.textContent = 'High Risk / Ineligible';
      } else {
        decisionBadge.classList.add('decision-conditional');
        decisionBadge.textContent = 'Conditional Approval';
      }
    }

    const riskBadge = document.getElementById('loanRiskBadge');
    if (riskBadge) {
      const risk = (result.risk_level || 'medium').toLowerCase();
      riskBadge.textContent = `${risk.toUpperCase()} RISK`;
      riskBadge.className = 'badge-tag';
      if (risk === 'low') {
        riskBadge.style.color = '#34d399';
        riskBadge.style.background = 'rgba(16, 185, 129, 0.15)';
      } else if (risk === 'high') {
        riskBadge.style.color = '#fb7185';
        riskBadge.style.background = 'rgba(244, 63, 94, 0.15)';
      } else {
        riskBadge.style.color = '#fbbf24';
        riskBadge.style.background = 'rgba(245, 158, 11, 0.15)';
      }
    }

    // Format Max Amount with INR and Lakh/Crore
    const maxNum = Number(result.max_eligible_amount) || 0;
    const maxDisplay = maxNum > 0 
      ? `${formatINR(maxNum)} <span style="font-size:0.75rem; color:var(--text-secondary); font-weight:normal;">(${formatINRLargeWords(maxNum)})</span>`
      : (result.max_eligible_amount || 'N/A');
    document.getElementById('loanMaxAmountVal').innerHTML = maxDisplay;

    // Suggested Interest Range
    document.getElementById('loanInterestVal').textContent = result.suggested_interest_range || '8.50% - 9.25% p.a.';

    // Estimated EMI & FOIR
    const emiNum = Number(result.estimated_emi) || 0;
    document.getElementById('loanEstimatedEmiVal').textContent = emiNum > 0 ? formatINR(emiNum) : 'N/A';
    document.getElementById('loanFoirVal').textContent = result.foir_percent ? `${result.foir_percent}%` : '38%';

    // Lists
    renderList('loanStrengthsList', result.strengths || [], 'success');
    renderList('loanRisksList', result.risk_factors || [], 'warning');
    renderList('loanRecsList', result.recommendations || [], 'info');
  }
}

function renderList(elementId, items, type) {
  const container = document.getElementById(elementId);
  if (!container) return;
  container.innerHTML = '';

  if (!items || items.length === 0) {
    container.innerHTML = `<li class="text-muted">None specified</li>`;
    return;
  }

  items.forEach(text => {
    const li = document.createElement('li');
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg class="bullet-icon success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
    } else if (type === 'warning') {
      iconSvg = `<svg class="bullet-icon warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    } else {
      iconSvg = `<svg class="bullet-icon info" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
    }
    li.innerHTML = `${iconSvg}<span>${text}</span>`;
    container.appendChild(li);
  });
}

function animateNumber(element, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const current = Math.floor(progress * (end - start) + start);
    element.textContent = current;
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      element.textContent = end;
    }
  };
  window.requestAnimationFrame(step);
}

// =========================================================================
// TOOL 2: CREDIT SCORE ANALYZER (CIBIL-STYLE)
// =========================================================================
function initTool2CreditScore() {
  const form = document.getElementById('formCreditScore');
  const loadingOverlay = document.getElementById('loadingCreditScore');
  const errorBanner = document.getElementById('errorCreditScore');
  const retryBtn = document.getElementById('retryCreditScore');
  const placeholder = document.getElementById('placeholderCreditScore');
  const content = document.getElementById('contentCreditScore');

  const scoreRange = document.getElementById('csScoreRange');
  const scoreInput = document.getElementById('csScoreInput');
  if (scoreRange && scoreInput) {
    scoreRange.addEventListener('input', () => { scoreInput.value = scoreRange.value; });
    scoreInput.addEventListener('input', () => { scoreRange.value = scoreInput.value; });
  }

  const payRange = document.getElementById('csPaymentHistoryRange');
  const payInput = document.getElementById('csPaymentHistory');
  if (payRange && payInput) {
    payRange.addEventListener('input', () => { payInput.value = payRange.value; });
    payInput.addEventListener('input', () => { payRange.value = payInput.value; });
  }

  const utilRange = document.getElementById('csUtilizationRange');
  const utilInput = document.getElementById('csUtilization');
  if (utilRange && utilInput) {
    utilRange.addEventListener('input', () => { utilInput.value = utilRange.value; });
    utilInput.addEventListener('input', () => { utilRange.value = utilInput.value; });
  }

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
      score: parseInt(scoreInput.value, 10),
      paymentHistory: parseFloat(payInput.value),
      utilization: parseFloat(utilInput.value),
      creditAge: parseFloat(document.getElementById('csCreditAge').value),
      activeAccounts: parseInt(document.getElementById('csActiveAccounts').value, 10),
      inquiries: parseInt(document.getElementById('csInquiries').value, 10)
    };

    state.lastCreditRequest = formData;
    await executeCreditAnalysis(formData);
  });

  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      if (state.lastCreditRequest) executeCreditAnalysis(state.lastCreditRequest);
    });
  }

  async function executeCreditAnalysis(data) {
    loadingOverlay.classList.add('active');
    errorBanner.classList.remove('active');
    if (placeholder) placeholder.style.display = 'none';

    const prompt = `
[CREDIT_SCORE_ANALYSIS_REQUEST]
Indian Borrower CIBIL Profile:
- CIBIL Score: ${data.score} (Indian bands: Below 550 = Poor, 550-649 = Fair, 650-749 = Good, 750+ = Excellent)
- Payment History: ${data.paymentHistory}% On-time
- Revolving Credit Utilization: ${data.utilization}%
- Average Credit Vintage / Age: ${data.creditAge} Years
- Active Credit Accounts / Loans: ${data.activeAccounts}
- Hard Inquiries in Past 6 Months: ${data.inquiries}

Evaluate and return STRICT JSON with this schema:
{
  "rating": "poor" | "fair" | "good" | "very good" | "excellent",
  "factor_breakdown": {
    "payment_history": number (0-100),
    "credit_utilization": number (0-100),
    "credit_age": number (0-100),
    "credit_mix": number (0-100),
    "hard_inquiries": number (0-100)
  },
  "top_issues": [string, string],
  "actionable_steps": [string, string, string],
  "estimated_improvement_timeline": string (e.g. "3 to 6 months for a 35-50 point CIBIL score boost")
}
`;

    try {
      const result = await callClaudeAPI(prompt, INDIAN_BFSI_SYSTEM_PROMPT);
      renderCreditResult(result, data);

      const submissionRecord = {
        id: 'credit_' + Date.now(),
        timestamp: new Date().toISOString(),
        tool: 'Credit Score Analyzer',
        userName: `CIBIL: ${data.score}`,
        inputs: data,
        result: result
      };
      await saveSubmission(submissionRecord);
      showToast('CIBIL analysis complete & saved', 'success');
    } catch (err) {
      console.error(err);
      errorBanner.classList.add('active');
      document.getElementById('errorCreditScoreMsg').textContent = err.message || 'Failed to process credit analysis.';
      if (placeholder) placeholder.style.display = 'flex';
      if (content) content.style.display = 'none';
    } finally {
      loadingOverlay.classList.remove('active');
    }
  }

  function renderCreditResult(result, input) {
    if (content) content.style.display = 'block';

    const score = input.score;
    const scoreValEl = document.getElementById('csGaugeScoreVal');
    const scoreRatingEl = document.getElementById('csGaugeRatingText');
    const needleEl = document.getElementById('csGaugeNeedle');

    if (scoreValEl) animateNumber(scoreValEl, 300, score, 1200);

    // Indian CIBIL bands: below 550 poor, 550-649 fair, 650-749 good, 750+ excellent
    let rating = (result.rating || 'Good').toUpperCase();
    if (score < 550) rating = 'POOR (<550)';
    else if (score < 650) rating = 'FAIR (550-649)';
    else if (score < 750) rating = 'GOOD (650-749)';
    else rating = 'EXCELLENT (750+)';

    if (scoreRatingEl) {
      scoreRatingEl.textContent = rating;
      if (score >= 750) scoreRatingEl.style.color = '#10b981';
      else if (score >= 650) scoreRatingEl.style.color = '#06b6d4';
      else if (score >= 550) scoreRatingEl.style.color = '#f59e0b';
      else scoreRatingEl.style.color = '#f43f5e';
    }

    if (needleEl) {
      const normalized = Math.min(1, Math.max(0, (score - 300) / 600));
      const angle = -90 + normalized * 180;
      needleEl.style.transform = `rotate(${angle}deg)`;
    }

    const factors = result.factor_breakdown || {};
    updateFactorBar('factorPaymentHistory', factors.payment_history ?? 90);
    updateFactorBar('factorUtilization', factors.credit_utilization ?? 75);
    updateFactorBar('factorCreditAge', factors.credit_age ?? 70);
    updateFactorBar('factorCreditMix', factors.credit_mix ?? 80);
    updateFactorBar('factorInquiries', factors.hard_inquiries ?? 85);

    renderList('csIssuesList', result.top_issues || [], 'warning');
    renderList('csStepsList', result.actionable_steps || [], 'success');

    const timelineEl = document.getElementById('csTimelineVal');
    if (timelineEl) {
      timelineEl.textContent = result.estimated_improvement_timeline || '3 to 6 months for a 30-45 point CIBIL score boost';
    }
  }

  function updateFactorBar(idPrefix, val) {
    const num = Math.min(100, Math.max(0, Math.round(Number(val) || 0)));
    const scoreEl = document.getElementById(`${idPrefix}Score`);
    const fillEl = document.getElementById(`${idPrefix}Fill`);

    if (scoreEl) scoreEl.textContent = `${num}%`;
    if (fillEl) {
      fillEl.style.width = `${num}%`;
      if (num >= 80) fillEl.style.background = '#10b981';
      else if (num >= 60) fillEl.style.background = '#06b6d4';
      else if (num >= 40) fillEl.style.background = '#f59e0b';
      else fillEl.style.background = '#f43f5e';
    }
  }
}

// =========================================================================
// TOOL 3: EMI CALCULATOR (INDIAN BANKING & AMORTIZATION IN ₹)
// =========================================================================
function initTool3EmiCalculator() {
  const principalInput = document.getElementById('emiPrincipal');
  const principalRange = document.getElementById('emiPrincipalRange');
  const principalWords = document.getElementById('emiPrincipalWords');
  const rateInput = document.getElementById('emiRate');
  const rateRange = document.getElementById('emiRateRange');
  const tenureInput = document.getElementById('emiTenure');
  const tenureRange = document.getElementById('emiTenureRange');
  const tenureUnitToggle = document.getElementById('emiTenureUnit');

  const getAiBtn = document.getElementById('btnGetEmiAiAdvice');
  const aiDrawer = document.getElementById('emiAiAdviceDrawer');
  const aiLoading = document.getElementById('emiAiLoading');
  const aiContent = document.getElementById('emiAiContent');

  const toggleYearly = document.getElementById('toggleAmortYearly');
  const toggleMonthly = document.getElementById('toggleAmortMonthly');

  // Synchronize inputs & sliders
  syncInputAndSlider(principalInput, principalRange, () => {
    updatePrincipalWords();
    calculateEMI();
  });
  syncInputAndSlider(rateInput, rateRange, calculateEMI);
  syncInputAndSlider(tenureInput, tenureRange, calculateEMI);

  function updatePrincipalWords() {
    if (!principalWords || !principalInput) return;
    const val = parseFloat(principalInput.value) || 0;
    principalWords.textContent = val > 0 ? `(${formatINRLargeWords(val)})` : '';
  }

  if (tenureUnitToggle) {
    tenureUnitToggle.addEventListener('change', () => {
      const isYears = tenureUnitToggle.value === 'years';
      if (isYears) {
        tenureRange.min = '1';
        tenureRange.max = '30';
        tenureInput.value = '20';
        tenureRange.value = '20';
        document.getElementById('emiTenureMaxLabel').textContent = '30 Y';
      } else {
        tenureRange.min = '12';
        tenureRange.max = '360';
        tenureInput.value = '240';
        tenureRange.value = '240';
        document.getElementById('emiTenureMaxLabel').textContent = '360 M';
      }
      calculateEMI();
    });
  }

  if (toggleYearly && toggleMonthly) {
    toggleYearly.addEventListener('click', () => {
      state.currentEmiMode = 'yearly';
      toggleYearly.classList.add('active');
      toggleMonthly.classList.remove('active');
      renderAmortizationTable();
    });
    toggleMonthly.addEventListener('click', () => {
      state.currentEmiMode = 'monthly';
      toggleMonthly.classList.add('active');
      toggleYearly.classList.remove('active');
      renderAmortizationTable();
    });
  }

  if (getAiBtn) {
    getAiBtn.addEventListener('click', fetchEmiAiSuggestions);
  }

  updatePrincipalWords();
  calculateEMI();

  function syncInputAndSlider(input, range, callback) {
    if (!input || !range) return;
    input.addEventListener('input', () => {
      range.value = input.value;
      callback();
    });
    range.addEventListener('input', () => {
      input.value = range.value;
      callback();
    });
  }

  function calculateEMI() {
    const P = parseFloat(principalInput.value) || 0;
    const annualRate = parseFloat(rateInput.value) || 0;
    const isYears = !tenureUnitToggle || tenureUnitToggle.value === 'years';
    const tenureVal = parseFloat(tenureInput.value) || 1;
    const n = isYears ? Math.round(tenureVal * 12) : Math.round(tenureVal);

    if (P <= 0 || annualRate <= 0 || n <= 0) return;

    const r = annualRate / 12 / 100;
    const factor = Math.pow(1 + r, n);
    const emi = (P * r * factor) / (factor - 1);
    const totalPayment = emi * n;
    const totalInterest = totalPayment - P;

    state.currentEmiData = {
      principal: P,
      annualRate: annualRate,
      tenureMonths: n,
      tenureYears: n / 12,
      emi: Math.round(emi),
      totalInterest: Math.round(totalInterest),
      totalPayment: Math.round(totalPayment)
    };

    // Update stat boxes with INR formatter
    document.getElementById('emiResultMonthly').textContent = formatINR(Math.round(emi));
    document.getElementById('emiResultInterest').textContent = formatINR(Math.round(totalInterest));
    document.getElementById('emiResultTotal').textContent = formatINR(Math.round(totalPayment));

    updateDonutChart(P, totalInterest);
    renderAmortizationTable();
  }

  function updateDonutChart(principal, interest) {
    const total = principal + interest;
    if (total <= 0) return;

    const principalPct = Math.round((principal / total) * 100);
    const interestPct = 100 - principalPct;

    document.getElementById('donutPrincipalPct').textContent = `${principalPct}% (${formatINRLargeWords(principal)})`;
    document.getElementById('donutInterestPct').textContent = `${interestPct}% (${formatINRLargeWords(interest)})`;

    const radius = 45;
    const circumference = 2 * Math.PI * radius; // ~282.74
    const principalSegment = document.getElementById('donutSegmentPrincipal');
    const interestSegment = document.getElementById('donutSegmentInterest');

    if (principalSegment && interestSegment) {
      principalSegment.style.strokeDasharray = `${circumference}`;
      interestSegment.style.strokeDasharray = `${circumference}`;

      const principalLength = (principal / total) * circumference;
      principalSegment.style.strokeDashoffset = '0';
      interestSegment.style.strokeDashoffset = `-${principalLength}`;
    }
  }

  function renderAmortizationTable() {
    if (!state.currentEmiData) return;
    const tbody = document.getElementById('amortizationTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const { principal, annualRate, tenureMonths } = state.currentEmiData;
    const monthlyRate = annualRate / 12 / 100;
    const factor = Math.pow(1 + monthlyRate, tenureMonths);
    const emi = (principal * monthlyRate * factor) / (factor - 1);

    let balance = principal;
    const isYearly = state.currentEmiMode === 'yearly';

    if (isYearly) {
      let currentYear = 1;
      let yearlyInterest = 0;
      let yearlyPrincipal = 0;
      let yearOpening = balance;

      for (let m = 1; m <= tenureMonths; m++) {
        const interestPaid = balance * monthlyRate;
        const principalPaid = Math.min(balance, emi - interestPaid);
        balance -= principalPaid;

        yearlyInterest += interestPaid;
        yearlyPrincipal += principalPaid;

        if (m % 12 === 0 || m === tenureMonths) {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>Year ${currentYear}</td>
            <td>${formatINR(Math.round(yearOpening))}</td>
            <td>${formatINR(Math.round(yearlyPrincipal + yearlyInterest))}</td>
            <td>${formatINR(Math.round(yearlyPrincipal))}</td>
            <td>${formatINR(Math.round(yearlyInterest))}</td>
            <td>${formatINR(Math.max(0, Math.round(balance)))}</td>
          `;
          tbody.appendChild(tr);

          currentYear++;
          yearlyInterest = 0;
          yearlyPrincipal = 0;
          yearOpening = balance;
        }
      }
    } else {
      const limit = Math.min(tenureMonths, 60);
      for (let m = 1; m <= limit; m++) {
        const opening = balance;
        const interestPaid = balance * monthlyRate;
        const principalPaid = Math.min(balance, emi - interestPaid);
        balance -= principalPaid;

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>Month ${m}</td>
          <td>${formatINR(Math.round(opening))}</td>
          <td>${formatINR(Math.round(emi))}</td>
          <td>${formatINR(Math.round(principalPaid))}</td>
          <td>${formatINR(Math.round(interestPaid))}</td>
          <td>${formatINR(Math.max(0, Math.round(balance)))}</td>
        `;
        tbody.appendChild(tr);
      }
    }
  }

  async function fetchEmiAiSuggestions() {
    if (!state.currentEmiData) return;
    if (aiDrawer) aiDrawer.style.display = 'block';
    if (aiLoading) aiLoading.classList.add('active');
    if (aiContent) aiContent.style.display = 'none';

    const { principal, annualRate, tenureYears, emi, totalInterest, totalPayment } = state.currentEmiData;

    const prompt = `
[EMI_AI_SUGGESTIONS_REQUEST]
Indian Loan Figures:
- Principal Borrowed: ₹${principal} (${formatINRLargeWords(principal)})
- Annual Interest Rate: ${annualRate}% p.a.
- Tenure: ${tenureYears} Years (${state.currentEmiData.tenureMonths} Months)
- Calculated Monthly EMI: ₹${emi}
- Total Interest Payable: ₹${totalInterest}
- Total Outflow: ₹${totalPayment}

Provide optimization recommendations considering Indian banking regulations (mention RBI's rule that individual floating-rate retail loans carry zero prepayment penalty, prepayment strategies during Diwali bonuses, and ideal tenure optimization).
Return STRICT JSON:
{
  "tips_to_reduce_interest": [string, string],
  "ideal_tenure_suggestion": string,
  "prepayment_advice": string,
  "loan_insights": string
}
`;

    try {
      const result = await callClaudeAPI(prompt, INDIAN_BFSI_SYSTEM_PROMPT);
      if (aiContent) {
        aiContent.style.display = 'block';
        renderList('emiAiTipsList', result.tips_to_reduce_interest || [], 'success');
        document.getElementById('emiAiTenureVal').textContent = result.ideal_tenure_suggestion || 'N/A';
        document.getElementById('emiAiPrepaymentVal').textContent = result.prepayment_advice || 'N/A';
        document.getElementById('emiAiInsightsVal').textContent = result.loan_insights || 'N/A';
      }

      const submissionRecord = {
        id: 'emi_' + Date.now(),
        timestamp: new Date().toISOString(),
        tool: 'EMI Calculator',
        userName: `Loan: ${formatINRLargeWords(principal)}`,
        inputs: state.currentEmiData,
        result: result
      };
      await saveSubmission(submissionRecord);
      showToast('Indian loan advisory generated & logged', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to load AI suggestions: ' + err.message, 'error');
    } finally {
      if (aiLoading) aiLoading.classList.remove('active');
    }
  }
}

// =========================================================================
// TOOL 4: AI FINANCIAL TIPS (INDIAN CONTEXT & WEALTH INSTRUMENTS)
// =========================================================================
function initTool4FinancialTips() {
  const form = document.getElementById('formFinancialTips');
  const loadingOverlay = document.getElementById('loadingFinancialTips');
  const errorBanner = document.getElementById('errorFinancialTips');
  const retryBtn = document.getElementById('retryFinancialTips');
  const placeholder = document.getElementById('placeholderFinancialTips');
  const content = document.getElementById('contentFinancialTips');

  // Words helper for income and expenses
  const ftIncome = document.getElementById('ftIncome');
  const ftIncomeWords = document.getElementById('ftIncomeWords');
  if (ftIncome && ftIncomeWords) {
    const update = () => {
      const val = parseFloat(ftIncome.value) || 0;
      ftIncomeWords.textContent = val > 0 ? `(${formatINRLargeWords(val)})` : '';
    };
    ftIncome.addEventListener('input', update);
    update();
  }

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
      age: parseInt(document.getElementById('ftAge').value, 10),
      monthlyIncome: parseFloat(document.getElementById('ftIncome').value),
      monthlyExpenses: parseFloat(document.getElementById('ftExpenses').value),
      currentSavings: parseFloat(document.getElementById('ftSavings').value || 0),
      goal: document.getElementById('ftGoal').value,
      riskAppetite: document.getElementById('ftRisk').value
    };

    if (formData.monthlyIncome <= 0) {
      showToast('Please enter monthly income greater than ₹0', 'error');
      return;
    }

    state.lastTipsRequest = formData;
    await executeFinancialTips(formData);
  });

  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      if (state.lastTipsRequest) executeFinancialTips(state.lastTipsRequest);
    });
  }

  async function executeFinancialTips(data) {
    loadingOverlay.classList.add('active');
    errorBanner.classList.remove('active');
    if (placeholder) placeholder.style.display = 'none';

    const prompt = `
[FINANCIAL_TIPS_REQUEST]
Indian User Profile:
- Age: ${data.age} Years
- Monthly Net Take-Home Salary: ₹${data.monthlyIncome}
- Current Monthly Living Expenses: ₹${data.monthlyExpenses}
- Current Liquid Savings / Assets: ₹${data.currentSavings}
- Primary Financial Target: ${data.goal}
- Risk Appetite: ${data.riskAppetite}

Synthesize a 50/30/20 budget with exact INR ₹ figures, savings targets, and concrete Indian financial instruments (such as PPF, EPF, NPS, ELSS, Mutual Fund SIPs, FDs, Sovereign Gold Bonds).
Return STRICT JSON:
{
  "personalized_tips": [
    { "title": string, "description": string, "priority": "high" | "medium" | "low" },
    { "title": string, "description": string, "priority": "high" | "medium" | "low" },
    { "title": string, "description": string, "priority": "high" | "medium" | "low" }
  ],
  "budget_50_30_20": {
    "needs": string (e.g. "₹42,500 (50%)"),
    "wants": string (e.g. "₹25,500 (30%)"),
    "savings": string (e.g. "₹17,000 (20%)")
  },
  "savings_target": string (e.g. "₹17,000 / month (₹2.04 Lakh annually)"),
  "suggested_instruments": [string, string, string, string],
  "motivational_summary": string
}
`;

    try {
      const result = await callClaudeAPI(prompt, INDIAN_BFSI_SYSTEM_PROMPT);
      renderTipsResult(result, data);

      const submissionRecord = {
        id: 'tips_' + Date.now(),
        timestamp: new Date().toISOString(),
        tool: 'AI Financial Tips',
        userName: `Goal: ${data.goal}`,
        inputs: data,
        result: result
      };
      await saveSubmission(submissionRecord);
      showToast('Indian financial plan formulated & logged', 'success');
    } catch (err) {
      console.error(err);
      errorBanner.classList.add('active');
      document.getElementById('errorFinancialTipsMsg').textContent = err.message || 'Failed to generate financial tips.';
      if (placeholder) placeholder.style.display = 'flex';
      if (content) content.style.display = 'none';
    } finally {
      loadingOverlay.classList.remove('active');
    }
  }

  function renderTipsResult(result, input) {
    if (content) content.style.display = 'block';

    const budget = result.budget_50_30_20 || {};
    document.getElementById('ftBudgetNeedsVal').textContent = budget.needs || '50%';
    document.getElementById('ftBudgetWantsVal').textContent = budget.wants || '30%';
    document.getElementById('ftBudgetSavingsVal').textContent = budget.savings || '20%';

    document.getElementById('ftSavingsTargetVal').textContent = result.savings_target || 'N/A';
    document.getElementById('ftMotivationalSummary').textContent = result.motivational_summary || '';

    // Render Suggested Instruments
    const instrumentsList = document.getElementById('ftInstrumentsList');
    if (instrumentsList) {
      instrumentsList.innerHTML = '';
      const list = result.suggested_instruments || ['Nifty 50 Index Fund SIP', 'PPF', 'ELSS Tax Saver', 'High-Yield FDs'];
      list.forEach(inst => {
        const span = document.createElement('span');
        span.className = 'instrument-chip';
        span.textContent = inst;
        instrumentsList.appendChild(span);
      });
    }

    // Render Tip Cards
    const tipsContainer = document.getElementById('ftTipsCardsContainer');
    if (tipsContainer) {
      tipsContainer.innerHTML = '';
      const tips = result.personalized_tips || [];
      tips.forEach(tip => {
        const priority = (tip.priority || 'medium').toLowerCase();
        const card = document.createElement('div');
        card.className = 'tip-item-card';
        card.innerHTML = `
          <div class="tip-card-top">
            <span class="tip-title">${escapeHtml(tip.title)}</span>
            <span class="tip-priority-badge tip-priority-${priority}">${priority}</span>
          </div>
          <p class="tip-desc">${escapeHtml(tip.description)}</p>
        `;
        tipsContainer.appendChild(card);
      });
    }
  }
}

// =========================================================================
// TOOL 5: HISTORY MANAGER & EXPORT (INR)
// =========================================================================
function initHistoryView() {
  const refreshBtn = document.getElementById('btnRefreshHistory');
  const clearBtn = document.getElementById('btnClearHistory');
  const exportBtn = document.getElementById('btnExportHistory');
  const filterButtons = document.querySelectorAll('.history-filter-btn');

  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      showToast('Syncing history from storage...', 'info');
      await refreshHistoryDisplay();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear your local submission history?')) {
        state.localHistory = [];
        localStorage.removeItem(STORAGE_KEYS.HISTORY);
        refreshHistoryDisplay();
        showToast('History cleared', 'info');
      }
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', exportHistoryToCSV);
  }

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeToolFilter = btn.dataset.filter;
      refreshHistoryDisplay();
    });
  });
}

async function refreshHistoryDisplay() {
  const tbody = document.getElementById('historyTableBody');
  const emptyNotice = document.getElementById('historyEmptyNotice');
  if (!tbody) return;

  const records = await fetchHistoryFromStorage();
  tbody.innerHTML = '';

  const filter = state.activeToolFilter || 'all';
  const filtered = records.filter(r => {
    if (filter === 'all') return true;
    if (filter === 'loan') return r.tool.includes('Loan');
    if (filter === 'credit') return r.tool.includes('Credit');
    if (filter === 'emi') return r.tool.includes('EMI');
    if (filter === 'tips') return r.tool.includes('Tips') || r.tool.includes('Financial');
    return true;
  });

  if (filtered.length === 0) {
    if (emptyNotice) emptyNotice.style.display = 'block';
    return;
  }

  if (emptyNotice) emptyNotice.style.display = 'none';

  filtered.forEach((rec, idx) => {
    const tr = document.createElement('tr');
    const dateStr = rec.timestamp ? new Date(rec.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A';
    const userName = rec.userName || rec.inputs?.fullName || rec.inputs?.name || 'Applicant';

    let summaryText = rec.resultSummary || '';
    if (!summaryText && rec.result) {
      if (rec.tool.includes('Loan')) {
        const maxDisplay = rec.result.max_eligible_amount ? formatINRLargeWords(rec.result.max_eligible_amount) : 'N/A';
        summaryText = `Eligible: ${rec.result.eligible?.toUpperCase()} (${rec.result.eligibility_score}/100) · Max: ${maxDisplay} · FOIR: ${rec.result.foir_percent}%`;
      } else if (rec.tool.includes('Credit')) {
        summaryText = `CIBIL Rating: ${rec.result.rating?.toUpperCase()} · Timeline: ${rec.result.estimated_improvement_timeline}`;
      } else if (rec.tool.includes('EMI')) {
        summaryText = `EMI: ${formatINR(rec.inputs?.emi)} · Total Int: ${formatINRLargeWords(rec.inputs?.totalInterest)}`;
      } else {
        summaryText = `Target: ${rec.result.savings_target || 'Configured'}`;
      }
    }

    tr.innerHTML = `
      <td>${dateStr}</td>
      <td><span class="history-tool-tag">${escapeHtml(rec.tool)}</span></td>
      <td><strong>${escapeHtml(userName)}</strong></td>
      <td style="max-width: 320px; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(summaryText)}</td>
      <td>
        <button class="btn-table-action view-detail-btn" data-index="${idx}">View Details</button>
      </td>
    `;

    const detailBtn = tr.querySelector('.view-detail-btn');
    detailBtn?.addEventListener('click', () => openDetailModal(rec));

    tbody.appendChild(tr);
  });
}

function exportHistoryToCSV() {
  if (!state.localHistory || state.localHistory.length === 0) {
    showToast('No records available to export', 'error');
    return;
  }

  const headers = ['Timestamp', 'Tool', 'Currency', 'User', 'Inputs', 'Results'];
  const rows = state.localHistory.map(r => [
    `"${r.timestamp}"`,
    `"${r.tool}"`,
    `"INR (₹)"`,
    `"${r.userName || ''}"`,
    `"${JSON.stringify(r.inputs).replace(/"/g, '""')}"`,
    `"${JSON.stringify(r.result).replace(/"/g, '""')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `ai_loan_inr_history_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  showToast('History exported to CSV in INR', 'success');
}

// =========================================================================
// MODALS CONTROLLERS
// =========================================================================
function initSettingsModal() {
  const modal = document.getElementById('settingsModal');
  const openBtn = document.getElementById('btnNavSettings');
  const closeBtn = document.getElementById('closeSettingsModal');
  const saveBtn = document.getElementById('btnSaveSettings');
  const testClaudeBtn = document.getElementById('btnTestClaudeApi');
  const testSheetsBtn = document.getElementById('btnTestSheets');

  const apiKeyInput = document.getElementById('settingsClaudeApiKey');
  const sheetsUrlInput = document.getElementById('settingsSheetsUrl');
  const toggleKeyVisibilityBtn = document.getElementById('btnToggleApiKeyVisibility');

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      apiKeyInput.value = state.claudeApiKey || '';
      sheetsUrlInput.value = state.sheetsUrl || '';
      modal.classList.add('active');
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  }

  if (toggleKeyVisibilityBtn && apiKeyInput) {
    toggleKeyVisibilityBtn.addEventListener('click', () => {
      apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const keyVal = apiKeyInput.value.trim();
      const sheetsVal = sheetsUrlInput.value.trim();

      state.claudeApiKey = keyVal;
      state.sheetsUrl = sheetsVal;

      localStorage.setItem(STORAGE_KEYS.CLAUDE_KEY, keyVal);
      localStorage.setItem(STORAGE_KEYS.SHEETS_URL, sheetsVal);

      updateStatusIndicators();
      modal.classList.remove('active');
      showToast('Settings saved successfully', 'success');
    });
  }

  if (testClaudeBtn) {
    testClaudeBtn.addEventListener('click', async () => {
      const testKey = apiKeyInput.value.trim();
      if (!testKey) {
        showToast('Please enter an Anthropic API Key first', 'error');
        return;
      }
      testClaudeBtn.textContent = 'Testing...';
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': testKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
          },
          body: JSON.stringify({
            model: state.claudeModel,
            max_tokens: 30,
            messages: [{ role: 'user', content: 'Reply with JSON {"status": "ok", "currency": "INR"}' }]
          })
        });
        if (response.ok) {
          showToast('Claude API Connected Successfully!', 'success');
        } else {
          const err = await response.json();
          showToast('Claude Test Failed: ' + (err.error?.message || response.statusText), 'error');
        }
      } catch (err) {
        showToast('Connection error: ' + err.message, 'error');
      } finally {
        testClaudeBtn.textContent = 'Test Claude Key';
      }
    });
  }

  if (testSheetsBtn) {
    testSheetsBtn.addEventListener('click', async () => {
      const testUrl = sheetsUrlInput.value.trim();
      if (!testUrl || !testUrl.startsWith('http')) {
        showToast('Please enter a valid Google Apps Script Web App URL', 'error');
        return;
      }
      testSheetsBtn.textContent = 'Testing...';
      try {
        const res = await fetch(testUrl, { method: 'GET' });
        if (res.ok) {
          showToast('Google Sheets Apps Script Connected!', 'success');
        } else {
          showToast('Sheets test failed with status ' + res.status, 'error');
        }
      } catch (err) {
        showToast('Sheets test error (Verify access is Anyone): ' + err.message, 'error');
      } finally {
        testSheetsBtn.textContent = 'Test Sheets URL';
      }
    });
  }
}

function initAppsScriptModal() {
  const modal = document.getElementById('appsScriptModal');
  const openBtn = document.getElementById('btnNavAppsScript');
  const closeBtn = document.getElementById('closeAppsScriptModal');
  const copyBtn = document.getElementById('btnCopyAppsScriptCode');

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => modal.classList.add('active'));
  }
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const codeEl = document.getElementById('appsScriptCodePre');
      if (codeEl) {
        navigator.clipboard.writeText(codeEl.textContent).then(() => {
          showToast('Indian Apps Script code copied to clipboard!', 'success');
        }).catch(() => {
          showToast('Copy failed, please select and copy manually', 'error');
        });
      }
    });
  }
}

function initDetailModal() {
  const modal = document.getElementById('detailModal');
  const closeBtn = document.getElementById('closeDetailModal');

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  }
}

function openDetailModal(record) {
  const modal = document.getElementById('detailModal');
  if (!modal) return;

  document.getElementById('detailModalTitle').textContent = record.tool || 'Submission Record';
  document.getElementById('detailModalTime').textContent = new Date(record.timestamp).toLocaleString('en-IN');
  document.getElementById('detailModalUser').textContent = record.userName || 'N/A';

  const inputsPre = document.getElementById('detailModalInputsPre');
  const resultPre = document.getElementById('detailModalResultPre');

  if (inputsPre) inputsPre.textContent = JSON.stringify(record.inputs, null, 2);
  if (resultPre) resultPre.textContent = JSON.stringify(record.result, null, 2);

  modal.classList.add('active');
}

function escapeHtml(str) {
  if (typeof str !== 'string') return String(str || '');
  return str.replace(/[&<>"']/g, function (m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m];
  });
}
