import { processVoiceCommand } from './src/utils/voiceProcessor.ts';

const phrases = [
    "موعد بتاريخ غدا 6:00",
    "موعد غدا الساعة 6",
    "تذكير شراء حليب",
    "اجتماع يوم الاحد القادم الساعة 5 مساء"
];

phrases.forEach(phrase => {
    console.log(`--- Testing: "${phrase}" ---`);
    const result = processVoiceCommand(phrase);
    console.log(JSON.stringify(result, null, 2));
});
