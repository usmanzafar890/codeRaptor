import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OrganizationStore {
  organizationId: string | null;
  setOrganizationId: (id: string | null) => void;
}

export const useOrganization = create<OrganizationStore>()(
  persist(
    (set) => ({
      organizationId: null as string | null,
      setOrganizationId: (id: string | null) => set({ organizationId: id }),
    }),
    {
      name: 'organization-storage',
    }
  )
);
