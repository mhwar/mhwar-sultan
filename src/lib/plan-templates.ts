import type { PhaseStatus, PlanKind } from '@/types'

export interface TemplatePhase {
  title: string
  description?: string
  status?: PhaseStatus
  milestones: string[]
}

export interface PlanTemplate {
  id: string
  name: string
  icon: string
  kind: PlanKind
  description: string
  defaultView: 'timeline' | 'board'
  phases: TemplatePhase[]
}

/** Ready-made plan structures for technical projects. */
export const PLAN_TEMPLATES: PlanTemplate[] = [
  {
    id: 'roadmap',
    kind: 'roadmap',
    name: 'خارطة الطريق',
    icon: 'route',
    description: 'مراحل تطور المنتج من التأسيس حتى التوسّع',
    defaultView: 'timeline',
    phases: [
      { title: 'التأسيس', description: 'إعداد البنية والأساسيات', milestones: ['تحديد النطاق', 'إعداد البيئة', 'التصميم الأولي'] },
      { title: 'النسخة الأولى (MVP)', description: 'بناء الحد الأدنى القابل للإطلاق', milestones: ['الميزات الأساسية', 'اختبار داخلي'] },
      { title: 'الإطلاق', description: 'الطرح للمستخدمين', milestones: ['تجهيز الإطلاق', 'النشر', 'المتابعة'] },
      { title: 'التوسّع', description: 'النمو وتحسين الأداء', milestones: ['ميزات متقدمة', 'تحسين الأداء'] },
    ],
  },
  {
    id: 'marketing',
    kind: 'content',
    name: 'خطة التسويق',
    icon: 'megaphone',
    description: 'من أبحاث السوق حتى قياس الحملات',
    defaultView: 'board',
    phases: [
      { title: 'أبحاث السوق', milestones: ['تحليل المنافسين', 'تحديد الجمهور', 'دراسة الأسعار'] },
      { title: 'الاستراتيجية', milestones: ['الرسائل الأساسية', 'اختيار القنوات', 'الميزانية'] },
      { title: 'الحملات', milestones: ['إعداد المحتوى', 'إطلاق الحملة', 'التفاعل'] },
      { title: 'القياس والتحسين', milestones: ['تحليل النتائج', 'تحسين الأداء'] },
    ],
  },
  {
    id: 'sales',
    kind: 'custom',
    name: 'خطة المبيعات',
    icon: 'trending-up',
    description: 'بناء قمع المبيعات والإغلاق والاحتفاظ',
    defaultView: 'board',
    phases: [
      { title: 'بناء القمع', milestones: ['تحديد العملاء المحتملين', 'مصادر العملاء'] },
      { title: 'التواصل', milestones: ['العرض التقديمي', 'المتابعة', 'التفاوض'] },
      { title: 'الإغلاق', milestones: ['العقود', 'الدفع'] },
      { title: 'الاحتفاظ', milestones: ['الدعم', 'البيع الإضافي'] },
    ],
  },
  {
    id: 'content',
    kind: 'content',
    name: 'خطة المحتوى',
    icon: 'file-text',
    description: 'التخطيط والإنتاج والنشر والتحليل',
    defaultView: 'board',
    phases: [
      { title: 'التخطيط', milestones: ['أفكار المحتوى', 'التقويم التحريري', 'الكلمات المفتاحية'] },
      { title: 'الإنتاج', milestones: ['الكتابة', 'التصميم', 'المراجعة'] },
      { title: 'النشر', milestones: ['الجدولة', 'النشر', 'الترويج'] },
      { title: 'التحليل', milestones: ['قياس الأداء', 'التحسين'] },
    ],
  },
  {
    id: 'launch',
    kind: 'launch',
    name: 'خطة الإطلاق',
    icon: 'rocket',
    description: 'تجهيز وإطلاق ومتابعة ما بعد الإطلاق',
    defaultView: 'timeline',
    phases: [
      { title: 'ما قبل الإطلاق', milestones: ['قائمة التحقق', 'الاختبار النهائي', 'مواد التواصل'] },
      { title: 'الإطلاق', milestones: ['النشر', 'الإعلان', 'الدعم المباشر'] },
      { title: 'ما بعد الإطلاق', milestones: ['جمع الملاحظات', 'إصلاح المشاكل', 'التقرير'] },
    ],
  },
  {
    id: 'product',
    kind: 'product',
    name: 'خطة المنتج',
    icon: 'layers',
    description: 'اكتشاف وتصميم وبناء وشحن الميزات',
    defaultView: 'timeline',
    phases: [
      { title: 'الاكتشاف', milestones: ['أبحاث المستخدم', 'تحديد المشكلة'] },
      { title: 'التصميم', milestones: ['النماذج الأولية', 'اختبار قابلية الاستخدام'] },
      { title: 'البناء', milestones: ['التطوير', 'ضمان الجودة'] },
      { title: 'الشحن', milestones: ['الإطلاق التدريجي', 'المتابعة'] },
    ],
  },
  {
    id: 'blank',
    kind: 'custom',
    name: 'خطة فارغة',
    icon: 'list-checks',
    description: 'ابدأ من الصفر وأضف مراحلك',
    defaultView: 'timeline',
    phases: [],
  },
]
