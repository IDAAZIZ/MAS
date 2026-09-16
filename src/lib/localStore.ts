// ============================================================
// e-APRESIASI KKBDA — Local Storage Database Engine
// Provides full offline/local persistence when Supabase is not configured
// ============================================================

import type {
  AwardYear,
  Award,
  AwardItemSet,
  AwardItem,
  Evaluator,
  EvaluatorAssignment,
  PanelCandidate,
  Evaluation,
  EvaluationScore,
  CandidateAggregate,
  ManagementSelection,
  DirectorSelection,
  DirectorApproval,
  FinalResult,
  AuditLog,
  SystemSetting,
  AwardStatus,
  UserRole,
  UserRoleRecord,
  Profile,
} from './types';
import { DEFAULT_CATEGORIES } from './constants';
import { generateInitialItemSetsAndItems } from './rubricTemplates';
import { supabase } from './supabase';

export const isSupabaseConfigured = (): boolean => {
  // Kawalan Keselamatan: Pada Step B (Sambungan Sahaja), data rasmi kekal 100%
  // menggunakan localStorage sehingga proses migrasi (Step C) diluluskan secara rasmi.
  const enableData = import.meta.env.VITE_ENABLE_SUPABASE_DATA === 'true';
  const url = import.meta.env.VITE_SUPABASE_URL;
  return enableData && !!url && !url.includes('placeholder') && !url.includes('your-project');
};

const STORAGE_KEYS = {
  YEARS: 'kkbda_award_years',
  AWARDS: 'kkbda_awards',
  ITEM_SETS: 'kkbda_item_sets',
  ITEMS: 'kkbda_award_items',
  EVALUATORS: 'kkbda_evaluators',
  ASSIGNMENTS: 'kkbda_assignments',
  CLOUD_ASSIGNMENTS: 'kkbda_cloud_assignments',
  CANDIDATES: 'kkbda_panel_candidates',
  EVALUATIONS: 'kkbda_evaluations',
  SCORES: 'kkbda_evaluation_scores',
  AGGREGATES: 'kkbda_candidate_aggregates',
  MGMT_SELECTIONS: 'kkbda_mgmt_selections',
  DIR_SELECTIONS: 'kkbda_dir_selections',
  DIR_APPROVALS: 'kkbda_dir_approvals',
  FINAL_RESULTS: 'kkbda_final_results',
  AUDIT_LOGS: 'kkbda_audit_logs',
  SETTINGS: 'kkbda_settings',
  AWARD_STATUS: 'kkbda_award_status',
  USER_ROLES: 'kkbda_user_roles',
  PROFILES: 'kkbda_user_profiles',
  AUTH_VAULT: 'kkbda_auth_vault',
};

// Initial Seed Data
function getInitialYears(): AwardYear[] {
  return [
    { id: 'year-2026', year: 2026, is_active: true, created_at: new Date().toISOString() },
    { id: 'year-2025', year: 2025, is_active: false, created_at: new Date().toISOString() },
  ];
}

function getInitialAwards(): Award[] {
  return DEFAULT_CATEGORIES.map((name, index) => ({
    id: `award-${index + 1}`,
    name,
    description:
      name === 'Pengurusan PdP Terbaik'
        ? 'Anugerah kecemerlangan dan pengiktirafan sumbangan bagi Pengurusan PdP Terbaik KKBDA mengikut bahagian (SKE, STS, STM, SAU, DCV, AM).'
        : `Anugerah kecemerlangan dan pengiktirafan sumbangan bagi ${name} KKBDA.`,
    sort_order: index + 1,
    is_active: true,
    max_candidates: name === 'Pengurusan PdP Terbaik' ? 6 : 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
}

function getInitialItemSets(): { sets: AwardItemSet[]; items: AwardItem[] } {
  return generateInitialItemSetsAndItems();
}

function getInitialEvaluators(): Evaluator[] {
  return [
    { id: 'eval-1', profile_id: '00000000-0000-0000-0000-000000000002', name: 'Ts. Dr. Ahmad Bin Hashim', email: 'panel@kkbda.edu.my', position: 'Ketua Program / Pensyarah DH48', phone: '013-4567890', is_active: true, is_dummy: true, created_at: '', updated_at: '' },
    { id: 'eval-2', profile_id: null, name: 'Puan Siti Rahmah Binti Mahmud', email: 'siti@kkbda.edu.my', position: 'Pensyarah Kanan DH44', phone: '019-1234567', is_active: true, is_dummy: true, created_at: '', updated_at: '' },
    { id: 'eval-3', profile_id: null, name: 'Encik Ali Bin Hassan', email: 'ali@kkbda.edu.my', position: 'Pegawai Pentadbiran N41', phone: '012-7654321', is_active: true, is_dummy: true, created_at: '', updated_at: '' },
  ];
}

function getInitialAssignments(): EvaluatorAssignment[] {
  return [
    { id: 'asgn-1', evaluator_id: 'eval-1', award_id: 'award-1', award_year_id: 'year-2026', created_at: '' },
    { id: 'asgn-2', evaluator_id: 'eval-2', award_id: 'award-1', award_year_id: 'year-2026', created_at: '' },
    { id: 'asgn-3', evaluator_id: 'eval-1', award_id: 'award-2', award_year_id: 'year-2026', created_at: '' },
  ];
}

function getInitialCandidatesAndAggregates(): { candidates: PanelCandidate[]; aggregates: CandidateAggregate[]; mgmtSelections: ManagementSelection[] } {
  return { candidates: [], aggregates: [], mgmtSelections: [] };
}


// Helper to get or set storage
function getStorage<T>(key: string, initialFallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(initialFallback));
      return initialFallback;
    }
    return JSON.parse(raw);
  } catch {
    return initialFallback;
  }
}

function setStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Storage quota exceeded:', err);
  }
}

