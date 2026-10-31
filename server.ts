import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { storage } from './server/storage.js';
import {
  chatWithFinancialCoach,
  parseUnstructuredTransactions,
  generateScenarioEvaluation,
  generateMonthlyReviewActionables,
} from './server/gemini.js';
import { ScenarioParameters, ScenarioResult } from './src/types/finance.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// --- REST API Endpoints ---

// Full State
app.get('/api/data', (_req, res) => {
  try {
    const data = storage.getState();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Profile / Living Money Model
app.post('/api/profile', (req, res) => {
  try {
    const updated = storage.updateProfile(req.body);
    res.json({ success: true, profile: updated, metrics: storage.getState().metrics });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Add Single Transaction
app.post('/api/transactions', (req, res) => {
  try {
    const tx = storage.addTransaction(req.body);
    res.json({ success: true, transaction: tx, metrics: storage.getState().metrics });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Transaction (Category correction + Rule learning loop)
app.put('/api/transactions/:id', (req, res) => {
  try {
    const { updates, createLearningRule } = req.body;
    const tx = storage.updateTransaction(req.params.id, updates, createLearningRule);
    if (!tx) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }
    const state = storage.getState();
    res.json({ success: true, transaction: tx, rules: state.rules, metrics: state.metrics });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Transaction
app.delete('/api/transactions/:id', (req, res) => {
  try {
    const ok = storage.deleteTransaction(req.params.id);
    res.json({ success: ok, metrics: storage.getState().metrics });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Import Transactions Batch
app.post('/api/transactions/import', (req, res) => {
  try {
    const { transactions, source } = req.body;
    if (!Array.isArray(transactions)) {
      res.status(400).json({ error: 'transactions array required' });
      return;
    }
    const result = storage.importTransactions(transactions, source || 'csv');
    res.json({
      success: true,
      ...result,
      allTransactions: storage.getState().transactions,
      metrics: storage.getState().metrics,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Categorization Rules
app.post('/api/rules', (req, res) => {
  try {
    const rule = storage.addRule(req.body);
    res.json({ success: true, rule, allRules: storage.getState().rules, metrics: storage.getState().metrics });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/rules/:id', (req, res) => {
  try {
    const ok = storage.deleteRule(req.params.id);
    res.json({ success: ok, allRules: storage.getState().rules });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Recurring Commitments Actions
app.post('/api/recurring/:id/action', (req, res) => {
  try {
    const { action } = req.body;
    const item = storage.updateRecurringAction(req.params.id, action);
    if (!item) {
      res.status(404).json({ error: 'Recurring commitment not found' });
      return;
    }
    res.json({ success: true, recurring: item, allRecurring: storage.getState().recurring, metrics: storage.getState().metrics });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Dismiss Nudge Alert
app.post('/api/nudges/:id/dismiss', (req, res) => {
  try {
    const ok = storage.dismissNudge(req.params.id);
    res.json({ success: ok, allNudges: storage.getState().nudges });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reset to Pristine Demo
app.post('/api/reset-data', (_req, res) => {
  try {
    const resetState = storage.resetToDefault();
    res.json({ success: true, state: resetState });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- AI Endpoints ---

// AI Financial Coach Chat
app.post('/api/ai/coach', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }
    const state = storage.getState();
    const reply = await chatWithFinancialCoach(message, history || [], state);
    res.json({ reply, metricsSnapshot: state.metrics });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// AI Document & Unstructured Statement / SMS Parser
app.post('/api/ai/parse-statement', async (req, res) => {
  try {
    const { rawText, sourceType } = req.body;
    if (!rawText) {
      res.status(400).json({ error: 'rawText is required' });
      return;
    }
    const parsed = await parseUnstructuredTransactions(rawText, sourceType || 'pdf_ocr');
    res.json({ success: true, transactions: parsed });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// AI Scenario Analysis
app.post('/api/ai/scenario-analysis', async (req, res) => {
  try {
    const { params, baseline, simulated, currency } = req.body as {
      params: ScenarioParameters;
      baseline: ScenarioResult['baseline'];
      simulated: ScenarioResult['simulated'];
      currency: string;
    };
    const result: ScenarioResult = { baseline, simulated };
    const analysis = await generateScenarioEvaluation(params, result, currency || 'USD');
    res.json({ success: true, analysis });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// AI Monthly Review
app.post('/api/ai/monthly-review', async (req, res) => {
  try {
    const { monthName } = req.body;
    const state = storage.getState();
    const actionables = await generateMonthlyReviewActionables(monthName || 'October 2026', state);
    res.json({ success: true, actionables });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Server Lifecycle & Vite Middlewares ---

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FINMATE AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
