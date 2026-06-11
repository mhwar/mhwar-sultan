export type ProjectStatus = 'active' | 'paused' | 'completed' | 'planning'
export type TaskStatus = 'todo' | 'in-progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'
export type PhaseStatus = 'upcoming' | 'in-progress' | 'completed'
export type SprintStatus = 'planned' | 'active' | 'completed'

export interface Milestone {
  id: string
  title: string
  done: boolean
}

export interface Project {
  id: string
  name: string
  nameEn?: string
  description: string
  status: ProjectStatus
  progress: number
  color: string
  icon: string
  logo?: string
  cover?: string
  category: string
  /** Project type id (technical | event | content | general). Drives default tools. */
  type: string
  /** Ordered ids of the tools (tabs) enabled for this project. */
  tools: string[]
  createdAt: string
  updatedAt: string
  tags: string[]
  links?: { label: string; url: string }[]
}

export interface TaskSubtask {
  id: string
  title: string
  done: boolean
}

export interface Task {
  id: string
  projectId?: string
  phaseId?: string
  milestoneId?: string
  sprintId?: string
  assigneeId?: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  startDate?: string
  dueDate?: string
  subtasks?: TaskSubtask[]
  tags?: string[]
  timeEstimate?: number
  createdAt: string
}

export interface SprintChecklistItem {
  id: string
  title: string
  done: boolean
}

export interface SprintUpdate {
  id: string
  text: string
  createdAt: string
}

/**
 * An "initiative" (مبادرة) — a major managed effort inside a project, such as
 * organising a conference or delivering an integrated milestone. Beyond a plain
 * phase it carries a lead, a checklist of milestones, and a follow-up log for
 * tracking and communication.
 */
export interface Sprint {
  id: string
  projectId: string
  name: string
  goal?: string
  startDate?: string
  dueDate?: string
  status: SprintStatus
  order: number
  /** Team member id responsible for the initiative. */
  lead?: string
  /** Milestones / sub-steps that make up the initiative. */
  checklist?: SprintChecklistItem[]
  /** Time-stamped follow-up & communication notes. */
  updates?: SprintUpdate[]
  createdAt: string
}

export type PlanKind = 'roadmap' | 'agile' | 'launch' | 'course' | 'content' | 'product' | 'custom'

export type PlanDomain = 'product' | 'growth'

export interface Plan {
  id: string
  projectId: string
  name: string
  icon?: string
  kind?: PlanKind
  domain?: PlanDomain
  view?: 'timeline' | 'board'
  targetDate?: string
  order: number
  createdAt: string
}

export interface Feature {
  id: string
  title: string
  done: boolean
}

export interface PlanPhase {
  id: string
  projectId: string
  planId?: string
  title: string
  description: string
  objective?: string
  startDate?: string
  dueDate?: string
  status: PhaseStatus
  order: number
  milestones: Milestone[]
  notes?: string
  features?: Feature[]
}

export interface Note {
  id: string
  projectId: string
  title: string
  content: string
  tags?: string[]
  createdAt: string
  updatedAt: string
  pinned?: boolean
}

export type DocType = 'spec' | 'guide' | 'design' | 'research' | 'other'

export interface ProductDoc {
  id: string
  projectId: string
  title: string
  description?: string
  url?: string
  type: DocType
  order: number
  createdAt: string
}

// ── Growth ───────────────────────────────────────────────
export type MetricCategory = 'acquisition' | 'activation' | 'retention' | 'revenue' | 'referral'

export interface GrowthMetric {
  id: string
  projectId: string
  name: string
  value: number
  unit: string
  target?: number
  change?: number
  category: MetricCategory
  order: number
  updatedAt: string
  createdAt: string
}

export type ExperimentStatus = 'idea' | 'running' | 'completed' | 'paused'
export type ExperimentResult = 'won' | 'lost' | 'inconclusive'

