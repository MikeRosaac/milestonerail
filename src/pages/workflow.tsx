import { useEffect, useMemo, useState } from 'react'
import {
  Background,
  Controls,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  CircleDollarSign,
  FileCheck2,
  GitBranch,
  Grip,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRoundCheck,
  Workflow,
  X,
} from 'lucide-react'
import { useWorkflow, useSaveWorkflow } from '../hooks/use-app-data'
import { cn, titleCase } from '../lib/utils'
import type { Role, WorkflowStep, WorkflowStepType } from '../types'
import { Badge, Button, Card, EmptyState, LoadingBlock, Notice, PageHeader } from '../components/ui'

const nodeTone: Record<WorkflowStepType, string> = {
  evidence: 'border-blue-200 bg-blue-50 text-blue-700',
  approval: 'border-violet-200 bg-violet-50 text-violet-700',
  payout: 'border-amber-200 bg-amber-50 text-amber-800',
  receipt: 'border-emerald-200 bg-emerald-50 text-emerald-700',
}

function StepIcon({ type }: { type: WorkflowStepType }) {
  if (type === 'approval') return <UserRoundCheck className="size-4" aria-hidden />
  if (type === 'payout') return <CircleDollarSign className="size-4" aria-hidden />
  if (type === 'receipt') return <FileCheck2 className="size-4" aria-hidden />
  return <GitBranch className="size-4" aria-hidden />
}

function FlowNode({
  step,
  selected,
  index,
}: {
  step: WorkflowStep
  selected: boolean
  index: number
}) {
  return (
    <div
      className={cn(
        'w-[205px] rounded-2xl border bg-white p-3.5 text-left shadow-[0_12px_35px_-22px_rgba(15,23,42,.45)] transition',
        selected
          ? 'border-indigo-500 ring-4 ring-indigo-500/10'
          : 'border-slate-200 hover:border-slate-300',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn('grid size-8 place-items-center rounded-lg border', nodeTone[step.type])}
        >
          <StepIcon type={step.type} />
        </span>
        <span className="text-[9px] font-black uppercase tracking-[0.12em] text-slate-300">
          0{index + 1}
        </span>
      </div>
      <p className="mt-3 truncate text-xs font-extrabold text-slate-900">{step.label}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <Badge value={step.role} className="px-2 py-0.5 text-[9px]" />
        <span className="text-[9px] font-bold text-slate-400">
          {step.slaHours ? `${step.slaHours}h SLA` : 'No SLA'}
        </span>
      </div>
      {step.type === 'payout' ? (
        <p className="mt-2 truncate text-[9px] font-bold text-amber-700">
          Paystack test · No real money
        </p>
      ) : null}
    </div>
  )
}

function normalizeSteps(steps: WorkflowStep[]) {
  const evidence = steps.filter((step) => step.type === 'evidence')
  const approvals = steps.filter((step) => step.type === 'approval')
  const system = steps.filter((step) => step.type !== 'evidence' && step.type !== 'approval')
  return [...evidence, ...approvals, ...system].map((step, index) => ({
    ...step,
    position: index + 1,
  }))
}

function WorkflowSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <LoadingBlock className="h-4 w-24" />
        <LoadingBlock className="h-9 w-80 max-w-full" />
        <LoadingBlock className="h-5 w-[38rem] max-w-full" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
        <LoadingBlock className="h-[590px]" />
        <LoadingBlock className="h-[590px]" />
      </div>
    </div>
  )
}