// Initialise DB once
export function initLocalStore() {
  getStorage(STORAGE_KEYS.YEARS, getInitialYears());
  const storedAwards = getStorage<Award[]>(STORAGE_KEYS.AWARDS, getInitialAwards());

  // Consolidation: If split categories "Pengurusan PdP Terbaik - *" exist, consolidate back into single "Pengurusan PdP Terbaik"
  const hasSplitPdp = storedAwards.some((a) => a.name.startsWith('Pengurusan PdP Terbaik -'));
  if (hasSplitPdp) {
    const newAwards: Award[] = [];
    let sortOrder = 1;
    let consolidatedAdded = false;

    for (const award of storedAwards) {
      if (award.name.startsWith('Pengurusan PdP Terbaik -')) {
        if (!consolidatedAdded) {
          newAwards.push({
            id: 'award-12',
            name: 'Pengurusan PdP Terbaik',
            description:
              'Anugerah kecemerlangan dan pengiktirafan sumbangan bagi Pengurusan PdP Terbaik KKBDA mengikut bahagian (SKE, STS, STM, SAU, DCV, AM).',
            sort_order: sortOrder++,
            is_active: true,
            max_candidates: 6,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          consolidatedAdded = true;
        }
      } else {
        newAwards.push({
          ...award,
          sort_order: sortOrder++,
        });
      }
    }
    setStorage(STORAGE_KEYS.AWARDS, newAwards);

    // Migrate any candidates and aggregates with award-pdp-* to award-12
    const cands = getStorage<PanelCandidate[]>(STORAGE_KEYS.CANDIDATES, []);
    let candsChanged = false;
    cands.forEach((c) => {
      if (c.award_id.startsWith('award-pdp-')) {
        c.award_id = 'award-12';
        candsChanged = true;
      }
    });
    if (candsChanged) setStorage(STORAGE_KEYS.CANDIDATES, cands);

    const aggs = getStorage<CandidateAggregate[]>(STORAGE_KEYS.AGGREGATES, []);
    let aggsChanged = false;
    aggs.forEach((a) => {
      if (a.award_id.startsWith('award-pdp-')) {
        a.award_id = 'award-12';
        aggsChanged = true;
      }
    });
    if (aggsChanged) setStorage(STORAGE_KEYS.AGGREGATES, aggs);
  }

  const { sets: defaultSets, items: defaultItems } = getInitialItemSets();
  const existingSets = getStorage<AwardItemSet[]>(STORAGE_KEYS.ITEM_SETS, []);
  const existingItems = getStorage<AwardItem[]>(STORAGE_KEYS.ITEMS, []);

  // Ensure all 15 categories have their official rubric sets and items
  const mergedSets = [...existingSets];
  defaultSets.forEach((dSet) => {
    const idx = mergedSets.findIndex((s) => s.id === dSet.id || s.award_id === dSet.award_id);
    if (idx >= 0) {
      mergedSets[idx] = { ...dSet, ...mergedSets[idx], name: dSet.name, total_max_score: 100, is_complete: true };
    } else {
      mergedSets.push(dSet);
    }
  });
  setStorage(STORAGE_KEYS.ITEM_SETS, mergedSets);

  const mergedItems = [...existingItems];
  defaultItems.forEach((dItem) => {
    const idx = mergedItems.findIndex(
      (i) => i.id === dItem.id || (i.item_set_id === dItem.item_set_id && i.sort_order === dItem.sort_order)
    );
    if (idx >= 0) {
      mergedItems[idx] = { ...mergedItems[idx], ...dItem };
    } else {
      mergedItems.push(dItem);
    }
  });
  setStorage(STORAGE_KEYS.ITEMS, mergedItems);
  const existingEvaluators = getStorage<Evaluator[]>(STORAGE_KEYS.EVALUATORS, getInitialEvaluators());
  let evalsChanged = false;
  existingEvaluators.forEach((e) => {
    if (e.id === 'eval-1' || e.name.toLowerCase().includes('ahmad bin hashim')) {
      if (e.is_dummy !== true) {
        e.is_dummy = true;
        evalsChanged = true;
      }
    }
  });
  if (evalsChanged) setStorage(STORAGE_KEYS.EVALUATORS, existingEvaluators);

  getStorage(STORAGE_KEYS.ASSIGNMENTS, getInitialAssignments());

  // Purge any dummy candidates, aggregates, evaluations, and selections
  const dummyCandIds = new Set(['cand-1', 'cand-2', 'cand-3']);
  const dummyAggIds = new Set(['agg-1', 'agg-2', 'agg-3']);
  const dummyNames = new Set(['ahmad bin ali', 'siti binti rahman', 'farah binti hassan']);

  const currentCands = getStorage<PanelCandidate[]>(STORAGE_KEYS.CANDIDATES, []);
  const filteredCands = currentCands.filter(
    (c) => !dummyCandIds.has(c.id) && !dummyNames.has((c.candidate_name || '').toLowerCase().trim())
  );
  setStorage(STORAGE_KEYS.CANDIDATES, filteredCands);

  const currentAggs = getStorage<CandidateAggregate[]>(STORAGE_KEYS.AGGREGATES, []);
  const filteredAggs = currentAggs.filter(
    (a) => !dummyAggIds.has(a.id) && !dummyNames.has((a.candidate_name || '').toLowerCase().trim())
  );
  setStorage(STORAGE_KEYS.AGGREGATES, filteredAggs);

  const currentMgmt = getStorage<ManagementSelection[]>(STORAGE_KEYS.MGMT_SELECTIONS, []);
  const filteredMgmt = currentMgmt.filter(
    (m) => m.id !== 'ms-1' && !dummyAggIds.has(m.candidate_aggregate_id)
  );
  setStorage(STORAGE_KEYS.MGMT_SELECTIONS, filteredMgmt);

  const currentDir = getStorage<DirectorSelection[]>(STORAGE_KEYS.DIR_SELECTIONS, []);
  const filteredDir = currentDir.filter((d) => !dummyAggIds.has(d.candidate_aggregate_id));
  setStorage(STORAGE_KEYS.DIR_SELECTIONS, filteredDir);

  const currentEvals = getStorage<Evaluation[]>(STORAGE_KEYS.EVALUATIONS, []);
  const filteredEvals = currentEvals.filter((e) => !dummyCandIds.has(e.panel_candidate_id));
  setStorage(STORAGE_KEYS.EVALUATIONS, filteredEvals);

  const currentFinal = getStorage<FinalResult[]>(STORAGE_KEYS.FINAL_RESULTS, []);
  const filteredFinal = currentFinal.filter(
    (f) => !dummyAggIds.has(f.candidate_aggregate_id)
  );
  setStorage(STORAGE_KEYS.FINAL_RESULTS, filteredFinal);

  // Initialize official Urusetia (Admin) profile if not exists
  const currentProfiles = getStorage<Profile[]>(STORAGE_KEYS.PROFILES, []);
  const hasAdmin = currentProfiles.some(
    (p) => p.username === 'admin' || p.email === 'admin@kkbda.edu.my'
  );
  if (!hasAdmin) {
    currentProfiles.push({
      id: '00000000-0000-0000-0000-000000000001',
      full_name: 'Ida Safinar Binti Aziz (UJK)',
      email: 'admin@kkbda.edu.my',
      username: 'admin',
      role: 'admin',
      roles: ['admin'],
      phone: '012-3456789',
      position: 'Pegawai Urusetia Anugerah (UJK)',
      is_active: true,
      activation_status: 'active',
      activated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });
    setStorage(STORAGE_KEYS.PROFILES, currentProfiles);
  }

  // Ensure user_roles has admin entry
  const currentRoles = getStorage<UserRoleRecord[]>(STORAGE_KEYS.USER_ROLES, []);
  const hasAdminRole = currentRoles.some(
    (r) => r.user_id === '00000000-0000-0000-0000-000000000001' && r.role === 'admin'
  );
  if (!hasAdminRole) {
    currentRoles.push({
      id: 'ur-admin-init',
      user_id: '00000000-0000-0000-0000-000000000001',
      role: 'admin',
      created_at: new Date().toISOString(),
    });
    setStorage(STORAGE_KEYS.USER_ROLES, currentRoles);
  }

  // Clear obsolete demoProfile that may hold legacy dummy accounts
  try {
    const rawDemo = localStorage.getItem('demoProfile');
    if (rawDemo && (rawDemo.includes('Ahmad') || rawDemo.includes('panel@kkbda.edu.my'))) {
      localStorage.removeItem('demoProfile');
    }
  } catch {}
}

// Immediately run initialize
initLocalStore();

// ============================================================
// Local Store CRUD Operations
// ============================================================

export const localDB = {
  // AWARD YEARS
  getYears: (): AwardYear[] => {
    return getStorage<AwardYear[]>(STORAGE_KEYS.YEARS, getInitialYears()).sort((a, b) => b.year - a.year);
  },
  createYear: (year: number): AwardYear => {
    const years = localDB.getYears();
    const newYear: AwardYear = {
      id: `year-${year}`,
      year,
      is_active: false,
      created_at: new Date().toISOString(),
    };
    years.unshift(newYear);
    setStorage(STORAGE_KEYS.YEARS, years);
    return newYear;
  },
  setActiveYear: (id: string): void => {
    const years = localDB.getYears().map((y) => ({
      ...y,
      is_active: y.id === id,
    }));
    setStorage(STORAGE_KEYS.YEARS, years);
  },
  deleteYear: (id: string): void => {
    const years = localDB.getYears().filter((y) => y.id !== id);
    setStorage(STORAGE_KEYS.YEARS, years);
  },

  // AWARDS (CATEGORIES)
  getAwards: (): Award[] => {
    return getStorage<Award[]>(STORAGE_KEYS.AWARDS, getInitialAwards()).sort((a, b) => a.sort_order - b.sort_order);
  },
  createAward: (input: { name: string; description?: string; max_candidates?: number }): Award => {
    const awards = localDB.getAwards();
    const maxOrder = awards.reduce((max, a) => Math.max(max, a.sort_order), 0);
    const newAward: Award = {
      id: `award-${Date.now()}`,
      name: input.name,
      description: input.description || null,
      sort_order: maxOrder + 1,
      is_active: true,
      max_candidates: input.max_candidates || 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    awards.push(newAward);
    setStorage(STORAGE_KEYS.AWARDS, awards);
    return newAward;
  },
  updateAward: (id: string, updates: Partial<Award>): Award | null => {
    const awards = localDB.getAwards();
    const idx = awards.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    awards[idx] = { ...awards[idx], ...updates, updated_at: new Date().toISOString() };
    setStorage(STORAGE_KEYS.AWARDS, awards);
    return awards[idx];
  },
  deleteAward: (id: string): void => {
    const awards = localDB.getAwards().filter((a) => a.id !== id);
    setStorage(STORAGE_KEYS.AWARDS, awards);
  },

  // ITEM SETS
  getItemSets: (): AwardItemSet[] => {
    const sets = getStorage<AwardItemSet[]>(STORAGE_KEYS.ITEM_SETS, []);
    const items = getStorage<AwardItem[]>(STORAGE_KEYS.ITEMS, []);
    return sets.map((s) => ({
      ...s,
      award_items: items.filter((i) => i.item_set_id === s.id).sort((a, b) => a.sort_order - b.sort_order),
    }));
  },
  createItemSet: (name: string): AwardItemSet => {
    const sets = getStorage<AwardItemSet[]>(STORAGE_KEYS.ITEM_SETS, []);
    const newSet: AwardItemSet = {
      id: `set-${Date.now()}`,
      name,
      award_id: null,
      total_max_score: 0,
      is_complete: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      award_items: [],
    };
    sets.unshift(newSet);
    setStorage(STORAGE_KEYS.ITEM_SETS, sets);
    return newSet;
  },
  updateItemSet: (id: string, updates: Partial<AwardItemSet>): void => {
    const sets = getStorage<AwardItemSet[]>(STORAGE_KEYS.ITEM_SETS, []);
    const idx = sets.findIndex((s) => s.id === id);
    if (idx !== -1) {
      sets[idx] = { ...sets[idx], ...updates, updated_at: new Date().toISOString() };
      setStorage(STORAGE_KEYS.ITEM_SETS, sets);
    }
  },
  deleteItemSet: (id: string): void => {
    const sets = getStorage<AwardItemSet[]>(STORAGE_KEYS.ITEM_SETS, []).filter((s) => s.id !== id);
    setStorage(STORAGE_KEYS.ITEM_SETS, sets);
  },

  // AWARD ITEMS
  getItemsBySet: (setId: string): AwardItem[] => {
    return getStorage<AwardItem[]>(STORAGE_KEYS.ITEMS, []).filter((i) => i.item_set_id === setId).sort((a, b) => a.sort_order - b.sort_order);
  },
  createItem: (setId: string, input: { name: string; description?: string; max_score: number }): AwardItem => {
    const items = getStorage<AwardItem[]>(STORAGE_KEYS.ITEMS, []);
    const setItems = items.filter((i) => i.item_set_id === setId);
    const maxOrder = setItems.reduce((m, i) => Math.max(m, i.sort_order), 0);
    const newItem: AwardItem = {
      id: `item-${Date.now()}`,
      item_set_id: setId,
      name: input.name,
      description: input.description || null,
      max_score: input.max_score,
      sort_order: maxOrder + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    items.push(newItem);
    setStorage(STORAGE_KEYS.ITEMS, items);
    return newItem;
  },
  updateItem: (id: string, updates: Partial<AwardItem>): void => {
    const items = getStorage<AwardItem[]>(STORAGE_KEYS.ITEMS, []);
    const idx = items.findIndex((i) => i.id === id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...updates, updated_at: new Date().toISOString() };
      setStorage(STORAGE_KEYS.ITEMS, items);
    }
  },
  deleteItem: (id: string): void => {
    const items = getStorage<AwardItem[]>(STORAGE_KEYS.ITEMS, []).filter((i) => i.id !== id);
    setStorage(STORAGE_KEYS.ITEMS, items);
  },
  reorderItems: (setId: string, orderedItems: { id: string; sort_order: number }[]): void => {
    const items = getStorage<AwardItem[]>(STORAGE_KEYS.ITEMS, []);
    const orderMap = new Map(orderedItems.map((o) => [o.id, o.sort_order]));
    const updated = items.map((i) => {
      if (i.item_set_id === setId && orderMap.has(i.id)) {
        return { ...i, sort_order: orderMap.get(i.id)! };
      }
      return i;
    });
    setStorage(STORAGE_KEYS.ITEMS, updated);
  },

  // EVALUATORS
  getEvaluators: (): Evaluator[] => {
    return getStorage<Evaluator[]>(STORAGE_KEYS.EVALUATORS, getInitialEvaluators());
  },
  createEvaluator: (input: { name: string; email: string; position?: string; phone?: string }): Evaluator => {
    const evals = localDB.getEvaluators();
    const newEval: Evaluator = {
      id: `eval-${Date.now()}`,
      profile_id: null,
      name: input.name,
      email: input.email,
      position: input.position || null,
      phone: input.phone || null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    evals.push(newEval);
    setStorage(STORAGE_KEYS.EVALUATORS, evals);
    return newEval;
  },
  updateEvaluator: (id: string, updates: Partial<Evaluator>): void => {
    const evals = localDB.getEvaluators();
    const idx = evals.findIndex((e) => e.id === id);
    if (idx !== -1) {
      evals[idx] = { ...evals[idx], ...updates, updated_at: new Date().toISOString() };
      setStorage(STORAGE_KEYS.EVALUATORS, evals);
    }
  },
  deleteEvaluator: (id: string): void => {
    const evals = localDB.getEvaluators().filter((e) => e.id !== id);
    setStorage(STORAGE_KEYS.EVALUATORS, evals);
  },

  // ASSIGNMENTS
  getAssignments: (awardId: string, yearId: string): (EvaluatorAssignment & { evaluator: Evaluator })[] => {
    const asgns = getStorage<EvaluatorAssignment[]>(STORAGE_KEYS.ASSIGNMENTS, getInitialAssignments());
    const evals = localDB.getEvaluators();
    const evalMap = new Map(evals.map((e) => [e.id, e]));

    return asgns
      .filter((a) => (!awardId || a.award_id === awardId) && (!yearId || a.award_year_id === yearId))
      .map((a) => ({
        ...a,
        evaluator: evalMap.get(a.evaluator_id) || {
          id: a.evaluator_id,
          name: 'Panel Penilai',
          email: '',
          position: '',
          phone: '',
          profile_id: null,
          is_active: true,
          created_at: '',
          updated_at: '',
        },
      }));
  },
  // CLOUD ASSIGNMENT SYNC (Menggunakan system_settings Supabase merentasi peranti & pelayar)
  getCloudAssignments: (): Record<string, string[]> => {
    return getStorage<Record<string, string[]>>(STORAGE_KEYS.CLOUD_ASSIGNMENTS, {});
  },
  setCloudAssignments: (map: Record<string, string[]>): void => {
    setStorage(STORAGE_KEYS.CLOUD_ASSIGNMENTS, map);
  },
  syncAssignmentsFromCloud: async (): Promise<Record<string, string[]>> => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'panel_assignments_sync')
        .maybeSingle();

      if (!error && data?.value) {
        const cloudMap = JSON.parse(data.value) as Record<string, string[]>;
        setStorage(STORAGE_KEYS.CLOUD_ASSIGNMENTS, cloudMap);

        // Segerakkan juga ke dalam STORAGE_KEYS.ASSIGNMENTS
        let asgns = getStorage<EvaluatorAssignment[]>(STORAGE_KEYS.ASSIGNMENTS, []);
        const activeYearId = 'year-2026';

        Object.entries(cloudMap).forEach(([userKey, awardIds]) => {
          if (!userKey || !Array.isArray(awardIds)) return;
          // Buang tugasan lama bagi userKey ini
          asgns = asgns.filter((a) => !(a.evaluator_id.toLowerCase() === userKey.toLowerCase() && a.award_year_id === activeYearId));
          // Masukkan tugasan baharu dari cloud
          awardIds.forEach((awardId) => {
            asgns.push({
              id: `asgn-cloud-${userKey}-${awardId}`,
              evaluator_id: userKey,
              award_id: awardId,
              award_year_id: activeYearId,
              division: null,
              created_at: new Date().toISOString(),
            });
          });
        });

        setStorage(STORAGE_KEYS.ASSIGNMENTS, asgns);
        window.dispatchEvent(new Event('kkbda_assignments_changed'));
        return cloudMap;
      }
    } catch (e) {
      console.warn('Cloud assignments sync notice:', e);
    }
    return getStorage<Record<string, string[]>>(STORAGE_KEYS.CLOUD_ASSIGNMENTS, {});
  },
  saveAssignmentsToCloud: async (userKeys: string[], awardIds: string[]): Promise<boolean> => {
    try {
      const currentMap = localDB.getCloudAssignments();
      userKeys.forEach((key) => {
        if (key) {
          currentMap[key.toLowerCase()] = awardIds;
          currentMap[key] = awardIds;
        }
      });
      setStorage(STORAGE_KEYS.CLOUD_ASSIGNMENTS, currentMap);

      // Simpan ke Supabase system_settings
      const jsonVal = JSON.stringify(currentMap);
      const { error } = await supabase
        .from('system_settings')
        .upsert(
          { key: 'panel_assignments_sync', value: jsonVal, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );

      window.dispatchEvent(new Event('kkbda_assignments_changed'));
      return !error;
    } catch (e) {
      console.warn('Save assignments to cloud notice:', e);
      return false;
    }
  },

  assignEvaluator: (awardId: string, yearId: string, evaluatorId: string, division?: string | null): void => {
    const asgns = getStorage<EvaluatorAssignment[]>(STORAGE_KEYS.ASSIGNMENTS, []);
    const existingIdx = asgns.findIndex((a) => a.award_id === awardId && a.award_year_id === yearId && a.evaluator_id === evaluatorId);
    if (existingIdx !== -1) {
      if (division) asgns[existingIdx].division = division;
    } else {
      asgns.push({
        id: `asgn-${Date.now()}`,
        award_id: awardId,
        award_year_id: yearId,
        evaluator_id: evaluatorId,
        division: division || null,
        created_at: new Date().toISOString(),
      });
    }
    setStorage(STORAGE_KEYS.ASSIGNMENTS, asgns);
    const currentAwards = asgns.filter((a) => a.evaluator_id === evaluatorId && a.award_year_id === yearId).map((a) => a.award_id);
    localDB.saveAssignmentsToCloud([evaluatorId], currentAwards).catch(() => {});
  },
  setAssignmentDivision: (awardId: string, yearId: string, evaluatorId: string, division: string): void => {
    const asgns = getStorage<EvaluatorAssignment[]>(STORAGE_KEYS.ASSIGNMENTS, []);
    const idx = asgns.findIndex((a) => a.award_id === awardId && a.award_year_id === yearId && a.evaluator_id === evaluatorId);
    if (idx !== -1) {
      asgns[idx].division = division;
      setStorage(STORAGE_KEYS.ASSIGNMENTS, asgns);
    }
  },
  unassignEvaluator: (awardId: string, yearId: string, evaluatorId: string): void => {
    const asgns = getStorage<EvaluatorAssignment[]>(STORAGE_KEYS.ASSIGNMENTS, []).filter(
      (a) => !(a.award_id === awardId && a.award_year_id === yearId && a.evaluator_id === evaluatorId)
    );
    setStorage(STORAGE_KEYS.ASSIGNMENTS, asgns);
    const currentAwards = asgns.filter((a) => a.evaluator_id === evaluatorId && a.award_year_id === yearId).map((a) => a.award_id);
    localDB.saveAssignmentsToCloud([evaluatorId], currentAwards).catch(() => {});
  },
  setEvaluatorCategories: (evaluatorId: string, awardIds: string[], yearId: string = 'year-2026'): void => {
    let asgns = getStorage<EvaluatorAssignment[]>(STORAGE_KEYS.ASSIGNMENTS, []);
    // Remove all assignments for this evaluator and year
    asgns = asgns.filter((a) => !(a.evaluator_id === evaluatorId && a.award_year_id === yearId));
    // Add new ones
    awardIds.forEach((awardId) => {
      asgns.push({
        id: `asgn-${Date.now()}-${awardId}`,
        award_id: awardId,
        award_year_id: yearId,
        evaluator_id: evaluatorId,
        division: null,
        created_at: new Date().toISOString(),
      });
    });
    setStorage(STORAGE_KEYS.ASSIGNMENTS, asgns);
    localDB.saveAssignmentsToCloud([evaluatorId], awardIds).catch(() => {});
  },
  getAssignedAwardIds: (userId: string, userEmail?: string, yearId?: string): string[] => {
    const cloudMap = localDB.getCloudAssignments();
    const evals = localDB.getEvaluators();
    const profiles = localDB.getProfiles();

    const cleanEmail = (userEmail || '').trim().toLowerCase();
    const derivedUsername = cleanEmail.includes('@') ? cleanEmail.split('@')[0] : cleanEmail;

    const evaluator = evals.find(
      (e) =>
        (userId && (e.profile_id === userId || e.id === userId)) ||
        (cleanEmail && e.email && e.email.toLowerCase() === cleanEmail)
    );

    const profile = profiles.find(
      (p) =>
        (userId && p.id === userId) ||
        (cleanEmail && p.email && p.email.toLowerCase() === cleanEmail) ||
        (derivedUsername && p.username && p.username.toLowerCase() === derivedUsername)
    );

    // Kumpulkan semua kemungkinan kunci pengenalan pengguna ini secara komprehensif
    const candidateKeys = new Set(
      [
        userId,
        evaluator?.id,
        evaluator?.profile_id,
        cleanEmail,
        derivedUsername,
        profile?.id,
        profile?.username,
        profile?.email?.toLowerCase(),
      ].filter(Boolean) as string[]
    );

    const resultAwardIds = new Set<string>();

    // 1. Semak padanan dalam cloudMap (Supabase system_settings sync)
    candidateKeys.forEach((key) => {
      const lowerKey = key.toLowerCase();
      if (cloudMap[lowerKey] && Array.isArray(cloudMap[lowerKey])) {
        cloudMap[lowerKey].forEach((id) => resultAwardIds.add(id));
      }
      if (cloudMap[key] && Array.isArray(cloudMap[key])) {
        cloudMap[key].forEach((id) => resultAwardIds.add(id));
      }
    });

    // 2. Semak padanan dalam kkbda_assignments (localStorage)
    const asgns = getStorage<EvaluatorAssignment[]>(STORAGE_KEYS.ASSIGNMENTS, getInitialAssignments());
    asgns.forEach((a) => {
      if (!yearId || a.award_year_id === yearId) {
        const asgnEvalLower = (a.evaluator_id || '').toLowerCase();
        for (const k of candidateKeys) {
          if (k.toLowerCase() === asgnEvalLower) {
            resultAwardIds.add(a.award_id);
            break;
          }
        }
      }
    });

    return Array.from(resultAwardIds);
  },
  getEvaluatorAssignment: (userId: string, userEmail: string | undefined, awardId: string, yearId: string): EvaluatorAssignment | null => {
    const evals = localDB.getEvaluators();
    const cleanEmail = (userEmail || '').trim().toLowerCase();
    const derivedUsername = cleanEmail.includes('@') ? cleanEmail.split('@')[0] : cleanEmail;
    const evaluator = evals.find(
      (e) =>
        (userId && (e.profile_id === userId || e.id === userId)) ||
        (cleanEmail && e.email && e.email.toLowerCase() === cleanEmail)
    );
    const candidateKeys = new Set(
      [userId, evaluator?.id, evaluator?.profile_id, cleanEmail, derivedUsername].filter(Boolean) as string[]
    );
    const asgns = getStorage<EvaluatorAssignment[]>(STORAGE_KEYS.ASSIGNMENTS, getInitialAssignments());
    for (const a of asgns) {
      if (a.award_id === awardId && (!yearId || a.award_year_id === yearId)) {
        const asgnEvalLower = (a.evaluator_id || '').toLowerCase();
        for (const k of candidateKeys) {
          if (k.toLowerCase() === asgnEvalLower) {
            return a;
          }
        }
      }
    }
    return null;
  },

  // CANDIDATES & AGGREGATES
  getCandidates: (awardId?: string, yearId?: string, panelId?: string): (PanelCandidate & { evaluations?: Evaluation[] })[] => {
    let cands = getStorage<PanelCandidate[]>(STORAGE_KEYS.CANDIDATES, []);
    const evals = getStorage<Evaluation[]>(STORAGE_KEYS.EVALUATIONS, []);
    if (awardId) cands = cands.filter((c) => c.award_id === awardId);
    if (yearId) cands = cands.filter((c) => c.award_year_id === yearId);
    if (panelId) cands = cands.filter((c) => c.panel_id === panelId || c.created_by === panelId);

    return cands.map((c) => ({
      ...c,
      evaluations: evals.filter((e) => e.panel_candidate_id === c.id),
    }));
  },
  createCandidate: (candidate: Omit<PanelCandidate, 'id' | 'created_at' | 'updated_at'>): PanelCandidate => {
    const cands = getStorage<PanelCandidate[]>(STORAGE_KEYS.CANDIDATES, []);
    const newCand: PanelCandidate = {
      ...candidate,
      id: `cand-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    cands.push(newCand);
    setStorage(STORAGE_KEYS.CANDIDATES, cands);

    // Initialise draft evaluation
    const evals = getStorage<Evaluation[]>(STORAGE_KEYS.EVALUATIONS, []);
    evals.push({
      id: `eval-${Date.now()}`,
      panel_candidate_id: newCand.id,
      panel_id: newCand.panel_id,
      award_id: newCand.award_id,
      award_year_id: newCand.award_year_id,
      total_score: null,
      status: 'draft',
      submitted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setStorage(STORAGE_KEYS.EVALUATIONS, evals);

    return newCand;
  },
  getCandidateById: (id: string): PanelCandidate | null => {
    const cands = getStorage<PanelCandidate[]>(STORAGE_KEYS.CANDIDATES, []);
    return cands.find((c) => c.id === id) || null;
  },
  getEvaluation: (candidateId: string, panelId?: string): (Evaluation & { scores: (EvaluationScore & { award_item?: AwardItem })[] }) | null => {
    const evals = getStorage<Evaluation[]>(STORAGE_KEYS.EVALUATIONS, []);
    const scores = getStorage<EvaluationScore[]>(STORAGE_KEYS.SCORES, []);
    const items = getStorage<AwardItem[]>(STORAGE_KEYS.ITEMS, []);
    const itemMap = new Map(items.map((i) => [i.id, i]));

    const ev = evals.find((e) => e.panel_candidate_id === candidateId && (!panelId || e.panel_id === panelId));
    if (!ev) return null;

    const evalScores = scores
      .filter((s) => s.evaluation_id === ev.id)
      .map((s) => ({
        ...s,
        award_item: itemMap.get(s.award_item_id),
      }));

    return {
      ...ev,
      scores: evalScores,
    };
  },
  saveEvaluationScores: (
    evaluationId: string,
    itemScores: { award_item_id: string; score: number; raw_score?: number | null; max_score: number }[],
    comments?: string | null
  ): void => {
    let scores = getStorage<EvaluationScore[]>(STORAGE_KEYS.SCORES, []);
    for (const item of itemScores) {
      const idx = scores.findIndex((s) => s.evaluation_id === evaluationId && s.award_item_id === item.award_item_id);
      if (idx !== -1) {
        scores[idx].score = item.score;
        if (item.raw_score !== undefined) scores[idx].raw_score = item.raw_score;
        scores[idx].updated_at = new Date().toISOString();
      } else {
        scores.push({
          id: `score-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          evaluation_id: evaluationId,
          award_item_id: item.award_item_id,
          score: item.score,
          raw_score: item.raw_score ?? null,
          max_score: item.max_score,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }
    setStorage(STORAGE_KEYS.SCORES, scores);

    // Update total score in evaluation
    const evals = getStorage<Evaluation[]>(STORAGE_KEYS.EVALUATIONS, []);
    const evIdx = evals.findIndex((e) => e.id === evaluationId);
    if (evIdx !== -1) {
      const total = itemScores.reduce((sum, i) => sum + (i.score || 0), 0);
      evals[evIdx].total_score = total;
      if (comments !== undefined) evals[evIdx].comments = comments;
      evals[evIdx].updated_at = new Date().toISOString();
      setStorage(STORAGE_KEYS.EVALUATIONS, evals);
    }
  },
  submitEvaluation: (params: {
    evaluationId: string;
    candidateId: string;
    awardId: string;
    yearId: string;
    totalScore: number;
    candidateName: string;
    staffNumber?: string | null;
    division: string;
    comments?: string | null;
  }): void => {
    const evals = getStorage<Evaluation[]>(STORAGE_KEYS.EVALUATIONS, []);
    const evIdx = evals.findIndex((e) => e.id === params.evaluationId);
    if (evIdx !== -1) {
      evals[evIdx].status = 'submitted';
      evals[evIdx].total_score = params.totalScore;
      if (params.comments !== undefined) evals[evIdx].comments = params.comments;
      evals[evIdx].submitted_at = new Date().toISOString();
      setStorage(STORAGE_KEYS.EVALUATIONS, evals);
    }

    // Update Candidate Aggregates
    const aggs = getStorage<CandidateAggregate[]>(STORAGE_KEYS.AGGREGATES, []);
    const identifier = params.staffNumber || `${params.candidateName.toLowerCase().trim()}|${params.division.toLowerCase().trim()}`;
    const aggIdx = aggs.findIndex((a) => a.award_id === params.awardId && a.award_year_id === params.yearId && a.candidate_identifier === identifier);

    if (aggIdx !== -1) {
      const currentScores = (aggs[aggIdx].individual_scores || []) as number[];
      const newScores = [...currentScores, params.totalScore];
      const newTotal = newScores.reduce((a, b) => a + b, 0);
      aggs[aggIdx].score_count = newScores.length;
      aggs[aggIdx].total_score = newTotal;
      aggs[aggIdx].average_score = parseFloat((newTotal / newScores.length).toFixed(2));
      aggs[aggIdx].individual_scores = newScores;
      aggs[aggIdx].updated_at = new Date().toISOString();
    } else {
      aggs.push({
        id: `agg-${Date.now()}`,
        award_id: params.awardId,
        award_year_id: params.yearId,
        candidate_identifier: identifier,
        candidate_name: params.candidateName,
        staff_number: params.staffNumber || null,
        division: params.division,
        score_count: 1,
        total_score: params.totalScore,
        average_score: parseFloat(params.totalScore.toFixed(2)),
        individual_scores: [params.totalScore],
        updated_at: new Date().toISOString(),
      });
    }
    setStorage(STORAGE_KEYS.AGGREGATES, aggs);
  },

  // CANDIDATE AGGREGATES
  getAggregates: (awardId?: string, yearId?: string): (CandidateAggregate & { award?: Award })[] => {
    let aggs = getStorage<CandidateAggregate[]>(STORAGE_KEYS.AGGREGATES, []);
    const awards = localDB.getAwards();
    const awardMap = new Map(awards.map((a) => [a.id, a]));

    if (awardId) aggs = aggs.filter((a) => a.award_id === awardId);
    if (yearId) aggs = aggs.filter((a) => a.award_year_id === yearId);

    return aggs.map((a) => ({
      ...a,
      award: awardMap.get(a.award_id) || {
        id: a.award_id,
        name: 'Kategori Anugerah',
        description: null,
        sort_order: 1,
        is_active: true,
        max_candidates: 1,
        created_at: '',
        updated_at: '',
      },
    }));
  },

  // MANAGEMENT SELECTIONS
  getManagementSelections: (awardId?: string, yearId?: string): ManagementSelection[] => {
    let sels = getStorage<ManagementSelection[]>(STORAGE_KEYS.MGMT_SELECTIONS, []);
    if (awardId) sels = sels.filter((s) => s.award_id === awardId);
    if (yearId) sels = sels.filter((s) => s.award_year_id === yearId);
    return sels;
  },
  toggleManagementSelection: (params: { candidateAggregateId: string; awardId: string; yearId: string; selected: boolean; userId: string }): void => {
    const sels = getStorage<ManagementSelection[]>(STORAGE_KEYS.MGMT_SELECTIONS, []);
    const idx = sels.findIndex((s) => s.candidate_aggregate_id === params.candidateAggregateId && s.award_id === params.awardId && s.award_year_id === params.yearId);
    if (idx !== -1) {
      sels[idx].selected = params.selected;
      sels[idx].selected_by = params.userId;
      sels[idx].selected_at = new Date().toISOString();
    } else {
      sels.push({
        id: `ms-${Date.now()}`,
        award_id: params.awardId,
        award_year_id: params.yearId,
        candidate_aggregate_id: params.candidateAggregateId,
        selected: params.selected,
        selected_by: params.userId,
        selected_at: new Date().toISOString(),
      });
    }
    setStorage(STORAGE_KEYS.MGMT_SELECTIONS, sels);
  },

  // DIRECTOR SELECTIONS
  getDirectorSelections: (awardId?: string, yearId?: string): DirectorSelection[] => {
    let sels = getStorage<DirectorSelection[]>(STORAGE_KEYS.DIR_SELECTIONS, []);
    if (awardId) sels = sels.filter((s) => s.award_id === awardId);
    if (yearId) sels = sels.filter((s) => s.award_year_id === yearId);
    return sels;
  },
  toggleDirectorSelection: (params: { candidateAggregateId: string; awardId: string; yearId: string; selected: boolean; note?: string; userId: string }): void => {
    const sels = getStorage<DirectorSelection[]>(STORAGE_KEYS.DIR_SELECTIONS, []);
    const idx = sels.findIndex((s) => s.candidate_aggregate_id === params.candidateAggregateId && s.award_id === params.awardId && s.award_year_id === params.yearId);
    if (idx !== -1) {
      sels[idx].selected = params.selected;
      sels[idx].director_note = params.note || null;
      sels[idx].selected_by = params.userId;
      sels[idx].selected_at = new Date().toISOString();
    } else {
      sels.push({
        id: `ds-${Date.now()}`,
        award_id: params.awardId,
        award_year_id: params.yearId,
        candidate_aggregate_id: params.candidateAggregateId,
        selected: params.selected,
        director_note: params.note || null,
        selected_by: params.userId,
        selected_at: new Date().toISOString(),
      });
    }
    setStorage(STORAGE_KEYS.DIR_SELECTIONS, sels);
  },

  // USER PROFILES & ROLES (MULTI-ROLE & PRODUCTION MANAGEMENT)
  getProfiles: (): Profile[] => {
    return getStorage<Profile[]>(STORAGE_KEYS.PROFILES, []);
  },
  saveProfile: (prof: Profile): void => {
    const profiles = getStorage<Profile[]>(STORAGE_KEYS.PROFILES, []);
    const idx = profiles.findIndex((p) => p.id === prof.id || p.email.toLowerCase() === prof.email.toLowerCase());
    if (idx >= 0) {
      profiles[idx] = { ...profiles[idx], ...prof };
    } else {
      profiles.push(prof);
    }
    setStorage(STORAGE_KEYS.PROFILES, profiles);
  },
  getUserRoles: (userId: string): UserRole[] => {
    const allRoles = getStorage<UserRoleRecord[]>(STORAGE_KEYS.USER_ROLES, []);
    return allRoles.filter((r) => r.user_id === userId).map((r) => r.role);
  },
  setUserRoles: (userId: string, roles: UserRole[]): void => {
    const allRoles = getStorage<UserRoleRecord[]>(STORAGE_KEYS.USER_ROLES, []);
    const filtered = allRoles.filter((r) => r.user_id !== userId);
    roles.forEach((role) => {
      filtered.push({
        id: `ur-${Date.now()}-${role}`,
        user_id: userId,
        role,
        created_at: new Date().toISOString(),
      });
    });
    setStorage(STORAGE_KEYS.USER_ROLES, filtered);

    // Also synchronize profile record roles
    const profiles = getStorage<Profile[]>(STORAGE_KEYS.PROFILES, []);
    const pIdx = profiles.findIndex((p) => p.id === userId);
    if (pIdx >= 0) {
      profiles[pIdx].roles = roles;
      if (roles.length > 0) profiles[pIdx].role = roles[0];
      setStorage(STORAGE_KEYS.PROFILES, profiles);
    }
  },

  // CANDIDATE SAFE DELETION
  deleteCandidate: (
    candidateId: string,
    deletedByUserId: string,
    deletedByRole: UserRole,
    userName?: string
  ): { success: boolean; error?: string } => {
    const cands = getStorage<PanelCandidate[]>(STORAGE_KEYS.CANDIDATES, []);
    const cand = cands.find((c) => c.id === candidateId);
    if (!cand) return { success: false, error: 'Calon tidak dijumpai.' };

    // Permission check
    if (deletedByRole === 'admin') {
      // Allowed for all
    } else if (deletedByRole === 'panel') {
      if (cand.created_by !== deletedByUserId && cand.panel_id !== deletedByUserId) {
        return { success: false, error: 'Anda hanya dibenarkan memadam calon yang anda masukkan sendiri.' };
      }
    } else {
      return { success: false, error: 'Peranan ini tidak dibenarkan memadam calon.' };
    }

    // 1. Remove candidate
    const remainingCands = cands.filter((c) => c.id !== candidateId);
    setStorage(STORAGE_KEYS.CANDIDATES, remainingCands);

    // 2. Remove evaluations belonging to candidate
    const evals = getStorage<Evaluation[]>(STORAGE_KEYS.EVALUATIONS, []);
    const candEvals = evals.filter((e) => e.panel_candidate_id === candidateId);
    const candEvalIds = new Set(candEvals.map((e) => e.id));
    const remainingEvals = evals.filter((e) => e.panel_candidate_id !== candidateId);
    setStorage(STORAGE_KEYS.EVALUATIONS, remainingEvals);

    // 3. Remove evaluation scores
    const scores = getStorage<EvaluationScore[]>(STORAGE_KEYS.SCORES, []);
    const remainingScores = scores.filter((s) => !candEvalIds.has(s.evaluation_id));
    setStorage(STORAGE_KEYS.SCORES, remainingScores);

    // 4. Update or remove CandidateAggregate safely
    const aggs = getStorage<CandidateAggregate[]>(STORAGE_KEYS.AGGREGATES, []);
    const identifier = cand.staff_number || `${cand.candidate_name.toLowerCase().trim()}|${cand.division.toLowerCase().trim()}`;
    const aggIdx = aggs.findIndex(
      (a) => a.award_id === cand.award_id && a.award_year_id === cand.award_year_id && a.candidate_identifier === identifier
    );

    if (aggIdx !== -1) {
      const aggId = aggs[aggIdx].id;
      const otherSameCandidates = remainingCands.filter(
        (c) =>
          c.award_id === cand.award_id &&
          c.award_year_id === cand.award_year_id &&
          (c.staff_number || `${c.candidate_name.toLowerCase().trim()}|${c.division.toLowerCase().trim()}`) === identifier
      );

      if (otherSameCandidates.length === 0) {
        aggs.splice(aggIdx, 1);
        setStorage(STORAGE_KEYS.AGGREGATES, aggs);

        // Safe cascade cleanup for this aggregate
        const mgmts = getStorage<ManagementSelection[]>(STORAGE_KEYS.MGMT_SELECTIONS, []);
        setStorage(STORAGE_KEYS.MGMT_SELECTIONS, mgmts.filter((m) => m.candidate_aggregate_id !== aggId));

        const dirs = getStorage<DirectorSelection[]>(STORAGE_KEYS.DIR_SELECTIONS, []);
        setStorage(STORAGE_KEYS.DIR_SELECTIONS, dirs.filter((d) => d.candidate_aggregate_id !== aggId));

        const finals = getStorage<FinalResult[]>(STORAGE_KEYS.FINAL_RESULTS, []);
        setStorage(STORAGE_KEYS.FINAL_RESULTS, finals.filter((f) => f.candidate_aggregate_id !== aggId));
      } else {
        const remainingCandidateIds = new Set(otherSameCandidates.map((c) => c.id));
        const activeEvals = remainingEvals.filter(
          (e) => remainingCandidateIds.has(e.panel_candidate_id) && e.status === 'submitted' && e.total_score !== null
        );
        const activeScores = activeEvals.map((e) => e.total_score as number);
        const newTotal = activeScores.reduce((a, b) => a + b, 0);

        aggs[aggIdx].score_count = activeScores.length;
        aggs[aggIdx].total_score = newTotal;
        aggs[aggIdx].average_score = activeScores.length > 0 ? parseFloat((newTotal / activeScores.length).toFixed(2)) : 0;
        aggs[aggIdx].individual_scores = activeScores;
        aggs[aggIdx].updated_at = new Date().toISOString();
        setStorage(STORAGE_KEYS.AGGREGATES, aggs);
      }
    }

    // 5. Log audit trail
    localDB.logAudit({
      userId: deletedByUserId,
      userName: userName || 'Pengguna',
      activeRole: deletedByRole,
      action: 'Padam Calon',
      details: `Memadam calon: ${cand.candidate_name} (${cand.division})`,
      entityType: 'candidate',
      entityId: candidateId,
    });

    return { success: true };
  },

  // TEST / DUMMY DATA MANAGEMENT
  setCandidateDummyStatus: (candidateId: string, isDummy: boolean): void => {
    const cands = getStorage<PanelCandidate[]>(STORAGE_KEYS.CANDIDATES, []);
    const idx = cands.findIndex((c) => c.id === candidateId);
    if (idx !== -1) {
      cands[idx].is_dummy = isDummy;
      setStorage(STORAGE_KEYS.CANDIDATES, cands);
    }
  },
  setEvaluationDummyStatus: (evaluationId: string, isDummy: boolean): void => {
    const evals = getStorage<Evaluation[]>(STORAGE_KEYS.EVALUATIONS, []);
    const idx = evals.findIndex((e) => e.id === evaluationId);
    if (idx !== -1) {
      evals[idx].is_dummy = isDummy;
      setStorage(STORAGE_KEYS.EVALUATIONS, evals);
    }
  },
  deleteDummyCandidates: (
    candidateIds: string[],
    deletedByUserId: string,
    deletedByRole: UserRole,
    userName?: string
  ): { success: boolean; deletedCount: number } => {
    let count = 0;
    for (const id of candidateIds) {
      const res = localDB.deleteCandidate(id, deletedByUserId, deletedByRole, userName);
      if (res.success) count++;
    }
    return { success: true, deletedCount: count };
  },
  deleteDummyScores: (
    evaluationIds: string[],
    deletedByUserId: string,
    deletedByRole: UserRole,
    userName?: string
  ): { success: boolean; deletedCount: number } => {
    if (deletedByRole !== 'admin') {
      return { success: false, deletedCount: 0 };
    }
    const evals = getStorage<Evaluation[]>(STORAGE_KEYS.EVALUATIONS, []);
    const scores = getStorage<EvaluationScore[]>(STORAGE_KEYS.SCORES, []);
    const evalIdSet = new Set(evaluationIds);

    const remainingEvals = evals.filter((e) => !evalIdSet.has(e.id));
    const remainingScores = scores.filter((s) => !evalIdSet.has(s.evaluation_id));

    setStorage(STORAGE_KEYS.EVALUATIONS, remainingEvals);
    setStorage(STORAGE_KEYS.SCORES, remainingScores);

    localDB.logAudit({
      userId: deletedByUserId,
      userName: userName || 'Urusetia',
      activeRole: deletedByRole,
      action: 'Padam Markah Ujian',
      details: `Memadam ${evaluationIds.length} rekod markah/penilaian ujian`,
      entityType: 'evaluation',
    });

    return { success: true, deletedCount: evaluationIds.length };
  },

  // AUDIT LOGS
  getAuditLogs: (): AuditLog[] => {
    return getStorage<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  },
  logAudit: (log: {
    userId?: string | null;
    userName: string;
    activeRole: string;
    action: string;
    details?: string | null;
    entityType?: string | null;
    entityId?: string | null;
  }): void => {
    const logs = getStorage<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
    logs.unshift({
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      user_id: log.userId || null,
      user_name: log.userName,
      user_role: log.activeRole,
      action: log.action,
      details: log.details || null,
      entity_type: log.entityType || null,
      entity_id: log.entityId || null,
      created_at: new Date().toISOString(),
    });
    setStorage(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 500));
  },

  // EVALUATOR / ACCOUNT DUMMY MANAGEMENT
  setEvaluatorDummyStatus: (evaluatorId: string, isDummy: boolean): void => {
    const evals = getStorage<Evaluator[]>(STORAGE_KEYS.EVALUATORS, []);
    const idx = evals.findIndex((e) => e.id === evaluatorId);
    if (idx !== -1) {
      evals[idx].is_dummy = isDummy;
      setStorage(STORAGE_KEYS.EVALUATORS, evals);
    }
  },
  getEvaluatorStats: (evaluatorId: string): {
    nominationsCount: number;
    evaluationsCount: number;
    scoresCount: number;
    assignmentsCount: number;
  } => {
    const cands = getStorage<PanelCandidate[]>(STORAGE_KEYS.CANDIDATES, []);
    const evals = getStorage<Evaluation[]>(STORAGE_KEYS.EVALUATIONS, []);
    const scores = getStorage<EvaluationScore[]>(STORAGE_KEYS.SCORES, []);
    const asgns = getStorage<EvaluatorAssignment[]>(STORAGE_KEYS.ASSIGNMENTS, []);

    const evaluator = localDB.getEvaluators().find((e) => e.id === evaluatorId);
    const idSet = new Set<string>([evaluatorId]);
    if (evaluator?.profile_id) idSet.add(evaluator.profile_id);

    const myCands = cands.filter((c) => idSet.has(c.panel_id) || (c.created_by && idSet.has(c.created_by)));
    const myEvals = evals.filter((e) => idSet.has(e.panel_id));
    const evalIdSet = new Set(myEvals.map((e) => e.id));
    const myScores = scores.filter((s) => evalIdSet.has(s.evaluation_id));
    const myAsgns = asgns.filter((a) => a.evaluator_id === evaluatorId);

    return {
      nominationsCount: myCands.length,
      evaluationsCount: myEvals.length,
      scoresCount: myScores.length,
      assignmentsCount: myAsgns.length,
    };
  },
  deleteEvaluatorAccount: (
    evaluatorId: string,
    deletedByUserId: string,
    deletedByRole: UserRole,
    userName?: string
  ): { success: boolean; error?: string } => {
    if (deletedByRole !== 'admin') {
      return { success: false, error: 'Hanya Urusetia dibenarkan memadam akaun ujian.' };
    }
    const evals = localDB.getEvaluators();
    const targetEval = evals.find((e) => e.id === evaluatorId);
    if (!targetEval) return { success: false, error: 'Akaun panel tidak dijumpai.' };

    // 1. Remove assignments
    const asgns = getStorage<EvaluatorAssignment[]>(STORAGE_KEYS.ASSIGNMENTS, []);
    setStorage(STORAGE_KEYS.ASSIGNMENTS, asgns.filter((a) => a.evaluator_id !== evaluatorId));

    // 2. Remove evaluations & scores
    const idSet = new Set<string>([evaluatorId]);
    if (targetEval.profile_id) idSet.add(targetEval.profile_id);

    const allEvals = getStorage<Evaluation[]>(STORAGE_KEYS.EVALUATIONS, []);
    const evalsToDelete = allEvals.filter((e) => idSet.has(e.panel_id));
    const evalIdsToDelete = new Set(evalsToDelete.map((e) => e.id));
    setStorage(STORAGE_KEYS.EVALUATIONS, allEvals.filter((e) => !idSet.has(e.panel_id)));

    const allScores = getStorage<EvaluationScore[]>(STORAGE_KEYS.SCORES, []);
    setStorage(STORAGE_KEYS.SCORES, allScores.filter((s) => !evalIdsToDelete.has(s.evaluation_id)));

    // 3. Remove from evaluators list
    setStorage(STORAGE_KEYS.EVALUATORS, evals.filter((e) => e.id !== evaluatorId));

    // 4. Log audit
    localDB.logAudit({
      userId: deletedByUserId,
      userName: userName || 'Urusetia',
      activeRole: deletedByRole,
      action: 'Padam Akaun Ujian',
      details: `Memadam akaun panel ujian: ${targetEval.name} (${targetEval.email})`,
      entityType: 'evaluator',
      entityId: evaluatorId,
    });

    return { success: true };
  },
};
