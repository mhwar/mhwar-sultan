import type { Project, Task, Plan, PlanPhase, Note, Sprint, ProductDoc, GrowthMetric, GrowthExperiment, GrowthChannel, TeamMember, ScheduleEvent, FinanceEntry, Kpi, Client, ContentItem } from '@/types'
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
  { id: 'sp-mehwar-1', projectId: 'mehwar', name: 'سبرنت ١: صفحة المشاريع', goal: 'إطلاق صفحة المشاريع كاملة الوظائف', status: 'active', startDate: '2026-06-01T00:00:00Z', dueDate: '2026-06-14T00:00:00Z', order: 1, createdAt: '2026-06-01T00:00:00Z' },
  { id: 'sp-mehwar-2', projectId: 'mehwar', name: 'سبرنت ٢: نظام المهام', goal: 'كانبان وسحب وإفلات وعرض جدول', status: 'planned', startDate: '2026-06-15T00:00:00Z', dueDate: '2026-06-28T00:00:00Z', order: 2, createdAt: '2026-06-01T00:00:00Z' },
]

export const SEED_PROJECTS: Project[] = [
  {
    id: 'mehwar',
    name: 'محور',
    nameEn: 'Mehwar',
    description: 'منصة محور — نظام إدارة المشاريع التقنية الشخصية. مركز التحكم في المشاريع والمهام والخطط والملاحظات. بُنيت بـ Next.js وTypeScript وTailwind.',
    status: 'active',
    progress: 35,
    color: '#6366F1',
    icon: 'hexagon',
    category: 'منصة',
    type: 'technical',
    tools: FALLBACK_TOOL_IDS,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-06-03T00:00:00Z',
    tags: ['Next.js', 'TypeScript', 'Tailwind', 'Zustand'],
    links: [],
  },
  {
    id: 'mellasaq',
    name: 'ملصق',
    nameEn: 'Mellasaq',
    description: 'تطبيق إنشاء وتخصيص الملصقات والبطاقات الرقمية. تصاميم احترافية بسهولة وسرعة. يدعم التصدير بصيغ متعددة.',
    status: 'planning',
    progress: 10,
    color: '#F59E0B',
    icon: 'tag',
    category: 'تطبيق ويب',
    type: 'technical',
    tools: FALLBACK_TOOL_IDS,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-06-03T00:00:00Z',
    tags: ['React', 'Canvas API', 'PWA'],
    links: [],
  },
  {
    id: 'bawsala',
    name: 'بوصلة',
    nameEn: 'Bawsala',
    description: 'تطبيق تنقل وملاحة ذكي بواجهة عربية جميلة. اكتشف الأماكن والمسارات واحفظ مفضلاتك.',
    status: 'active',
    progress: 20,
    color: '#10B981',
    icon: 'compass',
    category: 'تطبيق جوال',
    type: 'technical',
    tools: FALLBACK_TOOL_IDS,
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-06-03T00:00:00Z',
    tags: ['React Native', 'Maps', 'GPS'],
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
  { id: 't1', projectId: 'mehwar', title: 'تصميم الواجهة الرئيسية', description: 'تصميم Figma كامل للمنصة', status: 'done', priority: 'high', startDate: '2026-01-05T00:00:00Z', dueDate: '2026-01-20T00:00:00Z', createdAt: '2026-01-05T00:00:00Z' },
  { id: 't2', projectId: 'mehwar', title: 'إعداد البنية التحتية', description: 'Next.js + Tailwind + Zustand', status: 'done', priority: 'high', startDate: '2026-01-10T00:00:00Z', dueDate: '2026-01-25T00:00:00Z', createdAt: '2026-01-10T00:00:00Z' },
  { id: 't3', projectId: 'mehwar', sprintId: 'sp-mehwar-1', title: 'تطوير صفحة المشاريع', status: 'in-progress', priority: 'high', startDate: '2026-02-01T00:00:00Z', dueDate: '2026-06-20T00:00:00Z', createdAt: '2026-02-01T00:00:00Z' },
  { id: 't4', projectId: 'mehwar', sprintId: 'sp-mehwar-2', title: 'تطوير نظام المهام', status: 'in-progress', priority: 'medium', startDate: '2026-02-15T00:00:00Z', dueDate: '2026-06-30T00:00:00Z', createdAt: '2026-02-15T00:00:00Z' },
  { id: 't5', projectId: 'mehwar', title: 'نظام الإشعارات', status: 'todo', priority: 'low', startDate: '2026-06-10T00:00:00Z', dueDate: '2026-07-15T00:00:00Z', createdAt: '2026-03-01T00:00:00Z' },
  { id: 't6', projectId: 'mehwar', title: 'تصدير البيانات', status: 'todo', priority: 'low', startDate: '2026-06-20T00:00:00Z', dueDate: '2026-07-30T00:00:00Z', createdAt: '2026-03-10T00:00:00Z' },

  // ملصق
  { id: 't7', projectId: 'mellasaq', title: 'تحديد متطلبات المشروع', status: 'done', priority: 'high', startDate: '2026-03-05T00:00:00Z', dueDate: '2026-03-15T00:00:00Z', createdAt: '2026-03-05T00:00:00Z' },
  { id: 't8', projectId: 'mellasaq', title: 'بحث المنافسين والسوق', status: 'done', priority: 'medium', startDate: '2026-03-10T00:00:00Z', dueDate: '2026-03-20T00:00:00Z', createdAt: '2026-03-10T00:00:00Z' },
  { id: 't9', projectId: 'mellasaq', title: 'تصميم نماذج الملصقات', status: 'todo', priority: 'high', startDate: '2026-06-15T00:00:00Z', dueDate: '2026-07-10T00:00:00Z', createdAt: '2026-03-15T00:00:00Z' },
  { id: 't10', projectId: 'mellasaq', title: 'محرر الملصقات التفاعلي', status: 'todo', priority: 'high', startDate: '2026-07-01T00:00:00Z', dueDate: '2026-08-15T00:00:00Z', createdAt: '2026-04-01T00:00:00Z' },

  // بوصلة
  { id: 't11', projectId: 'bawsala', title: 'بحث مزودي الخرائط', status: 'done', priority: 'high', startDate: '2026-02-05T00:00:00Z', dueDate: '2026-02-15T00:00:00Z', createdAt: '2026-02-05T00:00:00Z' },
  { id: 't12', projectId: 'bawsala', title: 'واجهة الخريطة الأساسية', status: 'in-progress', priority: 'high', startDate: '2026-02-20T00:00:00Z', dueDate: '2026-06-25T00:00:00Z', createdAt: '2026-02-20T00:00:00Z' },
  { id: 't13', projectId: 'bawsala', title: 'نظام البحث عن الأماكن', status: 'todo', priority: 'high', startDate: '2026-06-05T00:00:00Z', dueDate: '2026-07-05T00:00:00Z', createdAt: '2026-04-01T00:00:00Z' },
  { id: 't14', projectId: 'bawsala', title: 'حفظ المفضلات', status: 'todo', priority: 'medium', startDate: '2026-06-15T00:00:00Z', dueDate: '2026-07-20T00:00:00Z', createdAt: '2026-04-15T00:00:00Z' },
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
    id: 'ph4', projectId: 'mellasaq', planId: 'pl-mellasaq', title: 'مرحلة الاستكشاف والتخطيط',
    description: 'بحث السوق وتحديد المتطلبات وتصميم الحل',
    status: 'in-progress', order: 1,
    milestones: [
      { id: 'm11', title: 'بحث المنافسين', done: true },
      { id: 'm12', title: 'تحديد الميزات الأساسية', done: true },
      { id: 'm13', title: 'wireframes أولية', done: false },
    ],
  },
  {
    id: 'ph5', projectId: 'mellasaq', planId: 'pl-mellasaq', title: 'مرحلة التطوير',
    description: 'بناء محرر الملصقات التفاعلي',
    status: 'upcoming', order: 2,
    milestones: [
      { id: 'm14', title: 'محرر Canvas الأساسي', done: false },
      { id: 'm15', title: 'مكتبة القوالب', done: false },
    ],
  },

  // بوصلة
  {
    id: 'ph6', projectId: 'bawsala', planId: 'pl-bawsala', title: 'مرحلة البحث والتأسيس',
    description: 'اختيار التقنيات وإعداد البيئة',
    status: 'completed', order: 1,
    milestones: [
      { id: 'm16', title: 'اختيار مزود الخرائط', done: true },
      { id: 'm17', title: 'إعداد بيئة التطوير', done: true },
    ],
  },
  {
    id: 'ph7', projectId: 'bawsala', planId: 'pl-bawsala', title: 'مرحلة التطوير الأساسي',
    description: 'بناء الميزات الجوهرية للتطبيق',
    status: 'in-progress', order: 2,
    milestones: [
      { id: 'm18', title: 'عرض الخريطة التفاعلية', done: false },
      { id: 'm19', title: 'البحث عن الأماكن', done: false },
      { id: 'm20', title: 'نظام المفضلات', done: false },
    ],
  },
]

