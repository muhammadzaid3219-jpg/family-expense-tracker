import React, { useState, useMemo } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line
} from "recharts";
import {
  Wallet, TrendingUp, TrendingDown, PiggyBank, AlertTriangle, Plus,
  Trash2, Pencil, Users, Receipt, Target, Repeat, BarChart3, Moon, Sun,
  Calendar, X, Check, LayoutDashboard, Cloud
} from "lucide-react";
import { useCollection, useConfigDoc } from "./firestoreHooks";

// ---------- Constants ----------
const DEFAULT_CATEGORIES = [
  "Grocery / Rashan", "Rent / Ghar ka Kiraya", "Electricity Bill", "Gas Bill",
  "Water Bill", "Internet / Mobile", "Education / School Fees", "Medical / Medicine",
  "Transport / Fuel", "Shopping / Clothes", "Food / Restaurant", "Family Events"
];
const PAYMENT_METHODS = ["Cash", "Bank", "Card", "Easypaisa", "JazzCash"];
const INCOME_SOURCES = ["Salary", "Business", "Other income"];

const PALETTE = ["#16665A", "#C98A2C", "#7A3B3B", "#3B6E8F", "#6B7F3B", "#8A5FA5", "#B85C3E", "#4A7C6F", "#9C6B2E", "#5C5C8A", "#2E7D6B", "#A54747"];

const uid = () => Math.random().toString(36).slice(2, 10);
const fmt = (n) => "Rs " + Math.round(Number(n) || 0).toLocaleString("en-PK");
const todayISO = () => new Date().toISOString().slice(0, 10);
const monthKey = (dateStr) => dateStr.slice(0, 7);
const thisMonthKey = () => todayISO().slice(0, 7);
const monthLabel = (key) => {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString("en-US", { month: "short", year: "2-digit" });
};

// ---------- Seed Data ----------
const seedMembers = [
  { id: uid(), name: "Abu" },
  { id: uid(), name: "Ammi" },
  { id: uid(), name: "Brother" },
  { id: uid(), name: "Sister" },
];

const seedIncomes = [
  { id: uid(), source: "Salary", amount: 150000, date: todayISO(), notes: "Monthly salary" },
];

const seedBudgets = {
  "Grocery / Rashan": 25000,
  "Rent / Ghar ka Kiraya": 30000,
  "Electricity Bill": 12000,
  "Gas Bill": 4000,
  "Water Bill": 1500,
  "Internet / Mobile": 3000,
  "Education / School Fees": 10000,
  "Medical / Medicine": 6000,
  "Transport / Fuel": 8000,
  "Shopping / Clothes": 6000,
  "Food / Restaurant": 5000,
  "Family Events": 4000,
};

const seedExpenses = [
  { id: uid(), date: todayISO(), category: "Grocery / Rashan", amount: 8200, member: "Ammi", method: "Easypaisa", notes: "Weekly grocery" },
  { id: uid(), date: todayISO(), category: "Electricity Bill", amount: 9800, member: "Abu", method: "Bank", notes: "" },
  { id: uid(), date: todayISO(), category: "Transport / Fuel", amount: 5000, member: "Abu", method: "Cash", notes: "Petrol" },
  { id: uid(), date: todayISO(), category: "Education / School Fees", amount: 10000, member: "Ammi", method: "Bank", notes: "School fee" },
];

const seedGoals = [
  { id: uid(), name: "Emergency Fund", target: 100000, current: 32000, deadline: "2026-12-31" },
  { id: uid(), name: "Eid Shopping", target: 40000, current: 15000, deadline: "2027-03-15" },
];

const seedRecurring = [
  { id: uid(), name: "Rent", category: "Rent / Ghar ka Kiraya", amount: 30000, dueDay: 1 },
  { id: uid(), name: "Internet", category: "Internet / Mobile", amount: 3000, dueDay: 5 },
  { id: uid(), name: "School Fee", category: "Education / School Fees", amount: 10000, dueDay: 10 },
];

// ---------- Small UI atoms ----------
function Card({ children, className = "" }) {
  return <div className={`kh-card ${className}`}>{children}</div>;
}

function IconBadge({ children, tone }) {
  return <div className={`kh-badge kh-tone-${tone}`}>{children}</div>;
}

