// Footer - Apple-inspired minimal footer
import { useTranslation } from 'react-i18next';

const Footer = () => {
    const { t } = useTranslation();
    
    const scrollTo = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <footer className="relative border-t border-white/5 bg-black/50 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-6 py-16">
                
                {/* Main footer content */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-16">

                    {/* Brand */}
                    <div className="col-span-2">
                        <div 
                            className="flex items-center gap-2 mb-6 cursor-pointer group" 
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        >
                            <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <div className="w-2 h-2 bg-black rounded-full"></div>
                            </div>
                            <span className="font-semibold text-lg tracking-tight text-white">BloomX</span>
                        </div>
                        <p className="text-sm text-white/40 leading-relaxed max-w-xs">
                            {t('hero.subtitle')}
                        </p>
                    </div>

                    {/* Product */}
                    <div>
                        <h5 className="text-white font-medium mb-4 text-sm">{t('footer.product')}</h5>
                        <ul className="space-y-3 text-sm text-white/40">
                            <li><button onClick={() => scrollTo('features')} className="hover:text-white transition-colors duration-300">{t('footer.features')}</button></li>
                            <li><button onClick={() => scrollTo('pricing')} className="hover:text-white transition-colors duration-300">{t('footer.pricing')}</button></li>
                            <li><button className="hover:text-white transition-colors duration-300">{t('footer.docs')}</button></li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h5 className="text-white font-medium mb-4 text-sm">{t('footer.company')}</h5>
                        <ul className="space-y-3 text-sm text-white/40">
                            <li><button className="hover:text-white transition-colors duration-300">{t('footer.about')}</button></li>
                            <li><button className="hover:text-white transition-colors duration-300">{t('footer.blog')}</button></li>
                            <li><button className="hover:text-white transition-colors duration-300">{t('footer.careers')}</button></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h5 className="text-white font-medium mb-4 text-sm">{t('footer.legal')}</h5>
                        <ul className="space-y-3 text-sm text-white/40">
                            <li><button className="hover:text-white transition-colors duration-300">{t('footer.terms')}</button></li>
                            <li><button className="hover:text-white transition-colors duration-300">{t('footer.privacy')}</button></li>
                            <li><button className="hover:text-white transition-colors duration-300">{t('footer.security')}</button></li>
                        </ul>
                    </div>

                </div>

                {/* Bottom bar */}
                <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/5 text-xs text-white/30">
                    <p>© 2026 BloomX Infrastructure. {t('footer.allRightsReserved')}</p>
                    <div className="flex items-center gap-4 mt-4 md:mt-0">
                        <span className="flex items-center gap-2">
                            Status: <span className="text-green-400">All Systems Operational</span>
                        </span>
                    </div>
                </div>

            </div>
        </footer>
    );
};

export default Footer;
