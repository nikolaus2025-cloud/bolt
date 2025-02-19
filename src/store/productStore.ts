import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { ProductSettings } from '../types/database';

interface ProductStore {
  settings: ProductSettings | null;
  isLoading: boolean;
  error: string | null;
  fetchSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<ProductSettings>) => Promise<void>;
}

export const useProductStore = create<ProductStore>((set, get) => ({
  settings: null,
  isLoading: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('product_settings')
        .select('*')
        .single();

      if (error) throw error;
      set({ 
        settings: {
          ...data,
          additional_images: data.additional_images || [] 
        }, 
        isLoading: false 
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateSettings: async (newSettings: Partial<ProductSettings>) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('product_settings')
        .update(newSettings)
        .eq('id', get().settings?.id)
        .select()
        .single();

      if (error) throw error;
      set({ settings: data, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
}));