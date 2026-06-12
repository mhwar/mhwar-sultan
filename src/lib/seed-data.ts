import type { Project, Task, Plan, PlanPhase, Note, Sprint, ProductDoc, GrowthMetric, GrowthExperiment, GrowthChannel, TeamMember, ScheduleEvent, FinanceEntry, FinancePackage, Kpi, Client, ContentItem, Portfolio, Meeting, ProductProfile } from '@/types'
import { FALLBACK_TOOL_IDS } from '@/lib/project-types'

export const SEED_METRICS: GrowthMetric[] = [
  { id: 'mt-1', projectId: 'mehwar', name: 'مستخدمون نشطون', value: 120, unit: 'مستخدم', target: 1000, change: 15, category: 'retention', order: 0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z' },
  { id: 'mt-2', projectId: 'mehwar', name: 'معدل التحويل', value: 3.2, unit: '%', target: 8, change: -0.5, category: 'activation', order: 1, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z' },
  { id: 'mt-3', projectId: 'mehwar', name: 'إيرادات شهرية', value: 2400, unit: 'SAR', target: 10000, change: 8, category: 'revenue', order: 2, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-06-01T00:00:00Z' },
]

export const SEED_EXPERIMENTS: GrowthExperiment[] = [
  { id: 'ex-1', projectId: 'mehwar', title: 'تقليل حقول التسجيل', hypothesis: 'نعتقد أن تقليل الحقول إلى 3 سيرفع معدل إكمال التسجيل بشكل ملحوظ', metric: 'معدل التسجيل', status: 'running', impact: 4, confidence: 3, ease: 4, startDate: '2026-05-20T00:00:00Z', order: 0, createdAt: '2026-05-15T00:00:00Z' },
  { id: 'ex-2', projectId: 'mehwar', title: 'عرض تجريبي 14 يوماً مجاناً', hypothesis: 'نعتقد أن تجربة مجانية بدون بطاقة ائتمان ستزيد التحويل', metric: 'معدل التحويل', status: 'idea', impact: 5, confidence: 3, ease: 2, order: 1, createdAt: '2026-05-20T00:00:00Z' },
  { id: 'ex-3', projectId: 'mehwar', title: 'إشعارات تذكير ذكية', metric: 'الاحتفاظ', status: 'completed', result: 'won', impact: 3, confidence: 4, ease: 5, notes: 'رفعت معدل العودة 18% خلال أسبوع واحد', order: 2, createdAt: '2026-04-01T00:00:00Z' },
]

export const SEED_CHANNELS: GrowthChannel[] = [
  { id: 'ch-1', projectId: 'mehwar', name: 'Twitter / X', type: 'social', status: 'active', notes: 'نشر تحديثات المنتج والـ changelog', order: 0, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'ch-2', projectId: 'mehwar', name: 'SEO — مدونة المنتج', type: 'seo', status: 'testing', order: 1, createdAt: '2026-03-01T00:00:00Z' },
]

export const SEED_PLANS: Plan[] = [
  { id: 'pl-mehwar', projectId: 'mehwar', name: 'خارطة الطريق', icon: 'route', kind: 'roadmap', domain: 'product', view: 'timeline', order: 1, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'pl-mellasaq', projectId: 'mellasaq', name: 'خارطة الطريق', icon: 'route', kind: 'roadmap', domain: 'product', view: 'timeline', order: 1, createdAt: '2026-03-01T00:00:00Z' },
  { id: 'pl-bawsala', projectId: 'bawsala', name: 'خارطة الطريق', icon: 'route', kind: 'roadmap', domain: 'product', view: 'timeline', order: 1, createdAt: '2026-02-01T00:00:00Z' },
]

export const SEED_SPRINTS: Sprint[] = [
  {
    id: 'sp-mehwar-1', projectId: 'mehwar', name: 'مبادرة: إطلاق لوحة المهام التفاعلية',
    goal: 'تسليم لوحة مهام متكاملة بعروض متعددة وفلاتر متقدمة',
    status: 'active', startDate: '2026-06-01T00:00:00Z', dueDate: '2026-06-28T00:00:00Z', order: 1,
    lead: 'tm1',
    checklist: [
      { id: 'sc-1-1', title: 'اعتماد التصميم النهائي', done: true },
      { id: 'sc-1-2', title: 'تطوير عروض التقويم (يوم/أسبوع/شهر/سنة)', done: true },
      { id: 'sc-1-3', title: 'شريط الفلاتر المتقدم', done: false },
      { id: 'sc-1-4', title: 'اختبار القبول مع الفريق', done: false },
    ],
    updates: [
      { id: 'su-1-1', text: 'اكتمل عرض البرنامج السنوي ومراجعته مع التصميم.', createdAt: '2026-06-04T09:00:00Z' },
      { id: 'su-1-2', text: 'بدء العمل على شريط الفلاتر — التسليم المتوقع نهاية الأسبوع.', createdAt: '2026-06-05T13:30:00Z' },
    ],
    createdAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'sp-mehwar-2', projectId: 'mehwar', name: 'مبادرة: نظام المهام والمبادرات',
    goal: 'بنية بيانات المهام والمبادرات والربط بينها',
    status: 'planned', startDate: '2026-06-15T00:00:00Z', dueDate: '2026-07-10T00:00:00Z', order: 2,
    lead: 'tm4',
    checklist: [
      { id: 'sc-2-1', title: 'نمذجة بيانات المهام', done: true },
      { id: 'sc-2-2', title: 'ربط المهام بالمبادرات', done: false },
    ],
    createdAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'sp-mehwar-3', projectId: 'mehwar', name: 'تنظيم ملتقى محور التقني السنوي',
    goal: 'إقامة ملتقى يضم 300 مشارك مع متحدثين ورعاة وبرنامج متكامل',
    status: 'active', startDate: '2026-06-01T00:00:00Z', dueDate: '2026-11-20T00:00:00Z', order: 3,
    lead: 'tm1',
    checklist: [
      { id: 'sc-3-1', title: 'تحديد الموعد والمكان', done: true },
      { id: 'sc-3-2', title: 'التعاقد مع المتحدثين', done: true },
      { id: 'sc-3-3', title: 'استقطاب الرعاة', done: false },
      { id: 'sc-3-4', title: 'فتح باب التسجيل', done: false },
      { id: 'sc-3-5', title: 'إعداد الأجندة والبرنامج', done: false },
      { id: 'sc-3-6', title: 'التغطية الإعلامية', done: false },
    ],
    updates: [
      { id: 'su-3-1', text: 'تم حجز قاعة المؤتمرات الرئيسية ليوم 15 نوفمبر.', createdAt: '2026-06-02T10:00:00Z' },
      { id: 'su-3-2', text: 'تأكيد مشاركة 4 متحدثين رئيسيين، التواصل جارٍ مع البقية.', createdAt: '2026-06-05T16:00:00Z' },
    ],
    createdAt: '2026-06-01T00:00:00Z',
  },

  // ── ملصق — مسارات العمل الخمسة لخطة التمكين الاستراتيجي (قيادة: سفيان) ──
  {
    id: 'sp-mlsq-1', projectId: 'mellasaq', name: 'تكامل نظام الترميز (GS1)',
    goal: 'ربط فعلي وتكامل بيانات مع مركز الترميز السعودي لترسيخ الموثوقية وسحب تفاصيل المنتجات تلقائياً',
    status: 'active', startDate: '2026-06-09T00:00:00Z', dueDate: '2026-08-31T00:00:00Z', order: 1,
    lead: 'tm7',
    checklist: [
      { id: 'mc-1-1', title: 'تحليل ومطابقة حقول النموذج العالمي مع قاعدة بيانات ملصق', done: false },
      { id: 'mc-1-2', title: 'رسم البنية المعمارية للربط المباشر', done: false },
      { id: 'mc-1-3', title: 'نموذج أولي لسحب بيانات الباركود في البيئة التجريبية', done: false },
      { id: 'mc-1-4', title: 'اعتماد مخطط المطابقة وخطة الربط الهندسية', done: false },
    ],
    updates: [
      { id: 'mu-1-1', text: 'انطلاق المسار ضمن خطة التمكين — التركيز الأول على مطابقة حقول البيانات.', createdAt: '2026-06-09T09:00:00Z' },
    ],
    createdAt: '2026-06-09T00:00:00Z',
  },
  {
    id: 'sp-mlsq-2', projectId: 'mellasaq', name: 'تطوير ملف الغذاء والدواء',
    goal: 'إغلاق الملفات المعلقة مع الهيئة وبناء قناة تواصل تقني مستمرة لترسيخ المصداقية الرسمية',
    status: 'active', startDate: '2026-06-09T00:00:00Z', dueDate: '2026-08-31T00:00:00Z', order: 2,
    lead: 'tm7',
    checklist: [
      { id: 'mc-2-1', title: 'إغلاق الملفات والملاحظات المعلقة مع الهيئة', done: false },
      { id: 'mc-2-2', title: 'بناء قناة تواصل تقني مستمرة', done: false },
      { id: 'mc-2-3', title: 'مواءمة بيانات الحساسيات مع المعايير الرسمية المعتمدة', done: false },
      { id: 'mc-2-4', title: 'دراسة فرص الربط المستقبلي لمؤشرات الصحة العامة', done: false },
    ],
    updates: [
      { id: 'mu-2-1', text: 'انطلاق المسار — جارٍ حصر الملاحظات المعلقة لدى الهيئة.', createdAt: '2026-06-09T09:30:00Z' },
    ],
    createdAt: '2026-06-09T00:00:00Z',
  },
  {
    id: 'sp-mlsq-3', projectId: 'mellasaq', name: 'تحسين تطبيق الأفراد',
    goal: 'فهم ملاءمة المنتج لصحة المستخدم في أقل من ثانية واحدة من المسح',
    status: 'active', startDate: '2026-06-15T00:00:00Z', dueDate: '2026-09-09T00:00:00Z', order: 3,
    lead: 'tm7',
    checklist: [
      { id: 'mc-3-1', title: 'تبسيط واجهات الهاتف وجعل مسح الباركود بلمسة واحدة', done: false },
      { id: 'mc-3-2', title: 'تطوير خوارزميات الذكاء الاصطناعي لتشخيص المكونات بدقة', done: false },
      { id: 'mc-3-3', title: 'معايير آلية لتنظيف قاعدة البيانات واستكمال النواقص', done: false },
      { id: 'mc-3-4', title: 'إطلاق ميزات جديدة تعزز تجربة المستهلك', done: false },
    ],
    createdAt: '2026-06-09T00:00:00Z',
  },
  {
    id: 'sp-mlsq-4', projectId: 'mellasaq', name: 'تأطير منصة ملصق للأعمال',
    goal: 'منصة تصل الشركات والمصانع والأسر المنتجة بالجهات التي يحتاجونها — لوحة تحكم ونماذج اشتراك ودخل',
    status: 'planned', startDate: '2026-07-01T00:00:00Z', dueDate: '2026-09-09T00:00:00Z', order: 4,
    lead: 'tm7',
    checklist: [
      { id: 'mc-4-1', title: 'تحديد الخدمات الموجهة للشركات الغذائية والمصانع والأسر المنتجة', done: false },
      { id: 'mc-4-2', title: 'وضع المخطط الهيكلي للوحة التحكم لمراقبة وتعديل بيانات المنتجات', done: false },
      { id: 'mc-4-3', title: 'هيكلة نماذج الاشتراك والدخل (باقات شهرية، API، حزم تقارير)', done: false },
      { id: 'mc-4-4', title: 'لوحة تحكم مخصصة لباقات الشركات والأعمال', done: false },
    ],
    createdAt: '2026-06-09T00:00:00Z',
  },
  {
    id: 'sp-mlsq-5', projectId: 'mellasaq', name: 'شراكات السوق والنمو',
    goal: 'قائمة واضحة لفرص وشراكات السوق ذات الأولوية ومسودة أولية لخطة النمو',
    status: 'planned', startDate: '2026-07-15T00:00:00Z', dueDate: '2026-09-09T00:00:00Z', order: 5,
    lead: 'tm7',
    checklist: [
      { id: 'mc-5-1', title: 'حصر وتصنيف الحلفاء — جمعيات صحية وسلاسل تجزئة ومصانع أغذية', done: false },
      { id: 'mc-5-2', title: 'صياغة عروض التعاون متبادلة القيمة', done: false },
      { id: 'mc-5-3', title: 'هندسة خطة الوصول للسوق وتحديد القنوات الفعالة', done: false },
      { id: 'mc-5-4', title: 'وضع معايير ومؤشرات الجاهزية للتوسع الخليجي لاحقاً', done: false },
    ],
    createdAt: '2026-06-09T00:00:00Z',
  },
]

export const SEED_PROJECTS: Project[] = [
  {
    id: 'mehwar',
    name: 'محور',
    nameEn: 'Mehwar',
    description: 'منصة محور — نظام إدارة المشاريع التقنية الشخصية. مركز التحكم في المشاريع والمهام والخطط والملاحظات. بُنيت بـ Next.js وTypeScript وTailwind.',
    status: 'active',
    progress: 35,
    color: '#1B3D8F',
    icon: 'hexagon',
    logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzFCM0Q4RiIvPjxlbGxpcHNlIGN4PSI5NiIgY3k9IjEwOCIgcng9IjQ2IiByeT0iNjUiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMTkiIHRyYW5zZm9ybT0icm90YXRlKC0xNSA5NiAxMDgpIi8+PHRleHQgeD0iMTM4IiB5PSI2MCIgZmlsbD0id2hpdGUiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtZmFtaWx5PSJzZXJpZiIgZm9udC1zdHlsZT0iaXRhbGljIj7CrjwvdGV4dD48L3N2Zz4=',
    cover: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjAwIDQwMCI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJiZyIgeDE9IjAiIHgyPSIxIiB5MT0iMCIgeTI9IjEiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiMwRjJDN0EiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMxQjNEOEYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI0MDAiIGZpbGw9InVybCglMjNiZykiLz48ZWxsaXBzZSBjeD0iOTUwIiBjeT0iMjAwIiByeD0iMjAwIiByeT0iMjgwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xMikiIHN0cm9rZS13aWR0aD0iNjAiIHRyYW5zZm9ybT0icm90YXRlKC0yMCA5NTAgMjAwKSIvPjxlbGxpcHNlIGN4PSIxMDMwIiBjeT0iMTgwIiByeD0iMTUwIiByeT0iMjIwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wNykiIHN0cm9rZS13aWR0aD0iODAiIHRyYW5zZm9ybT0icm90YXRlKC0yMCAxMDMwIDE4MCkiLz48dGV4dCB4PSI4MCIgeT0iMTkwIiBmaWxsPSJ3aGl0ZSIgZm9udC1zaXplPSI4OCIgZm9udC1mYW1pbHk9IkFyaWFsLHNhbnMtc2VyaWYiIGZvbnQtd2VpZ2h0PSJib2xkIiBsZXR0ZXItc3BhY2luZz0iLTIiPm1od2FyPC90ZXh0Pjx0ZXh0IHg9IjgyIiB5PSIyOTAiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC42NSkiIGZvbnQtc2l6ZT0iNTYiIGZvbnQtZmFtaWx5PSJBcmlhbCxzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iYm9sZCI+2YXYrdmI2LE8L3RleHQ+PC9zdmc+',
    category: 'منصة',
    type: 'technical',
    tools: FALLBACK_TOOL_IDS,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-06-03T00:00:00Z',
    tags: ['Next.js', 'TypeScript', 'Tailwind', 'Zustand'],
    links: [{ label: 'الموقع', url: 'https://mhwar.sa' }],
  },
  {
    id: 'mellasaq',
    name: 'ملصق',
    nameEn: 'Mulsaq',
    description: 'منصة سعودية تساعد المستخدمين على فهم المنتجات واتخاذ قرارات أفضل عبر تحليل المكونات والبيانات الغذائية والحساسيات — حلقة الوصل بين الشركات والمصانع والأسر المنتجة وبين الجهات التي يحتاجونها مثل GS1 وهيئة الغذاء والدواء.',
    status: 'active',
    progress: 35,
    color: '#F4581C',
    icon: 'scan-barcode',
    logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgcng9IjQ0IiBmaWxsPSIjRjQ1ODFDIi8+PGcgZmlsbD0iI2ZmZiI+PHJlY3QgeD0iNTYiIHk9IjY4IiB3aWR0aD0iMTIiIGhlaWdodD0iNjQiIHJ4PSIzIi8+PHJlY3QgeD0iNzgiIHk9IjY4IiB3aWR0aD0iNyIgaGVpZ2h0PSI2NCIgcng9IjMiLz48cmVjdCB4PSI5NSIgeT0iNjgiIHdpZHRoPSIxNiIgaGVpZ2h0PSI2NCIgcng9IjMiLz48cmVjdCB4PSIxMjEiIHk9IjY4IiB3aWR0aD0iNyIgaGVpZ2h0PSI2NCIgcng9IjMiLz48cmVjdCB4PSIxMzgiIHk9IjY4IiB3aWR0aD0iMTIiIGhlaWdodD0iNjQiIHJ4PSIzIi8+PC9nPjxwYXRoIGQ9Ik00NCA2MFY0OHEwLTggOC04aDE0TTE1NiA2MFY0OHEwLTgtOC04aC0xNE00NCAxNDB2MTJxMCA4IDggOGgxNE0xNTYgMTQwdjEycTAgOC04IDhoLTE0IiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMTAiIGZpbGw9Im5vbmUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg==',
    category: 'منصة بيانات منتجات',
    type: 'technical',
    tools: ['overview', 'profile', 'product', 'execution', 'meetings', 'team', 'kpis', 'finance', 'notes'],
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-06-09T00:00:00Z',
    tags: ['بيانات المنتجات', 'GS1', 'هيئة الغذاء والدواء', 'باركود', 'ذكاء اصطناعي'],
    links: [{ label: 'الموقع الرسمي', url: 'https://checkersa.com' }],
  },
  {
    id: 'bawsala',
    name: 'بوصلة الأعمال',
    nameEn: 'Bawsala Business',
    description: 'مؤسسة حلول أعمال متكاملة — إدارة حسابات التواصل الاجتماعي وصناعة المحتوى للعملاء: من استلام الطلبات وكتابة المحتوى وتصميمه، إلى الجدولة والنشر والتقارير الشهرية. نحدد الاتجاه.. ونصنع الأثر.',
    status: 'active',
    progress: 45,
    color: '#2743C6',
    icon: 'compass',
    logo: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgcng9IjQ0IiBmaWxsPSIjMUUzQTlGIi8+PGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSI2NCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utb3BhY2l0eT0iMC4zIiBzdHJva2Utd2lkdGg9IjciLz48cGF0aCBkPSJNMTAwIDQyIEwxMjggMTMyIEwxMDAgMTE0IEw3MiAxMzIgWiIgZmlsbD0iI0YwQjQyOSIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjE0OCIgcj0iNyIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIwLjg1Ii8+PC9zdmc+',
    category: 'وكالة محتوى وإدارة حسابات',
    type: 'content',
    tools: ['overview', 'profile', 'clients', 'content', 'execution', 'meetings', 'team', 'finance', 'kpis', 'notes'],
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-06-10T00:00:00Z',
    tags: ['إدارة حسابات', 'صناعة المحتوى', 'تصميم', 'هوية بصرية', 'تقارير شهرية'],
    links: [],
  },
  {
    id: 'jasad',
    name: 'جسد',
    nameEn: 'Jasad',
    description: 'إدارة المحتوى الإعلامي الشهري لجمعية جسد لمرضى السرطان — عميل واحد، 25 قطعة شهرياً، تقويم + لوحة + تقارير.',
    status: 'active',
    progress: 28,
    color: '#E91E8C',
    icon: 'heart',
    category: 'محتوى',
    type: 'content',
    tools: ['overview', 'clients', 'content', 'finance', 'execution', 'notes'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-06-03T00:00:00Z',
    tags: ['جمعية', 'محتوى', 'صحة'],
    links: [],
  },
]

export const SEED_TASKS: Task[] = [
  // محور
  { id: 't1', projectId: 'mehwar', assigneeId: 'tm2', title: 'تصميم الواجهة الرئيسية', description: 'تصميم Figma كامل للمنصة', status: 'done', priority: 'high', startDate: '2026-01-05T00:00:00Z', dueDate: '2026-01-20T00:00:00Z', createdAt: '2026-01-05T00:00:00Z' },
  { id: 't2', projectId: 'mehwar', assigneeId: 'tm3', title: 'إعداد البنية التحتية', description: 'Next.js + Tailwind + Zustand', status: 'done', priority: 'high', startDate: '2026-01-10T00:00:00Z', dueDate: '2026-01-25T00:00:00Z', createdAt: '2026-01-10T00:00:00Z' },
  {
    id: 't3',
    projectId: 'mehwar',
    assigneeId: 'tm3',
    sprintId: 'sp-mehwar-1',
    title: 'تطوير لوحة المهام التفاعلية',
    description: 'تصميم وتطوير لوحة مهام ذكية تدعم السحب والإفلات، والفلترة المتقدمة، وعروض التقويم المتعددة (يوم / أسبوع / شهر / سنة).\n\nيشمل العمل دعم المهام الممتدة عبر أيام متعددة، وأشرطة CSS Grid للمهام الطويلة، وشريط فلاتر متطور مع تصفية فورية.',
    status: 'in-progress',
    priority: 'high',
    startDate: '2026-02-01T00:00:00Z',
    dueDate: '2026-06-20T00:00:00Z',
    timeEstimate: 40,
    tags: ['React', 'Zustand', 'CSS Grid', 'UX'],
    subtasks: [
      { id: 'sub-t3-1', title: 'تصميم واجهة Kanban board في Figma', done: true },
      { id: 'sub-t3-2', title: 'تطوير عرض اليوم والأسبوع بشبكة CSS Grid', done: true },
      { id: 'sub-t3-3', title: 'دعم السحب والإفلات لإعادة الجدولة', done: true },
      { id: 'sub-t3-4', title: 'تطوير شريط الفلاتر المتطور', done: true },
      { id: 'sub-t3-5', title: 'المهام الممتدة — أشرطة span متعددة الأيام', done: false },
      { id: 'sub-t3-6', title: 'اختبار التوافق مع الشاشات الصغيرة', done: false },
      { id: 'sub-t3-7', title: 'توثيق الواجهة البرمجية للمكوّنات', done: false },
    ],
    createdAt: '2026-02-01T00:00:00Z',
  },
  {
    id: 't4',
    projectId: 'mehwar',
    assigneeId: 'tm4',
    sprintId: 'sp-mehwar-2',
    title: 'تطوير نظام المهام',
    description: 'Next.js + Tailwind + Zustand',
    status: 'in-progress',
    priority: 'medium',
    startDate: '2026-02-15T00:00:00Z',
    dueDate: '2026-06-30T00:00:00Z',
    timeEstimate: 24,
    tags: ['backend', 'store'],
    subtasks: [
      { id: 'sub-t4-1', title: 'تصميم نموذج البيانات للمهام', done: true },
      { id: 'sub-t4-2', title: 'تطوير مخزن Zustand للمهام', done: true },
      { id: 'sub-t4-3', title: 'ربط المهام بالمبادرات', done: false },
    ],
    createdAt: '2026-02-15T00:00:00Z',
  },
  { id: 't5', projectId: 'mehwar', assigneeId: 'tm4', title: 'نظام الإشعارات', status: 'todo', priority: 'low', startDate: '2026-06-10T00:00:00Z', dueDate: '2026-07-15T00:00:00Z', tags: ['notifications'], createdAt: '2026-03-01T00:00:00Z' },
  { id: 't6', projectId: 'mehwar', assigneeId: 'tm3', title: 'تصدير البيانات', status: 'todo', priority: 'low', startDate: '2026-06-20T00:00:00Z', dueDate: '2026-07-30T00:00:00Z', createdAt: '2026-03-10T00:00:00Z' },

  // ملصق — مرحلة التمكين الاستراتيجي (المهام موكلة لسفيان tm7 ليتابعها الشركاء)
  { id: 't7', projectId: 'mellasaq', assigneeId: 'tm5', title: 'تحديد متطلبات المشروع', status: 'done', priority: 'high', startDate: '2026-03-05T00:00:00Z', dueDate: '2026-03-15T00:00:00Z', createdAt: '2026-03-05T00:00:00Z' },
  { id: 't8', projectId: 'mellasaq', assigneeId: 'tm5', title: 'بحث المنافسين والسوق', status: 'done', priority: 'medium', startDate: '2026-03-10T00:00:00Z', dueDate: '2026-03-20T00:00:00Z', createdAt: '2026-03-10T00:00:00Z' },
  { id: 't9', projectId: 'mellasaq', assigneeId: 'tm7', sprintId: 'sp-mlsq-3', title: 'تبسيط واجهة المسح وجعل فحص الباركود بلمسة واحدة', status: 'todo', priority: 'high', startDate: '2026-06-15T00:00:00Z', dueDate: '2026-07-10T00:00:00Z', tags: ['تطبيق الأفراد', 'UX'], createdAt: '2026-03-15T00:00:00Z' },
  { id: 't10', projectId: 'mellasaq', assigneeId: 'tm7', sprintId: 'sp-mlsq-1', title: 'بناء النموذج الأولي للربط بسحب بيانات الباركود في البيئة التجريبية', status: 'todo', priority: 'high', startDate: '2026-07-01T00:00:00Z', dueDate: '2026-08-15T00:00:00Z', tags: ['GS1', 'API'], createdAt: '2026-04-01T00:00:00Z' },
  // المسار 1: تكامل نظام الترميز (GS1)
  { id: 'tk-mlsq-1', projectId: 'mellasaq', assigneeId: 'tm7', sprintId: 'sp-mlsq-1', title: 'تحليل ومطابقة حقول النموذج العالمي مع قاعدة بيانات ملصق', status: 'in-progress', priority: 'high', startDate: '2026-06-09T00:00:00Z', dueDate: '2026-06-25T00:00:00Z', tags: ['GS1', 'بيانات'], createdAt: '2026-06-09T00:00:00Z' },
  { id: 'tk-mlsq-2', projectId: 'mellasaq', assigneeId: 'tm7', sprintId: 'sp-mlsq-1', title: 'رسم البنية المعمارية للربط المباشر وسحب تفاصيل المنتجات تلقائياً', status: 'todo', priority: 'high', startDate: '2026-06-22T00:00:00Z', dueDate: '2026-07-10T00:00:00Z', tags: ['GS1', 'معمارية'], createdAt: '2026-06-09T00:00:00Z' },
  // المسار 2: تطوير ملف الغذاء والدواء
  { id: 'tk-mlsq-3', projectId: 'mellasaq', assigneeId: 'tm7', sprintId: 'sp-mlsq-2', title: 'حصر الملفات والملاحظات المعلقة مع هيئة الغذاء والدواء', status: 'in-progress', priority: 'high', startDate: '2026-06-09T00:00:00Z', dueDate: '2026-06-20T00:00:00Z', tags: ['الهيئة'], createdAt: '2026-06-09T00:00:00Z' },
  { id: 'tk-mlsq-4', projectId: 'mellasaq', assigneeId: 'tm7', sprintId: 'sp-mlsq-2', title: 'مواءمة وتدقيق بيانات الحساسيات لتطابق المعايير الرسمية المعتمدة', status: 'todo', priority: 'medium', startDate: '2026-06-25T00:00:00Z', dueDate: '2026-07-30T00:00:00Z', tags: ['الهيئة', 'بيانات'], createdAt: '2026-06-09T00:00:00Z' },
  { id: 'tk-mlsq-5', projectId: 'mellasaq', assigneeId: 'tm7', sprintId: 'sp-mlsq-2', title: 'تأسيس قناة تواصل تقني مستمرة مع الهيئة', status: 'todo', priority: 'medium', startDate: '2026-07-01T00:00:00Z', dueDate: '2026-07-15T00:00:00Z', tags: ['الهيئة'], createdAt: '2026-06-09T00:00:00Z' },
  // المسار 3: تحسين تطبيق الأفراد
  { id: 'tk-mlsq-6', projectId: 'mellasaq', assigneeId: 'tm7', sprintId: 'sp-mlsq-3', title: 'تطوير خوارزميات الذكاء الاصطناعي لتشخيص المكونات بدقة متناهية', status: 'todo', priority: 'high', startDate: '2026-07-05T00:00:00Z', dueDate: '2026-08-20T00:00:00Z', tags: ['ذكاء اصطناعي'], createdAt: '2026-06-09T00:00:00Z' },
  { id: 'tk-mlsq-7', projectId: 'mellasaq', assigneeId: 'tm7', sprintId: 'sp-mlsq-3', title: 'تأسيس معايير آلية لتطهير قاعدة البيانات واستكمال النواقص', status: 'todo', priority: 'medium', startDate: '2026-07-15T00:00:00Z', dueDate: '2026-08-30T00:00:00Z', tags: ['بيانات'], createdAt: '2026-06-09T00:00:00Z' },
  // المسار 4: تأطير منصة الأعمال
  { id: 'tk-mlsq-8', projectId: 'mellasaq', assigneeId: 'tm7', sprintId: 'sp-mlsq-4', title: 'تحديد خدمات الشركات والمصانع والأسر المنتجة ورحلة الاشتراك', status: 'todo', priority: 'high', startDate: '2026-07-01T00:00:00Z', dueDate: '2026-07-25T00:00:00Z', tags: ['منصة الأعمال'], createdAt: '2026-06-09T00:00:00Z' },
  { id: 'tk-mlsq-9', projectId: 'mellasaq', assigneeId: 'tm7', sprintId: 'sp-mlsq-4', title: 'وضع المخطط الهيكلي للوحة تحكم الأعمال لمراقبة وتعديل بيانات المنتجات', status: 'todo', priority: 'high', startDate: '2026-07-20T00:00:00Z', dueDate: '2026-08-20T00:00:00Z', tags: ['منصة الأعمال', 'Dashboard'], createdAt: '2026-06-09T00:00:00Z' },
  { id: 'tk-mlsq-10', projectId: 'mellasaq', assigneeId: 'tm7', sprintId: 'sp-mlsq-4', title: 'هيكلة نماذج الاشتراك والدخل — باقات شهرية وواجهات ربط وحزم تقارير', status: 'todo', priority: 'medium', startDate: '2026-08-01T00:00:00Z', dueDate: '2026-08-25T00:00:00Z', tags: ['منصة الأعمال', 'إيرادات'], createdAt: '2026-06-09T00:00:00Z' },
  // المسار 5: شراكات السوق والنمو
  { id: 'tk-mlsq-11', projectId: 'mellasaq', assigneeId: 'tm7', sprintId: 'sp-mlsq-5', title: 'حصر وتصنيف الحلفاء — جمعيات صحية وسلاسل تجزئة ومصانع أغذية', status: 'todo', priority: 'medium', startDate: '2026-07-15T00:00:00Z', dueDate: '2026-08-10T00:00:00Z', tags: ['شراكات'], createdAt: '2026-06-09T00:00:00Z' },
  { id: 'tk-mlsq-12', projectId: 'mellasaq', assigneeId: 'tm7', sprintId: 'sp-mlsq-5', title: 'صياغة عروض التعاون وهندسة خطة الوصول للسوق', status: 'todo', priority: 'medium', startDate: '2026-08-10T00:00:00Z', dueDate: '2026-09-05T00:00:00Z', tags: ['شراكات', 'نمو'], createdAt: '2026-06-09T00:00:00Z' },

  // بوصلة الأعمال — مهام تشغيل الوكالة
  { id: 'tk-bsl-1', projectId: 'bawsala', assigneeId: 'tm-bsl-2', title: 'إعداد تقويم محتوى يوليو لجميع العملاء', description: 'تقويم شهري كامل لكل عميل وفق حصته التعاقدية، مع توزيع المناسبات والأيام العالمية', status: 'in-progress', priority: 'high', startDate: '2026-06-15T00:00:00Z', dueDate: '2026-06-25T00:00:00Z', tags: ['تقويم المحتوى'], createdAt: '2026-06-10T00:00:00Z' },
  { id: 'tk-bsl-2', projectId: 'bawsala', assigneeId: 'tm-bsl-3', title: 'قوالب تصميم موحدة لكل عميل', description: 'قوالب شهرية ثابتة (منشور، ستوري، إنفوجرافيك) وفق الهوية البصرية لكل عميل لتسريع الإنتاج', status: 'todo', priority: 'medium', startDate: '2026-06-18T00:00:00Z', dueDate: '2026-07-05T00:00:00Z', tags: ['تصميم'], createdAt: '2026-06-10T00:00:00Z' },
  { id: 'tk-bsl-3', projectId: 'bawsala', assigneeId: 'tm6', title: 'تقرير أداء الحسابات الشهري — مايو', description: 'تقرير لكل عميل: نمو المتابعين، التفاعل، أفضل القطع أداءً، وتوصيات الشهر القادم', status: 'done', priority: 'high', startDate: '2026-06-01T00:00:00Z', dueDate: '2026-06-05T00:00:00Z', tags: ['تقارير'], createdAt: '2026-06-01T00:00:00Z' },
  { id: 'tk-bsl-4', projectId: 'bawsala', assigneeId: 'tm-bsl-1', title: 'إعداد عرض الباقات للعملاء المحتملين', description: 'عرض تجاري بثلاث باقات شهرية (أساسية / متقدمة / شاملة) مع نماذج من أعمالنا', status: 'todo', priority: 'medium', startDate: '2026-06-20T00:00:00Z', dueDate: '2026-07-10T00:00:00Z', tags: ['مبيعات'], createdAt: '2026-06-10T00:00:00Z' },
]

export const SEED_PHASES: PlanPhase[] = [
  // محور
  {
    id: 'ph1', projectId: 'mehwar', planId: 'pl-mehwar', title: 'المرحلة الأولى: التأسيس',
    description: 'إعداد البنية التحتية والتصميم الأساسي للمنصة',
    status: 'completed', order: 1,
    milestones: [
      { id: 'm1', title: 'إعداد المشروع والتبعيات', done: true },
      { id: 'm2', title: 'نظام الألوان والتصميم', done: true },
      { id: 'm3', title: 'تصميم الواجهة في Figma', done: true },
    ],
  },
  {
    id: 'ph2', projectId: 'mehwar', planId: 'pl-mehwar', title: 'المرحلة الثانية: المحتوى الأساسي',
    description: 'تطوير صفحات المشاريع والمهام وإدارة البيانات',
    status: 'in-progress', order: 2,
    milestones: [
      { id: 'm4', title: 'لوحة التحكم الرئيسية', done: true },
      { id: 'm5', title: 'صفحة المشاريع الكاملة', done: false },
      { id: 'm6', title: 'نظام المهام (كانبان)', done: false },
      { id: 'm7', title: 'نظام الخطط والمراحل', done: false },
    ],
  },
  {
    id: 'ph3', projectId: 'mehwar', planId: 'pl-mehwar', title: 'المرحلة الثالثة: التحسين والتوسع',
    description: 'تحسين الأداء وإضافة ميزات متقدمة',
    status: 'upcoming', order: 3,
    milestones: [
      { id: 'm8', title: 'تحسين الأداء والتحميل', done: false },
      { id: 'm9', title: 'نظام الإشعارات', done: false },
      { id: 'm10', title: 'تصدير واستيراد البيانات', done: false },
    ],
  },

  // ملصق
  {
    id: 'ph4', projectId: 'mellasaq', planId: 'pl-mellasaq', title: 'مرحلة بناء القدرات التقنية',
    description: 'بناء قاعدة البيانات ومحرك التحليل وأدوات الذكاء الاصطناعي — 150 ألف+ منتج معالج ومنظومة تحليل للمكونات والحساسيات',
    status: 'completed', order: 1,
    milestones: [
      { id: 'm11', title: 'تنظيف ومعالجة 150,000+ منتج', done: true },
      { id: 'm12', title: 'محرك تحليل المكونات والتصنيف الذكي للحساسيات', done: true },
      { id: 'm13', title: 'أدوات الذكاء الاصطناعي — استخراج البيانات من صور الملصقات', done: true },
    ],
  },
  {
    id: 'ph5', projectId: 'mellasaq', planId: 'pl-mellasaq', title: 'مرحلة التمكين الاستراتيجي والجاهزية السوقية',
    description: 'تحويل الأصول الحالية إلى قيمة تجارية وسوقية حقيقية — 3 أشهر من العمل المشترك مع مستشار تطوير المنتجات والنمو عبر خمسة مسارات متوازية',
    status: 'in-progress', order: 2,
    startDate: '2026-06-09T00:00:00Z', dueDate: '2026-09-09T00:00:00Z',
    milestones: [
      { id: 'm14', title: 'الربط الفني الفعلي وتكامل البيانات مع مركز الترميز', done: false },
      { id: 'm15', title: 'تسوية الملاحظات الفنية مع هيئة الغذاء والدواء', done: false },
      { id: 'm-mlsq-1', title: 'إطلاق ميزات جديدة في التطبيق تعزز تجربة المستهلك', done: false },
      { id: 'm-mlsq-2', title: 'لوحة تحكم مخصصة لباقات الشركات والأعمال', done: false },
    ],
  },
  {
    id: 'ph-mlsq-3', projectId: 'mellasaq', planId: 'pl-mellasaq', title: 'مرحلة الانطلاق التجاري والتوسع',
    description: 'نقل ملصق من فكرة ناضجة إلى منصة مرجعية ذات عوائد تجارية — شراكات واشتراكات وتوسع إقليمي',
    status: 'upcoming', order: 3,
    milestones: [
      { id: 'm-mlsq-3', title: 'شراكات موقعة مع جمعيات صحية وسلاسل تجزئة', done: false },
      { id: 'm-mlsq-4', title: 'تشغيل اشتراكات منصة الأعمال', done: false },
      { id: 'm-mlsq-5', title: 'مؤشرات الجاهزية للتوسع الخليجي', done: false },
      { id: 'm-mlsq-6', title: 'دراسة الربط مع الصادرات والجمارك', done: false },
    ],
  },

  // بوصلة الأعمال
  {
    id: 'ph-bsl-1', projectId: 'bawsala', planId: 'pl-bawsala', title: 'مرحلة التأسيس وبناء الفريق',
    description: 'تشكيل فريق الإنتاج، اعتماد سير عمل صناعة المحتوى، وتوقيع العقود الأولى',
    status: 'completed', order: 1,
    milestones: [
      { id: 'm-bsl-1', title: 'تشكيل الفريق: كتابة محتوى، تصميم، إدارة حسابات، تحليل أداء', done: true },
      { id: 'm-bsl-2', title: 'اعتماد سير الإنتاج: طلب ← كتابة ← تصميم ← مراجعة ← نشر', done: true },
      { id: 'm-bsl-3', title: 'توقيع أول 3 عقود إدارة حسابات شهرية', done: true },
    ],
  },
  {
    id: 'ph-bsl-2', projectId: 'bawsala', planId: 'pl-bawsala', title: 'مرحلة التشغيل وتنمية المحفظة',
    description: 'الالتزام الكامل بالحصص الشهرية، ورفع جودة الإنتاج، والوصول إلى 5 عملاء نشطين',
    status: 'in-progress', order: 2,
    milestones: [
      { id: 'm-bsl-4', title: 'الالتزام الكامل بالحصص الشهرية للعملاء الثلاثة', done: false },
      { id: 'm-bsl-5', title: 'بناء معرض أعمال لعروض المبيعات', done: false },
      { id: 'm-bsl-6', title: 'أتمتة تقارير الأداء الشهرية للعملاء', done: false },
      { id: 'm-bsl-7', title: 'التعاقد مع عميلين جديدين', done: false },
    ],
  },
]

export const SEED_DOCS: ProductDoc[] = [
  { id: 'doc-1', projectId: 'mehwar', title: 'مواصفات المنتج', type: 'spec', description: 'متطلبات الوظائف والمستخدمين — نطاق المنصة وحالات الاستخدام الأساسية', order: 0, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'doc-2', projectId: 'mehwar', title: 'دليل التصميم', type: 'design', description: 'نظام Axis للألوان والمكوّنات — ألوان، مسافات، أيقونات، وأنماط مكوّنات Figma', order: 1, createdAt: '2026-01-05T00:00:00Z' },
  { id: 'doc-3', projectId: 'mehwar', title: 'دليل المطوّر', type: 'guide', description: 'إعداد البيئة، هيكل المشروع، والـ conventions المتبعة', order: 2, createdAt: '2026-01-10T00:00:00Z' },
  // ملصق — وثائق المنتج والوصف التفصيلي للمنتجين
  { id: 'doc-mlsq-1', projectId: 'mellasaq', title: 'تطبيق ملصق للأفراد', type: 'spec', description: 'تطبيق يتيح للمستهلك فحص أي منتج بمسح الباركود — تحليل المكونات والحساسيات في أقل من ثانية واحدة. يستهدف المستخدمين الذين يعانون من حساسيات غذائية أو يبحثون عن شفافية في المنتجات الاستهلاكية.', url: 'https://checkersa.com', order: 0, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'doc-mlsq-2', projectId: 'mellasaq', title: 'منصة ملصق للأعمال', type: 'spec', description: 'حلقة الوصل بين الشركات والمصانع والأسر المنتجة وبين الجهات التنظيمية (GS1 — هيئة الغذاء والدواء). لوحة تحكم مخصصة لإدارة بيانات المنتجات، باقات اشتراك شهرية، وواجهات ربط (API) للتحقق والتسجيل.', order: 1, createdAt: '2026-03-01T00:00:00Z' },
  { id: 'doc-mlsq-3', projectId: 'mellasaq', title: 'وثيقة هوية المنتج', type: 'research', description: 'رسالة ملصق وقيمه الجوهرية: الشفافية، الثقة، وسهولة الوصول للمعلومات الغذائية. تتضمن الهوية البصرية، نبرة الصوت، والقيم التأسيسية للعلامة.', order: 2, createdAt: '2026-06-08T00:00:00Z' },
  { id: 'doc-mlsq-4', projectId: 'mellasaq', title: 'دليل تكامل GS1', type: 'guide', description: 'مواصفات الربط الفني مع مركز الترميز السعودي — GTIN، تسجيل المنتجات تلقائياً، سحب البيانات عبر API، ومطابقة حقول النموذج العالمي مع قاعدة بيانات ملصق.', order: 3, createdAt: '2026-06-09T00:00:00Z' },
]

export const SEED_NOTES: Note[] = [
  {
    id: 'n1', projectId: 'mehwar',
    title: 'رؤية التصميم',
    content: 'الواجهة تعتمد على الثيم الداكن مع تأثيرات الزجاج (glass morphism). اللون الرئيسي هو indigo مع gradient نحو violet. الخط الأساسي Cairo للعربية.\n\nمبادئ التصميم:\n- البساطة والوضوح\n- هرمية بصرية واضحة\n- تجربة مستخدم سلسة بالعربية\n- قابلية التوسع والإضافة',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
    pinned: true,
  },
  {
    id: 'n2', projectId: 'mehwar',
    title: 'قرارات تقنية',
    content: '- Next.js 14 App Router: لأنه يوفر Server Components وتحسين الأداء\n- Zustand: أبسط من Redux مع localStorage persistence\n- Tailwind v4: CSS-first configuration أسرع وأحدث\n- shadcn/ui: مكونات جاهزة قابلة للتخصيص',
    createdAt: '2026-01-20T00:00:00Z',
    updatedAt: '2026-01-20T00:00:00Z',
    pinned: false,
  },
  {
    id: 'n-bsl-1', projectId: 'bawsala',
    title: 'سير عمل إنتاج المحتوى',
    content: 'رحلة القطعة الواحدة:\n1. الطلب — من العميل مباشرة (طلب عميل) أو من التقويم الشهري المخطط (داخلي)\n2. الكتابة — صياغة النص والكوبي وفق هوية العميل ونبرة صوته\n3. التصميم — تنفيذ التصميم أو الموشن وفق القوالب المعتمدة\n4. المراجعة — مراجعة داخلية ثم اعتماد العميل\n5. الجدولة والنشر — حسب التقويم الشهري\n\nالتزامات ثابتة:\n- تسليم تقويم الشهر القادم قبل يوم 25 من كل شهر\n- تقرير الأداء الشهري لكل عميل خلال أول 5 أيام من الشهر\n- الاجتماع التحريري الأسبوعي كل أحد صباحاً',
    createdAt: '2026-06-10T00:00:00Z',
    updatedAt: '2026-06-10T00:00:00Z',
    pinned: true,
  },
  {
    id: 'n4', projectId: 'mellasaq',
    title: 'أفكار الميزات',
    content: 'ميزات يجب التفكير فيها:\n1. قوالب جاهزة (بطاقات أعمال، ملصقات منتجات)\n2. تصدير PDF/PNG/SVG\n3. تشارك عبر رابط\n4. تخصيص الخطوط العربية\n5. وضع الطباعة',
    createdAt: '2026-03-20T00:00:00Z',
    updatedAt: '2026-03-20T00:00:00Z',
    pinned: false,
  },
  {
    id: 'n-mlsq-1', projectId: 'mellasaq',
    title: 'الملف التعريفي — ملصق',
    content: 'منصة سعودية تساعد المستخدمين على فهم المنتجات واتخاذ قرارات أفضل عبر تحليل المكونات والبيانات الغذائية والحساسيات.\n\n## ماذا نقدم؟\n- فحص الباركود: فحص المنتجات بسهولة وسرعة\n- تحليل دقيق: تحليل الحساسيات والمكونات\n- تنبيهات ذكية: تحذير المستخدمين بشكل استباقي\n- تجربة مبسطة: فهم مبسط للمنتجات الاستهلاكية\n\n## ما الذي بنيناه حتى الآن؟\n- قدرات البيانات: تنظيف ومعالجة 150,000+ منتج، والوصول إلى 1,000,000+ منتج للتحسين، وأنظمة موحدة للمكونات والحساسيات\n- البنية التقنية: محرك تحليل للمكونات، تصنيف ذكي للحساسيات، معالجة بيانات متعددة المصادر\n- أدوات الذكاء الاصطناعي: تحليل المكونات تلقائياً، استخراج البيانات من صور الملصقات، اكتشاف المكونات الخطرة\n\n## المنتجان\n1. تطبيق ملصق للأفراد — فهم ملاءمة المنتج لصحة المستخدم في أقل من ثانية واحدة من المسح\n2. منصة ملصق للأعمال — حلقة الوصل بين الشركات والمصانع والأسر المنتجة وبين الجهات: GS1، هيئة الغذاء والدواء، ومستقبلاً الصادرات والجمارك\n\n## مسارا التعاون مع GS1\n1. تسجيل وإدارة المنتجات: تسجيل احترافي، تحسين جودة البيانات وتوحيدها، تسهيل رفع وإدارة بيانات GTIN والباركود\n2. التحقق عبر الباركود (API): مسح الباركود، جلب فوري للبيانات، عرض موثوق\n\nالموقع الرسمي: https://checkersa.com',
    createdAt: '2026-06-09T00:00:00Z',
    updatedAt: '2026-06-09T00:00:00Z',
    pinned: true,
  },
  {
    id: 'n-mlsq-2', projectId: 'mellasaq',
    title: 'آلية العمل مع سفيان — مرحلة التمكين',
    content: 'الدور: مستشار تطوير المنتجات والنمو — قيادة المنتج والنمو لمدة 3 أشهر من العمل المشترك.\n\n## المسؤوليات الست\n1. رسم التوجه والأولويات — توجيه دفة التطوير نحو الميزات الأعلى قيمة تجارية\n2. قيادة ملف الترميز (GS1) — إدارة المواءمة الفنية والتنفيذية لضمان ربط الباركود بأعلى كفاءة\n3. تطوير ملف الغذاء والدواء — تعميق العلاقة مع الهيئة وبناء نقاط التقاء استراتيجية\n4. توجيه مسار المنتج — الإشراف المباشر على تحسين واجهات المستخدم وموثوقية البيانات\n5. بناء علاقات السوق — المساهمة الفعالة في صياغة الشراكات التجارية وتسريع الوصول للمستفيدين\n6. الدعم والتمثيل الفني — مساندة الإدارة في القرارات الفنية وتمثيل الجانب التقني في الاجتماعات الحساسة\n\n## آلية المرافقة الفنية والمنتجية اللصيقة\n- التنسيق والمواءمة الدورية عبر جلسات عمل أسبوعية منتظمة (تُدار من تبويب الاجتماعات)\n- المتابعة الفنية المباشرة مع المطورين وفريق تصميم الواجهات\n- الدعم الاستشاري المعماري وصناعة القرار الفني والمنتجي\n- التمثيل الفني في اجتماعات مركز الترميز وهيئة الغذاء والدواء\n\n## متابعة الشركاء\n- المبادرات الخمس في تبويب التنفيذ — كل مسار بقائمة تحقق وتحديثات دورية\n- المهام الموكلة لسفيان تظهر في مساحة المهام مع التواريخ\n- مؤشرات مخرجات النجاح في تبويب المؤشرات\n- محاضر الجلسات الأسبوعية (منجزات / تحديات / قرارات / بنود عمل) في تبويب الاجتماعات',
    createdAt: '2026-06-09T00:00:00Z',
    updatedAt: '2026-06-09T00:00:00Z',
    pinned: true,
  },
]

export const SEED_TEAM: TeamMember[] = [
  { id: 'tm1', projectId: 'mehwar', name: 'محمد المانع', role: 'مدير المشروع', status: 'active', order: 1, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'tm2', projectId: 'mehwar', name: 'نورة القحطاني', role: 'مصممة تجربة المستخدم', status: 'active', order: 2, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'tm3', projectId: 'mehwar', name: 'ريّان الزهراني', role: 'مطوّر واجهات', status: 'active', order: 3, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'tm4', projectId: 'mehwar', name: 'سارة العتيبي', role: 'مطوّرة خلفية', status: 'active', order: 4, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'tm5', projectId: 'mellasaq', name: 'عبدالله العبود', role: 'مدير المنتج', status: 'active', order: 5, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'tm6', projectId: 'bawsala', name: 'فهد الدوسري', role: 'محلل أداء ومنصات', status: 'active', notes: 'تقارير الأداء الشهرية للعملاء وتحليل نمو الحسابات', order: 6, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'tm7', projectId: 'mellasaq', name: 'سفيان', role: 'مستشار تطوير المنتجات والنمو', status: 'active', notes: 'اتفاق مرحلة التمكين الاستراتيجي — 3 أشهر من العمل المشترك (يونيو – سبتمبر 2026)', order: 7, createdAt: '2026-06-09T00:00:00Z' },
  // بوصلة الأعمال — فريق الوكالة
  { id: 'tm-bsl-1', projectId: 'bawsala', name: 'ريم الشمري', role: 'مديرة الحسابات والمشاريع', status: 'active', notes: 'استلام طلبات العملاء، متابعة العقود الشهرية، وتسليم التقارير', order: 8, createdAt: '2026-06-10T00:00:00Z' },
  { id: 'tm-bsl-2', projectId: 'bawsala', name: 'نوف الحربي', role: 'كاتبة محتوى', status: 'active', notes: 'صياغة المحتوى والكوبي والتقويم الشهري لجميع العملاء', order: 9, createdAt: '2026-06-10T00:00:00Z' },
  { id: 'tm-bsl-3', projectId: 'bawsala', name: 'مشعل العتيبي', role: 'مصمم جرافيك', status: 'active', notes: 'التصاميم والهويات البصرية والموشن جرافيك', order: 10, createdAt: '2026-06-10T00:00:00Z' },
]

// Remaining modular-tool stores start empty; seed projects are technical and don't use them.
export const SEED_SCHEDULE: ScheduleEvent[] = []

// ملصق — حركات مالية: رواتب والتزامات البنية التحتية الشهرية + إيراد متوقع
export const SEED_FINANCE: FinanceEntry[] = [
  { id: 'fin-mlsq-1', projectId: 'mellasaq', title: 'رواتب فريق التطوير', kind: 'expense', amount: 12000, currency: 'SAR', category: 'رواتب', status: 'paid', date: '2026-06-01T00:00:00Z', recurring: true, order: 0, createdAt: '2026-06-01T00:00:00Z' },
  { id: 'fin-mlsq-2', projectId: 'mellasaq', title: 'استضافة الخوادم والبنية السحابية', kind: 'expense', amount: 1100, currency: 'SAR', category: 'بنية تحتية', status: 'paid', date: '2026-06-01T00:00:00Z', recurring: true, order: 1, createdAt: '2026-06-01T00:00:00Z' },
  { id: 'fin-mlsq-3', projectId: 'mellasaq', title: 'اشتراك أدوات الذكاء الاصطناعي ومعالجة البيانات', kind: 'expense', amount: 800, currency: 'SAR', category: 'بنية تحتية', status: 'paid', date: '2026-06-01T00:00:00Z', recurring: true, order: 2, createdAt: '2026-06-01T00:00:00Z' },
  { id: 'fin-mlsq-4', projectId: 'mellasaq', title: 'نطاق checkersa.com وشهادات الأمان (سنوي)', kind: 'expense', amount: 350, currency: 'SAR', category: 'بنية تحتية', status: 'paid', date: '2026-05-15T00:00:00Z', order: 3, createdAt: '2026-05-15T00:00:00Z' },
  { id: 'fin-mlsq-5', projectId: 'mellasaq', title: 'حملة تعريفية بمنصة الأعمال (مخططة)', kind: 'expense', amount: 2500, currency: 'SAR', category: 'تسويق', status: 'planned', date: '2026-08-01T00:00:00Z', order: 4, createdAt: '2026-06-09T00:00:00Z' },
  { id: 'fin-mlsq-6', projectId: 'mellasaq', title: 'إيراد باقات الأعمال المتوقع بعد الإطلاق', kind: 'income', amount: 15000, currency: 'SAR', category: 'إيرادات', status: 'planned', date: '2026-09-15T00:00:00Z', order: 5, createdAt: '2026-06-09T00:00:00Z' },

  // بوصلة الأعمال — اشتراكات العملاء الشهرية + الرواتب والأتعاب + أدوات العمل
  { id: 'fin-bsl-1', projectId: 'bawsala', title: 'اشتراك شهري — مطاعم لمسة ذوق', kind: 'income', amount: 7000, currency: 'SAR', category: 'اشتراكات العملاء', status: 'paid', date: '2026-06-01T00:00:00Z', recurring: true, clientId: 'cl-bsl-1', billingType: 'subscription', order: 0, createdAt: '2026-06-01T00:00:00Z' },
  { id: 'fin-bsl-2', projectId: 'bawsala', title: 'اشتراك شهري — مؤسسة وقاء الصحية', kind: 'income', amount: 5500, currency: 'SAR', category: 'اشتراكات العملاء', status: 'paid', date: '2026-06-01T00:00:00Z', recurring: true, clientId: 'cl-bsl-2', billingType: 'subscription', order: 1, createdAt: '2026-06-01T00:00:00Z' },
  { id: 'fin-bsl-3', projectId: 'bawsala', title: 'اشتراك شهري — جمعية إتقان التعليمية', kind: 'income', amount: 4000, currency: 'SAR', category: 'اشتراكات العملاء', status: 'planned', date: '2026-06-15T00:00:00Z', recurring: true, clientId: 'cl-bsl-3', billingType: 'subscription', order: 2, createdAt: '2026-06-01T00:00:00Z' },
  { id: 'fin-bsl-4', projectId: 'bawsala', title: 'راتب كاتبة المحتوى — نوف الحربي', kind: 'expense', amount: 4500, currency: 'SAR', category: 'رواتب وأتعاب', status: 'paid', date: '2026-06-01T00:00:00Z', recurring: true, order: 3, createdAt: '2026-06-01T00:00:00Z' },
  { id: 'fin-bsl-5', projectId: 'bawsala', title: 'راتب المصمم — مشعل العتيبي', kind: 'expense', amount: 5500, currency: 'SAR', category: 'رواتب وأتعاب', status: 'paid', date: '2026-06-01T00:00:00Z', recurring: true, order: 4, createdAt: '2026-06-01T00:00:00Z' },
  { id: 'fin-bsl-6', projectId: 'bawsala', title: 'أتعاب مديرة الحسابات — ريم الشمري', kind: 'expense', amount: 3500, currency: 'SAR', category: 'رواتب وأتعاب', status: 'planned', date: '2026-06-28T00:00:00Z', recurring: true, order: 5, createdAt: '2026-06-01T00:00:00Z' },
  { id: 'fin-bsl-7', projectId: 'bawsala', title: 'مكافأة محلل الأداء — التقارير الشهرية', kind: 'expense', amount: 1500, currency: 'SAR', category: 'رواتب وأتعاب', status: 'planned', date: '2026-06-28T00:00:00Z', recurring: true, order: 6, createdAt: '2026-06-01T00:00:00Z' },
  { id: 'fin-bsl-8', projectId: 'bawsala', title: 'اشتراك Adobe Creative Cloud', kind: 'expense', amount: 240, currency: 'SAR', category: 'أدوات واشتراكات', status: 'paid', date: '2026-06-01T00:00:00Z', recurring: true, order: 7, createdAt: '2026-06-01T00:00:00Z' },
  { id: 'fin-bsl-9', projectId: 'bawsala', title: 'أداة جدولة المنشورات', kind: 'expense', amount: 180, currency: 'SAR', category: 'أدوات واشتراكات', status: 'paid', date: '2026-06-01T00:00:00Z', recurring: true, order: 8, createdAt: '2026-06-01T00:00:00Z' },
  { id: 'fin-bsl-10', projectId: 'bawsala', title: 'بنك صور وخطوط عربية مرخصة', kind: 'expense', amount: 120, currency: 'SAR', category: 'أدوات واشتراكات', status: 'paid', date: '2026-06-01T00:00:00Z', recurring: true, order: 9, createdAt: '2026-06-01T00:00:00Z' },
]

// بوصلة الأعمال — باقات إدارة الحسابات الشهرية المرتبطة بالعملاء
export const SEED_PACKAGES: FinancePackage[] = [
  { id: 'pkg-bsl-1', projectId: 'bawsala', name: 'الباقة الفضية', description: 'إدارة محتوى أساسية لمنصة واحدة', price: 4000, currency: 'SAR', deliverables: 12, features: ['12 قطعة محتوى شهرياً', 'إدارة منصة واحدة', 'تقرير أداء شهري'], clientIds: ['cl-bsl-3'], order: 0, createdAt: '2026-06-01T00:00:00Z' },
  { id: 'pkg-bsl-2', projectId: 'bawsala', name: 'الباقة الذهبية', description: 'إدارة محتوى لمنصتين مع تصاميم متقدمة', price: 5500, currency: 'SAR', deliverables: 16, features: ['16 قطعة محتوى شهرياً', 'إدارة منصتين', 'تصاميم وإنفوجرافيك', 'تقرير أداء نصف شهري'], clientIds: ['cl-bsl-2'], order: 1, createdAt: '2026-06-01T00:00:00Z' },
  { id: 'pkg-bsl-3', projectId: 'bawsala', name: 'الباقة البلاتينية', description: 'إدارة حسابات متكاملة وتغطيات', price: 7000, currency: 'SAR', deliverables: 20, features: ['20 قطعة محتوى شهرياً', 'إدارة كل المنصات', 'تغطيات مصورة', 'حملات إعلانية', 'تقارير أسبوعية'], clientIds: ['cl-bsl-1'], order: 2, createdAt: '2026-06-01T00:00:00Z' },
]

// ملصق — مؤشرات مخرجات النجاح لمرحلة التمكين (يتابعها الشركاء من تبويب المؤشرات)
export const SEED_KPIS: Kpi[] = [
  { id: 'kpi-mlsq-1', projectId: 'mellasaq', name: 'جاهزية الربط مع مركز الترميز', value: 20, unit: '%', target: 100, trend: 'up', notes: 'الربط الفني الفعلي وتكامل البيانات مع GS1', order: 0, createdAt: '2026-06-09T00:00:00Z', updatedAt: '2026-06-09T00:00:00Z' },
  { id: 'kpi-mlsq-2', projectId: 'mellasaq', name: 'تسوية ملاحظات هيئة الغذاء والدواء', value: 0, unit: '%', target: 100, trend: 'flat', notes: 'إغلاق الملفات والملاحظات الفنية المعلقة', order: 1, createdAt: '2026-06-09T00:00:00Z', updatedAt: '2026-06-09T00:00:00Z' },
  { id: 'kpi-mlsq-3', projectId: 'mellasaq', name: 'ميزات جديدة مُطلقة في التطبيق', value: 0, unit: 'ميزة', target: 3, trend: 'flat', notes: 'ميزات تعزز تجربة المستهلك في تطبيق الأفراد', order: 2, createdAt: '2026-06-09T00:00:00Z', updatedAt: '2026-06-09T00:00:00Z' },
  { id: 'kpi-mlsq-4', projectId: 'mellasaq', name: 'جاهزية لوحة تحكم الأعمال', value: 10, unit: '%', target: 100, trend: 'up', notes: 'لوحة تحكم مخصصة لباقات الشركات والأعمال', order: 3, createdAt: '2026-06-09T00:00:00Z', updatedAt: '2026-06-09T00:00:00Z' },

  // بوصلة الأعمال — مؤشرات تشغيل الوكالة
  { id: 'kpi-bsl-1', projectId: 'bawsala', name: 'قطع المحتوى المنشورة شهرياً', value: 38, unit: 'قطعة', target: 48, trend: 'up', notes: 'إجمالي الحصص التعاقدية: 48 قطعة شهرياً لثلاثة عملاء', order: 0, createdAt: '2026-06-01T00:00:00Z', updatedAt: '2026-06-10T00:00:00Z' },
  { id: 'kpi-bsl-2', projectId: 'bawsala', name: 'الالتزام بمواعيد النشر', value: 92, unit: '%', target: 95, trend: 'up', notes: 'نسبة القطع المنشورة في موعدها المجدول', order: 1, createdAt: '2026-06-01T00:00:00Z', updatedAt: '2026-06-10T00:00:00Z' },
  { id: 'kpi-bsl-3', projectId: 'bawsala', name: 'العملاء النشطون', value: 3, unit: 'عميل', target: 5, trend: 'flat', notes: 'الهدف: عقدان جديدان قبل نهاية الربع الثالث', order: 2, createdAt: '2026-06-01T00:00:00Z', updatedAt: '2026-06-10T00:00:00Z' },
  { id: 'kpi-bsl-4', projectId: 'bawsala', name: 'رضا العملاء — الاستبيان الشهري', value: 4.6, unit: 'من 5', target: 4.8, trend: 'up', notes: 'متوسط تقييم العملاء الثلاثة لشهر مايو', order: 3, createdAt: '2026-06-01T00:00:00Z', updatedAt: '2026-06-10T00:00:00Z' },
]

// ملصق — الاجتماعات الدورية لمرحلة التمكين
export const SEED_MEETINGS: Meeting[] = [
  {
    id: 'meet-mlsq-0', projectId: 'mellasaq',
    title: 'الجلسة التأسيسية — انطلاق التعاون مع سفيان',
    date: '2026-06-03', startTime: '14:00', endTime: '15:30',
    kind: 'other', kindLabel: 'تأسيسية',
    attendees: ['tm5', 'tm7'],
    agenda: [
      { id: 'ag-0-1', text: 'عرض شروط التعاقد وحجم العمل المتفق عليه' },
      { id: 'ag-0-2', text: 'تصميم هوية الشعار ومتطلبات العلامة التجارية' },
      { id: 'ag-0-3', text: 'الدومين والبريد الإلكتروني الرسمي للمنصة' },
      { id: 'ag-0-4', text: 'الرد على بريد GS1 — مركز الترميز السعودي' },
      { id: 'ag-0-5', text: 'خطة العمل للأشهر الثلاثة (يونيو – سبتمبر 2026)' },
      { id: 'ag-0-6', text: 'آلية التواصل والمتابعة الأسبوعية' },
    ],
    achievements: 'اعتماد التعاقد مع سفيان كمستشار لتطوير المنتجات والنمو لمدة ثلاثة أشهر.\nالاتفاق على هوية بصرية احترافية تعكس مأمورية ملصق الرقمية.',
    challenges: 'موعد تسليم الشعار يحتاج تنسيقاً مع المصمم — المعالجة: تحديد موعد لا يتجاوز 15 يونيو.',
    decisions: [
      { id: 'dec-0-1', text: 'اعتماد التعاقد مع سفيان بصيغة الاستشارة المتكاملة (3 أشهر — يونيو/سبتمبر 2026)', ownerId: 'tm5' },
      { id: 'dec-0-2', text: 'تسجيل نطاق mellasaq.com واشتراك G-Suite للبريد الرسمي قبل نهاية الأسبوع', ownerId: 'tm5', dueDate: '2026-06-07' },
      { id: 'dec-0-3', text: 'الرد على بريد مركز GS1 السعودي بعرض الاندماج التقني وطلب حساب تجريبي', ownerId: 'tm7', dueDate: '2026-06-05' },
      { id: 'dec-0-4', text: 'إيفاد متطلبات الشعار للمصمم: رمز باركود، مفهوم الشفافية والثقة، ألوان زرقاء/خضراء', ownerId: 'tm5', dueDate: '2026-06-05' },
    ],
    recommendations: [
      { id: 'rec-0-1', text: 'تفعيل المصادقة الثنائية على البريد الرسمي فور إنشائه', assigneeId: 'tm5', dueDate: '2026-06-10', done: true },
      { id: 'rec-0-2', text: 'حجز نطاقات مشابهة (melasaq.com، mellasaq.sa) لحماية العلامة التجارية', assigneeId: 'tm5', dueDate: '2026-06-10', done: false },
      { id: 'rec-0-3', text: 'إعداد وثيقة "هوية المنتج" تتضمن رسالة ملصق وقيمه قبل الشروع في تصميم الشعار', assigneeId: 'tm7', dueDate: '2026-06-08', done: true },
    ],
    actionItems: [
      { id: 'ai-0-1', title: 'تسجيل نطاق mellasaq.com', assigneeId: 'tm5', dueDate: '2026-06-07', done: true },
      { id: 'ai-0-2', title: 'إنشاء حسابات البريد الرسمي (info@mellasaq.com، support@mellasaq.com)', assigneeId: 'tm5', dueDate: '2026-06-07', done: true },
      { id: 'ai-0-3', title: 'إرسال رد رسمي على بريد مركز GS1 السعودي', assigneeId: 'tm7', dueDate: '2026-06-05', done: true },
      { id: 'ai-0-4', title: 'إرسال متطلبات الشعار للمصمم وتحديد موعد التسليم', assigneeId: 'tm5', dueDate: '2026-06-05', done: true },
      { id: 'ai-0-5', title: 'مشاركة وثيقة "هوية المنتج" مع الفريق', assigneeId: 'tm7', dueDate: '2026-06-08', done: true },
      { id: 'ai-0-6', title: 'ضبط جدول الاجتماعات الأسبوعية (كل اثنين — 10:00 صباحاً)', assigneeId: 'tm5', dueDate: '2026-06-08', done: false },
    ],
    status: 'minuted', createdAt: '2026-06-03T12:00:00Z',
  },
  {
    id: 'meet-mlsq-1', projectId: 'mellasaq', title: 'اجتماع انطلاق مرحلة التمكين الاستراتيجي',
    date: '2026-06-09', startTime: '10:00', endTime: '11:30', kind: 'review',
    attendees: ['tm7', 'tm5'],
    agenda: [
      { id: 'ag-1-1', text: 'استعراض خطة التمكين ومسارات العمل الخمسة' },
      { id: 'ag-1-2', text: 'اعتماد أولويات الشهر الأول' },
      { id: 'ag-1-3', text: 'الاتفاق على آلية المتابعة والجلسة الأسبوعية' },
    ],
    achievements: 'اعتماد خطة التمكين الاستراتيجي والجاهزية السوقية بمساراتها الخمسة.\nتحديد أولويات الشهر الأول: مطابقة حقول GS1 وحصر ملاحظات الهيئة.',
    challenges: 'الوصول لبيئة الاختبار في مركز الترميز يحتاج تنسيقاً — المعالجة: التواصل مع مدير الحساب خلال هذا الأسبوع.',
    decisions: [
      { id: 'dec-1-1', text: 'اعتماد جلسة متابعة أسبوعية كل اثنين 10:00 صباحاً', ownerId: 'tm5' },
      { id: 'dec-1-2', text: 'البدء بالمسارين الأول والثاني بالتوازي قبل فتح مساري المنتج', ownerId: 'tm7', dueDate: '2026-06-15' },
    ],
    recommendations: [
      { id: 'rec-1-1', text: 'تجهيز عرض موجز للشركاء عن خطة الربط مع مركز الترميز', assigneeId: 'tm7', dueDate: '2026-06-22', done: false },
      { id: 'rec-1-2', text: 'دعوة ممثل الهيئة لجلسة تنسيقية خلال الشهر الأول', assigneeId: 'tm5', dueDate: '2026-07-01', done: false },
    ],
    actionItems: [
      { id: 'ai-1-1', title: 'طلب وصول لبيئة الاختبار من مركز الترميز', assigneeId: 'tm7', dueDate: '2026-06-16', done: false },
      { id: 'ai-1-2', title: 'مشاركة قائمة الملاحظات المعلقة لدى الهيئة', assigneeId: 'tm5', done: true },
    ],
    status: 'minuted', createdAt: '2026-06-09T08:00:00Z',
  },
  {
    id: 'meet-mlsq-2', projectId: 'mellasaq', title: 'جلسة المتابعة الأسبوعية',
    date: '2026-06-15', startTime: '10:00', endTime: '11:00', kind: 'weekly',
    attendees: ['tm7', 'tm5'],
    agenda: [
      { id: 'ag-2-1', text: 'استعراض منجزات الأسبوع' },
      { id: 'ag-2-2', text: 'التحديات ومعالجاتها' },
      { id: 'ag-2-3', text: 'مستجدات مركز الترميز وهيئة الغذاء والدواء' },
      { id: 'ag-2-4', text: 'أولويات الأسبوع القادم' },
    ],
    actionItems: [],
    recurring: true,
    recurringInterval: 'weekly',
    status: 'preparation', createdAt: '2026-06-09T12:00:00Z',
  },

  // بوصلة الأعمال — الاجتماع التحريري الأسبوعي + المراجعات الشهرية مع العملاء
  {
    id: 'meet-bsl-1', projectId: 'bawsala', title: 'الاجتماع التحريري الأسبوعي',
    date: '2026-06-07', startTime: '10:00', endTime: '11:00', kind: 'weekly',
    attendees: ['tm-bsl-1', 'tm-bsl-2', 'tm-bsl-3', 'tm6'],
    agenda: [
      { id: 'ag-bsl-1', text: 'مراجعة تقويم الأسبوع لكل عميل' },
      { id: 'ag-bsl-2', text: 'طلبات العملاء الجديدة وتوزيعها على الفريق' },
      { id: 'ag-bsl-3', text: 'حالة القطع المتأخرة ومعالجتها' },
    ],
    achievements: 'اعتماد تقويم الأسبوع الثاني من يونيو للعملاء الثلاثة.\nتوزيع طلب تغطية افتتاح فرع لمسة ذوق على فريق التصميم.',
    challenges: 'ضغط مواعيد منتصف الشهر مع تزامن حملتين — المعالجة: تقديم مواد وقاء التوعوية يومين.',
    decisions: [
      { id: 'dec-bsl-1', text: 'تثبيت موعد تسليم تقويم الشهر القادم: يوم 25 من كل شهر', ownerId: 'tm-bsl-1' },
      { id: 'dec-bsl-2', text: 'مراجعة داخلية إلزامية قبل إرسال أي قطعة لاعتماد العميل', ownerId: 'tm-bsl-2' },
    ],
    recommendations: [
      { id: 'rec-bsl-1', text: 'بناء مكتبة وسوم معتمدة لكل عميل لتوحيد الهوية النصية', assigneeId: 'tm-bsl-2', dueDate: '2026-06-20', done: false },
    ],
    actionItems: [
      { id: 'ai-bsl-1', title: 'تنفيذ تصاميم تغطية افتتاح فرع لمسة ذوق', assigneeId: 'tm-bsl-3', dueDate: '2026-06-06', done: true },
      { id: 'ai-bsl-2', title: 'إرسال مسودات وقاء التوعوية للمراجعة الطبية', assigneeId: 'tm-bsl-2', dueDate: '2026-06-10', done: false },
    ],
    recurring: true, recurringInterval: 'weekly',
    status: 'minuted', createdAt: '2026-06-07T08:00:00Z',
  },
  {
    id: 'meet-bsl-2', projectId: 'bawsala', title: 'المراجعة الشهرية مع مطاعم لمسة ذوق',
    date: '2026-06-16', startTime: '13:00', endTime: '14:00', kind: 'review',
    attendees: ['tm-bsl-1', 'tm6'],
    agenda: [
      { id: 'ag-bsl-4', text: 'عرض تقرير أداء الحسابات لشهر مايو' },
      { id: 'ag-bsl-5', text: 'نتائج حملة افتتاح الفرع الجديد' },
      { id: 'ag-bsl-6', text: 'مقترحات تقويم يوليو واعتماد التوجه' },
    ],
    actionItems: [],
    status: 'preparation', createdAt: '2026-06-10T08:00:00Z',
  },
]

// ── جسد ─────────────────────────────────────────────────────
// Demo content-management project: جمعية جسد (cancer patients charity).
// Populates the "المحتوى" and "العملاء" tabs with a realistic June 2026 plan.
export const SEED_CLIENTS: Client[] = [
  {
    id: 'cl-jasad-1',
    projectId: 'jasad',
    name: 'جمعية جسد',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Pink_ribbon.svg/200px-Pink_ribbon.svg.png',
    contactName: 'منسق التواصل والإعلام',
    email: 'media@jasad.org.sa',
    phone: '0500000000',
    contractValue: 8000,
    contractCurrency: 'SAR',
    contractStart: '2026-01-01T00:00:00Z',
    contractEnd: '2026-12-31T00:00:00Z',
    deliverableCount: 25,
    status: 'active',
    notes: 'جمعية خيرية تُعنى بدعم مرضى السرطان وأسرهم في المملكة العربية السعودية',
    order: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },

  // ── بوصلة الأعمال — عملاء إدارة الحسابات الشهرية ──────────
  {
    id: 'cl-bsl-1',
    projectId: 'bawsala',
    name: 'مطاعم لمسة ذوق',
    contactName: 'مدير التسويق — خالد العمري',
    email: 'marketing@lamsatthawq.sa',
    phone: '0555000001',
    contractValue: 7000,
    contractCurrency: 'SAR',
    contractStart: '2026-01-01T00:00:00Z',
    contractEnd: '2026-12-31T00:00:00Z',
    deliverableCount: 20,
    status: 'active',
    notes: 'سلسلة مطاعم سعودية — إدارة كاملة لحسابات إنستغرام وتيك توك وسناب شات: محتوى يومي، تغطيات، وحملات إطلاق الأطباق الموسمية',
    order: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'cl-bsl-2',
    projectId: 'bawsala',
    name: 'مؤسسة وقاء الصحية',
    contactName: 'منسقة الإعلام — هند الشهري',
    email: 'media@weqaa-health.sa',
    phone: '0555000002',
    contractValue: 5500,
    contractCurrency: 'SAR',
    contractStart: '2026-02-01T00:00:00Z',
    contractEnd: '2027-01-31T00:00:00Z',
    deliverableCount: 16,
    status: 'active',
    notes: 'مجمع عيادات — محتوى توعوي طبي، تصاميم إنفوجرافيك، وإدارة حسابي X ولينكدإن مع تقرير أداء شهري',
    order: 2,
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
  },
  {
    id: 'cl-bsl-3',
    projectId: 'bawsala',
    name: 'جمعية إتقان التعليمية',
    contactName: 'مسؤول العلاقات — عبدالعزيز الحربي',
    email: 'info@itqan-edu.org.sa',
    phone: '0555000003',
    contractValue: 4000,
    contractCurrency: 'SAR',
    contractStart: '2026-03-01T00:00:00Z',
    contractEnd: '2026-12-31T00:00:00Z',
    deliverableCount: 12,
    status: 'active',
    notes: 'جمعية تعليمية غير ربحية — تغطية البرامج والمبادرات، قصص نجاح المستفيدين، وحملات التسجيل الموسمية',
    order: 3,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
  },
]

const J = 'cl-jasad-1'
const D = (d: string) => `2026-${d}T00:00:00Z`

export const SEED_CONTENT: ContentItem[] = [
  // ── منشور نشور (1 يونيو) ──────────────────────────────────
  { id: 'ct-01', projectId: 'jasad', clientId: J, title: 'ترحيب بشهر يونيو — أبرز فعاليات جسد هذا الشهر', type: 'post', platform: 'instagram', status: 'published', publishDate: D('06-01'), order: 0, createdAt: D('05-20') },
  { id: 'ct-02', projectId: 'jasad', clientId: J, title: 'ستوري: مستجدات جسد — ماذا أنجزنا في مايو؟', type: 'story', platform: 'instagram', status: 'published', publishDate: D('06-01'), order: 1, createdAt: D('05-20') },

  // ── 3 يونيو ───────────────────────────────────────────────
  { id: 'ct-03', projectId: 'jasad', clientId: J, title: 'إنفوجرافيك: أكثر أنواع السرطان شيوعاً في المملكة', type: 'design', platform: 'instagram', status: 'published', publishDate: D('06-03'), dimensions: '1080×1080', body: 'تعرّف على أكثر أنواع السرطان شيوعاً في المملكة وأهمية الكشف المبكر.\n\nالكشف المبكر يصنع الفارق — احجز فحصك اليوم.\n\n#جسد #الكشف_المبكر #التوعية_الصحية', checklist: [{ id: 'ck-03a', title: 'جمع الإحصائيات من المصادر الرسمية', done: true }, { id: 'ck-03b', title: 'تصميم الإنفوجرافيك', done: true }, { id: 'ck-03c', title: 'مراجعة طبية للمحتوى', done: true }, { id: 'ck-03d', title: 'الجدولة والنشر', done: true }], order: 2, createdAt: D('05-20') },

  // ── 5 يونيو (يوم البيئة العالمي) ──────────────────────────
  { id: 'ct-04', projectId: 'jasad', clientId: J, title: 'يوم البيئة العالمي — الملوثات البيئية وعلاقتها بالسرطان', type: 'post', platform: 'twitter', status: 'published', publishDate: D('06-05'), order: 3, createdAt: D('05-22') },
  { id: 'ct-05', projectId: 'jasad', clientId: J, title: 'ريلز: 5 عادات يومية تقلّل خطر الإصابة بالسرطان', type: 'reel', platform: 'instagram', status: 'delivered', publishDate: D('06-05'), dimensions: '1080×1920', body: '5 عادات يومية بسيطة تحميك:\n1. غذاء متوازن غني بالخضار\n2. نشاط بدني 30 دقيقة\n3. الإقلاع عن التدخين\n4. تجنّب أشعة الشمس المباشرة\n5. الفحص الدوري', checklist: [{ id: 'ck-05a', title: 'كتابة السكربت', done: true }, { id: 'ck-05b', title: 'التصوير والمونتاج', done: true }, { id: 'ck-05c', title: 'إضافة الموسيقى والكابشن', done: false }], order: 4, createdAt: D('05-22') },

  // ── 7 يونيو (يوم الناجين العالمي — أول أحد في يونيو) ──────
  { id: 'ct-06', projectId: 'jasad', clientId: J, title: 'يوم الناجين العالمي — قصة ناجية: رحلتي مع سرطان الثدي', type: 'post', platform: 'instagram', status: 'approved', publishDate: D('06-07'), dimensions: '1080×1350', body: '«بعد التشخيص ظننت أن الحياة توقفت… لكن دعم جسد أعادني للحياة.»\n\nقصة ملهمة من إحدى الناجيات بمناسبة يوم الناجين العالمي.', checklist: [{ id: 'ck-06a', title: 'مقابلة الناجية وأخذ الموافقة', done: true }, { id: 'ck-06b', title: 'صياغة القصة', done: true }, { id: 'ck-06c', title: 'التصميم', done: true }, { id: 'ck-06d', title: 'اعتماد العميل', done: false }], order: 5, createdAt: D('05-25') },
  { id: 'ct-07', projectId: 'jasad', clientId: J, title: 'فيديو: شهادة ناجية — من التشخيص إلى الشفاء', type: 'video', platform: 'youtube', status: 'approved', publishDate: D('06-07'), dimensions: '1920×1080', order: 6, createdAt: D('05-25') },
  { id: 'ct-08', projectId: 'jasad', clientId: J, title: 'تصميم: بنر يوم الناجين العالمي', type: 'design', platform: 'instagram', status: 'review', publishDate: D('06-07'), order: 7, createdAt: D('05-26') },

  // ── 10 يونيو ──────────────────────────────────────────────
  { id: 'ct-09', projectId: 'jasad', clientId: J, title: 'مقال: التغذية السليمة خلال جلسات العلاج الكيماوي', type: 'article', platform: 'linkedin', status: 'review', publishDate: D('06-10'), order: 8, createdAt: D('05-28') },
  { id: 'ct-10', projectId: 'jasad', clientId: J, title: 'منشور: دور الأسرة في دعم المريض نفسياً', type: 'post', platform: 'facebook', status: 'design', publishDate: D('06-11'), order: 9, createdAt: D('05-28') },

  // ── 12 يونيو ──────────────────────────────────────────────
  { id: 'ct-11', projectId: 'jasad', clientId: J, title: 'ريلز: يوم كامل في حياة متطوع جسد', type: 'reel', platform: 'instagram', status: 'design', publishDate: D('06-12'), order: 10, createdAt: D('05-29') },

  // ── 14 يونيو (يوم المتبرع بالدم العالمي) ─────────────────
  { id: 'ct-12', projectId: 'jasad', clientId: J, title: 'يوم المتبرع بالدم — لماذا يعتمد مريض السرطان على التبرع؟', type: 'post', platform: 'instagram', status: 'draft', publishDate: D('06-14'), order: 11, createdAt: D('06-01') },
  { id: 'ct-13', projectId: 'jasad', clientId: J, title: 'إنفوجرافيك: رحلة التبرع بالدم وكيف تنقذ حياة', type: 'design', platform: 'twitter', status: 'draft', publishDate: D('06-14'), order: 12, createdAt: D('06-01') },
  { id: 'ct-14', projectId: 'jasad', clientId: J, title: 'ستوري: سجّل تبرعك بالدم هذا اليوم', type: 'story', platform: 'instagram', status: 'draft', publishDate: D('06-14'), order: 13, createdAt: D('06-01') },

  // ── 15 يونيو ──────────────────────────────────────────────
  { id: 'ct-15', projectId: 'jasad', clientId: J, title: 'خبر: إطلاق برنامج الدعم النفسي الشامل لمرضى السرطان', type: 'article', platform: 'linkedin', status: 'draft', publishDate: D('06-15'), order: 14, createdAt: D('06-02') },

  // ── 17 يونيو ──────────────────────────────────────────────
  { id: 'ct-16', projectId: 'jasad', clientId: J, title: 'منشور: الدعم النفسي ليس رفاهية — هو جزء من العلاج', type: 'post', platform: 'instagram', status: 'idea', publishDate: D('06-17'), order: 15, createdAt: D('06-02') },

  // ── 19 يونيو ──────────────────────────────────────────────
  { id: 'ct-17', projectId: 'jasad', clientId: J, title: 'ستوري: استفتاء — أي خدمات جسد تفيدك أكثر؟', type: 'story', platform: 'instagram', status: 'idea', publishDate: D('06-19'), order: 16, createdAt: D('06-03') },

  // ── 21 يونيو ──────────────────────────────────────────────
  { id: 'ct-18', projectId: 'jasad', clientId: J, title: 'منشور: فوائد الرياضة الخفيفة بعد إكمال علاج السرطان', type: 'post', platform: 'twitter', status: 'idea', publishDate: D('06-21'), order: 17, createdAt: D('06-03') },
  { id: 'ct-19', projectId: 'jasad', clientId: J, title: 'ريلز: شكراً للمتطوعين الذين غيّروا حياة المرضى', type: 'reel', platform: 'instagram', status: 'idea', publishDate: D('06-21'), order: 18, createdAt: D('06-03') },

  // ── 22 يونيو ──────────────────────────────────────────────
  { id: 'ct-20', projectId: 'jasad', clientId: J, title: 'إنفوجرافيك: خطوات الكشف المبكر عن السرطان', type: 'design', platform: 'instagram', status: 'idea', publishDate: D('06-22'), order: 19, createdAt: D('06-03') },

  // ── 23 يونيو ──────────────────────────────────────────────
  { id: 'ct-21', projectId: 'jasad', clientId: J, title: 'خبر: جسد تستقبل 50 متطوعاً جديداً في شهر يونيو', type: 'article', platform: 'linkedin', status: 'idea', publishDate: D('06-23'), order: 20, createdAt: D('06-03') },

  // ── 24 يونيو ──────────────────────────────────────────────
  { id: 'ct-22', projectId: 'jasad', clientId: J, title: 'فيديو: كيف تتحدث مع شخص مصاب بالسرطان؟', type: 'video', platform: 'youtube', status: 'idea', publishDate: D('06-24'), order: 21, createdAt: D('06-03') },
  { id: 'ct-23', projectId: 'jasad', clientId: J, title: 'منشور: الاحتفاء بمتطوع الشهر — محمد الغامدي', type: 'post', platform: 'instagram', status: 'idea', publishDate: D('06-25'), order: 22, createdAt: D('06-03') },

  // ── 27 يونيو ──────────────────────────────────────────────
  { id: 'ct-24', projectId: 'jasad', clientId: J, title: 'تقرير: إنجازات وأرقام النصف الأول 2026', type: 'article', platform: 'linkedin', status: 'idea', publishDate: D('06-27'), order: 23, createdAt: D('06-03') },

  // ── 30 يونيو ──────────────────────────────────────────────
  { id: 'ct-25', projectId: 'jasad', clientId: J, title: 'ستوري: أبرز لحظات يونيو مع جسد', type: 'story', platform: 'instagram', status: 'idea', publishDate: D('06-30'), order: 24, createdAt: D('06-03') },

  // ── بوصلة الأعمال — تقويم يونيو 2026 لثلاثة عملاء ──────────
  // مطاعم لمسة ذوق
  { id: 'ct-bsl-01', projectId: 'bawsala', clientId: 'cl-bsl-1', title: 'إطلاق أطباق الصيف — منشور تشويقي', type: 'post', platform: 'instagram', status: 'published', source: 'internal', assigneeId: 'tm-bsl-2', publishDate: D('06-02'), order: 0, createdAt: D('05-25') },
  { id: 'ct-bsl-02', projectId: 'bawsala', clientId: 'cl-bsl-1', title: 'ريلز: خلف الكواليس في مطبخ لمسة ذوق', type: 'reel', platform: 'tiktok', status: 'published', source: 'internal', assigneeId: 'tm-bsl-3', publishDate: D('06-04'), dimensions: '1080×1920', order: 1, createdAt: D('05-25') },
  { id: 'ct-bsl-03', projectId: 'bawsala', clientId: 'cl-bsl-1', title: 'طلب: تغطية افتتاح فرع الرياض الجديد', type: 'post', platform: 'snapchat', status: 'delivered', source: 'client-request', assigneeId: 'tm-bsl-3', publishDate: D('06-07'), notes: 'وصل الطلب من مدير التسويق — تغطية مصورة كاملة يوم الافتتاح', order: 2, createdAt: D('06-01') },
  { id: 'ct-bsl-04', projectId: 'bawsala', clientId: 'cl-bsl-1', title: 'طلب: ستوري عرض نهاية الأسبوع', type: 'story', platform: 'instagram', status: 'approved', source: 'client-request', assigneeId: 'tm-bsl-3', publishDate: D('06-12'), order: 3, createdAt: D('06-08') },
  { id: 'ct-bsl-05', projectId: 'bawsala', clientId: 'cl-bsl-1', title: 'تصميم المسابقة الأسبوعية — اربح وجبة عائلية', type: 'design', platform: 'instagram', status: 'design', source: 'internal', assigneeId: 'tm-bsl-3', publishDate: D('06-15'), dimensions: '1080×1080', order: 4, createdAt: D('06-05') },
  { id: 'ct-bsl-06', projectId: 'bawsala', clientId: 'cl-bsl-1', title: 'ريلز: وصفة الشيف — طبق الأسبوع', type: 'reel', platform: 'tiktok', status: 'draft', source: 'internal', assigneeId: 'tm-bsl-2', publishDate: D('06-19'), order: 5, createdAt: D('06-05') },
  { id: 'ct-bsl-07', projectId: 'bawsala', clientId: 'cl-bsl-1', title: 'منشور: تقييمات عملائنا هذا الشهر', type: 'post', platform: 'instagram', status: 'idea', source: 'internal', publishDate: D('06-25'), order: 6, createdAt: D('06-05') },

  // مؤسسة وقاء الصحية
  { id: 'ct-bsl-08', projectId: 'bawsala', clientId: 'cl-bsl-2', title: 'إنفوجرافيك: الوقاية من ضربات الشمس في الصيف', type: 'design', platform: 'twitter', status: 'published', source: 'internal', assigneeId: 'tm-bsl-3', publishDate: D('06-03'), dimensions: '1600×900', order: 7, createdAt: D('05-26') },
  { id: 'ct-bsl-09', projectId: 'bawsala', clientId: 'cl-bsl-2', title: 'مقال: أهمية الفحص الدوري الشامل', type: 'article', platform: 'linkedin', status: 'delivered', source: 'internal', assigneeId: 'tm-bsl-2', publishDate: D('06-08'), order: 8, createdAt: D('05-28') },
  { id: 'ct-bsl-10', projectId: 'bawsala', clientId: 'cl-bsl-2', title: 'طلب: إعلان افتتاح عيادة الجلدية الجديدة', type: 'design', platform: 'instagram', status: 'review', source: 'client-request', assigneeId: 'tm-bsl-3', publishDate: D('06-14'), dimensions: '1080×1350', notes: 'طلب من منسقة الإعلام — بانتظار اعتماد التصميم النهائي', order: 9, createdAt: D('06-06') },
  { id: 'ct-bsl-11', projectId: 'bawsala', clientId: 'cl-bsl-2', title: 'منشور توعوي: صحة النوم وجودة الحياة', type: 'post', platform: 'twitter', status: 'draft', source: 'internal', assigneeId: 'tm-bsl-2', publishDate: D('06-18'), order: 10, createdAt: D('06-06') },
  { id: 'ct-bsl-12', projectId: 'bawsala', clientId: 'cl-bsl-2', title: 'ستوري: سؤال وجواب مع طبيب الأسرة', type: 'story', platform: 'instagram', status: 'idea', source: 'internal', publishDate: D('06-22'), order: 11, createdAt: D('06-06') },
  { id: 'ct-bsl-13', projectId: 'bawsala', clientId: 'cl-bsl-2', title: 'تقرير الأداء الشهري — حسابات وقاء', type: 'other', status: 'idea', source: 'internal', assigneeId: 'tm6', publishDate: D('06-30'), notes: 'يُسلَّم للعميلة مع مطلع يوليو', order: 12, createdAt: D('06-06') },

  // جمعية إتقان التعليمية
  { id: 'ct-bsl-14', projectId: 'bawsala', clientId: 'cl-bsl-3', title: 'طلب: تغطية حفل تخريج الدفعة الخامسة', type: 'post', platform: 'twitter', status: 'published', source: 'client-request', assigneeId: 'tm-bsl-2', publishDate: D('06-05'), order: 13, createdAt: D('06-01') },
  { id: 'ct-bsl-15', projectId: 'bawsala', clientId: 'cl-bsl-3', title: 'قصة نجاح: من متدربة إلى مدربة معتمدة', type: 'design', platform: 'instagram', status: 'approved', source: 'internal', assigneeId: 'tm-bsl-2', publishDate: D('06-10'), dimensions: '1080×1350', order: 14, createdAt: D('06-02') },
  { id: 'ct-bsl-16', projectId: 'bawsala', clientId: 'cl-bsl-3', title: 'طلب: حملة التسجيل في البرامج الصيفية', type: 'design', platform: 'snapchat', status: 'design', source: 'client-request', assigneeId: 'tm-bsl-3', publishDate: D('06-16'), dimensions: '1080×1920', notes: 'حملة من 3 تصاميم متتابعة — هذا الأول منها', order: 15, createdAt: D('06-08') },
  { id: 'ct-bsl-17', projectId: 'bawsala', clientId: 'cl-bsl-3', title: 'منشور: أثر التعليم المستمر في تطوير المهارات', type: 'post', platform: 'linkedin', status: 'draft', source: 'internal', assigneeId: 'tm-bsl-2', publishDate: D('06-21'), order: 16, createdAt: D('06-08') },
  { id: 'ct-bsl-18', projectId: 'bawsala', clientId: 'cl-bsl-3', title: 'ريلز: جولة في مقر الجمعية وقاعات التدريب', type: 'reel', platform: 'instagram', status: 'idea', source: 'internal', publishDate: D('06-28'), order: 17, createdAt: D('06-08') },
]

export const SEED_PORTFOLIOS: Portfolio[] = [
  { id: 'pf-product', name: 'منتجات رقمية', color: 'var(--iris-500)', icon: 'rocket', projectIds: ['mehwar', 'mellasaq'], createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'pf-clients', name: 'عملاء المحتوى', color: 'var(--success-500)', icon: 'target', projectIds: ['jasad', 'bawsala'], createdAt: '2026-03-01T00:00:00Z', updatedAt: '2026-03-01T00:00:00Z' },
]

// ── Product profiles (investor-facing) ────────────────────
// Authored from each project's data: descriptions, work tracks, KPIs, packages.
export const SEED_PROFILES: ProductProfile[] = [
  {
    id: 'mellasaq',
    projectId: 'mellasaq',
    tagline: 'نقرأ الملصق بدلاً عنك — لتختار ما يناسب صحتك في أقل من ثانية',
    overview:
      'ملصق منصة سعودية لبيانات المنتجات الاستهلاكية، تساعد المستخدم على فهم ما يشتريه واتخاذ قرار أفضل عبر تحليل المكونات والقيم الغذائية والحساسيات. تعمل المنصة حلقة وصل موثوقة بين الشركات والمصانع والأسر المنتجة من جهة، والجهات الرسمية التي يحتاجونها مثل مركز الترميز السعودي (GS1) وهيئة الغذاء والدواء من جهة أخرى.',
    problem:
      'يقف المستهلك أمام آلاف المنتجات دون قدرة عملية على قراءة المكونات أو معرفة ملاءمتها لحالته الصحية وحساسياته. وفي المقابل تفتقر الشركات والمصانع والأسر المنتجة إلى قناة موحدة وموثوقة تربط بيانات منتجاتها بالجهات الرسمية، فتبقى البيانات مبعثرة وغير دقيقة.',
    solution:
      'تطبيق يمسح الباركود فيحلل المكونات والقيم الغذائية والحساسيات بالذكاء الاصطناعي خلال لحظة، مدعوماً بقاعدة بيانات مرتبطة مباشرة بمركز الترميز السعودي وهيئة الغذاء والدواء. ويكمله جانب أعمال يتيح للشركات والمصانع إدارة بيانات منتجاتها عبر لوحة تحكم مخصصة.',
    subProducts: [
      { id: 'mlsq-sub-1', name: 'تطبيق الأفراد', description: 'مسح الباركود وتشخيص ملاءمة المنتج لصحة المستخدم وحساسياته في أقل من ثانية' },
      { id: 'mlsq-sub-2', name: 'منصة ملصق للأعمال', description: 'لوحة تحكم للشركات والمصانع والأسر المنتجة لإدارة بيانات منتجاتها ومتابعتها' },
      { id: 'mlsq-sub-3', name: 'محرك الذكاء الاصطناعي', description: 'خوارزميات تشخيص المكونات واستكمال البيانات الناقصة وتنظيف قاعدة البيانات آلياً' },
      { id: 'mlsq-sub-4', name: 'الربط مع مركز الترميز (GS1)', description: 'تكامل مباشر لسحب تفاصيل المنتجات تلقائياً وترسيخ موثوقية البيانات' },
    ],
    market:
      'المستهلك السعودي المهتم بصحته وذوو الحساسيات والأنظمة الغذائية الخاصة، إضافة إلى الشركات الغذائية والمصانع والأسر المنتجة وسلاسل التجزئة. سوق يتوسع مع توجه المملكة نحو الصحة الوقائية وجودة الحياة ضمن رؤية 2030، مع فرصة للتوسع الخليجي لاحقاً.',
    goals: [
      'إتمام الربط الفني الفعلي وتكامل البيانات مع مركز الترميز السعودي (GS1)',
      'إغلاق الملفات والملاحظات المعلقة مع هيئة الغذاء والدواء وبناء قناة تواصل تقني مستمرة',
      'إطلاق ميزات جديدة في تطبيق الأفراد تعزز دقة التشخيص وتجربة المستخدم',
      'إطلاق منصة ملصق للأعمال بنماذج اشتراك ودخل واضحة',
      'بناء شراكات سوق نوعية تمهيداً للتوسع',
    ],
    advantages: [
      'ربط رسمي مباشر بمركز الترميز السعودي وهيئة الغذاء والدواء يمنح البيانات موثوقية رسمية',
      'تشخيص بالذكاء الاصطناعي لملاءمة المنتج في أقل من ثانية واحدة',
      'قاعدة بيانات سعودية محلية مبنية على المعايير الرسمية المعتمدة',
      'نموذج ثنائي يجمع بين خدمة الأفراد ومنصة الأعمال في منظومة واحدة',
    ],
    businessModel:
      'الخدمة مجانية للأفراد لبناء قاعدة مستخدمين واسعة، بينما يأتي الدخل من منصة الأعمال عبر اشتراكات شهرية للشركات والمصانع والأسر المنتجة (باقات متدرجة)، وواجهات ربط برمجية (API)، وحزم تقارير وبيانات موجهة للمصانع وسلاسل التجزئة.',
    team:
      'فريق تقني متخصص في تطوير المنتج وهندسة البيانات والذكاء الاصطناعي، يقود مسارات التمكين الخمسة: تكامل الترميز، وملف الهيئة، وتطبيق الأفراد، ومنصة الأعمال، وشراكات النمو.',
    contact: 'الموقع الرسمي: checkersa.com',
    createdAt: '2026-06-12T00:00:00Z',
    updatedAt: '2026-06-12T00:00:00Z',
  },
  {
    id: 'bawsala',
    projectId: 'bawsala',
    tagline: 'نحدد الاتجاه.. ونصنع الأثر',
    overview:
      'بوصلة الأعمال مؤسسة حلول أعمال متكاملة متخصصة في إدارة حسابات التواصل الاجتماعي وصناعة المحتوى للعملاء. نتولى الرحلة كاملة من استلام الطلبات وكتابة المحتوى وتصميمه، إلى الجدولة والنشر والتقارير الشهرية، عبر باقات تعاقدية واضحة.',
    problem:
      'تدرك الشركات والجهات أهمية حضورها الرقمي، لكنها تفتقر إلى الفريق والوقت والاتساق اللازم لإنتاج محتوى منتظم بجودة احترافية، ولقياس أثره على نمو الحساب والتفاعل بشكل موثوق.',
    solution:
      'خدمة إدارة حسابات متكاملة من الفكرة إلى النشر: تقويم محتوى شهري لكل عميل، وكتابة وتصميم وفق هويته البصرية، وجدولة ونشر منضبط، وتقارير أداء دورية بمؤشرات واضحة — كل ذلك ضمن باقات شهرية مرنة.',
    subProducts: [
      { id: 'bsl-sub-1', name: 'الباقة الفضية', description: 'إدارة محتوى أساسية لمنصة واحدة — 12 قطعة شهرياً وتقرير أداء شهري (4,000 ريال)' },
      { id: 'bsl-sub-2', name: 'الباقة الذهبية', description: 'إدارة منصتين مع تصاميم وإنفوجرافيك — 16 قطعة شهرياً وتقرير نصف شهري (5,500 ريال)' },
      { id: 'bsl-sub-3', name: 'الباقة البلاتينية', description: 'إدارة كل المنصات مع تغطيات وحملات — 20 قطعة شهرياً وتقارير أسبوعية (7,000 ريال)' },
      { id: 'bsl-sub-4', name: 'خدمة التقارير الشهرية', description: 'تقرير لكل عميل: نمو المتابعين والتفاعل وأفضل القطع وتوصيات الشهر القادم' },
    ],
    market:
      'المطاعم والعيادات والمؤسسات الصحية والجمعيات والجهات التعليمية في السوق السعودي، الباحثة عن إدارة احترافية ومنتظمة لحساباتها الرقمية دون بناء فريق داخلي.',
    goals: [
      'رفع عدد العملاء النشطين من 3 إلى 5 عبر عقدين جديدين قبل نهاية الربع الثالث',
      'رفع نسبة الالتزام بمواعيد النشر إلى 95% أو أعلى',
      'رفع متوسط رضا العملاء في الاستبيان الشهري إلى 4.8 من 5',
      'توحيد عملية الإنتاج بقوالب جاهزة لتسريع التسليم ورفع الجودة',
    ],
    advantages: [
      'عملية إنتاج موحدة وقوالب تصميم جاهزة لكل عميل تسرّع التسليم وتثبّت الجودة',
      'فريق متكامل يجمع كتابة المحتوى والتصميم وإدارة الحسابات تحت سقف واحد',
      'تقارير أداء شهرية بمؤشرات واضحة تربط العمل بالأثر الفعلي',
      'ثلاث باقات بأسعار تنافسية تناسب أحجام العملاء المختلفة',
    ],
    businessModel:
      'اشتراكات شهرية تعاقدية ضمن ثلاث باقات (الفضية 4,000 والذهبية 5,500 والبلاتينية 7,000 ريال)، مع خدمات إضافية كالتغطيات المصورة والحملات الإعلانية تُسعّر بحسب الطلب.',
    team:
      'فريق متخصص في إدارة الحسابات وكتابة المحتوى والتصميم، يدير تقويم النشر والإنتاج والتقارير لجميع العملاء وفق حصصهم التعاقدية.',
    contact: 'للتواصل والاشتراك في الباقات تواصل مع فريق بوصلة الأعمال',
    createdAt: '2026-06-12T00:00:00Z',
    updatedAt: '2026-06-12T00:00:00Z',
  },
]
