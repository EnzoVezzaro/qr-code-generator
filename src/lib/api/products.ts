import { supabase } from '../supabase';
import type { Product } from '../supabase';

export const productsApi = {
  // Get all products with their category and supplier information
  getAll: async () => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(name),
        supplier:suppliers(name)
      `)
      .order('name');
    
    if (error) throw error;
    return data;
  },

  // Get a single product by ID with its category and supplier information
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(name),
        supplier:suppliers(name)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get products by category
  getByCategory: async (categoryId: string) => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(name),
        supplier:suppliers(name)
      `)
      .eq('category_id', categoryId)
      .order('name');
    
    if (error) throw error;
    return data;
  },

  // Get products by supplier
  getBySupplier: async (supplierId: string) => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(name),
        supplier:suppliers(name)
      `)
      .eq('supplier_id', supplierId)
      .order('name');
    
    if (error) throw error;
    return data;
  },

  // Create a new product
  create: async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single();
    
    if (error) throw error;
    return data as Product;
  },

  // Update a product
  update: async (id: string, product: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>) => {
    const { data, error } = await supabase
      .from('products')
      .update(product)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Product;
  },

  // Delete a product
  delete: async (id: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Search products by name or SKU
  search: async (query: string) => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:categories(name),
        supplier:suppliers(name)
      `)
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
      .order('name');
    
    if (error) throw error;
    return data;
  }
}; 