export const SEED_DOCS: ProductDoc[] = [
  { id: 'doc-1', projectId: 'mehwar', title: 'مواصفات المنتج', type: 'spec', description: 'متطلبات الوظائف والمستخدمين — نطاق المنصة وحالات الاستخدام الأساسية', order: 0, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'doc-2', projectId: 'mehwar', title: 'دليل التصميم', type: 'design', description: 'نظام Axis للألوان والمكوّنات — ألوان، مسافات، أيقونات، وأنماط مكوّنات Figma', order: 1, createdAt: '2026-01-05T00:00:00Z' },
  { id: 'doc-3', projectId: 'mehwar', title: 'دليل المطوّر', type: 'guide', description: 'إعداد البيئة، هيكل المشروع، والـ conventions المتبعة', order: 2, createdAt: '2026-01-10T00:00:00Z' },
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
    id: 'n3', projectId: 'bawsala',
    title: 'مصادر الخرائط',
    content: 'Mapbox GL JS هو الخيار الأفضل:\n- يدعم RTL Text Plugin للعربية\n- أداء ممتاز على الجوال\n- مكتبة ثرية من الأيقونات\n\nالبديل المجاني: Leaflet + OpenStreetMap\nمناسب للميزات الأساسية دون تكلفة اشتراك.',
    createdAt: '2026-02-10T00:00:00Z',
    updatedAt: '2026-02-10T00:00:00Z',
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
]

