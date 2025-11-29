import { create } from 'zustand';
import type { Income, Expense, BudgetSummary } from '../types';
import { dbOperations, DB_KEYS } from '../utils/db';
import { getDaysRemainingInMonth } from '../utils/dateHelpers';
import { supabase } from '../services/supabase';

interface TransactionRow {
    id: string;
    user_id: string;
    type: 'income' | 'expense';
    amount: number;
    category: string;
    date: string;
    description: string;
    created_at: string;
}

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
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                const newIncome: Income = {
                    ...incomeData,
                    amount: Number(incomeData.amount),
                    id: crypto.randomUUID(),
                    type: 'income',
                    recurring: false // Default for guest
                };
                const updatedIncomes = [...get().incomes, newIncome];
                set({ incomes: updatedIncomes });
                await dbOperations.saveData(DB_KEYS.INCOME, updatedIncomes);
                return;
            }

            const newTransaction = {
                user_id: user.id,
                type: 'income',
                amount: Number(incomeData.amount),
                category: incomeData.category,
                date: incomeData.date,
                description: incomeData.description,
                created_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('transactions')
                .insert(newTransaction)
                .select()
                .single();

            if (error) throw error;

            if (data) {
                const transaction = data as TransactionRow;
                const income: Income = {
                    id: transaction.id,
                    amount: transaction.amount,
                    category: transaction.category,
                    date: transaction.date,
                    description: transaction.description,
                    type: 'income',
                    recurring: false
                };
                set({ incomes: [...get().incomes, income] });
            }
        } catch (error) {
            console.error('Error adding income:', error);
        }
    },

    deleteIncome: async (id) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                const updatedIncomes = get().incomes.filter(income => income.id !== id);
                set({ incomes: updatedIncomes });
                await dbOperations.saveData(DB_KEYS.INCOME, updatedIncomes);
                return;
            }

            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', id);

            if (error) throw error;

            set({ incomes: get().incomes.filter(income => income.id !== id) });
        } catch (error) {
            console.error('Error deleting income:', error);
        }
    },

    addExpense: async (expenseData) => {
        try {
            const { data: { user } = {} } = await supabase.auth.getUser();

            if (!user) {
                const newExpense: Expense = {
                    ...expenseData,
                    amount: Number(expenseData.amount),
                    id: crypto.randomUUID(),
                    type: 'expense',
                    recurring: false
                };
                const updatedExpenses = [...get().expenses, newExpense];
                set({ expenses: updatedExpenses });
                await dbOperations.saveData(DB_KEYS.EXPENSES, updatedExpenses);
                return;
            }

            const newTransaction = {
                user_id: user.id,
                type: 'expense',
                amount: Number(expenseData.amount),
                category: expenseData.category,
                date: expenseData.date,
                description: expenseData.description,
                created_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('transactions')
                .insert(newTransaction)
                .select()
                .single();

            if (error) throw error;

            if (data) {
                const transaction = data as TransactionRow;
                const expense: Expense = {
                    id: transaction.id,
                    amount: transaction.amount,
                    category: transaction.category,
                    date: transaction.date,
                    description: transaction.description,
                    type: 'expense',
                    recurring: false
                };
                set({ expenses: [...get().expenses, expense] });
            }
        } catch (error) {
            console.error('Error adding expense:', error);
        }
    },

    deleteExpense: async (id) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                const updatedExpenses = get().expenses.filter(expense => expense.id !== id);
                set({ expenses: updatedExpenses });
                await dbOperations.saveData(DB_KEYS.EXPENSES, updatedExpenses);
                return;
            }

            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', id);

            if (error) throw error;

            set({ expenses: get().expenses.filter(expense => expense.id !== id) });
        } catch (error) {
            console.error('Error deleting expense:', error);
        }
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
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data, error } = await supabase
                    .from('transactions')
                    .select('*')
                    .order('date', { ascending: false });

                if (error) throw error;

                if (data) {
                    const transactions = data as TransactionRow[];
                    const incomes: Income[] = transactions
                        .filter(t => t.type === 'income')
                        .map(t => ({
                            id: t.id,
                            amount: t.amount,
                            category: t.category,
                            date: t.date,
                            description: t.description
                        }));

                    const expenses: Expense[] = transactions
                        .filter(t => t.type === 'expense')
                        .map(t => ({
                            id: t.id,
                            amount: t.amount,
                            category: t.category,
                            date: t.date,
                            description: t.description
                        }));

                    set({ incomes, expenses });
                }
            } else {
                // Fallback to local storage for guest
                const [incomes, expenses] = await Promise.all([
                    dbOperations.getData<Income[]>(DB_KEYS.INCOME, []),
                    dbOperations.getData<Expense[]>(DB_KEYS.EXPENSES, []),
                ]);
                set({ incomes, expenses });
            }
        } catch (error) {
            console.error('Failed to initialize finance store:', error);
        }
    },
}));
