import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const languages = [
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'zh', name: '中文', flag: '🇨🇳' },
    ];

    const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

    const changeLanguage = (code: string) => {
        i18n.changeLanguage(code);
        localStorage.setItem('language', code);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="liquid-glass rounded-full px-4 py-2 flex items-center gap-2 text-sm text-white/90 hover:bg-white/10 transition-all duration-300"
            >
                <Globe size={16} />
                <span className="hidden sm:inline">{currentLanguage.flag} {currentLanguage.name}</span>
                <span className="sm:hidden">{currentLanguage.flag}</span>
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsOpen(false)}
                    />
                    
                    {/* Dropdown */}
                    <div className="absolute right-0 mt-2 w-48 liquid-glass-strong rounded-2xl border border-white/10 overflow-hidden z-50 animate-in fade-in zoom-in duration-200">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => changeLanguage(lang.code)}
                                className={`w-full px-4 py-3 flex items-center justify-between text-sm transition-colors ${
                                    i18n.language === lang.code
                                        ? 'bg-white/10 text-white'
                                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <span className="text-lg">{lang.flag}</span>
                                    <span>{lang.name}</span>
                                </span>
                                {i18n.language === lang.code && (
                                    <Check size={16} className="text-green-400" />
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default LanguageSwitcher;
