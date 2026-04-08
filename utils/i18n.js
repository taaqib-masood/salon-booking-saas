import fs from 'fs';
import path from 'path';

const locales = {
    en: JSON.parse(fs.readFileSync(path.resolve(__dirname, './locales/en.json'))),
    ar: JSON.parse(fs.readFileSync(path.resolve(__dirname, './locales/ar.json')))
};

function getNestedValue(obj, key) {
    return key.split('.').reduce((o, k) => o && o[k], obj);
}

export function t(key, lang = 'en', vars = {}) {
    let translation = getNestedValue(locales[lang] || locales['en'], key);
    
    if (translation) {
        for (const [k, v] of Object.entries(vars)) {
            translation = translation.replace(new RegExp('{{' + k + '}}', 'g'), v);
        }
    } else {
        console.warn(`Missing translation: ${key} in language ${lang}`);
        return key;
    }
    
    return translation;
}

export function getCustomerLang(customer) {
    return customer && customer.preferredLanguage || 'en';
}

export function formatDateForLang(date, lang) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    
    if (lang === 'ar') {
        return new Intl.DateTimeFormat('ar-AE', options).format(new Date(date));
    } else {
        return new Intl.DateTimeFormat('en-US', options).format(new Date(date));
    }
}