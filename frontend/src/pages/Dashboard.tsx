import { useEffect, useMemo, useState, useRef } from 'react';
import { Activity, BrainCircuit, CheckCircle2, ChevronDown, ListChecks, Play, Target, Trash2, X, Plus, CircleAlert, Eye, Sparkles, Zap, Square, ExternalLink, UserRound } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ItemCard } from '../components/ItemCard';
import { Modal } from '../components/Modal';
import { ProgressPanel, Event } from '../components/ProgressPanel';
import { SolutionCard } from '../components/SolutionCard';
import { getItems, createItem, deleteItem, researchItem, getResearch, Item, API } from '../lib/api';

export function Dashboard() {
    const [hurdles, setHurdles] = useState<Item[]>([]);
    const [visions, setVisions] = useState<Item[]>([]);
    const [kind, setKind] = useState<'hurdles' | 'visions'>('hurdles');
    const [modal, setModal] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', priority: 1 });
    const [events, setEvents] = useState<Event[]>([]);
    const [selected, setSelected] = useState<{ kind: 'hurdles' | 'visions'; item: Item } | null>(null);
    const [loading, setLoading] = useState(false);
    const [daemonActive, setDaemonActive] = useState(false);
    
    const activeWebsockets = useRef<Set<string>>(new Set());

    const refresh = async () => {
        const h = await getItems('hurdles');
        const v = await getItems('visions');
        setHurdles(h);
        setVisions(v);
        
        // Auto-connect to running research from daemon
        [...h, ...v].forEach(item => {
            if (item.status === 'researching' && item.run_id && !activeWebsockets.current.has(item.run_id)) {
                connectWs(item.run_id, item.kind || (h.includes(item) ? 'hurdles' : 'visions'), item);
            }
        });
    };

    useEffect(() => {
        refresh();
        fetch(`${API}/api/daemon`).then(r => r.json()).then(d => setDaemonActive(d.active));
        const interval = setInterval(() => {
            refresh();
            fetch(`${API}/api/daemon`).then(r => r.json()).then(d => setDaemonActive(d.active));
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const toggleDaemon = async () => {
        const res = await fetch(`${API}/api/daemon`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ active: !daemonActive })
        });
        const d = await res.json();
        setDaemonActive(d.active);
    };

    const counts = useMemo(() => ({
        h: hurdles.length,
        v: visions.length,
        r: [...hurdles, ...visions].filter(x => x.status === 'researching').length
    }), [hurdles, visions]);

    const connectWs = (run_id: string, k: 'hurdles'|'visions', item: Item) => {
        activeWebsockets.current.add(run_id);
        const wsUrl = (location.protocol === 'https:' ? 'wss://' : 'ws://') + 
            (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/^https?:\/\//, '') + 
            `/ws/research/${run_id}`;
        
        const ws = new WebSocket(wsUrl);
        ws.onmessage = e => {
            const d = JSON.parse(e.data);
            if (d.type === 'terminal') {
                setLoading(false);
                refresh();
                if (selected?.item.id === item.id) {
                    setSelected({ kind: k, item });
                }
                activeWebsockets.current.delete(run_id);
                return;
            }
            if (['status', 'agent', 'warning', 'complete', 'progress', 'error'].includes(d.type)) {
                setEvents(prev => [...prev, {
                    phase: d.type === 'complete' ? 'complete' : d.type === 'error' ? 'error' : 'running',
                    message: d.message || '',
                    progress: d.progress || 0,
                    agent: d.agent || 'system',
                    status: d.type
                }]);
            }
            if (d.type === 'error') {
                setLoading(false);
                refresh();
                if (selected?.item.id === item.id) {
                    setSelected({ kind: k, item });
                }
                // Intentionally keeping run_id in activeWebsockets to prevent infinite reconnect loop
            }
        };
        ws.onerror = () => {
            setLoading(false);
            activeWebsockets.current.delete(run_id);
        };
    };

    const startResearch = async (k: 'hurdles' | 'visions', item: Item) => {
        setEvents([]);
        setLoading(true);
        const run = await researchItem(k, item.id);
        connectWs(run.run_id, k, item);
    };

    const add = async () => {
        await createItem(kind, form);
        setModal(false);
        setForm({ title: '', description: '', priority: 1 });
        refresh();
    };

    const remove = async (k: string, id: string) => {
        await deleteItem(k, id);
        refresh();
    };

    const allItems = kind === 'hurdles' ? hurdles : visions;

    return (
        <div className="min-h-screen bg-[#f7faf8]">
            <header className="sticky top-0 z-20 border-b border-[#dfe8e3] bg-white/90 backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-[#2f3e46] p-2 text-white">
                            <BrainCircuit size={19} />
                        </div>
                        <div>
                            <div className="font-extrabold tracking-tight text-[#2f3e46]">Venture Intelligence</div>
                            <div className="text-[11px] text-slate-500">Evidence → execution</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="secondary"
                            onClick={toggleDaemon}
                            className={`flex items-center gap-2 ${daemonActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                        >
                            {daemonActive ? <Square size={14} className="fill-current"/> : <Play size={14} className="fill-current"/>}
                            {daemonActive ? 'Stop Auto-Research' : 'Start Auto-Research'}
                        </Button>
                        <Button onClick={() => setModal(true)}>
                            <Plus size={16} />Add {kind === 'hurdles' ? 'Hurdle' : 'Vision'}
                        </Button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-6 py-8">
                <section className="mb-8">
                    <div className="max-w-3xl">
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#eaf1ed] px-3 py-1.5 text-xs font-semibold text-[#52796f]">
                            <Sparkles size={14} />Agentic business research
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-[#2f3e46] sm:text-5xl">Turn business problems into researched action.</h1>
                        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">Track what is blocking the company today and where it wants to go next. Specialized agents research evidence, comparable implementations, budgets and market gaps.</p>
                    </div>
                </section>

                <section className="mb-8 grid gap-4 sm:grid-cols-3">
                    <Stat icon={<CircleAlert />} label="Active hurdles" value={counts.h} />
                    <Stat icon={<Target />} label="Active visions" value={counts.v} />
                    <Stat icon={<Zap />} label="Research running" value={counts.r} />
                </section>

                <div className="mb-5 flex items-center gap-2">
                    <button onClick={() => setKind('hurdles')} className={`rounded-xl px-4 py-2 text-sm font-semibold ${kind === 'hurdles' ? 'bg-[#2f3e46] text-white' : 'bg-white text-[#52796f]'}`}>Hurdles</button>
                    <button onClick={() => setKind('visions')} className={`rounded-xl px-4 py-2 text-sm font-semibold ${kind === 'visions' ? 'bg-[#2f3e46] text-white' : 'bg-white text-[#52796f]'}`}>Vision</button>
                    <span className="ml-auto text-xs text-slate-500">Priority is unique and automatically reordered</span>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                    <div className="space-y-4">
                        {allItems.map(item => (
                            <ItemCard key={item.id} item={item} kind={kind} onResearch={() => startResearch(kind, item)} onDelete={() => remove(kind, item.id)} onOpen={() => setSelected({ kind, item })} />
                        ))}
                        {allItems.length === 0 && (
                            <Card className="p-12 text-center text-slate-500">No {kind} yet. Add one to start the research loop.</Card>
                        )}
                    </div>
                    <div className="lg:sticky lg:top-24 lg:h-fit">
                        {events.length > 0 ? (
                            <ProgressPanel events={events} />
                        ) : (
                            <Card className="p-5">
                                <div className="mb-3 text-sm font-bold">How the loop works</div>
                                {kind === 'hurdles' ? (
                                    <div className="space-y-4 text-sm text-slate-600">
                                        <Flow n="01" t="Search web, GitHub, and Reddit" />
                                        <Flow n="02" t="Discover solutions & implementations" />
                                        <Flow n="03" t="Extract developers & portfolios" />
                                        <Flow n="04" t="Score success, budget, & similarity" />
                                        <Flow n="05" t="Generate actionable steps" />
                                    </div>
                                ) : (
                                    <div className="space-y-4 text-sm text-slate-600">
                                        <Flow n="01" t="Search for related real products" />
                                        <Flow n="02" t="Analyze market value vs models" />
                                        <Flow n="03" t="Find customer market gaps" />
                                        <Flow n="04" t="Generate solutions to overcome gaps" />
                                        <Flow n="05" t="Extract developer implementations" />
                                    </div>
                                )}
                            </Card>
                        )}
                    </div>
                </div>

                {selected && (
                    <Detail item={selected.item} kind={selected.kind} onClose={() => setSelected(null)} loading={loading} />
                )}
            </main>

            <Modal open={modal} title={`Add ${kind === 'hurdles' ? 'Hurdle' : 'Vision'}`} onClose={() => setModal(false)}>
                <div className="space-y-4">
                    <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title" className="w-full rounded-xl border border-[#d9e3de] px-4 py-3 outline-none focus:ring-2 focus:ring-[#84a98c]" />
                    <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the problem or goal..." rows={5} className="w-full resize-none rounded-xl border border-[#d9e3de] px-4 py-3 outline-none focus:ring-2 focus:ring-[#84a98c]" />
                    <input type="number" min={1} value={form.priority} onChange={e => setForm({ ...form, priority: Number(e.target.value) })} className="w-full rounded-xl border border-[#d9e3de] px-4 py-3 outline-none" />
                    <Button className="w-full" onClick={add}>Add {kind === 'hurdles' ? 'Hurdle' : 'Vision'}</Button>
                </div>
            </Modal>
        </div>
    );
}

function Stat({ icon, label, value }: { icon: any; label: string; value: number }) {
    return (
        <Card className="p-5">
            <div className="mb-3 flex items-center gap-2 text-[#52796f]">
                {icon}
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
            </div>
            <div className="text-3xl font-black text-[#2f3e46]">{value}</div>
        </Card>
    );
}

function Flow({ n, t }: { n: string; t: string }) {
    return (
        <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#eef4f0] text-xs font-bold text-[#52796f]">{n}</span>
            <span>{t}</span>
        </div>
    );
}

function Detail({ item, kind, onClose, loading }: { item: Item; kind: 'hurdles' | 'visions'; onClose: () => void; loading: boolean }) {
    const [research, setResearch] = useState<any>(null);
    const [selectedRun, setSelectedRun] = useState<string | null>(null);
    const [selectedSolution, setSelectedSolution] = useState<any>(null);
    const [selectedBusinessModel, setSelectedBusinessModel] = useState<any>(null);

    useEffect(() => {
        getResearch(kind, item.id, selectedRun || undefined).then(setResearch).catch(e => console.error(e));
    }, [item.id, kind, selectedRun]);

    const handleRunChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedRun(e.target.value);
    };

    return (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-[#f7faf8]">
            <div className="mx-auto max-w-6xl px-6 py-8">
                {selectedSolution ? (
                    <button onClick={() => setSelectedSolution(null)} className="mb-5 text-sm font-semibold text-[#52796f]">← Back to Solutions</button>
                ) : selectedBusinessModel ? (
                    <button onClick={() => setSelectedBusinessModel(null)} className="mb-5 text-sm font-semibold text-[#52796f]">← Back to Business Models</button>
                ) : (
                    <button onClick={onClose} className="mb-5 text-sm font-semibold text-[#52796f]">← Back</button>
                )}
                <div className="mb-8 flex items-start justify-between">
                    <div>
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#84a98c]">{kind === 'hurdles' ? 'Current hurdle' : 'Strategic vision'}</div>
                        <h2 className="text-4xl font-black text-[#2f3e46]">{item.title}</h2>
                        <p className="mt-3 max-w-3xl text-slate-600">{item.description}</p>
                    </div>
                    {research?.executions && research.executions.length > 0 && (
                        <div>
                            <select 
                                value={selectedRun || research.executions[research.executions.length - 1]} 
                                onChange={handleRunChange}
                                className="rounded-xl border border-[#d9e3de] px-4 py-2 text-sm font-semibold text-[#2f3e46] outline-none"
                            >
                                {research.executions.map((r: string, i: number) => (
                                    <option key={r} value={r}>Execution {i + 1} {i === research.executions.length - 1 ? '(Latest)' : ''}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
                {research?.status === 'completed' ? (
                    <div className="space-y-6">
                        {kind === 'visions' && !selectedBusinessModel && (
                            <div>
                                <h3 className="mb-4 text-xl font-bold">Business Models & Market Gaps</h3>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {research.business_models?.map((m: any, i: number) => (
                                        <Card key={m.id || m.name || i} className="flex cursor-pointer flex-col justify-between p-5 transition hover:shadow-md" onClick={() => setSelectedBusinessModel(m)}>
                                            <div>
                                                <div className="font-bold text-lg text-[#2f3e46]">{m.name || m}</div>
                                                {m.description && <p className="mt-2 text-sm text-slate-600 line-clamp-3">{m.description}</p>}
                                                {m.market_gap && (
                                                    <div className="mt-4 rounded-lg bg-[#fff8e6] p-3 text-sm text-[#8c6b14]">
                                                        <span className="font-semibold block mb-1">Market Gap (Score: {m.market_gap_score || 0}):</span>
                                                        {m.market_gap}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                                                <div className="text-xs font-semibold text-slate-500">Success Rate: <span className="text-[#52796f]">{m.success_rate || 0}%</span></div>
                                                <div className="text-xs font-semibold text-[#52796f]">View Solutions →</div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                        {selectedSolution ? (
                            <div className="space-y-6">
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="text-xl font-bold">Comparable implementations for: {selectedSolution.title}</h3>
                                </div>
                                <div className="grid gap-4 lg:grid-cols-2">
                                    {selectedSolution.implementations?.map((x: any) => (
                                        <div key={x.id} className="rounded-xl border border-[#e1e9e4] bg-white p-6 shadow-sm">
                                            <div className="flex items-start gap-4">
                                                <div className="rounded-lg bg-[#eef4f0] p-3 text-[#52796f]">
                                                    <UserRound size={20} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-lg font-bold text-[#2f3e46]">{x.person_name}</div>
                                                    <div className="text-sm font-medium text-slate-500">
                                                        {x.role} &bull; similarity {Math.round(x.similarity * 100)}%
                                                    </div>
                                                    <div className="mt-3 text-base text-slate-600 leading-relaxed">{x.description}</div>
                                                    <div className="mt-5 flex flex-wrap gap-3 border-t border-[#e1e9e4] pt-4">
                                                        {x.github && (
                                                            <a className="inline-flex items-center gap-1.5 rounded-md bg-[#eef4f0] px-3 py-1.5 text-sm font-semibold text-[#52796f] transition hover:bg-[#d9e3de]" href={x.github} target="_blank" rel="noreferrer">
                                                                GitHub
                                                            </a>
                                                        )}
                                                        {x.demo && (
                                                            <a className="inline-flex items-center gap-1.5 rounded-md bg-[#eef4f0] px-3 py-1.5 text-sm font-semibold text-[#52796f] transition hover:bg-[#d9e3de]" href={x.demo} target="_blank" rel="noreferrer">
                                                                <ExternalLink size={14} />
                                                                Demo
                                                            </a>
                                                        )}
                                                        {x.portfolio && (
                                                            <a className="inline-flex items-center gap-1.5 rounded-md bg-[#eef4f0] px-3 py-1.5 text-sm font-semibold text-[#52796f] transition hover:bg-[#d9e3de]" href={x.portfolio} target="_blank" rel="noreferrer">
                                                                Portfolio
                                                            </a>
                                                        )}
                                                        {x.contact && (
                                                            <a className="inline-flex items-center gap-1.5 rounded-md bg-[#52796f] px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-[#3e5f56]" href={x.contact} target="_blank" rel="noreferrer">
                                                                Contact
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : selectedBusinessModel ? (
                            <div>
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="text-xl font-bold">Solutions for: {selectedBusinessModel.name}</h3>
                                </div>
                                <div className="space-y-4">
                                    {selectedBusinessModel.solutions?.map((s: any, i: number) => (
                                        <SolutionCard key={s.id || s.title || i} solution={s} onViewImplementations={() => setSelectedSolution(s)} />
                                    ))}
                                    {(!selectedBusinessModel.solutions || selectedBusinessModel.solutions.length === 0) && (
                                        <div className="text-slate-500">No solutions found for this business model.</div>
                                    )}
                                </div>
                            </div>
                        ) : kind === 'hurdles' ? (
                            <div>
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="text-xl font-bold">Solutions</h3>
                                    <span className="text-xs text-slate-500">{research.research_mode || research.mode} research · {research.sources?.length || research.sources_found || 0} sources</span>
                                </div>
                                <div className="space-y-4">
                                    {research.solutions?.map((s: any, i: number) => (
                                        <SolutionCard key={s.id || s.title || i} solution={s} onViewImplementations={() => setSelectedSolution(s)} />
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>
                ) : (
                    <Card className="p-8 text-center text-slate-500">
                        {loading || item.status === 'researching' ? 'Research is running — follow the live activity panel on the dashboard.' : 'No completed research for this item yet. Start research from the dashboard.'}
                        {item.status === 'failed' && <div className="mt-2 text-red-500">Last research attempt failed. Please try again.</div>}
                    </Card>
                )}
            </div>
        </div>
    );
}
