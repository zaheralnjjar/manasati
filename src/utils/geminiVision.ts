import { GoogleGenerativeAI } from '@google/generative-ai';
import type { PrayerTime } from '../types';

// Initialize Gemini API
const getGeminiAPI = () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

    console.log('API Key exists:', !!apiKey);
    console.log('API Key length:', apiKey?.length || 0);

    if (!apiKey) {
        throw new Error('الرجاء إضافة VITE_GEMINI_API_KEY في ملف .env');
    }

    return new GoogleGenerativeAI(apiKey);
};

export const extractPrayerTimesWithGemini = async (imageFile: File): Promise<PrayerTime[]> => {
    try {
        console.log('Starting Gemini Vision extraction...');

        const genAI = getGeminiAPI();
        // Use gemini-1.5-pro for multimodal (text + image) analysis
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

        // Convert image to base64
        const imageData = await fileToGenerativePart(imageFile);

        const prompt = `أنت مساعد ذكي متخصص في قراءة جداول أوقات الصلاة.

انظر إلى هذه الصورة واستخرج أوقات الصلاة من الجدول.

يجب أن تعيد النتيجة بتنسيق JSON فقط، بدون أي نص إضافي:

{
  "prayerTimes": [
    {
      "date": "YYYY-MM-DD",
      "fajr": "HH:MM",
      "sunrise": "HH:MM",
      "dhuhr": "HH:MM",
      "asr": "HH:MM",
      "maghrib": "HH:MM",
      "isha": "HH:MM"
    }
  ]
}

ملاحظات مهمة:
1. التاريخ بصيغة YYYY-MM-DD (مثال: 2025-11-22)
2. الأوقات بصيغة 24 ساعة HH:MM (مثال: 03:56 للفجر، 19:18 للعشاء)
3. إذا كان الوقت بصيغة AM/PM، حوله إلى 24 ساعة
4. استخرج كل الأيام الموجودة في الجدول
5. أعد JSON فقط، بدون markdown أو نص إضافي`;

        const result = await model.generateContent([prompt, imageData]);
        const response = await result.response;
        const text = response.text();

        console.log('Gemini Response:', text);

        // Parse the JSON response
        const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleanedText);

        if (parsed.prayerTimes && Array.isArray(parsed.prayerTimes)) {
            return parsed.prayerTimes;
        }

        return [];
    } catch (error) {
        console.error('Gemini Vision Error:', error);
        throw new Error('فشل في قراءة الصورة باستخدام الذكاء الاصطناعي. تأكد من إضافة API Key.');
    }
};

// Convert File to GenerativePart
async function fileToGenerativePart(file: File): Promise<{ inlineData: { data: string; mimeType: string } }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Data = (reader.result as string).split(',')[1];
            resolve({
                inlineData: {
                    data: base64Data,
                    mimeType: file.type,
                },
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
