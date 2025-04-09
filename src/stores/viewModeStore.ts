import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ViewMode = 'laptop' | 'mobile';

interface ViewModeState {
  mode: ViewMode;
  toggleMode: () => void;
  setMode: (mode: ViewMode) => void;
}

const useViewModeStore = create<ViewModeState>()(
  persist(
    (set) => ({
      mode: 'laptop',
      toggleMode: () => set((state) => ({ 
        mode: state.mode === 'laptop' ? 'mobile' : 'laptop' 
      })),
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'view-mode-storage',
    }
  )
);

export default useViewModeStore;
