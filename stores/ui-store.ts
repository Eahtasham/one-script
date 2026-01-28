import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type ModalType =
    | 'createOrganization'
    | 'inviteMember'
    | 'deleteConfirm'
    | 'settings'
    | null;

interface UIState {
    // Modal state
    activeModal: ModalType;
    modalData: Record<string, unknown> | undefined;

    // Loading states
    globalLoading: boolean;
    loadingMessage: string | undefined;

    // Actions
    openModal: (modal: ModalType, data?: Record<string, unknown>) => void;
    closeModal: () => void;
    setGlobalLoading: (loading: boolean, message?: string) => void;
}

export const useUIStore = create<UIState>()(
    devtools(
        (set) => ({
            // Initial state
            activeModal: null,
            modalData: undefined,
            globalLoading: false,
            loadingMessage: undefined,

            // Actions
            openModal: (activeModal, modalData = undefined) => set(
                { activeModal, modalData },
                false,
                'ui/openModal'
            ),
            closeModal: () => set(
                { activeModal: null, modalData: undefined },
                false,
                'ui/closeModal'
            ),
            setGlobalLoading: (globalLoading, loadingMessage = undefined) => set(
                { globalLoading, loadingMessage },
                false,
                'ui/setGlobalLoading'
            ),
        }),
        { name: 'ui-store' }
    )
);

// Selector hooks
export const useActiveModal = () => useUIStore((state) => state.activeModal);
export const useModalData = () => useUIStore((state) => state.modalData);
export const useGlobalLoading = () => useUIStore((state) => state.globalLoading);
