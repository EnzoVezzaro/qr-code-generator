import { supabase } from '../supabase';
import type { Inventory, Product } from '../supabase';

export const inventoryApi = {
  // Get all inventory items with product information
  getAll: async () => {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        *,
        product:products(*)
      `)
      .order('product(name)');
    
    if (error) throw error;
    return data;
  },

  // Get inventory for a specific product
  getByProductId: async (productId: string) => {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        *,
        product:products(*)
      `)
      .eq('product_id', productId)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get low stock items (quantity below reorder level)
  getLowStock: async () => {
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        *,
        product:products(*)
      `)
      .lt('quantity', supabase.raw('reorder_level'))
      .order('quantity');
    
    if (error) throw error;
    return data;
  },

  // Update inventory quantity
  updateQuantity: async (productId: string, quantity: number) => {
    const { data, error } = await supabase
      .from('inventory')
      .update({ quantity })
      .eq('product_id', productId)
      .select()
      .single();
    
    if (error) throw error;
    return data as Inventory;
  },

  // Update reorder level
  updateReorderLevel: async (productId: string, reorderLevel: number) => {
    const { data, error } = await supabase
      .from('inventory')
      .update({ reorder_level: reorderLevel })
      .eq('product_id', productId)
      .select()
      .single();
    
    if (error) throw error;
    return data as Inventory;
  },

  // Add stock to inventory
  addStock: async (productId: string, quantity: number) => {
    const { data, error } = await supabase.rpc('add_stock', {
      p_product_id: productId,
      p_quantity: quantity
    });
    
    if (error) throw error;
    return data as Inventory;
  },

  // Remove stock from inventory
  removeStock: async (productId: string, quantity: number) => {
    const { data, error } = await supabase.rpc('remove_stock', {
      p_product_id: productId,
      p_quantity: quantity
    });
    
    if (error) throw error;
    return data as Inventory;
  },

  // Create new inventory item
  create: async (inventory: Omit<Inventory, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('inventory')
      .insert([inventory])
      .select()
      .single();
    
    if (error) throw error;
    return data as Inventory;
  },

  // Delete inventory item
  delete: async (productId: string) => {
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('product_id', productId);
    
    if (error) throw error;
  }
}; 