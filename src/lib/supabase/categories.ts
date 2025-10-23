import { supabase } from './client'

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: string
  updated_at: string
}

export class CategoriesAPI {
  /**
   * Get all categories
   */
  static async getCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error fetching categories:', error)
        throw error
      }

      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error in getCategories:', error)
      return { data: [], error }
    }
  }

  /**
   * Get category by slug
   */
  static async getCategoryBySlug(slug: string) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error) {
        console.error('Error fetching category:', error)
        throw error
      }

      return { data, error: null }
    } catch (error) {
      console.error('Error in getCategoryBySlug:', error)
      return { data: null, error }
    }
  }

  /**
   * Get categories with product counts
   */
  static async getCategoriesWithCounts() {
    try {
      // First get all categories
      const { data: categories, error: categoriesError } = await this.getCategories()

      if (categoriesError) {
        throw categoriesError
      }

      // Get product counts for each category
      const categoriesWithCounts = await Promise.all(
        categories.map(async (category) => {
          const { count, error: countError } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('category', category.slug)
            .eq('status', 'active')

          return {
            ...category,
            productCount: countError ? 0 : (count || 0)
          }
        })
      )

      return { data: categoriesWithCounts, error: null }
    } catch (error) {
      console.error('Error in getCategoriesWithCounts:', error)
      return { data: [], error }
    }
  }
}