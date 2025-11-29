import { create } from 'zustand';
import type { Income, Expense, BudgetSummary } from '../types';
import { dbOperations, DB_KEYS } from '../utils/db';
import { getDaysRemainingInMonth } from '../utils/dateHelpers';

interface FinanceState {
    // Income
    incomes: Income[];
    addIncome: (income: Omit<Income, 'id'>) => Promise<void>;
    deleteIncome: (id: string) => Promise<void>;

    // Expenses
    expenses: Expense[];
    addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
    deleteExpense: (id: string) => Promise<void>;

    // Budget Summary
    getBudgetSummary: () => BudgetSummary;

    // Initialize
    initialize: () => Promise<void>;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
    incomes: [],
    expenses: [],

    addIncome: async (incomeData) => {
        const income: Income = {
            ...incomeData,
            id: Date.now().toString() + Math.random().toString(36).substring(2),
        };
        const updated = [...get().incomes, income];
        set({ incomes: updated });
        await dbOperations.saveData(DB_KEYS.INCOME, updated);
    },

    deleteIncome: async (id) => {
        const updated = get().incomes.filter(income => income.id !== id);
        set({ incomes: updated });
        await dbOperations.saveData(DB_KEYS.INCOME, updated);
    },

    addExpense: async (expenseData) => {
        const expense: Expense = {
            ...expenseData,
            id: Date.now().toString() + Math.random().toString(36).substring(2),
        };
        const updated = [...get().expenses, expense];
        set({ expenses: updated });
        await dbOperations.saveData(DB_KEYS.EXPENSES, updated);
    },

    deleteExpense: async (id) => {
        const updated = get().expenses.filter(expense => expense.id !== id);
        set({ expenses: updated });
        await dbOperations.saveData(DB_KEYS.EXPENSES, updated);
    },

    getBudgetSummary: () => {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        // Filter current month data
        const monthlyIncomes = get().incomes.filter(income => {
            const date = new Date(income.date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });

        const monthlyExpenses = get().expenses.filter(expense => {
            const date = new Date(expense.date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        });

        // Calculate totals
        const totalIncome = monthlyIncomes.reduce((sum, income) => sum + income.amount, 0);
        const totalExpenses = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);

        // Calculate fixed bills (recurring expenses)
        const fixedBills = monthlyExpenses
            .filter(expense => expense.category === 'فواتير')
            .reduce((sum, expense) => sum + expense.amount, 0);

        const currentBalance = totalIncome - totalExpenses;
        const daysRemaining = getDaysRemainingInMonth();

        // Safe daily spend = (current balance - estimated future bills) / days remaining
        const safeDailySpend = daysRemaining > 0
            ? Math.max(0, currentBalance / daysRemaining)
            : 0;

        return {
            totalIncome,
            totalExpenses,
            currentBalance,
            fixedBills,
            safeDailySpend,
            daysRemainingInMonth: daysRemaining,
        };
    },

    initialize: async () => {
        try {
            const [incomes, expenses] = await Promise.all([
                dbOperations.getData<Income[]>(DB_KEYS.INCOME, []),
                dbOperations.getData<Expense[]>(DB_KEYS.EXPENSES, []),
            ]);

            set({ incomes, expenses });
        } catch (error) {
            console.error('Failed to initialize finance store:', error);
        }
    },
}));