export interface GrowthExperiment {
  id: string
  projectId: string
  title: string
  hypothesis?: string
  metric?: string
  status: ExperimentStatus
  result?: ExperimentResult
  impact: 1 | 2 | 3 | 4 | 5
  confidence: 1 | 2 | 3 | 4 | 5
  ease: 1 | 2 | 3 | 4 | 5
  startDate?: string
  endDate?: string
  notes?: string
  order: number
  createdAt: string
}

export type ChannelType = 'organic' | 'paid' | 'social' | 'email' | 'referral' | 'content' | 'seo' | 'other'
export type ChannelStatus = 'active' | 'testing' | 'paused' | 'stopped'

export interface GrowthChannel {
  id: string
  projectId: string
  name: string
  type: ChannelType
  status: ChannelStatus
  notes?: string
  order: number
  createdAt: string
}

// ── Team ─────────────────────────────────────────────────
export type TeamStatus = 'active' | 'invited' | 'inactive'

export interface TeamMember {
  id: string
  projectId: string
  name: string
  role: string
  email?: string
  phone?: string
  status: TeamStatus
  notes?: string
  /** Profile picture — an uploaded photo or a generated avatar (data URL). */
  avatar?: string
  order: number
  createdAt: string
}

// ── Schedule (agenda / event programme) ──────────────────
export type ScheduleStatus = 'planned' | 'confirmed' | 'done' | 'cancelled'

export interface ScheduleEvent {
  id: string
  projectId: string
  title: string
  date?: string
  startTime?: string
  endTime?: string
  location?: string
  owner?: string
  status: ScheduleStatus
  notes?: string
  order: number
  createdAt: string
}

// ── Meetings (recurring follow-up sessions with minutes) ──
export type MeetingStatus = 'preparation' | 'active' | 'minuted' | 'cancelled'
/** Built-in meeting types; `other` carries a free-text label in `kindLabel`. */
export type MeetingKind = 'weekly' | 'review' | 'external' | 'other'

export interface MeetingAgendaItem {
  id: string
  text: string
}

/** A decision taken in the session — with an optional owner and deadline. */
export interface MeetingDecision {
  id: string
  text: string
  ownerId?: string   // المسؤول عن التنفيذ
  dueDate?: string   // موعد التنفيذ (yyyy-mm-dd)
}

/** A recommendation / output — with an optional owner, deadline, and follow-up status. */
export interface MeetingRecommendation {
  id: string
  text: string
  assigneeId?: string  // المسؤول عن التوصية
  dueDate?: string     // الموعد (yyyy-mm-dd)
  done: boolean        // تم التنفيذ
}

export interface MeetingActionItem {
  id: string
  title: string
  assigneeId?: string
  dueDate?: string   // الموعد المستهدف (yyyy-mm-dd)
  done: boolean
  /** Set when the item is converted into a real task. */
  taskId?: string
}

export interface Meeting {
  id: string
  projectId: string
  title: string
  date: string          // yyyy-mm-dd
  startTime?: string    // HH:MM
  endTime?: string
  kind?: MeetingKind
  kindLabel?: string    // free-text label when kind === 'other'
  attendees: string[]   // TeamMember ids
  agenda: MeetingAgendaItem[]
  achievements?: string                  // المنجزات
  challenges?: string                    // التحديات والمعالجات
  decisions?: MeetingDecision[]          // القرارات
  recommendations?: MeetingRecommendation[] // التوصيات والمخرجات
  actionItems: MeetingActionItem[]
  status: MeetingStatus
  /** Whether this is a recurring session. */
  recurring?: boolean
  /** Interval for auto-creating the next occurrence. */
  recurringInterval?: 'weekly' | 'biweekly' | 'monthly'
  /** Id of the next occurrence created when this meeting is minuted. */
  nextMeetingId?: string
  createdAt: string
}

// ── Finance (budget / expenses / revenue) ────────────────
export type FinanceKind = 'income' | 'expense'
export type FinanceStatus = 'planned' | 'paid' | 'overdue'

