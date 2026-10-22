import React from 'react';
import { ShieldCheck, UserCheck, Activity, GitBranch, FileText, Sparkles, Globe, BarChart3 } from 'lucide-react';

interface HeaderProps {
  role: 'manager' | 'hr';
  onRoleChange: (role: 'manager' | 'hr') => void;
  activeTab: 'wizard' | 'tracking' | 'mining' | 'analytics' | 'audit';
  onTabChange: (tab: 'wizard' | 'tracking' | 'mining' | 'analytics' | 'audit') => void;
  lang: 'en' | 'ar';
  onLangToggle: () => void;
  onOpenAssistant: () => void;
  pendingCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  role,
  onRoleChange,
  activeTab,
  onTabChange,
  lang,
  onLangToggle,
  onOpenAssistant,
  pendingCount = 4
}) => {
  const isAr = lang === 'ar';

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
      {/* Top Emirates Brand Ribbon */}
      <div className="h-1 w-full bg-gradient-to-r from-[#D71921] via-[#BA9653] to-[#D71921]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded bg-[#D71921] flex items-center justify-center text-white font-bold tracking-wider shadow-sm">
              <span className="text-xs font-serif font-black tracking-tighter">EK</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 tracking-tight text-base whitespace-nowrap">
                  {isAr ? 'مجموعة طيران الإمارات' : 'Emirates Group'}
                </span>
                <span className="text-slate-300 font-light">|</span>
                <span className="text-xs font-medium text-[#BA9653] uppercase tracking-wider whitespace-nowrap">
                  {isAr ? 'صحيح من المرة الأولى (RFT)' : 'Right First Time (RFT)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 whitespace-nowrap hidden sm:block">
                {isAr
                  ? 'العمليات الذكية لربط المناصب بالأشخاص وذكاء المخاطر'
                  : 'Smart Position-to-Person Operations & Risk Intelligence'}
              </p>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <button
              onClick={() => onTabChange('wizard')}
              className={`px-3 py-2 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'wizard'
                  ? 'text-[#D71921] bg-red-50/70 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#D71921]" />
              <span>{isAr ? 'طلب جديد ذكي' : 'Smart Request'}</span>
            </button>

            <button
              onClick={() => onTabChange('tracking')}
              className={`px-3 py-2 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap relative ${
                activeTab === 'tracking'
                  ? 'text-[#D71921] bg-red-50/70 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>{isAr ? 'رادار المخاطر قيد التنفيذ' : 'In-Flight Risk Radar'}</span>
              {pendingCount > 0 && (
                <span className="ml-1 text-[11px] px-1.5 py-0.2 bg-red-100 text-[#D71921] font-mono font-bold rounded">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange('mining')}
              className={`px-3 py-2 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'mining'
                  ? 'text-[#D71921] bg-red-50/70 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <GitBranch className="w-4 h-4" />
              <span>{isAr ? 'تعدين العمليات والاختناقات' : 'Process Mining'}</span>
            </button>

            <button
              onClick={() => onTabChange('analytics')}
              className={`px-3 py-2 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'text-[#D71921] bg-red-50/70 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>{isAr ? 'التحليلات والرسوم' : 'Analytics & Graphs'}</span>
            </button>

            <button
              onClick={() => onTabChange('audit')}
              className={`px-3 py-2 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'audit'
                  ? 'text-[#D71921] bg-red-50/70 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>{isAr ? 'سجل التدقيق' : 'Audit Trail'}</span>
            </button>
          </nav>

          {/* Zone 3: Persona Switcher, Language & Assistant Action */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Persona Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => onRoleChange('manager')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 whitespace-nowrap ${
                  role === 'manager'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={
                  isAr
                    ? 'وضع مدير الخط: إنشاء ومتابعة طلبات الفريق مع التحقق الفوري المسبق'
                    : 'Line Manager Mode: Submit and track team requests with pre-submission validation'
                }
              >
                <UserCheck className="w-3.5 h-3.5 text-[#D71921]" />
                <span className="hidden sm:inline">{isAr ? 'مدير الخط المباشر' : 'Line Manager'}</span>
                <span className="sm:hidden">{isAr ? 'المدير' : 'Manager'}</span>
              </button>
              <button
                onClick={() => onRoleChange('hr')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 whitespace-nowrap ${
                  role === 'hr'
                    ? 'bg-[#0F172A] text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={
                  isAr
                    ? 'وضع عمليات الموارد البشرية: فحص مصنف المخاطر، أوزان SHAP، تعدين الاختناقات، وحوكمة القرارات'
                    : 'HR Operations / Process Owner Mode: Inspect risk classifier, SHAP, bottleneck mining, and HITL decisions'
                }
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#BA9653]" />
                <span className="hidden sm:inline">{isAr ? 'عمليات الموارد البشرية' : 'HR Ops & Process'}</span>
                <span className="sm:hidden">{isAr ? 'الموارد' : 'HR Ops'}</span>
              </button>
            </div>

            {/* Language switch */}
            <button
              onClick={onLangToggle}
              className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-slate-200 flex items-center gap-1 transition-colors"
              title="Toggle English / Arabic"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="font-sans">{isAr ? 'EN' : 'العربية'}</span>
            </button>

            {/* Assistant Trigger */}
            <button
              onClick={onOpenAssistant}
              className="px-3 py-1.5 text-xs font-medium text-white bg-[#D71921] hover:bg-[#b5141b] rounded-lg transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAr ? 'المساعد الذكي' : 'Ask AI'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 text-xs">
          <button
            onClick={() => onTabChange('wizard')}
            className={`py-1 px-2 rounded font-medium ${
              activeTab === 'wizard' ? 'text-[#D71921] font-bold' : 'text-slate-600'
            }`}
          >
            {isAr ? 'طلب جديد' : 'New Request'}
          </button>
          <button
            onClick={() => onTabChange('tracking')}
            className={`py-1 px-2 rounded font-medium ${
              activeTab === 'tracking' ? 'text-[#D71921] font-bold' : 'text-slate-600'
            }`}
          >
            {isAr ? 'الرادار' : 'In-Flight'} ({pendingCount})
          </button>
          <button
            onClick={() => onTabChange('mining')}
            className={`py-1 px-2 rounded font-medium ${
              activeTab === 'mining' ? 'text-[#D71921] font-bold' : 'text-slate-600'
            }`}
          >
            {isAr ? 'التعدين' : 'Mining'}
          </button>
          <button
            onClick={() => onTabChange('analytics')}
            className={`py-1 px-2 rounded font-medium ${
              activeTab === 'analytics' ? 'text-[#D71921] font-bold' : 'text-slate-600'
            }`}
          >
            {isAr ? 'التحليلات' : 'Analytics'}
          </button>
          <button
            onClick={() => onTabChange('audit')}
            className={`py-1 px-2 rounded font-medium ${
              activeTab === 'audit' ? 'text-[#D71921] font-bold' : 'text-slate-600'
            }`}
          >
            {isAr ? 'التدقيق' : 'Audit'}
          </button>
        </div>
      </div>
    </header>
  );
};