// Modular-tool stores start empty; seed projects are technical and don't use them.
export const SEED_TEAM: TeamMember[] = []
export const SEED_SCHEDULE: ScheduleEvent[] = []
export const SEED_FINANCE: FinanceEntry[] = []
export const SEED_KPIS: Kpi[] = []

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
]

const J = 'cl-jasad-1'
const D = (d: string) => `2026-${d}T00:00:00Z`

export const SEED_CONTENT: ContentItem[] = [
  // ── منشور نشور (1 يونيو) ──────────────────────────────────
  { id: 'ct-01', projectId: 'jasad', clientId: J, title: 'ترحيب بشهر يونيو — أبرز فعاليات جسد هذا الشهر', type: 'post', platform: 'instagram', status: 'published', publishDate: D('06-01'), order: 0, createdAt: D('05-20') },
  { id: 'ct-02', projectId: 'jasad', clientId: J, title: 'ستوري: مستجدات جسد — ماذا أنجزنا في مايو؟', type: 'story', platform: 'instagram', status: 'published', publishDate: D('06-01'), order: 1, createdAt: D('05-20') },

  // ── 3 يونيو ───────────────────────────────────────────────
  { id: 'ct-03', projectId: 'jasad', clientId: J, title: 'إنفوجرافيك: أكثر أنواع السرطان شيوعاً في المملكة', type: 'design', platform: 'instagram', status: 'published', publishDate: D('06-03'), order: 2, createdAt: D('05-20') },

  // ── 5 يونيو (يوم البيئة العالمي) ──────────────────────────
  { id: 'ct-04', projectId: 'jasad', clientId: J, title: 'يوم البيئة العالمي — الملوثات البيئية وعلاقتها بالسرطان', type: 'post', platform: 'twitter', status: 'published', publishDate: D('06-05'), order: 3, createdAt: D('05-22') },
  { id: 'ct-05', projectId: 'jasad', clientId: J, title: 'ريلز: 5 عادات يومية تقلّل خطر الإصابة بالسرطان', type: 'reel', platform: 'instagram', status: 'delivered', publishDate: D('06-05'), order: 4, createdAt: D('05-22') },

  // ── 7 يونيو (يوم الناجين العالمي — أول أحد في يونيو) ──────
  { id: 'ct-06', projectId: 'jasad', clientId: J, title: 'يوم الناجين العالمي — قصة ناجية: رحلتي مع سرطان الثدي', type: 'post', platform: 'instagram', status: 'approved', publishDate: D('06-07'), order: 5, createdAt: D('05-25') },
  { id: 'ct-07', projectId: 'jasad', clientId: J, title: 'فيديو: شهادة ناجية — من التشخيص إلى الشفاء', type: 'video', platform: 'youtube', status: 'approved', publishDate: D('06-07'), order: 6, createdAt: D('05-25') },
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
]
