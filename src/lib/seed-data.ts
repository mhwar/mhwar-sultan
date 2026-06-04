import type { Project, Task, Plan, PlanPhase, Note, Sprint, ProductDoc } from '@/types'

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
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-06-03T00:00:00Z',
    tags: ['React Native', 'Maps', 'GPS'],
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
