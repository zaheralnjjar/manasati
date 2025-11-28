import { GoogleGenAI } from "@google/genai";

// تهيئة العميل (تأكد من وضع مفتاح API في متغيرات البيئة)
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
const MODEL_FLASH = 'gemini-2.0-flash';

// واجهة استدعاء المساعد
export const getAssistantResponse = async (
    history: { role: string; parts: { text: string }[] }[], // سجل المحادثة
    message: string, // رسالة المستخدم الجديدة
    tools: any[] // قائمة الأدوات المتاحة (وظائف التطبيق)
) => {
    try {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

        // --- هنا يكمن ذكاء زاهر (System Prompt) ---
        const systemPrompt = `
    أنت "زاهر"، مساعد ذكي إسلامي للتطبيق "الزكي".
    التاريخ الحالي: ${dateStr}، الوقت: ${timeStr}.
    
    المبادئ الأساسية:
    1. **المبادرة بالفعل (Action Over Questions):** لا تسأل عن التفاصيل إذا كان بإمكانك استنتاجها أو استخدام قيم افتراضية. نفذ الأمر فوراً.
       - مثال: "اشتريت خبز" -> قم فوراً باستدعاء أداة 'add_shopping_item' مع الفئة 'مخبز'. لا تسأل "أي نوع؟".
       - مثال: "ذكرني بالدواء" -> أضف مهمة "أخذ الدواء" بوقت افتراضي (مثلاً بعد ساعة) أو 9 صباحاً.
    
    2. **باحث ومفتي:**
       - عند السؤال عن فتوى، ابحث وقدم أولاً أقوال **كبار علماء السعودية** (ابن باز، ابن عثيمين، الفوزان، أئمة الحرمين).
       - كن دقيقاً ومؤدباً، واستخدم عبارة "قال الشيخ...".
    
    3. **كاتب خطب:**
       - عند طلب خطبة جمعة: اكتب خطبة **واحدة متصلة** (ليست خطبتين).
       - ابدأ **فوراً بآية قرآنية** (بدون مقدمة "إن الحمد لله...").
       - اجعلها بليغة ومؤثرة وقصيرة.
    
    4. **استخدام الأدوات (Tools):**
       - يجب عليك استخدام الأدوات المتوفرة (Function Calling) لتنفيذ طلبات المستخدم بدلاً من الرد بالنص فقط.
       - الأدوات المتاحة: create_task, add_transaction, perform_backup, add_reading_item, add_shopping_item, add_appointment, create_note, add_goal.
    
    تحدث باللغة العربية دائماً بأسلوب ودود ومحترم.
    `;

        const chat = ai.chats.create({
            model: MODEL_FLASH,
            config: {
                systemInstruction: systemPrompt,
                tools: tools, // تمرير تعريفات الأدوات
            },
            history: history as any
        });

        // إرسال الرسالة وانتظار الرد (نص أو استدعاء دالة)
        const result = await chat.sendMessage({ message });
        return result;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

export const suggestRecipesAgent = async (ingredients: string): Promise<any[]> => {
    try {
        // 2. بناء الـ Prompt (السر في التوجيه الدقيق)
        const prompt = `
    Act as a professional Arab Chef.
    Suggest 20 Halal recipes based on these ingredients: "${ingredients}".
    
    CRITICAL INSTRUCTIONS:
    1. **Language:** The 'name', 'ingredients', 'steps', 'cuisine' MUST be in ARABIC.
    2. **Search Optimization:** The 'youtubeQuery' MUST be in ENGLISH or the original language of the dish (e.g., "Italian Pasta Recipe") to ensure best search results on YouTube.
    3. **Format:** Return a valid JSON Array ONLY. No markdown, no text before/after.
    
    JSON Structure for each recipe:
    {
      "name": "اسم الطبخة",
      "prepTime": "30 mins",
      "difficulty": "Easy/Medium/Hard",
      "ingredients": ["مكون 1", "مكون 2"],
      "steps": ["خطوة 1", "خطوة 2"],
      "cuisine": "المطبخ (مصري/شامي/ايطالي...)",
      "youtubeQuery": "English Search Term",
      "nutrition": {
        "calories": 500,
        "protein": "20g",
        "carbs": "50g",
        "fat": "10g"
      }
    }
    `;

        // 3. استدعاء النموذج
        const response = await ai.models.generateContent({
            model: MODEL_FLASH,
            contents: prompt,
            // إجبار النموذج على إخراج JSON فقط (مهم جداً لعدم كسر التطبيق)
            config: { responseMimeType: 'application/json' }
        });

        // 4. تحليل الرد
        const rawText = response.text || '[]';
        const recipes = JSON.parse(rawText);

        // إضافة معرفات فريدة إذا لزم الأمر
        return recipes.map((r: any, idx: number) => ({
            ...r,
            id: `recipe-${Date.now()}-${idx}`,
            isFavorite: false
        }));

    } catch (e) {
        console.error("Recipe AI Error:", e);
        return [];
    }
};
