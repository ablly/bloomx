import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const languages = [
        { code: 'en', name: 'English', region: 'US' },
        { code: 'zh', name: '中文', region: 'CN' },
    ];

    const currentLanguage = languages.find(lang => i18n.language?.startsWith(lang.code)) || languages[0];

    const changeLanguage = (code: string) => {
        i18n.changeLanguage(code);
        localStorage.setItem('language', code);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex min-h-11 items-center gap-2 rounded-full border border-[#293027]/12 bg-[#f6f2ea]/68 px-4 text-sm font-semibold text-[#293027]/74 shadow-[0_10px_35px_rgba(32,37,31,0.08)] backdrop-blur-xl hover:bg-[#f6f2ea]/90 hover:text-[#171c16]"
            >
                <Globe size={16} />
                <span className="hidden sm:inline">{currentLanguage.region} {currentLanguage.name}</span>
                <span className="sm:hidden">{currentLanguage.region}</span>
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsOpen(false)}
                    />
                    
                    {/* Dropdown */}
                    <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-[#293027]/10 bg-[#f6f2ea]/95 shadow-[0_24px_70px_rgba(32,37,31,0.18)] backdrop-blur-xl animate-in fade-in zoom-in duration-200">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => changeLanguage(lang.code)}
                                className={`w-full px-4 py-3 flex items-center justify-between text-sm transition-colors ${
                                    i18n.language?.startsWith(lang.code)
                                        ? 'bg-[#171c16] text-[#f6f2ea]'
                                        : 'text-[#293027]/72 hover:bg-white/48 hover:text-[#171c16]'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <span className="font-mono text-xs uppercase text-current/60">{lang.region}</span>
                                    <span>{lang.name}</span>
                                </span>
                                {i18n.language?.startsWith(lang.code) && (
                                    <Check size={16} />
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
