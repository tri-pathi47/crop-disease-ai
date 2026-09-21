export const LANGUAGES = [
  ["en", "English"], ["hi", "हिन्दी"], ["mr", "मराठी"], ["bn", "বাংলা"],
  ["ta", "தமிழ்"], ["te", "తెలుగు"], ["pa", "ਪੰਜਾਬੀ"], ["gu", "ગુજરાતી"],
  ["kn", "ಕನ್ನಡ"], ["ml", "മലയാളം"], ["or", "ଓଡ଼ିଆ"], ["as", "অসমীয়া"],
];

// Farmer-facing strings are stored per language rather than machine-translated
// at runtime. Add a language by adding a block here and a row in the backend
// knowledge base (ui_terms).
const STRINGS = {
  en: {
    greet: "Good morning", health: "Crop health", disease: "Disease risk",
    pest: "Pest risk", zones: "Field zones to check", check: "Check my crop",
    ask: "Ask the assistant", map: "Farm map", speak: "Speak", expert: "Expert",
    tagline: "Understand your farm. Detect problems early.",
    askPlaceholder: "Ask about your crop...",
    sampleQuestion: "My crop leaves are turning yellow, what should I do?",
    speakHint: "Tap and describe the problem in your own words",
  },
  hi: {
    greet: "सुप्रभात", health: "फसल की सेहत", disease: "बीमारी का खतरा",
    pest: "कीट का खतरा", zones: "जांच वाले खेत हिस्से", check: "मेरी फसल जांचें",
    ask: "सहायक से पूछें", map: "खेत का नक्शा", speak: "बोलें", expert: "विशेषज्ञ",
    tagline: "अपना खेत समझें। समस्या जल्दी पहचानें।",
    askPlaceholder: "अपनी फसल के बारे में पूछें...",
    sampleQuestion: "मेरी फसल के पत्ते पीले हो रहे हैं, क्या करूं?",
    speakHint: "दबाएं और अपनी भाषा में समस्या बताएं",
  },
  mr: {
    greet: "सुप्रभात", health: "पिकाचे आरोग्य", disease: "रोगाचा धोका",
    pest: "किडीचा धोका", zones: "तपासायचे भाग", check: "माझे पीक तपासा",
    ask: "सहाय्यकाला विचारा", map: "शेताचा नकाशा", speak: "बोला", expert: "तज्ज्ञ",
    tagline: "तुमचे शेत समजून घ्या. समस्या लवकर ओळखा.",
    askPlaceholder: "तुमच्या पिकाबद्दल विचारा...",
    sampleQuestion: "माझ्या पिकाची पाने पिवळी होत आहेत, काय करू?",
    speakHint: "दाबा आणि तुमच्या भाषेत समस्या सांगा",
  },
  bn: {
    greet: "সুপ্রভাত", health: "ফসলের স্বাস্থ্য", disease: "রোগের ঝুঁকি",
    pest: "পোকার ঝুঁকি", zones: "পরীক্ষা করার অংশ", check: "আমার ফসল দেখুন",
    ask: "সহায়ককে জিজ্ঞাসা করুন", map: "খেতের মানচিত্র", speak: "বলুন", expert: "বিশেষজ্ঞ",
    tagline: "আপনার খেত বুঝুন। সমস্যা আগে ধরুন।",
    askPlaceholder: "আপনার ফসল সম্পর্কে জিজ্ঞাসা করুন...",
    sampleQuestion: "আমার ফসলের পাতা হলুদ হয়ে যাচ্ছে, কী করব?",
    speakHint: "চাপুন এবং নিজের ভাষায় সমস্যা বলুন",
  },
  ta: {
    greet: "காலை வணக்கம்", health: "பயிர் நலம்", disease: "நோய் அபாயம்",
    pest: "பூச்சி அபாயம்", zones: "பார்க்க வேண்டிய பகுதிகள்", check: "என் பயிரைப் பார்",
    ask: "உதவியாளரிடம் கேள்", map: "வயல் வரைபடம்", speak: "பேசு", expert: "நிபுணர்",
    tagline: "உங்கள் வயலை அறியுங்கள். பிரச்னையை முன்கூட்டியே கண்டறியுங்கள்.",
    askPlaceholder: "உங்கள் பயிர் பற்றி கேளுங்கள்...",
    sampleQuestion: "என் பயிரின் இலைகள் மஞ்சளாகின்றன, என்ன செய்வது?",
    speakHint: "அழுத்தி உங்கள் மொழியில் பிரச்னையைச் சொல்லுங்கள்",
  },
  pa: {
    greet: "ਸ਼ੁਭ ਸਵੇਰ", health: "ਫ਼ਸਲ ਦੀ ਸਿਹਤ", disease: "ਬਿਮਾਰੀ ਦਾ ਖ਼ਤਰਾ",
    pest: "ਕੀੜੇ ਦਾ ਖ਼ਤਰਾ", zones: "ਜਾਂਚ ਵਾਲੇ ਹਿੱਸੇ", check: "ਮੇਰੀ ਫ਼ਸਲ ਵੇਖੋ",
    ask: "ਸਹਾਇਕ ਤੋਂ ਪੁੱਛੋ", map: "ਖੇਤ ਦਾ ਨਕਸ਼ਾ", speak: "ਬੋਲੋ", expert: "ਮਾਹਰ",
    tagline: "ਆਪਣਾ ਖੇਤ ਸਮਝੋ। ਸਮੱਸਿਆ ਜਲਦੀ ਪਛਾਣੋ।",
    askPlaceholder: "ਆਪਣੀ ਫ਼ਸਲ ਬਾਰੇ ਪੁੱਛੋ...",
    sampleQuestion: "ਮੇਰੀ ਫ਼ਸਲ ਦੇ ਪੱਤੇ ਪੀਲੇ ਹੋ ਰਹੇ ਹਨ, ਕੀ ਕਰਾਂ?",
    speakHint: "ਦਬਾਓ ਅਤੇ ਆਪਣੀ ਭਾਸ਼ਾ ਵਿੱਚ ਦੱਸੋ",
  },
};

export function makeT(lang) {
  return (key) => (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.en[key] || key;
}

export const SPEECH_LOCALE = {
  en: "en-IN", hi: "hi-IN", mr: "mr-IN", bn: "bn-IN", ta: "ta-IN", te: "te-IN",
  pa: "pa-IN", gu: "gu-IN", kn: "kn-IN", ml: "ml-IN", or: "or-IN", as: "as-IN",
};