export interface FinanceEntry {
  id: string
  projectId: string
  title: string
  kind: FinanceKind
  amount: number
  currency: string
  category?: string
  status: FinanceStatus
  date?: string
  notes?: string
  /** Monthly recurring commitment (salaries, hosting, subscriptions…). */
  recurring?: boolean
  /** For income entries: links this to a specific client. */
  clientId?: string
  /** For income entries: subscription retainer or per-job payment. */
  billingType?: 'subscription' | 'per-job'
  order: number
  createdAt: string
}

// ── Service packages (باقات) ──────────────────────────────
export interface FinancePackage {
  id: string
  projectId: string
  name: string
  description?: string
  /** Monthly price. */
  price: number
  currency: string
  /** Monthly deliverable count included. */
  deliverables?: number
  /** Bullet features/inclusions. */
  features?: string[]
  /** Clients subscribed to this package (optional linkage). */
  clientIds?: string[]
  color?: string
  order: number
  createdAt: string
}

// ── KPIs (generic indicators dashboard) ──────────────────
export type KpiTrend = 'up' | 'down' | 'flat'

export interface KpiSnapshot {
  date: string   // yyyy-mm-dd
  value: number
}

export interface Kpi {
  id: string
  projectId: string
  name: string
  value: number
  unit: string
  target?: number
  trend?: KpiTrend
  notes?: string
  history?: KpiSnapshot[]
  order: number
  updatedAt: string
  createdAt: string
}

// ── Client Management ─────────────────────────────────────
export type ClientStatus = 'active' | 'paused' | 'ended'

export interface Client {
  id: string
  projectId: string
  name: string
  logo?: string
  contactName?: string
  phone?: string
  email?: string
  contractValue: number
  contractCurrency: string
  contractStart?: string
  contractEnd?: string
  deliverableCount?: number
  status: ClientStatus
  notes?: string
  order: number
  createdAt: string
  updatedAt: string
}

// ── Portfolio (cross-project grouping) ────────────────────
export interface Portfolio {
  id: string
  name: string
  description?: string
  color: string
  icon?: string
  logo?: string
  projectIds: string[]
  createdAt: string
  updatedAt: string
}

// ── App Users & Permissions ───────────────────────────────
export interface AppUser {
  id: string
  name: string
  email?: string
  avatar?: string
  systemRole: 'admin' | 'member'
  isFinance: boolean
  isContent: boolean
  createdAt: string
}

export interface ProjectPermission {
  userId: string
  projectId: string
  /** 'all' = full access | 'custom' = use deniedTools | 'none' = project hidden */
  access: 'all' | 'custom' | 'none'
  deniedTools: string[]
}

// ── Content Production ────────────────────────────────────
export type ContentType = 'post' | 'design' | 'video' | 'story' | 'reel' | 'article' | 'other'
export type ContentPlatform = 'twitter' | 'instagram' | 'linkedin' | 'tiktok' | 'youtube' | 'snapchat' | 'facebook' | 'other'
export type ContentStatus = 'idea' | 'draft' | 'design' | 'review' | 'approved' | 'delivered' | 'published'
export type ContentSource = 'client-request' | 'internal'

export interface ContentChecklistItem {
  id: string
  title: string
  done: boolean
}

export interface ContentItem {
  id: string
  projectId: string
  clientId?: string
  title: string
  type: ContentType
  platform?: ContentPlatform
  status: ContentStatus
  dueDate?: string
  publishDate?: string
  body?: string          // نص المنشور / الكوبي الفعلي
  dimensions?: string    // مقاس التصميم مثل "1080×1080"
  /** منشأ القطعة: طلب مباشر من العميل أم محتوى مخطط داخلياً. */
  source?: ContentSource
  /** عضو الفريق المسؤول عن القطعة حالياً (كاتب، مصمم…). */
  assigneeId?: string
  checklist?: ContentChecklistItem[]
  notes?: string
  order: number
  createdAt: string
}
