import { GoogleGenAI } from '@google/genai';
import { inMemoryAuditLog, inMemoryRequests } from './auditLog.js';
import { loadAndAnalyzeEventLog } from './processMining.js';

interface ChatRequest {
  message: string;
  history?: { role: 'user' | 'assistant'; text: string }[];
  language?: 'en' | 'ar';
}

interface ChatResponse {
  reply: string;
  language: 'en' | 'ar';
  relatedCaseId?: string;
  actionLinks?: { label: string; action: string; targetId?: string }[];
}

function detectArabic(text: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F]/.test(text);
}

export async function handleAssistantChat(req: ChatRequest): Promise<ChatResponse> {
  const query = req.message.trim();
  const isArabic = req.language === 'ar' || detectArabic(query);
  const lang: 'en' | 'ar' = isArabic ? 'ar' : 'en';

  const lowerQuery = query.toLowerCase();

  // Check if query matches a known request by ID, employee name, or number
  // Normalize Arabic names to match English employee records
  let normalizedQuery = lowerQuery;
  if (lowerQuery.includes('سارة') || lowerQuery.includes('جينكينز')) normalizedQuery += ' sarah jenkins';
  if (lowerQuery.includes('فرحان') || lowerQuery.includes('سعيد')) normalizedQuery += ' farhan saeed';
  if (lowerQuery.includes('ديفيد') || lowerQuery.includes('تشن')) normalizedQuery += ' david chen';
  if (lowerQuery.includes('راشد') || lowerQuery.includes('البلوشي') || lowerQuery.includes('بلوشي')) normalizedQuery += ' rashid al-blooshi';

  // Check if query matches any in-flight request
  const matchedRequest = inMemoryRequests.find(r => {
    return (
      normalizedQuery.includes(r.id.toLowerCase()) ||
      normalizedQuery.includes(r.trackingNumber.toLowerCase()) ||
      (r.employeeName && normalizedQuery.includes(r.employeeName.toLowerCase())) ||
      (r.employeeId && normalizedQuery.includes(r.employeeId.toLowerCase())) ||
      (r.title && normalizedQuery.includes(r.title.toLowerCase()))
    );
  });

  // Try Gemini API if GEMINI_API_KEY is available
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI();
      const analytics = loadAndAnalyzeEventLog();

      const contextPrompt = `
You are the "Emirates Group Right First Time (RFT) Smart P2P Assistant" for Emirates Group Human Resources and Line Managers.
Respond in ${isArabic ? 'Arabic (العربية الفصحى بطريقة مهنية وراقية)' : 'English (clear, professional corporate Emirates tone)'}.

Current system data context:
- In-Flight Requests:
${JSON.stringify(
  inMemoryRequests.map(r => ({
    id: r.id,
    trackingNumber: r.trackingNumber,
    title: r.title,
    employee: r.employeeName,
    type: r.requestType,
    status: r.status,
    owner: r.currentStepOwner,
    returnRisk: r.riskPrediction?.returnRisk,
    delayRisk: r.riskPrediction?.delayRisk,
    action: r.riskPrediction?.recommendedAction
  })),
  null,
  2
)}

- Core Rules:
1. Business justification >= 15 characters.
2. Lateral Transfer: target grade == current grade.
3. Promotion: target grade > current grade.
4. New Position & Promotion: requires has_budget_approval = true.
5. Transfers/Promotions require valid employee ID.

- Process Mining Recommendations:
1. Grade Mismatch: saves 3.5 days via pre-submission checks.
2. Missing Attachments: saves 1.8 days via automated reminders.
3. Lateral Moves: Express Lane saves 2.2 days for clean same-department moves.

User Question: "${query}"

Provide a concise, highly direct answer with exact numbers and case details when applicable. Do not invent fake case numbers.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contextPrompt
      });

      const text = response.text || '';
      if (text.trim().length > 0) {
        return {
          reply: text,
          language: lang,
          relatedCaseId: matchedRequest?.id,
          actionLinks: matchedRequest
            ? [
                {
                  label: isArabic ? `عرض الطلب ${matchedRequest.trackingNumber}` : `View ${matchedRequest.trackingNumber}`,
                  action: 'VIEW_REQUEST',
                  targetId: matchedRequest.id
                }
              ]
            : undefined
        };
      }
    } catch (apiErr) {
      console.warn('Gemini API call failed or rate-limited, utilizing local deterministic intelligence engine:', apiErr);
    }
  }

  // Robust, Domain-Grounded Fallback Intelligence Engine
  if (matchedRequest) {
    if (isArabic) {
      return {
        reply: `طلبك برقم التتبع **${matchedRequest.trackingNumber}** (${matchedRequest.title}) موجود حالياً في مرحلة: **${matchedRequest.status}** لدى **${matchedRequest.currentStepOwner}**.\n\n` +
          `• نسبة خطر الإرجاع (Return Risk): **${matchedRequest.riskPrediction?.returnRisk || 20}%**\n` +
          `• نسبة خطر التأخير (Delay Risk): **${matchedRequest.riskPrediction?.delayRisk || 25}%**\n` +
          `• الإجراء الموصى به: ${matchedRequest.riskPrediction?.recommendedAction || 'قيد المراجعة الروتينية'}\n` +
          (matchedRequest.status === 'Returned to Manager'
            ? `⚠️ تنبيه: تم إرجاع هذا الطلب لتعديل الدرجة الوظيفية لتتوافق مع قواعد النقل الجانبي (Rule-02A).`
            : `الطلب يتقدم في المسار المعتمد وسيقوم فريق العمليات بموافاتكم بالتحديث فوراً.`),
        language: 'ar',
        relatedCaseId: matchedRequest.id,
        actionLinks: [
          {
            label: `فتح تفاصيل الطلب (${matchedRequest.trackingNumber})`,
            action: 'VIEW_REQUEST',
            targetId: matchedRequest.id
          }
        ]
      };
    } else {
      return {
        reply: `Your request **${matchedRequest.trackingNumber}** (${matchedRequest.title}) is currently **${matchedRequest.status}** with **${matchedRequest.currentStepOwner}**.\n\n` +
          `• **Return Risk:** ${matchedRequest.riskPrediction?.returnRisk || 20}%\n` +
          `• **Delay Risk:** ${matchedRequest.riskPrediction?.delayRisk || 25}%\n` +
          `• **Recommended Action:** ${matchedRequest.riskPrediction?.recommendedAction || 'Normal screening processing'}\n` +
          (matchedRequest.status === 'Returned to Manager'
            ? `⚠️ Note: This request was returned due to a grade discrepancy. Please adjust the target position or change the request type to Promotion.`
            : `Processing is proceeding under SLA with no blocking alerts.`),
        language: 'en',
        relatedCaseId: matchedRequest.id,
        actionLinks: [
          {
            label: `Open ${matchedRequest.trackingNumber}`,
            action: 'VIEW_REQUEST',
            targetId: matchedRequest.id
          }
        ]
      };
    }
  }

  // Rules / Guidance queries
  if (lowerQuery.includes('rule') || lowerQuery.includes('قواعد') || lowerQuery.includes('شروط') || lowerQuery.includes('lateral') || lowerQuery.includes('جانبي') || lowerQuery.includes('promotion') || lowerQuery.includes('ترقية')) {
    if (isArabic) {
      return {
        reply: `قواعد التدقيق المسبق الذكية لطلبات (Position to Person - P2P) في مجموعة الإمارات:\n\n` +
          `1. **مبرر الأعمال (Business Justification):** يجب ألا يقل عن 15 حرفاً يوضح بدقة الأثر التشغيلي.\n` +
          `2. **النقل الجانبي (Lateral Transfer):** يشترط تطابق الدرجة الحالية مع الدرجة المستهدفة تماماً (Target Grade = Current Grade).\n` +
          `3. **الترقية (Promotion):** يجب أن تكون الدرجة المستهدفة أعلى من الدرجة الحالية (Target Grade > Current Grade).\n` +
          `4. **موافقة الميزانية (Budget Approval):** إلزامية لطلبات "منصب جديد" و"الترقية".\n` +
          `5. **معرّف الموظف (Employee ID):** إلزامي ويبدأ بـ (EK-XXXXX).\n\n` +
          `الالتزام بهذه القواعد قبل الإرسال يوفر 3.5 أيام عمل ويضمن نسبة 100% "صحيح من المرة الأولى" (Right First Time).`,
        language: 'ar'
      };
    } else {
      return {
        reply: `Here are the core **Right First Time (RFT)** pre-submission rules enforced for Emirates P2P requests:\n\n` +
          `1. **Business Justification:** Must be $\\ge 15$ characters detailing the operational need.\n` +
          `2. **Lateral Transfer Parity:** Target Grade must exactly equal Current Grade.\n` +
          `3. **Promotion Ascension:** Target Grade must be strictly greater than Current Grade.\n` +
          `4. **Budget Authorization:** Mandatory (\`has_budget_approval = true\`) for all New Positions and Promotions.\n` +
          `5. **Employee Identifier:** Valid Emirates Group ID (e.g., \`EK-77341\`) is required for transfers and promotions.\n\n` +
          `Following these rules eliminates ping-pong loops and saves an estimated **3.5 days** per request.`,
        language: 'en'
      };
    }
  }

  // Default greetings & general queries
  if (isArabic) {
    return {
      reply: `مرحباً بك في المساعد الذكي لمجموعة الإمارات لطلبات التعيين والنقل (P2P Smart Assistant).\n\n` +
        `يمكنني مساعدتك في:\n` +
        `• الاستعلام عن حالة طلبك (مثال: "أين طلب سارة جينكينز؟" أو "ما حالة P2P-EK-2026-0108؟")\n` +
        `• شرح قواعد النقل والترقية واعتماد الميزانية\n` +
        `• معرفة أسباب إرجاع المعاملات وتوصيات تسريع المسار السريع (Express Lane)\n\n` +
        `كيف يمكنني خدمتك اليوم؟`,
      language: 'ar'
    };
  } else {
    return {
      reply: `Welcome to the **Emirates Group Right First Time (P2P) Assistant**.\n\n` +
        `I can assist you with:\n` +
        `• Tracking request status (e.g., *"Where is Sarah Jenkins' request?"* or *"Status of P2P-EK-2026-0108"*)\n` +
        `• Checking pre-submission validation rules and grade parity policies\n` +
        `• Understanding risk scores, SHAP explanations, and Express Lane routing\n\n` +
        `How can I help you today?`,
      language: 'en'
    };
  }
}
