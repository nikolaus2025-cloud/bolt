export interface ProductSettings {
  id: string;
  title: string;
  description: string;
  price: number;
  discount: number;
  image_url: string;
  stock: number;
  sku: string | null;
  status: 'active' | 'inactive' | 'draft';
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  additional_images: string[];
}

export interface Database {
  public: {
    Tables: {
      product_settings: {
        Row: ProductSettings;
        Insert: Omit<ProductSettings, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ProductSettings, 'id' | 'created_at' | 'updated_at'>>;
      };
      // ... other tables
    };
  };
} 