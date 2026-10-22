import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.js';
import { RequestWizard } from './components/RequestWizard.js';
import { InFlightTracker } from './components/InFlightTracker.js';
import { ProcessMiningView } from './components/ProcessMiningView.js';
import { AnalyticsDashboard } from './components/AnalyticsDashboard.js';
import { AuditTrailView } from './components/AuditTrailView.js';
import { AssistantWidget } from './components/AssistantWidget.js';
import { Sparkles, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { translations } from './utils/i18n.js';

export default function App() {
  const [role, setRole] = useState<'manager' | 'hr'>('manager');
  const [activeTab, setActiveTab] = useState<'wizard' | 'tracking' | 'mining' | 'analytics' | 'audit'>('wizard');
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const t = lang === 'ar' ? translations.ar : translations.en;

  // Success toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 5000);
  };

  const handleSubmitted = (newReqId: string) => {
    setSelectedRequestId(newReqId);
    setActiveTab('tracking');
    showToast(
      lang === 'ar'
        ? `تم إنشاء المعاملة ${newReqId} بنجاح واجتياز كافة فحوصات التحقق المسبق!`
        : `Request ${newReqId} created successfully. Pre-validation verified!`
    );
  };

  const handleNavigateToRequest = (reqId: string) => {
    setSelectedRequestId(reqId);
    setActiveTab('tracking');
  };

  const handleLangToggle = () => {
    setLang(prev => (prev === 'en' ? 'ar' : 'en'));
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 rounded-xl bg-slate-900 text-white text-xs shadow-xl border border-slate-800 flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="font-bold text-[#BA9653]">
              {lang === 'ar' ? 'تأكيد نظام طيران الإمارات (RFT)' : 'Emirates RFT System Confirmation'}
            </div>
            <div className="text-slate-200 mt-0.5">{toastMessage}</div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <Header
        role={role}
        onRoleChange={r => {
          setRole(r);
          // If switching to HR, default to in-flight tracking or mining
          if (r === 'hr' && activeTab === 'wizard') {
            setActiveTab('tracking');
          }
        }}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        lang={lang}
        onLangToggle={handleLangToggle}
        onOpenAssistant={() => setIsAssistantOpen(true)}
      />

      {/* Persona Context Banner */}
      <div className="bg-white border-b border-slate-200 py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">
              {t.activePersona}: {role === 'manager' ? t.lineManagerRole : t.hrOpsRole}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-500">
              {role === 'manager' ? t.managerDesc : t.hrDesc}
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-500">
            <span>{t.dubaiHQ}</span>
            <span className="text-slate-300">·</span>
            <span className="font-mono text-emerald-700 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
              {t.erpOnline}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'wizard' && (
          <RequestWizard onSubmitted={handleSubmitted} lang={lang} />
        )}

        {activeTab === 'tracking' && (
          <InFlightTracker
            role={role}
            lang={lang}
            selectedRequestId={selectedRequestId}
            onSelectRequest={setSelectedRequestId}
          />
        )}

        {activeTab === 'mining' && (
          <ProcessMiningView lang={lang} />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            lang={lang}
            role={role}
            onNavigateToTracker={() => setActiveTab('tracking')}
          />
        )}

        {activeTab === 'audit' && (
          <AuditTrailView lang={lang} />
        )}
      </main>

      {/* Floating Bilingual AI Assistant Drawer */}
      <AssistantWidget
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        lang={lang}
        onNavigateToRequest={handleNavigateToRequest}
      />

      {/* Floating Quick Trigger for Assistant */}
      {!isAssistantOpen && (
        <button
          onClick={() => setIsAssistantOpen(true)}
          className="fixed bottom-6 right-6 z-40 px-4 py-2.5 bg-[#D71921] hover:bg-[#b5141b] text-white rounded-full shadow-lg flex items-center gap-2 text-xs font-bold transition-all hover:scale-105 cursor-pointer"
          title={lang === 'ar' ? 'فتح المساعد الذكي' : 'Open Bilingual Assistant'}
        >
          <Sparkles className="w-4 h-4" />
          <span>{lang === 'ar' ? 'المساعد الذكي' : 'Emirates AI Assistant'}</span>
        </button>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span>
              {lang === 'ar'
                ? '© 2026 مجموعة طيران الإمارات · قطاع الموارد البشرية والفاعلية التنظيمية'
                : '© 2026 The Emirates Group · Human Resources & Organization Effectiveness'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>{lang === 'ar' ? 'بروتوكول صحيح من المرة الأولى (RFT)' : 'Right First Time (RFT) Protocol'}</span>
            <span>·</span>
            <span>XGBoost & LightGBM SHAP Analytics</span>
            <span>·</span>
            <span>Workday ERP Sync Gateway</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