function ProgressBar({ pct, tone }) {
  const clamped = Math.min(pct, 100);
  return (
    <div className="kh-progress-track">
      <div
        className={`kh-progress-fill kh-tone-${tone}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="kh-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

// ---------- Main App ----------
export default function FamilyKhata() {
  const [dark, setDark] = useState(false);
  const [tab, setTab] = useState("dashboard");

  const { items: members, addItem: addMemberDoc, deleteItem: deleteMemberDoc, ready: membersReady } = useCollection("members", seedMembers);
  const { items: incomes, addItem: addIncomeDoc, deleteItem: deleteIncomeDoc, ready: incomesReady } = useCollection("incomes", seedIncomes);
  const { items: expenses, addItem: addExpenseDoc, updateItem: updateExpenseDoc, deleteItem: deleteExpenseDoc, ready: expensesReady } = useCollection("expenses", seedExpenses);
  const { items: goals, addItem: addGoalDoc, updateItem: updateGoalDoc, deleteItem: deleteGoalDoc, ready: goalsReady } = useCollection("goals", seedGoals);
  const { items: recurring, addItem: addRecurringDoc, deleteItem: deleteRecurringDoc, ready: recurringReady } = useCollection("recurring", seedRecurring);
  const { config, updateConfig, ready: configReady } = useConfigDoc({ categories: DEFAULT_CATEGORIES, budgets: seedBudgets });
  const categories = config.categories || DEFAULT_CATEGORIES;
  const budgets = config.budgets || {};

  const allReady = membersReady && incomesReady && expensesReady && goalsReady && recurringReady && configReady;

  const month = thisMonthKey();

  const monthIncomes = useMemo(() => incomes.filter(i => monthKey(i.date) === month), [incomes, month]);
  const monthExpenses = useMemo(() => expenses.filter(e => monthKey(e.date) === month), [expenses, month]);

  const totalIncome = monthIncomes.reduce((s, i) => s + Number(i.amount), 0);
  const totalExpense = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const balance = totalIncome - totalExpense;
  const totalSavings = goals.reduce((s, g) => s + Number(g.current), 0);

  const categorySpend = useMemo(() => {
    const map = {};
    monthExpenses.forEach(e => { map[e.category] = (map[e.category] || 0) + Number(e.amount); });
    return map;
  }, [monthExpenses]);

  const memberSpend = useMemo(() => {
    const map = {};
    monthExpenses.forEach(e => { map[e.member] = (map[e.member] || 0) + Number(e.amount); });
    return map;
  }, [monthExpenses]);

  const alerts = useMemo(() => {
    const list = [];
    categories.forEach(cat => {
      const budget = Number(budgets[cat] || 0);
      const spent = categorySpend[cat] || 0;
      if (budget > 0) {
        const pct = (spent / budget) * 100;
        if (pct >= 100) list.push({ cat, pct, level: "over" });
        else if (pct >= 80) list.push({ cat, pct, level: "warn" });
      }
    });
    return list;
  }, [categories, budgets, categorySpend]);

  const last6Months = useMemo(() => {
    const arr = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const inc = incomes.filter(x => monthKey(x.date) === key).reduce((s, x) => s + Number(x.amount), 0);
      const exp = expenses.filter(x => monthKey(x.date) === key).reduce((s, x) => s + Number(x.amount), 0);
      arr.push({ key, label: monthLabel(key), Income: inc, Expenses: exp });
    }
    return arr;
  }, [incomes, expenses]);

  const pieData = Object.entries(categorySpend).map(([name, value]) => ({ name, value }));

  // ---------- CRUD helpers (all writes go straight to Firestore; the
  // realtime listeners above pick the change back up automatically) ----------
  const addIncome = (payload) => addIncomeDoc(payload);
  const deleteIncome = (id) => deleteIncomeDoc(id);

  const addExpense = (payload) => addExpenseDoc(payload);
  const updateExpense = (id, payload) => updateExpenseDoc(id, payload);
  const deleteExpense = (id) => deleteExpenseDoc(id);

  const addMember = (name) => addMemberDoc({ name });
  const deleteMember = (id) => deleteMemberDoc(id);

  const addCategory = (name) => {
    if (name && !categories.includes(name)) {
      updateConfig({ categories: [...categories, name], budgets: { ...budgets, [name]: 0 } });
    }
  };

  const setBudgetFor = (cat, amount) => updateConfig({ budgets: { ...budgets, [cat]: amount } });

  const addGoal = (payload) => addGoalDoc({ current: 0, ...payload });
  const updateGoalAmount = (id, delta) => {
    const g = goals.find(x => x.id === id);
    if (!g) return;
    updateGoalDoc(id, { current: Math.max(0, Number(g.current) + delta) });
  };
  const deleteGoal = (id) => deleteGoalDoc(id);

  const addRecurring = (payload) => addRecurringDoc(payload);
  const deleteRecurring = (id) => deleteRecurringDoc(id);
  const applyRecurring = (r) => {
    addExpense({
      date: todayISO(), category: r.category, amount: r.amount,
      member: members[0]?.name || "Family", method: "Bank", notes: `Recurring: ${r.name}`
    });
  };

  const upcomingBills = recurring.map(r => {
    const now = new Date();
    let due = new Date(now.getFullYear(), now.getMonth(), r.dueDay);
    if (due < now) due = new Date(now.getFullYear(), now.getMonth() + 1, r.dueDay);
    const daysLeft = Math.ceil((due - now) / 86400000);
    return { ...r, due, daysLeft };
  }).sort((a, b) => a.daysLeft - b.daysLeft);

  const exportCSV = () => {
    const header = "Date,Category,Amount,Member,Method,Notes\n";
    const rows = expenses.map(e => `${e.date},"${e.category}",${e.amount},${e.member},${e.method},"${e.notes || ""}"`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "family-khata-expenses.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "income", label: "Income", icon: TrendingUp },
    { id: "expenses", label: "Expenses", icon: Receipt },
    { id: "budget", label: "Budget", icon: Wallet },
    { id: "family", label: "Family", icon: Users },
    { id: "goals", label: "Savings", icon: Target },
    { id: "recurring", label: "Recurring", icon: Repeat },
    { id: "reports", label: "Reports", icon: BarChart3 },
  ];

  if (!allReady) {
    return (
      <div className={dark ? "kh-root kh-dark" : "kh-root"} style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <style>{CSS}</style>
        <div style={{ textAlign: "center", color: "var(--kh-text-soft)" }}>
          <Cloud size={28} style={{ marginBottom: 10 }} />
          <div>Connecting to Firebase…</div>
        </div>
      </div>
    );
  }

  return (
    <div className={dark ? "kh-root kh-dark" : "kh-root"}>
      <style>{CSS}</style>

      <div className="kh-shell">
        {/* Spine / sidebar */}
        <aside className="kh-spine">
          <div className="kh-spine-top">
            <div className="kh-logo">
              <span className="kh-logo-mark">Kh</span>
              <div>
                <div className="kh-logo-title">Family Khata</div>
                <div className="kh-logo-sub">apna hisaab, apne haath</div>
              </div>
            </div>
          </div>
          <nav className="kh-nav">
            {tabs.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  className={`kh-nav-item ${tab === t.id ? "active" : ""}`}
                  onClick={() => setTab(t.id)}
                >
                  <Icon size={17} strokeWidth={2} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </nav>
          <button className="kh-theme-toggle" onClick={() => setDark(d => !d)}>
            {dark ? <Sun size={16} /> : <Moon size={16} />}
            <span>{dark ? "Light mode" : "Dark mode"}</span>
          </button>
        </aside>

        {/* Main content */}
        <main className="kh-main">
          <header className="kh-topbar">
            <div>
              <div className="kh-eyebrow">Masehab &middot; {monthLabel(month)}</div>
              <h1>{tabs.find(t => t.id === tab)?.label}</h1>
            </div>
            <div className="kh-topbar-actions">
              <span className="kh-sync-badge"><Cloud size={14} /> Synced to Firebase</span>
              <button className="kh-ghost-btn" onClick={exportCSV}><Receipt size={15} /> Export CSV</button>
            </div>
          </header>

          {tab === "dashboard" && (
            <Dashboard
              totalIncome={totalIncome} totalExpense={totalExpense} balance={balance}
              totalSavings={totalSavings} alerts={alerts} categories={categories}
              budgets={budgets} categorySpend={categorySpend} expenses={monthExpenses}
              last6Months={last6Months}
            />
          )}
          {tab === "income" && (
            <IncomeTab incomes={incomes} addIncome={addIncome} deleteIncome={deleteIncome} />
          )}
          {tab === "expenses" && (
            <ExpensesTab
              expenses={expenses} categories={categories} members={members}
              addExpense={addExpense} updateExpense={updateExpense} deleteExpense={deleteExpense}
            />
          )}
          {tab === "budget" && (
            <BudgetTab
              categories={categories} budgets={budgets} categorySpend={categorySpend}
              setBudgetFor={setBudgetFor} addCategory={addCategory}
            />
          )}
          {tab === "family" && (
            <FamilyTab members={members} addMember={addMember} deleteMember={deleteMember} memberSpend={memberSpend} />
          )}
          {tab === "goals" && (
            <GoalsTab goals={goals} addGoal={addGoal} updateGoalAmount={updateGoalAmount} deleteGoal={deleteGoal} />
          )}
          {tab === "recurring" && (
            <RecurringTab
              recurring={recurring} categories={categories} addRecurring={addRecurring}
              deleteRecurring={deleteRecurring} applyRecurring={applyRecurring} upcomingBills={upcomingBills}
            />
          )}
          {tab === "reports" && (
            <ReportsTab
              pieData={pieData} last6Months={last6Months} totalIncome={totalIncome}
              totalExpense={totalExpense} balance={balance} totalSavings={totalSavings}
              categorySpend={categorySpend} memberSpend={memberSpend}
            />
          )}
        </main>
      </div>
    </div>
  );
}

// ---------- Dashboard ----------
function Dashboard({ totalIncome, totalExpense, balance, totalSavings, alerts, categories, budgets, categorySpend, expenses, last6Months }) {
  return (
    <div className="kh-stack">
      <div className="kh-grid-4">
        <Card className="kh-stat">
          <IconBadge tone="income"><TrendingUp size={18} /></IconBadge>
          <div className="kh-stat-label">Monthly Income</div>
          <div className="kh-stat-value">{fmt(totalIncome)}</div>
        </Card>
        <Card className="kh-stat">
          <IconBadge tone="expense"><TrendingDown size={18} /></IconBadge>
          <div className="kh-stat-label">Total Expenses</div>
          <div className="kh-stat-value">{fmt(totalExpense)}</div>
        </Card>
        <Card className="kh-stat">
          <IconBadge tone="balance"><Wallet size={18} /></IconBadge>
          <div className="kh-stat-label">Remaining Balance</div>
          <div className="kh-stat-value">{fmt(balance)}</div>
        </Card>
        <Card className="kh-stat">
          <IconBadge tone="savings"><PiggyBank size={18} /></IconBadge>
          <div className="kh-stat-label">Total Savings</div>
          <div className="kh-stat-value">{fmt(totalSavings)}</div>
        </Card>
      </div>

      {alerts.length > 0 && (
        <Card className="kh-alerts">
          <div className="kh-section-title"><AlertTriangle size={16} /> Budget Alerts</div>
          <div className="kh-alert-list">
            {alerts.map(a => (
              <div key={a.cat} className={`kh-alert kh-alert-${a.level}`}>
                <span>{a.cat}</span>
                <span>{Math.round(a.pct)}% of budget used {a.level === "over" ? "— over budget" : ""}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="kh-grid-2">
        <Card>
          <div className="kh-section-title">Budget Status</div>
          <div className="kh-budget-list">
            {categories.map(cat => {
              const budget = Number(budgets[cat] || 0);
              const spent = categorySpend[cat] || 0;
              const pct = budget > 0 ? (spent / budget) * 100 : 0;
              const tone = pct >= 100 ? "expense" : pct >= 80 ? "warn" : "income";
              return (
                <div key={cat} className="kh-budget-row">
                  <div className="kh-budget-row-top">
                    <span>{cat}</span>
                    <span>{fmt(spent)} / {fmt(budget)}</span>
                  </div>
                  <ProgressBar pct={pct} tone={tone} />
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <div className="kh-section-title">Recent Transactions</div>
          <div className="kh-tx-list">
            {expenses.slice(0, 8).map(e => (
              <div key={e.id} className="kh-tx-row">
                <div>
                  <div className="kh-tx-cat">{e.category}</div>
                  <div className="kh-tx-meta">{e.date} &middot; {e.member} &middot; {e.method}</div>
                </div>
                <div className="kh-tx-amount">{fmt(e.amount)}</div>
              </div>
            ))}
            {expenses.length === 0 && <div className="kh-empty">No transactions yet this month.</div>}
          </div>
        </Card>
      </div>

      <Card>
        <div className="kh-section-title">Monthly Comparison</div>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={last6Months}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--kh-grid)" />
              <XAxis dataKey="label" stroke="var(--kh-text-soft)" fontSize={12} />
              <YAxis stroke="var(--kh-text-soft)" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: "var(--kh-card)", border: "1px solid var(--kh-border)", borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="Income" fill="#16665A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expenses" fill="#A54747" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

// ---------- Income Tab ----------
function IncomeTab({ incomes, addIncome, deleteIncome }) {
  const [form, setForm] = useState({ source: INCOME_SOURCES[0], amount: "", date: todayISO(), notes: "" });
  const submit = (e) => {
    e.preventDefault();
    if (!form.amount) return;
    addIncome({ ...form, amount: Number(form.amount) });
    setForm({ source: INCOME_SOURCES[0], amount: "", date: todayISO(), notes: "" });
  };
  return (
    <div className="kh-grid-2">
      <Card>
        <div className="kh-section-title"><Plus size={16} /> Add Income</div>
        <form className="kh-form" onSubmit={submit}>
          <Field label="Source">
            <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
              {INCOME_SOURCES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Amount (PKR)">
            <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="150000" />
          </Field>
          <Field label="Date">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </Field>
          <Field label="Notes">
            <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional note" />
          </Field>
          <button className="kh-btn" type="submit">Add Income</button>
        </form>
      </Card>
      <Card>
        <div className="kh-section-title">Income History</div>
        <div className="kh-tx-list">
          {incomes.map(i => (
            <div key={i.id} className="kh-tx-row">
              <div>
                <div className="kh-tx-cat">{i.source}</div>
                <div className="kh-tx-meta">{i.date}{i.notes ? ` · ${i.notes}` : ""}</div>
              </div>
              <div className="kh-tx-right">
                <span className="kh-tx-amount kh-amount-income">{fmt(i.amount)}</span>
                <button className="kh-icon-btn" onClick={() => deleteIncome(i.id)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          {incomes.length === 0 && <div className="kh-empty">No income recorded yet.</div>}
        </div>
      </Card>
    </div>
  );
}

// ---------- Expenses Tab ----------
function ExpensesTab({ expenses, categories, members, addExpense, updateExpense, deleteExpense }) {
  const blank = { date: todayISO(), category: categories[0], amount: "", member: members[0]?.name || "", method: PAYMENT_METHODS[0], notes: "" };
  const [form, setForm] = useState(blank);
  const [editingId, setEditingId] = useState(null);

  const submit = (e) => {
    e.preventDefault();
    if (!form.amount) return;
    if (editingId) {
      updateExpense(editingId, { ...form, amount: Number(form.amount) });
      setEditingId(null);
    } else {
      addExpense({ ...form, amount: Number(form.amount) });
    }
    setForm(blank);
  };

  const startEdit = (exp) => {
    setEditingId(exp.id);
    setForm({ date: exp.date, category: exp.category, amount: exp.amount, member: exp.member, method: exp.method, notes: exp.notes || "" });
  };

  return (
    <div className="kh-grid-2">
      <Card>
        <div className="kh-section-title"><Plus size={16} /> {editingId ? "Edit Expense" : "Add Expense"}</div>
        <form className="kh-form" onSubmit={submit}>
          <Field label="Date">
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </Field>
          <Field label="Category">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Amount (PKR)">
            <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="1000" />
          </Field>
          <Field label="Family Member">
            <select value={form.member} onChange={e => setForm(f => ({ ...f, member: e.target.value }))}>
              {members.map(m => <option key={m.id}>{m.name}</option>)}
            </select>
          </Field>
          <Field label="Payment Method">
            <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}>
              {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Notes">
            <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional description" />
          </Field>
          <div className="kh-form-actions">
            <button className="kh-btn" type="submit">{editingId ? "Save Changes" : "Add Expense"}</button>
            {editingId && <button type="button" className="kh-ghost-btn" onClick={() => { setEditingId(null); setForm(blank); }}>Cancel</button>}
          </div>
        </form>
      </Card>
      <Card>
        <div className="kh-section-title">All Expenses</div>
        <div className="kh-tx-list kh-tx-list-tall">
          {expenses.map(e => (
            <div key={e.id} className="kh-tx-row">
              <div>
                <div className="kh-tx-cat">{e.category}</div>
                <div className="kh-tx-meta">{e.date} · {e.member} · {e.method}{e.notes ? ` · ${e.notes}` : ""}</div>
              </div>
              <div className="kh-tx-right">
                <span className="kh-tx-amount kh-amount-expense">{fmt(e.amount)}</span>
                <button className="kh-icon-btn" onClick={() => startEdit(e)}><Pencil size={14} /></button>
                <button className="kh-icon-btn" onClick={() => deleteExpense(e.id)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          {expenses.length === 0 && <div className="kh-empty">No expenses recorded yet.</div>}
        </div>
      </Card>
    </div>
  );
}

// ---------- Budget Tab ----------
function BudgetTab({ categories, budgets, categorySpend, setBudgetFor, addCategory }) {
  const [newCat, setNewCat] = useState("");
  return (
    <div className="kh-stack">
      <Card>
        <div className="kh-section-title">Allocate Category Budgets</div>
        <div className="kh-budget-grid">
          {categories.map(cat => {
            const budget = Number(budgets[cat] || 0);
            const spent = categorySpend[cat] || 0;
            const remaining = budget - spent;
            const pct = budget > 0 ? (spent / budget) * 100 : 0;
            const tone = pct >= 100 ? "expense" : pct >= 80 ? "warn" : "income";
            return (
              <div key={cat} className="kh-budget-card">
                <div className="kh-budget-card-top">
                  <span>{cat}</span>
                  <input
                    type="number"
                    value={budget}
                    onChange={e => setBudgetFor(cat, Number(e.target.value))}
                  />
                </div>
                <ProgressBar pct={pct} tone={tone} />
                <div className="kh-budget-card-bottom">
                  <span>Spent {fmt(spent)}</span>
                  <span className={remaining < 0 ? "kh-neg" : ""}>{remaining < 0 ? "Over by " + fmt(-remaining) : "Left " + fmt(remaining)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      <Card>
        <div className="kh-section-title"><Plus size={16} /> Add Custom Category</div>
        <form className="kh-form kh-form-row" onSubmit={(e) => { e.preventDefault(); addCategory(newCat.trim()); setNewCat(""); }}>
          <input type="text" value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="e.g. Pets, Charity, Travel" />
          <button className="kh-btn" type="submit">Add Category</button>
        </form>
      </Card>
    </div>
  );
}

// ---------- Family Tab ----------
function FamilyTab({ members, addMember, deleteMember, memberSpend }) {
  const [name, setName] = useState("");
  return (
    <div className="kh-grid-2">
      <Card>
        <div className="kh-section-title"><Users size={16} /> Family Members</div>
        <form className="kh-form kh-form-row" onSubmit={(e) => { e.preventDefault(); if (name.trim()) { addMember(name.trim()); setName(""); } }}>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Add member name" />
          <button className="kh-btn" type="submit">Add</button>
        </form>
        <div className="kh-tx-list">
          {members.map(m => (
            <div key={m.id} className="kh-tx-row">
              <div className="kh-tx-cat">{m.name}</div>
              <button className="kh-icon-btn" onClick={() => deleteMember(m.id)}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <div className="kh-section-title">Member-wise Spending (this month)</div>
        <div className="kh-tx-list">
          {members.map(m => (
            <div key={m.id} className="kh-tx-row">
              <div className="kh-tx-cat">{m.name}</div>
              <span className="kh-tx-amount kh-amount-expense">{fmt(memberSpend[m.name] || 0)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ---------- Goals Tab ----------
function GoalsTab({ goals, addGoal, updateGoalAmount, deleteGoal }) {
  const [form, setForm] = useState({ name: "", target: "", deadline: "" });
  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.target) return;
    addGoal({ name: form.name, target: Number(form.target), deadline: form.deadline });
    setForm({ name: "", target: "", deadline: "" });
  };
  return (
    <div className="kh-stack">
      <Card>
        <div className="kh-section-title"><Plus size={16} /> New Saving Goal</div>
        <form className="kh-form kh-form-row-3" onSubmit={submit}>
          <input type="text" placeholder="Goal name (e.g. Emergency Fund)" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <input type="number" placeholder="Target amount" value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))} />
          <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
          <button className="kh-btn" type="submit">Create Goal</button>
        </form>
      </Card>
      <div className="kh-grid-2">
        {goals.map(g => {
          const pct = g.target > 0 ? (g.current / g.target) * 100 : 0;
          return (
            <Card key={g.id}>
              <div className="kh-goal-top">
                <div>
                  <div className="kh-goal-name">{g.name}</div>
                  <div className="kh-tx-meta">Deadline: {g.deadline || "—"}</div>
                </div>
                <button className="kh-icon-btn" onClick={() => deleteGoal(g.id)}><Trash2 size={14} /></button>
              </div>
              <ProgressBar pct={pct} tone="savings" />
              <div className="kh-budget-card-bottom">
                <span>{fmt(g.current)} saved</span>
                <span>{Math.min(100, Math.round(pct))}% of {fmt(g.target)}</span>
              </div>
              <div className="kh-goal-actions">
                <button className="kh-ghost-btn" onClick={() => updateGoalAmount(g.id, 1000)}>+ Rs 1,000</button>
                <button className="kh-ghost-btn" onClick={() => updateGoalAmount(g.id, 5000)}>+ Rs 5,000</button>
                <button className="kh-ghost-btn" onClick={() => updateGoalAmount(g.id, -1000)}>- Rs 1,000</button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Recurring Tab ----------
function RecurringTab({ recurring, categories, addRecurring, deleteRecurring, applyRecurring, upcomingBills }) {
  const [form, setForm] = useState({ name: "", category: categories[0], amount: "", dueDay: 1 });
  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.amount) return;
    addRecurring({ ...form, amount: Number(form.amount), dueDay: Number(form.dueDay) });
    setForm({ name: "", category: categories[0], amount: "", dueDay: 1 });
  };
  return (
    <div className="kh-grid-2">
      <Card>
        <div className="kh-section-title"><Plus size={16} /> Add Recurring Expense</div>
        <form className="kh-form" onSubmit={submit}>
          <Field label="Name">
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Rent" />
          </Field>
          <Field label="Category">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Amount (PKR)">
            <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </Field>
          <Field label="Repeat Day of Month">
            <input type="number" min="1" max="28" value={form.dueDay} onChange={e => setForm(f => ({ ...f, dueDay: e.target.value }))} />
          </Field>
          <button className="kh-btn" type="submit">Add Recurring Expense</button>
        </form>
      </Card>
      <Card>
        <div className="kh-section-title"><Calendar size={16} /> Upcoming Bills</div>
        <div className="kh-tx-list">
          {upcomingBills.map(r => (
            <div key={r.id} className="kh-tx-row">
              <div>
                <div className="kh-tx-cat">{r.name}</div>
                <div className="kh-tx-meta">{r.category} · Due in {r.daysLeft} day{r.daysLeft === 1 ? "" : "s"}</div>
              </div>
              <div className="kh-tx-right">
                <span className="kh-tx-amount kh-amount-expense">{fmt(r.amount)}</span>
                <button className="kh-icon-btn" title="Log as paid this month" onClick={() => applyRecurring(r)}><Check size={14} /></button>
                <button className="kh-icon-btn" onClick={() => deleteRecurring(r.id)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          {recurring.length === 0 && <div className="kh-empty">No recurring expenses set up yet.</div>}
        </div>
      </Card>
    </div>
  );
}

// ---------- Reports Tab ----------
function ReportsTab({ pieData, last6Months, totalIncome, totalExpense, balance, totalSavings, categorySpend, memberSpend }) {
  return (
    <div className="kh-stack">
      <div className="kh-grid-4">
        <Card className="kh-stat kh-stat-compact"><div className="kh-stat-label">Income</div><div className="kh-stat-value">{fmt(totalIncome)}</div></Card>
        <Card className="kh-stat kh-stat-compact"><div className="kh-stat-label">Expenses</div><div className="kh-stat-value">{fmt(totalExpense)}</div></Card>
        <Card className="kh-stat kh-stat-compact"><div className="kh-stat-label">Balance</div><div className="kh-stat-value">{fmt(balance)}</div></Card>
        <Card className="kh-stat kh-stat-compact"><div className="kh-stat-label">Savings</div><div className="kh-stat-value">{fmt(totalSavings)}</div></Card>
      </div>
      <div className="kh-grid-2">
        <Card>
          <div className="kh-section-title">Category-wise Expenses</div>
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label={(d) => d.name}>
                  {pieData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: "var(--kh-card)", border: "1px solid var(--kh-border)", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <div className="kh-section-title">Income vs Expenses Trend</div>
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={last6Months}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--kh-grid)" />
                <XAxis dataKey="label" stroke="var(--kh-text-soft)" fontSize={12} />
                <YAxis stroke="var(--kh-text-soft)" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background: "var(--kh-card)", border: "1px solid var(--kh-border)", borderRadius: 8 }} />
                <Legend />
                <Line type="monotone" dataKey="Income" stroke="#16665A" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Expenses" stroke="#A54747" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <Card>
        <div className="kh-section-title">Family Member Spending</div>
        <div className="kh-tx-list">
          {Object.entries(memberSpend).map(([name, val]) => (
            <div key={name} className="kh-tx-row">
              <div className="kh-tx-cat">{name}</div>
              <span className="kh-tx-amount kh-amount-expense">{fmt(val)}</span>
            </div>
          ))}
          {Object.keys(memberSpend).length === 0 && <div className="kh-empty">No expenses logged this month.</div>}
        </div>
      </Card>
    </div>
  );
}

// ---------- Styles ----------
const CSS = `
:root {
  --kh-bg: #F1F5F0;
  --kh-card: #FFFFFF;
  --kh-border: #DCE3D8;
  --kh-grid: #E4E9E1;
  --kh-text: #1C2B22;
  --kh-text-soft: #5C6B5F;
  --kh-primary: #16665A;
  --kh-primary-soft: #E4F0EC;
  --kh-gold: #C98A2C;
  --kh-gold-soft: #FBF1DF;
  --kh-red: #A54747;
  --kh-red-soft: #F8E9E9;
}
.kh-dark {
  --kh-bg: #12201A;
  --kh-card: #1A2D24;
  --kh-border: #2B4438;
  --kh-grid: #2B4438;
  --kh-text: #E9F1EB;
  --kh-text-soft: #9BB3A4;
  --kh-primary: #3FA98F;
  --kh-primary-soft: #1F3A31;
  --kh-gold: #E0A83E;
  --kh-gold-soft: #3A2E18;
  --kh-red: #E27575;
  --kh-red-soft: #3A2323;
}
.kh-root { font-family: 'Manrope', 'Segoe UI', sans-serif; background: var(--kh-bg); color: var(--kh-text); min-height: 100%; transition: background .2s, color .2s; }
.kh-shell { display: flex; min-height: 100vh; }
.kh-spine { width: 220px; flex-shrink: 0; background: var(--kh-card); border-right: 1px solid var(--kh-border); display: flex; flex-direction: column; padding: 20px 14px; gap: 20px; }
.kh-logo { display: flex; align-items: center; gap: 10px; padding: 0 6px; }
.kh-logo-mark { width: 38px; height: 38px; border-radius: 10px; background: var(--kh-primary); color: #fff; display: flex; align-items: center; justify-content: center; font-family: Georgia, serif; font-weight: 700; font-size: 17px; }
.kh-logo-title { font-family: Georgia, serif; font-weight: 700; font-size: 15.5px; letter-spacing: .2px; }
.kh-logo-sub { font-size: 11px; color: var(--kh-text-soft); }
.kh-nav { display: flex; flex-direction: column; gap: 3px; flex: 1; }
.kh-nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 9px; border: none; background: transparent; color: var(--kh-text-soft); font-size: 13.5px; font-weight: 600; cursor: pointer; text-align: left; transition: background .15s, color .15s; }
.kh-nav-item:hover { background: var(--kh-primary-soft); color: var(--kh-text); }
.kh-nav-item.active { background: var(--kh-primary); color: #fff; }
.kh-theme-toggle { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 9px; border: 1px solid var(--kh-border); background: transparent; color: var(--kh-text-soft); font-size: 12.5px; font-weight: 600; cursor: pointer; }
.kh-main { flex: 1; padding: 26px 32px 60px; max-width: 1180px; }
.kh-topbar { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 22px; flex-wrap: wrap; gap: 12px; }
.kh-eyebrow { font-size: 11.5px; text-transform: uppercase; letter-spacing: .8px; color: var(--kh-gold); font-weight: 700; margin-bottom: 4px; }
.kh-topbar h1 { font-family: Georgia, serif; font-size: 26px; margin: 0; }
.kh-topbar-actions { display: flex; gap: 10px; align-items: center; }
.kh-sync-badge { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: var(--kh-primary); background: var(--kh-primary-soft); padding: 7px 12px; border-radius: 20px; }
.kh-stack { display: flex; flex-direction: column; gap: 18px; }
.kh-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.kh-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 900px) { .kh-grid-4 { grid-template-columns: repeat(2, 1fr); } .kh-grid-2 { grid-template-columns: 1fr; } .kh-shell { flex-direction: column; } .kh-spine { width: 100%; flex-direction: row; flex-wrap: wrap; } .kh-nav { flex-direction: row; flex-wrap: wrap; } .kh-main { padding: 18px; } }
.kh-card { background: var(--kh-card); border: 1px solid var(--kh-border); border-radius: 14px; padding: 20px; }
.kh-stat { display: flex; flex-direction: column; gap: 6px; }
.kh-stat-compact { padding: 16px; }
.kh-badge { width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; margin-bottom: 4px; }
.kh-tone-income { background: var(--kh-primary-soft); color: var(--kh-primary); }
.kh-tone-expense { background: var(--kh-red-soft); color: var(--kh-red); }
.kh-tone-balance { background: var(--kh-gold-soft); color: var(--kh-gold); }
.kh-tone-savings { background: var(--kh-gold-soft); color: var(--kh-gold); }
.kh-tone-warn { background: var(--kh-gold-soft); color: var(--kh-gold); }
.kh-stat-label { font-size: 12.5px; color: var(--kh-text-soft); font-weight: 600; }
.kh-stat-value { font-family: Georgia, serif; font-size: 22px; font-weight: 700; }
.kh-section-title { display: flex; align-items: center; gap: 7px; font-weight: 700; font-size: 14px; margin-bottom: 14px; }
.kh-alerts { border-color: var(--kh-gold); }
.kh-alert-list { display: flex; flex-direction: column; gap: 8px; }
.kh-alert { display: flex; justify-content: space-between; padding: 9px 12px; border-radius: 9px; font-size: 13px; font-weight: 600; }
.kh-alert-warn { background: var(--kh-gold-soft); color: var(--kh-gold); }
.kh-alert-over { background: var(--kh-red-soft); color: var(--kh-red); }
.kh-budget-list, .kh-tx-list { display: flex; flex-direction: column; gap: 12px; max-height: 380px; overflow-y: auto; }
.kh-tx-list-tall { max-height: 520px; }
.kh-budget-row-top { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
.kh-progress-track { height: 8px; border-radius: 6px; background: var(--kh-grid); overflow: hidden; }
.kh-progress-fill { height: 100%; border-radius: 6px; transition: width .3s; }
.kh-progress-fill.kh-tone-income { background: var(--kh-primary); }
.kh-progress-fill.kh-tone-expense { background: var(--kh-red); }
.kh-progress-fill.kh-tone-warn { background: var(--kh-gold); }
.kh-progress-fill.kh-tone-savings { background: var(--kh-gold); }
.kh-tx-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--kh-border); }
.kh-tx-row:last-child { border-bottom: none; }
.kh-tx-cat { font-weight: 700; font-size: 13.5px; }
.kh-tx-meta { font-size: 11.5px; color: var(--kh-text-soft); margin-top: 2px; }
.kh-tx-amount { font-weight: 700; font-size: 13.5px; }
.kh-amount-income { color: var(--kh-primary); }
.kh-amount-expense { color: var(--kh-red); }
.kh-tx-right { display: flex; align-items: center; gap: 8px; }
.kh-icon-btn { border: 1px solid var(--kh-border); background: transparent; color: var(--kh-text-soft); border-radius: 7px; padding: 6px; cursor: pointer; display: flex; }
.kh-icon-btn:hover { color: var(--kh-red); border-color: var(--kh-red); }
.kh-empty { color: var(--kh-text-soft); font-size: 13px; padding: 10px 0; }
.kh-form { display: flex; flex-direction: column; gap: 12px; }
.kh-form-row { display: flex; flex-direction: row; gap: 10px; }
.kh-form-row-3 { display: grid; grid-template-columns: 2fr 1.2fr 1.2fr auto; gap: 10px; align-items: end; }
.kh-form-actions { display: flex; gap: 10px; }
.kh-field { display: flex; flex-direction: column; gap: 5px; font-size: 12.5px; font-weight: 600; color: var(--kh-text-soft); }
.kh-field input, .kh-field select, .kh-form-row input, .kh-form-row-3 input {
  border: 1px solid var(--kh-border); border-radius: 8px; padding: 9px 11px; font-size: 13.5px; background: var(--kh-bg); color: var(--kh-text); font-family: inherit;
}
.kh-btn { background: var(--kh-primary); color: #fff; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 700; font-size: 13.5px; cursor: pointer; }
.kh-btn:hover { opacity: .92; }
.kh-ghost-btn { background: transparent; border: 1px solid var(--kh-border); color: var(--kh-text); padding: 9px 14px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; }
.kh-budget-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
@media (max-width: 900px) { .kh-budget-grid { grid-template-columns: 1fr; } }
.kh-budget-card { border: 1px solid var(--kh-border); border-radius: 11px; padding: 14px; }
.kh-budget-card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 13px; font-weight: 700; gap: 10px; }
.kh-budget-card-top input { width: 90px; border: 1px solid var(--kh-border); border-radius: 7px; padding: 5px 8px; background: var(--kh-bg); color: var(--kh-text); text-align: right; }
.kh-budget-card-bottom { display: flex; justify-content: space-between; font-size: 12px; color: var(--kh-text-soft); margin-top: 8px; }
.kh-neg { color: var(--kh-red); font-weight: 700; }
.kh-goal-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
.kh-goal-name { font-family: Georgia, serif; font-weight: 700; font-size: 16px; }
.kh-goal-actions { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
`;
