import { storage } from './storage';
import type { Task, ShoppingItem, Transaction, DevelopmentGoal } from '../types';

export const commandParser = {
    parseAndExecute: (command: string): string => {
        const lowerCmd = command.toLowerCase();

        // --- QUERIES (Questions) ---

        // 1. Query Tasks
        if (lowerCmd.includes('ما هي مهامي') || lowerCmd.includes('what are my tasks') || lowerCmd.includes('وريني المهام')) {
            const tasks = storage.get<Task[]>('tasks') || [];
            const activeTasks = tasks.filter(t => !t.completed);
            if (activeTasks.length === 0) return 'ليس لديك مهام معلقة حالياً.';
            return `لديك ${activeTasks.length} مهام: ${activeTasks.map(t => t.title).slice(0, 3).join('، ')}...`;
        }

        // 2. Query Shopping List
        if (lowerCmd.includes('قائمة التسوق') || lowerCmd.includes('shopping list') || lowerCmd.includes('أغراض')) {
            const items = storage.get<ShoppingItem[]>('shoppingList') || [];
            const activeItems = items.filter(i => !i.purchased);
            if (activeItems.length === 0) return 'قائمة التسوق فارغة.';
            return `لديك ${activeItems.length} أغراض في القائمة: ${activeItems.map(i => i.name).slice(0, 5).join('، ')}...`;
        }

        // 3. Query Budget
        if (lowerCmd.includes('رصيد') || lowerCmd.includes('balance') || lowerCmd.includes('ميزانية')) {
            const transactions = storage.get<Transaction[]>('transactions') || [];
            const salary = parseFloat(storage.get<string>('salary') || '0');

            const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            const savings = transactions.filter(t => t.type === 'savings').reduce((sum, t) => sum + t.amount, 0);

            const balance = (income + salary) - (expense + savings);
            return `رصيدك الحالي هو ${balance.toFixed(2)}. (المصروفات: ${expense.toFixed(2)})`;
        }


        // --- COMMANDS (Actions) ---

        // 1. Appointments
        if (lowerCmd.includes('موعد') || lowerCmd.includes('appointment')) {
            const newTask: Task = {
                id: crypto.randomUUID(),
                title: `📅 موعد: ${command}`,
                completed: false,
                date: new Date().toISOString().split('T')[0],
                priority: 'high',
                section: 'appointment',
                recurrence: { type: 'none' }
            };
            const tasks = storage.get<Task[]>('tasks') || [];
            storage.set('tasks', [...tasks, newTask]);
            return 'تم تسجيل الموعد في المهام.';
        }

        // 2. Shopping (Smart List)
        if (lowerCmd.includes('شراء') || lowerCmd.includes('buy') || lowerCmd.includes('اشتري') || lowerCmd.includes('جيب')) {
            // Remove keywords to get the items string
            let itemsText = command.replace(/(شراء|اشتري|buy|جيب|هات|أريد|بدي|ذكرني بـ|ذكرني)/gi, '').trim();

            // Split by comma or 'and' or 'و'
            const itemsList = itemsText.split(/,|،| و | and /).map(i => i.trim()).filter(i => i);

            if (itemsList.length === 0) return 'ماذا تريد أن تشتري؟';

            const newItems: ShoppingItem[] = itemsList.map(text => {
                // Simple Auto-Categorization
                let category: any = 'أخرى';
                if (text.match(/(لحم|دجاج|سمك|meat|chicken|fish)/)) category = 'لحوم';
                else if (text.match(/(حليب|جبن|بيض|milk|cheese|egg)/)) category = 'ألبان';
                else if (text.match(/(طماطم|خيار|بصل|فواكه|خضار|fruit|veg)/)) category = 'خضروات';
                else if (text.match(/(خبز|رز|مكرونة|bread|rice)/)) category = 'بقالة';

                return {
                    id: crypto.randomUUID(),
                    name: text,
                    purchased: false,
                    category: category,
                    addedDate: new Date().toISOString()
                };
            });

            const currentItems = storage.get<ShoppingItem[]>('shoppingList') || [];
            storage.set('shoppingList', [...currentItems, ...newItems]);

            return `تم إضافة ${newItems.length} أغراض لقائمة التسوق (${newItems.map(i => i.name).join('، ')}).`;
        }

        // 3. Budget / Salary
        if (lowerCmd.includes('راتب') || lowerCmd.includes('salary') || lowerCmd.includes('دخل')) {
            const amountMatch = command.match(/[\d,]+/);
            if (amountMatch) {
                const amount = parseFloat(amountMatch[0].replace(/,/g, ''));
                storage.set('salary', amount.toString());
                return `تم تحديث الراتب إلى ${amount}.`;
            }
        }

        // 4. Development Goals
        if (lowerCmd.includes('قراءة') || lowerCmd.includes('read') || lowerCmd.includes('كتاب')) {
            const title = command.replace(/(أضف هدف|قراءة|كتاب|read|book)/gi, '').trim();
            const newGoal: DevelopmentGoal = {
                id: crypto.randomUUID(),
                title: title,
                type: 'book',
                frequency: 'once',
                status: 'active',
                createdAt: new Date().toISOString()
            };
            const goals = storage.get<DevelopmentGoal[]>('developmentGoals') || [];
            storage.set('developmentGoals', [...goals, newGoal]);
            return `تم إضافة هدف القراءة: ${title}`;
        }

        // Default: Add as a general task
        const newTask: Task = {
            id: crypto.randomUUID(),
            title: command,
            completed: false,
            date: new Date().toISOString().split('T')[0],
            priority: 'medium',
            section: 'general',
            recurrence: { type: 'none' }
        };
        const tasks = storage.get<Task[]>('tasks') || [];
        storage.set('tasks', [...tasks, newTask]);
        return 'تم إضافة الأمر كمهمة عامة.';
    }
};
