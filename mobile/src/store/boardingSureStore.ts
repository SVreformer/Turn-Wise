import { create } from 'zustand';
import {
  boardingSureService,
  BoardingSureAssessment,
  BoardingSureInput,
  RiskLevel
} from '../services/boardingSureService';
import { useNavigationStore } from './navigationStore';
import { useBlockageStore } from './blockageStore';
import { KSR_TRAIN_DATABASE } from '../services/localRouter';

interface BoardingSureState {
  // Train & coach selection
  trainNumber: string;
  trainName: string;
  platformNumber: number;
  coachNumber: string;

  // Passenger context
  startNodeId: string;
  profileId: string;

  // Time budget parameters
  departureTime: string; // HH:MM or ISO
  availableMinutesOverride: number; // e.g. 20m default simulation slider
  isSimulatingTime: boolean;
  bufferMinutes: number;

  // Assessment results
  assessment: BoardingSureAssessment | null;
  isEvaluating: boolean;
  error: string | null;

  // Actions
  setTrain: (trainNumber: string) => void;
  setCoach: (coachNumber: string) => void;
  setStartNode: (nodeId: string) => void;
  setProfile: (profileId: string) => void;
  setAvailableMinutes: (minutes: number) => void;
  setDepartureTime: (time: string) => void;
  setBufferMinutes: (buffer: number) => void;
  recalculateRisk: () => BoardingSureAssessment | null;
  applyAssessmentToNavigation: () => void;
}

export const useBoardingSureStore = create<BoardingSureState>((set, get) => {
  const initialTrainNo = '12658';
  const initialTrain = KSR_TRAIN_DATABASE[initialTrainNo] || {
    trainNumber: initialTrainNo,
    trainName: 'Bengaluru - Chennai Central Mail',
    platformNumber: 1,
    coaches: ['B4']
  };

  const initialProfile = useNavigationStore.getState().selectedProfile || 'first_time';
  const initialStartNode = useNavigationStore.getState().startNode?.id || 'node_entry_t1_main_east';

  return {
    trainNumber: initialTrain.trainNumber,
    trainName: initialTrain.trainName,
    platformNumber: initialTrain.platformNumber,
    coachNumber: 'B4',

    startNodeId: initialStartNode,
    profileId: initialProfile,

    departureTime: '21:30',
    availableMinutesOverride: 20,
    isSimulatingTime: true,
    bufferMinutes: 3.0,

    assessment: null,
    isEvaluating: false,
    error: null,

    setTrain: (trainNumber: string) => {
      const train = KSR_TRAIN_DATABASE[trainNumber];
      if (train) {
        set({
          trainNumber,
          trainName: train.trainName,
          platformNumber: train.platformNumber,
          coachNumber: train.coaches.includes(get().coachNumber) ? get().coachNumber : (train.coaches[4] || 'B4')
        });
      } else {
        set({ trainNumber });
      }
      get().recalculateRisk();
    },

    setCoach: (coachNumber: string) => {
      set({ coachNumber: coachNumber.trim().toUpperCase() });
      get().recalculateRisk();
    },

    setStartNode: (nodeId: string) => {
      set({ startNodeId: nodeId });
      get().recalculateRisk();
    },

    setProfile: (profileId: string) => {
      set({ profileId });
      // Keep navigation store in sync
      useNavigationStore.getState().setProfile(profileId);
      get().recalculateRisk();
    },

    setAvailableMinutes: (minutes: number) => {
      set({ availableMinutesOverride: Math.max(1, Math.min(120, minutes)), isSimulatingTime: true });
      get().recalculateRisk();
    },

    setDepartureTime: (time: string) => {
      set({ departureTime: time, isSimulatingTime: false });
      get().recalculateRisk();
    },

    setBufferMinutes: (buffer: number) => {
      set({ bufferMinutes: Math.max(0, buffer) });
      get().recalculateRisk();
    },

    recalculateRisk: () => {
      const state = get();
      set({ isEvaluating: true, error: null });

      try {
        const input: BoardingSureInput = {
          trainNumber: state.trainNumber,
          trainName: state.trainName,
          platformNumber: state.platformNumber,
          coachNumber: state.coachNumber,
          startNodeId: state.startNodeId,
          profileId: state.profileId,
          availableMinutesOverride: state.isSimulatingTime ? state.availableMinutesOverride : undefined,
          departureTime: state.isSimulatingTime ? undefined : state.departureTime,
          config: {
            boardingBufferMinutes: state.bufferMinutes
          }
        };

        const result = boardingSureService.evaluate(input);
        set({ assessment: result, isEvaluating: false });
        return result;
      } catch (err: any) {
        set({ isEvaluating: false, error: err?.message || 'Calculation error' });
        return null;
      }
    },

    applyAssessmentToNavigation: () => {
      const assessment = get().assessment;
      if (!assessment || !assessment.route) return;

      const navStore = useNavigationStore.getState();
      if (assessment.startNode) {
        navStore.setStartNode(assessment.startNode, 'SEARCH');
      }
      if (assessment.destinationNode) {
        navStore.setDestinationNode(assessment.destinationNode, 'SEARCH');
      }
      navStore.startNavigation(assessment.route);
    }
  };
});

// Real-time listener: Re-calculate risk whenever facility blockages or incidents change!
useBlockageStore.subscribe(() => {
  const store = useBoardingSureStore.getState();
  if (store.assessment) {
    store.recalculateRisk();
  }
});

