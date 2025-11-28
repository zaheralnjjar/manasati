import { Type } from "@google/genai";
import { addTaskToSystem } from "../utils/taskHelper";
import { storage } from "../utils/storage";
import { autoBackup } from "../utils/autoBackup";
import type { Transaction, ShoppingItem, BookGoal, DevelopmentGoal } from "../types";

export const tools = [
  {
    functionDeclarations: [
      {
        name: "create_task",
        description: "إنشاء مهمة أو مهام جديدة في الجدول.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "عنوان المهمة" },
            type: { type: Type.STRING, enum: ['منزل', 'عمل', 'عبادة', 'صحة', 'روتين', 'general'] },
            priority: { type: Type.STRING, enum: ['عالي', 'متوسط', 'منخفض'] },
            times: { type: Type.ARRAY, items: { type: Type.STRING }, description: "قائمة بالأوقات (HH:MM) للتكرار في نفس اليوم" }
          },
          required: ["title"]
        }
      },
      {
        name: "add_transaction",
        description: "تسجيل معاملة مالية (مصروف أو دخل).",
        parameters: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            description: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['expense', 'income'] },
            category: { type: Type.STRING }
          },
          required: ["amount", "description", "type"]
        }
      },
      {
        name: "add_shopping_item",
        description: "إضافة عنصر لقائمة التسوق.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            item: { type: Type.STRING, description: "اسم العنصر" },
            category: { type: Type.STRING, description: "فئة العنصر (عام، خضار، لحوم...)" }
          },
          required: ["item"]
        }
      },
      {
        name: "perform_backup",
        description: "إجراء نسخ احتياطي فوري للبيانات.",
        parameters: {
          type: Type.OBJECT,
          properties: {},
        }
      },
      {
        name: "add_appointment",
        description: "إضافة موعد جديد.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "عنوان الموعد" },
            time: { type: Type.STRING, description: "وقت الموعد (HH:MM)" },
            date: { type: Type.STRING, description: "تاريخ الموعد (YYYY-MM-DD)" }
          },
          required: ["title", "time"]
        }
      },
      {
        name: "add_reading_item",
        description: "إضافة كتاب أو مادة للقراءة.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "عنوان الكتاب" },
            pages: { type: Type.NUMBER, description: "عدد الصفحات" },
            days: { type: Type.NUMBER, description: "عدد الأيام المستهدفة للقراءة" }
          },
          required: ["title"]
        }
      },
      {
        name: "create_note",
        description: "إنشاء ملاحظة سريعة أو فكرة.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING, description: "نص الملاحظة" }
          },
          required: ["content"]
        }
      },
      {
        name: "add_goal",
        description: "إضافة هدف تطويري جديد.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "عنوان الهدف" },
            type: { type: Type.STRING, enum: ['book', 'video', 'course', 'habit'] },
            frequency: { type: Type.STRING, enum: ['once', 'weekly', 'monthly', 'daily'] }
          },
          required: ["title", "type"]
        }
      }
    ]
  }
];

export const executeTool = async (name: string, args: any) => {
  console.log(`Executing tool: ${name}`, args);

  switch (name) {
    case "create_task": {
      const { title, type, priority, times } = args;
      // Map priority string to TaskPriority type if needed
      let taskPriority: 'high' | 'medium' | 'low' = 'medium';
      if (priority === 'عالي') taskPriority = 'high';
      if (priority === 'منخفض') taskPriority = 'low';

      // Map type to section
      let section = 'general';
      if (type === 'عبادة') section = 'worship';
      if (type === 'عمل') section = 'tasks'; // or specific work section
      if (type === 'صحة') section = 'health'; // if exists, else general

      addTaskToSystem(title, {
        recurrence: times ? { type: 'daily', times: times } : { type: 'none' },
        priority: taskPriority,
        section: section
      });
      return { success: true, message: `تم إضافة المهمة: ${title}` };
    }

    case "add_transaction": {
      const { amount, description, type, category } = args;
      const transactions = storage.get<Transaction[]>('transactions') || [];
      const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        amount: Number(amount),
        description,
        type: type as 'income' | 'expense',
        category: category || 'عام',
        date: new Date().toISOString(),
        recurring: false
      };
      storage.set('transactions', [...transactions, newTransaction]);
      return { success: true, message: `تم تسجيل المعاملة: ${description} (${amount})` };
    }

    case "add_shopping_item": {
      const { item, category } = args;
      const items = storage.get<ShoppingItem[]>('shoppingList') || [];
      const newItem: ShoppingItem = {
        id: crypto.randomUUID(),
        name: item,
        purchased: false,
        category: category || 'أخرى',
        addedDate: new Date().toISOString()
      };
      storage.set('shoppingList', [...items, newItem]);
      return { success: true, message: `تم إضافة ${item} لقائمة التسوق` };
    }

    case "perform_backup": {
      autoBackup.performBackup('manual');
      return { success: true, message: "تم إجراء النسخ الاحتياطي بنجاح" };
    }

    case "add_appointment": {
      const { title, time, date } = args;
      addTaskToSystem(`📅 موعد: ${title}`, {
        date: date || new Date().toISOString().split('T')[0],
        time: time,
        recurrence: { type: 'none' }
      });
      return { success: true, message: `تم إضافة الموعد: ${title} في ${time}` };
    }

    case "add_reading_item": {
      // ... (keep existing logic if types match, otherwise update)
      // Assuming BookGoal is still valid or needs update. 
      // For now, I'll just update the task creation parts.
      const { title, pages, days } = args;
      // ... (rest of reading item logic seems fine if BookGoal matches)
      const books = storage.get<BookGoal[]>('bookGoals') || [];
      const newBook: BookGoal = {
        id: crypto.randomUUID(),
        title,
        totalPages: pages || 100,
        durationDays: days || 30,
        startDate: new Date().toISOString(),
        currentPage: 0,
        dailyTarget: Math.ceil((pages || 100) / (days || 30)),
        isCompleted: false
      };
      storage.set('bookGoals', [...books, newBook]);
      return { success: true, message: `تم إضافة كتاب: ${title}` };
    }

    case "create_note": {
      const { content } = args;
      addTaskToSystem(content, {
        recurrence: { type: 'none' }
      });
      return { success: true, message: "تم حفظ الملاحظة" };
    }

    case "add_goal": {
      const { title, type, frequency } = args;
      const goals = storage.get<DevelopmentGoal[]>('developmentGoals') || [];
      const newGoal: DevelopmentGoal = {
        id: crypto.randomUUID(),
        title,
        type: type as any,
        frequency: frequency || 'once',
        status: 'active',
        createdAt: new Date().toISOString()
      };
      storage.set('developmentGoals', [...goals, newGoal]);
      return { success: true, message: `تم إضافة هدف: ${title}` };
    }

    default:
      return { success: false, message: "أداة غير معروفة" };
  }
};
