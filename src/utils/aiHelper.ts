import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.error("VITE_GEMINI_API_KEY is missing in environment variables.");
}

// Initialize Gemini
const genAI = new GoogleGenerativeAI(API_KEY || "dummy_key_to_prevent_crash_on_init");
// Initialize Gemini with fallback logic
const MODELS = ["gemini-1.5-flash", "gemini-pro", "gemini-1.0-pro"];

const getModel = (modelName: string) => {
    return genAI.getGenerativeModel({ model: modelName });
};

// Helper function to generate text
const generateText = async (prompt: string): Promise<string> => {
    let lastError;

    for (const modelName of MODELS) {
        try {
            console.log(`Trying AI model: ${modelName}`);
            const model = getModel(modelName);
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error: any) {
            console.warn(`Model ${modelName} failed:`, error.message);
            lastError = error;
        }
    }

    throw lastError || new Error("All AI models failed");
};

export const aiHelper = {
    generateText,

    /**
     * Suggests recipes based on ingredients
     */
    suggestRecipes: async (ingredients: string[]): Promise<any[]> => {
        const prompt = `
        You are a professional chef. Suggest 10 recipes based on these ingredients: ${ingredients.join(', ')}.
        
        CRITICAL INSTRUCTIONS:
        1. Return ONLY valid JSON.
        2. Provide exactly 5 recipes from Arab cuisine and 5 from International cuisine.
        3. The output must be a JSON ARRAY of objects.
        
        JSON Structure per recipe:
        {
            "titleAr": "Arabic Name",
            "titleEn": "English/Original Name",
            "cuisine": "Arab" or "International",
            "ingredients": ["item1", "item2"],
            "steps": ["step1", "step2"],
            "youtubeQuery": "Recipe Name + How to cook"
        }
        `;

        try {
            const text = await generateText(prompt);
            console.log("AI Recipe Response:", text);

            // Robust JSON extraction
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (!jsonMatch) throw new Error("No JSON array found in response");

            const jsonStr = jsonMatch[0];
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error("Error suggesting recipes:", error);
            throw error;
        }
    },

    /**
     * Asks a religious question based on specific scholars
     */
    askScholar: async (question: string, scholar: string): Promise<string> => {
        const prompt = `
        You are a knowledgeable assistant in Islamic jurisprudence.
        Please answer the following question: "${question}"
        According to the views of scholar: ${scholar}
        
        If the scholar's specific view is not known, provide the general consensus (Jumhur) and mention that.
        Answer in Arabic, clearly and respectfully.
        `;

        try {
            return await generateText(prompt);
        } catch (error) {
            console.error("Error asking scholar:", error);
            return "عذراً، حدث خطأ أثناء البحث عن الإجابة. يرجى المحاولة مرة أخرى أو التأكد من الاتصال بالإنترنت.";
        }
    }
};
