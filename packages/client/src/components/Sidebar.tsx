import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HardDrive, Terminal, Settings, Activity, Zap, Box } from 'lucide-react';
import { cn } from './ui/Button';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Sidebar() {
  const { t } = useTranslation();

  const navItems = [
    { to: '/', icon: Box, labelKey: 'nav.dashboard' },
    { to: '/models', icon: HardDrive, labelKey: 'nav.models' },
    { to: '/remote-models', icon: HardDrive, labelKey: 'nav.remoteModels' },
    { to: '/api-test', icon: Terminal, labelKey: 'nav.apiTest' },
    { to: '/metrics', icon: Activity, labelKey: 'nav.metrics' },
    { to: '/settings', icon: Settings, labelKey: 'nav.settings' },
  ];

  return (
    <div className="w-64 bg-card border-r min-h-screen p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-8 px-2">
        <Zap className="h-6 w-6 text-primary" />
        <span className="text-xl font-bold">{t('app.title')}</span>
      </div>
      <nav className="space-y-2 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {t(item.labelKey)}
          </NavLink>
        ))}
      </nav>
      <div className="mt-4 pt-4 border-t">
        <LanguageSwitcher />
      </div>
    </div>
  );
}
