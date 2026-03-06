import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { Button } from './ui/Button';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant={i18n.language === 'en' ? 'default' : 'outline'}
        onClick={() => changeLanguage('en')}
      >
        EN
      </Button>
      <Button
        size="sm"
        variant={i18n.language === 'zh' ? 'default' : 'outline'}
        onClick={() => changeLanguage('zh')}
      >
        中文
      </Button>
    </div>
  );
}
