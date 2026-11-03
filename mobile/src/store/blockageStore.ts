import { create } from 'zustand';
import { apiService } from '../services/apiService';
import { useNavigationStore } from './navigationStore';
import { IncidentReport } from '../services/localRouter';

interface BlockageState {
  statuses: Record<string, string>;
  incidentReports: IncidentReport[];
  toggleBlockage: (facilityId: string) => Promise<void>;
  reportIncident: (
    facilityOrLocationId: string,
    type: 'OUT_OF_SERVICE' | 'OVERCROWDED' | 'MAINTENANCE' | 'SLIPPERY',
    reporterRole?: 'STAFF' | 'PASSENGER',
    description?: string
  ) => Promise<void>;
  resetAll: () => Promise<void>;
  isBlocked: (facilityId: string) => boolean;
}

const initialStatuses: Record<string, string> = {
  lift_1: 'OPEN',
  lift_2: 'OPEN',
  lift_3: 'OPEN',
  ramp_1: 'OPEN',
  ramp_2: 'OPEN',
  ramp_3: 'OPEN',
  vc_edge_lift1: 'OPEN',
  vc_edge_lift2: 'OPEN',
  vc_edge_lift3: 'OPEN'
};

export const useBlockageStore = create<BlockageState>((set, get) => ({
  statuses: { ...initialStatuses },
  incidentReports: [],

  toggleBlockage: async (facilityId: string) => {
    const current = get().statuses[facilityId] || 'OPEN';
    const nextStatus = current === 'OPEN' ? 'BLOCKED' : 'OPEN';

    const updated = { ...get().statuses, [facilityId]: nextStatus };
    set({ statuses: updated });

    await apiService.updateStatus(facilityId, nextStatus);

    if (nextStatus === 'BLOCKED') {
      const nav = useNavigationStore.getState();
      if (nav.activeRoute) {
        await nav.triggerDynamicReroute(facilityId);
      }
    }
  },

  reportIncident: async (facilityOrLocationId, type, reporterRole = 'PASSENGER', description) => {
    const rep = await apiService.reportIncident(facilityOrLocationId, type, reporterRole, description);
    const updatedReports = [rep, ...get().incidentReports];
    set({ incidentReports: updatedReports });

    if (type === 'OUT_OF_SERVICE' || reporterRole === 'STAFF') {
      const updatedStatuses = { ...get().statuses, [facilityOrLocationId]: 'BLOCKED' };
      set({ statuses: updatedStatuses });

      const nav = useNavigationStore.getState();
      if (nav.activeRoute) {
        await nav.triggerDynamicReroute(facilityOrLocationId);
      }
    }
  },

  resetAll: async () => {
    const reset = { ...initialStatuses };
    set({ statuses: reset, incidentReports: [] });
    for (const k of Object.keys(reset)) {
      await apiService.updateStatus(k, 'OPEN');
    }
    useNavigationStore.getState().clearBlockageAlert();
  },

  isBlocked: (facilityId: string) => {
    return get().statuses[facilityId] === 'BLOCKED';
  }
}));