export function WorkflowPage() {
  const workflowQuery = useWorkflow()
  const saveWorkflow = useSaveWorkflow()
  const [steps, setSteps] = useState<WorkflowStep[]>([])
  const [serverSnapshot, setServerSnapshot] = useState('[]')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!workflowQuery.data) return
    const normalized = normalizeSteps(workflowQuery.data)
    setSteps(normalized)
    setServerSnapshot(JSON.stringify(normalized))
    setSelectedId((current) =>
      current && normalized.some((step) => step.id === current) ? current : null,
    )
  }, [workflowQuery.data])

  const selected = steps.find((step) => step.id === selectedId) || null
  const approvalSteps = steps.filter((step) => step.type === 'approval')
  const totalSla = approvalSteps.reduce((sum, step) => sum + (step.slaHours || 0), 0)
  const dirty = JSON.stringify(steps) !== serverSnapshot
  const invalid = steps.some(
    (step) =>
      !step.label.trim() ||
      (step.type === 'approval' && (!step.slaHours || step.slaHours < 1 || step.slaHours > 168)),
  )

  const nodes = useMemo<Node[]>(
    () =>
      steps.map((step, index) => ({
        id: String(step.id),
        position: { x: index * 245, y: index % 2 === 0 ? 115 : 160 },
        data: {
          label: <FlowNode step={step} selected={step.id === selectedId} index={index} />,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        style: {
          width: 205,
          border: 'none',
          padding: 0,
          background: 'transparent',
        },
      })),
    [selectedId, steps],
  )

  const edges = useMemo<Edge[]>(() => {
    const result: Edge[] = []
    for (let index = 0; index < steps.length - 1; index += 1) {
      result.push({
        id: `edge-${steps[index].id}-${steps[index + 1].id}`,
        source: String(steps[index].id),
        target: String(steps[index + 1].id),
        type: 'smoothstep',
        animated: steps[index + 1].type === 'approval',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
        style: { stroke: '#94a3b8', strokeWidth: 1.5 },
      })
    }
    return result
  }, [steps])

  if (workflowQuery.isLoading) return <WorkflowSkeleton />

  if (workflowQuery.isError) {
    return (
      <div className="mx-auto max-w-2xl pt-10">
        <Notice tone="danger" title="Workflow studio could not load">
          <p>{workflowQuery.error.message}</p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() => void workflowQuery.refetch()}
          >
            <RefreshCw className="size-4" aria-hidden />
            Try again
          </Button>
        </Notice>
      </div>
    )
  }

  function updateSelected(patch: Partial<WorkflowStep>) {
    if (!selectedId) return
    setSaved(false)
    setSteps((current) =>
      current.map((step) => (step.id === selectedId ? { ...step, ...patch } : step)),
    )
  }

  function moveApproval(direction: -1 | 1) {
    if (!selected || selected.type !== 'approval') return
    const approvals = steps.filter((step) => step.type === 'approval')
    const currentIndex = approvals.findIndex((step) => step.id === selected.id)
    const nextIndex = currentIndex + direction
    if (nextIndex < 0 || nextIndex >= approvals.length) return
    const nextApprovals = [...approvals]
    const [moved] = nextApprovals.splice(currentIndex, 1)
    nextApprovals.splice(nextIndex, 0, moved)
    const evidence = steps.filter((step) => step.type === 'evidence')
    const system = steps.filter((step) => step.type !== 'evidence' && step.type !== 'approval')
    setSaved(false)
    setSteps(normalizeSteps([...evidence, ...nextApprovals, ...system]))
  }

  function addApproval() {
    const nextId = Math.max(0, ...steps.map((step) => step.id)) + 1
    const approval: WorkflowStep = {
      id: nextId,
      cohortId: steps[0]?.cohortId || 201,
      label: 'New approval gate',
      description: 'A designated operator checks this milestone before it advances.',
      type: 'approval',
      role: 'mentor',
      position: steps.length,
      slaHours: 24,
      active: true,
    }
    const evidence = steps.filter((step) => step.type === 'evidence')
    const approvals = steps.filter((step) => step.type === 'approval')
    const system = steps.filter((step) => step.type !== 'evidence' && step.type !== 'approval')
    setSaved(false)
    setSteps(normalizeSteps([...evidence, ...approvals, approval, ...system]))
    setSelectedId(nextId)
  }

  function removeSelected() {
    if (!selected || selected.type !== 'approval') return
    setSaved(false)
    setSteps((current) => normalizeSteps(current.filter((step) => step.id !== selected.id)))
    setSelectedId(null)
  }

  async function persistWorkflow() {
    try {
      const result = await saveWorkflow.mutateAsync(normalizeSteps(steps))
      const normalized = normalizeSteps(result)
      setSteps(normalized)
      setServerSnapshot(JSON.stringify(normalized))
      setSaved(true)
    } catch {
      // Mutation state renders the actionable error above the studio.
    }
  }

  function resetChanges() {
    const parsed = JSON.parse(serverSnapshot) as WorkflowStep[]
    setSteps(parsed)
    setSelectedId(null)
    setSaved(false)
    saveWorkflow.reset()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin controls"
        title="Visual workflow studio"
        description="Shape the human approval rail between learner evidence and provider handoff. Select an approval node to assign its role and SLA."
        actions={
          <div className="flex items-center gap-2">
            {dirty ? (
              <Button type="button" variant="ghost" size="sm" onClick={resetChanges}>
                <X className="size-4" aria-hidden />
                Discard
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              loading={saveWorkflow.isPending}
              disabled={!dirty || invalid}
              onClick={() => void persistWorkflow()}
            >
              <Save className="size-4" aria-hidden />
              Save workflow
            </Button>
          </div>
        }
      />

      {saved ? (
        <div role="status">
          <Notice tone="success" title="Workflow persisted">
            The approval rail is saved and available to every role in this local demo session.
          </Notice>
        </div>
      ) : null}

      {saveWorkflow.isError ? (
        <div role="alert">
          <Notice tone="danger" title="Workflow was not saved">
            {saveWorkflow.error.message}
          </Notice>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: 'Total stages',
            value: steps.length,
            context: 'Evidence through receipt',
            icon: Workflow,
            tone: 'bg-indigo-50 text-indigo-700',
          },
          {
            label: 'Human approvals',
            value: approvalSteps.length,
            context: 'Reorderable control gates',
            icon: UserRoundCheck,
            tone: 'bg-violet-50 text-violet-700',
          },
          {
            label: 'Approval SLA',
            value: `${totalSla}h`,
            context: 'Combined configured window',
            icon: Sparkles,
            tone: 'bg-amber-50 text-amber-700',
          },
        ].map(({ label, value, context, icon: Icon, tone }) => (
          <Card key={label} className="flex items-center gap-4 p-4">
            <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${tone}`}>
              <Icon className="size-4.5" aria-hidden />
            </span>
            <div>
              <p className="text-[11px] font-bold text-slate-500">{label}</p>
              <p className="mt-1 text-xl font-black tracking-tight text-slate-950">{value}</p>
              <p className="mt-0.5 text-[10px] font-semibold text-slate-400">{context}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Cohort approval rail</h2>
              <p className="mt-1 text-[11px] text-slate-500">
                Click a node to inspect it. Approval gates are editable.
              </p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={addApproval}>
              <Plus className="size-4" aria-hidden />
              Add approval
            </Button>
          </div>

          {steps.length ? (
            <div className="h-[520px] bg-[radial-gradient(circle_at_center,rgba(99,102,241,.06),transparent_62%)]">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodeClick={(_, node) => setSelectedId(Number(node.id))}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable
                fitView
                fitViewOptions={{ padding: 0.16 }}
                minZoom={0.35}
                maxZoom={1.4}
                proOptions={{ hideAttribution: true }}
                aria-label="Visual milestone approval workflow"
              >
                <Background color="#cbd5e1" gap={22} size={1} />
                <Controls
                  showInteractive={false}
                  className="overflow-hidden rounded-xl border-slate-200 shadow-sm"
                />
              </ReactFlow>
            </div>
          ) : (
            <EmptyState
              icon={Workflow}
              title="No workflow stages"
              description="Add an approval gate to begin building the operating rail."
              action={
                <Button type="button" size="sm" onClick={addApproval}>
                  <Plus className="size-4" aria-hidden />
                  Add approval
                </Button>
              }
            />
          )}

          <div className="grid gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:grid-cols-3">
            {[
              ['Evidence', 'Learner-owned entry point'],
              ['Approvals', 'Human roles and SLAs'],
              ['Payout + receipt', 'Fixed system-managed exit'],
            ].map(([title, description]) => (
              <div key={title}>
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
                  {title}
                </p>
                <p className="mt-1 text-[10px] text-slate-400">{description}</p>
              </div>
            ))}
          </div>
        </Card>

        <aside className="xl:sticky xl:top-24">
          {selected ? (
            <Card className="overflow-hidden">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'grid size-8 place-items-center rounded-lg border',
                        nodeTone[selected.type],
                      )}
                    >
                      <StepIcon type={selected.type} />
                    </span>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                        {titleCase(selected.type)} node
                      </p>
                      <p className="mt-0.5 text-sm font-extrabold text-slate-900">
                        Stage {selected.position}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close node inspector"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>

              <div className="space-y-5 p-5">
                {selected.type === 'approval' ? (
                  <>
                    <label className="block">
                      <span className="mb-2 block text-xs font-extrabold text-slate-700">
                        Gate label
                      </span>
                      <input
                        type="text"
                        value={selected.label}
                        onChange={(event) => updateSelected({ label: event.target.value })}
                        className="field h-10 text-xs"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-extrabold text-slate-700">
                        Description
                      </span>
                      <textarea
                        rows={3}
                        value={selected.description}
                        onChange={(event) => updateSelected({ description: event.target.value })}
                        className="field min-h-20 resize-y py-2.5 text-xs"
                      />
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <span className="mb-2 block text-xs font-extrabold text-slate-700">
                          Assigned role
                        </span>
                        <select
                          value={selected.role}
                          onChange={(event) => updateSelected({ role: event.target.value as Role })}
                          className="field h-10 py-0 text-xs"
                        >
                          <option value="mentor">Mentor</option>
                          <option value="finance">Finance</option>
                          <option value="admin">Admin</option>
                        </select>
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-xs font-extrabold text-slate-700">
                          SLA hours
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={168}
                          value={selected.slaHours || ''}
                          onChange={(event) =>
                            updateSelected({
                              slaHours: event.target.value ? Number(event.target.value) : null,
                            })
                          }
                          className={cn(
                            'field h-10 text-xs',
                            (!selected.slaHours ||
                              selected.slaHours < 1 ||
                              selected.slaHours > 168) &&
                              'border-rose-300',
                          )}
                        />
                      </label>
                    </div>

                    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-slate-50 p-3">
                      <span>
                        <span className="block text-xs font-extrabold text-slate-700">
                          Gate active
                        </span>
                        <span className="mt-0.5 block text-[10px] text-slate-400">
                          Include this approval in the rail
                        </span>
                      </span>
                      <input
                        type="checkbox"
                        checked={selected.active}
                        onChange={(event) => updateSelected({ active: event.target.checked })}
                        className="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </label>

                    <div>
                      <p className="text-xs font-extrabold text-slate-700">Reorder approval</p>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => moveApproval(-1)}
                          disabled={approvalSteps[0]?.id === selected.id}
                        >
                          <ArrowLeft className="hidden size-4 sm:block" aria-hidden />
                          <ArrowUp className="size-4 sm:hidden" aria-hidden />
                          Earlier
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => moveApproval(1)}
                          disabled={approvalSteps.at(-1)?.id === selected.id}
                        >
                          Later
                          <ArrowRight className="hidden size-4 sm:block" aria-hidden />
                          <ArrowDown className="size-4 sm:hidden" aria-hidden />
                        </Button>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      className="w-full"
                      onClick={removeSelected}
                    >
                      <Trash2 className="size-4" aria-hidden />
                      Remove approval gate
                    </Button>
                  </>
                ) : (
                  <>
                    <Notice tone="info" title="System-managed stage">
                      Evidence, payout, and receipt nodes anchor the rail. Add or select an approval
                      node to edit role and SLA controls.
                    </Notice>
                    <dl className="space-y-3 rounded-xl bg-slate-50 p-4">
                      <div>
                        <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Label
                        </dt>
                        <dd className="mt-1 text-xs font-extrabold text-slate-700">
                          {selected.label}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Owner
                        </dt>
                        <dd className="mt-1 text-xs font-extrabold text-slate-700">
                          {titleCase(selected.role)}
                        </dd>
                      </div>
                    </dl>
                  </>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-5">
              <span className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-700">
                <Grip className="size-4.5" aria-hidden />
              </span>
              <h2 className="mt-4 text-sm font-extrabold text-slate-900">Select a workflow node</h2>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Approval nodes expose role, SLA, order, active state, and removal controls.
              </p>
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-[10px] font-extrabold uppercase tracking-wide text-amber-800">
                  Provider boundary
                </p>
                <p className="mt-1 text-[11px] leading-4 text-amber-800">
                  The final handoff is Paystack test only. No real money is sent.
                </p>
              </div>
            </Card>
          )}

          <Card className="mt-4 flex gap-3 border-emerald-200 bg-emerald-50/60 p-4">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-600 text-white">
              <ShieldCheck className="size-4" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-extrabold text-slate-800">Guardrail</p>
              <p className="mt-1 text-[10px] leading-4 text-slate-500">
                Save is disabled until every approval has a label and an SLA from 1 to 168 hours.
              </p>
            </div>
          </Card>
        </aside>
      </div>

      <Card className="flex items-center gap-3 p-4">
        <span
          className={cn(
            'grid size-8 place-items-center rounded-full',
            dirty ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700',
          )}
        >
          {dirty ? (
            <RefreshCw className="size-4" aria-hidden />
          ) : (
            <Check className="size-4" aria-hidden />
          )}
        </span>
        <div>
          <p className="text-xs font-extrabold text-slate-800">
            {dirty ? 'Unsaved workflow changes' : 'Workflow matches the persisted version'}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400">
            {dirty
              ? 'Review the visual rail, then save to update the local demo store.'
              : 'Realtime sync will refresh this studio when the saved rail changes.'}
          </p>
        </div>
      </Card>
    </div>
  )
}
