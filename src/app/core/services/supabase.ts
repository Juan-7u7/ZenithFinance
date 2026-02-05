import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Supabase {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          flowType: 'pkce'
        }
      }
    );
    console.log('Supabase client initialized');
  }

  /**
   * Get the Supabase client instance
   */
  getClient(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Test database connection and RLS policies
   * This will attempt to read from a table to verify connectivity
   */
  async testConnection(): Promise<{
    success: boolean;
    message: string;
    data?: any;
    error?: any;
  }> {
    try {
      console.log('Testing Supabase connection...');
      
      // Intentar leer de una tabla (ajusta el nombre de la tabla según tu esquema)
      // Si no tienes tablas aún, esto fallará pero confirmará la conexión
      const { data, error } = await this.supabase
        .from('user_assets') // Changed from 'users' to a real table
        .select('*')
        .limit(1);

      if (error) {
        // Si el error es que la tabla no existe, aún así significa que la conexión funciona
        // 42P01 = PostgreSQL table does not exist
        // PGRST205 = PostgREST table not found in schema cache
        if (error.code === '42P01' || error.code === 'PGRST205') {
          console.warn('Table user_assets does not exist, check your SQL setup');
          return {
            success: true,
            message: 'Connection successful but table user_assets missing',
            error: error,
          };
        }

        console.error('Supabase connection test failed:', error);
        return {
          success: false,
          message: `Connection failed: ${error.message}`,
          error: error,
        };
      }

      console.log('Supabase connection test successful!', data);
      return {
        success: true,
        message: 'Connection and RLS verification successful',
        data: data,
      };
    } catch (err) {
      console.error('Unexpected error during connection test:', err);
      return {
        success: false,
        message: `Unexpected error: ${err}`,
        error: err,
      };
    }
  }
}
