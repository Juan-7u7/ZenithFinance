import { Injectable, signal } from '@angular/core';

export type Language = 'es' | 'en';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly LANG_KEY = 'app_lang';
  
  // State
  public currentLang = signal<Language>(this.getInitialLanguage());

  // Dictionary
  private translations: Record<Language, any> = {
    es: {
      auth: {
        login: 'Iniciar Sesión',
        register: 'Crear Cuenta',
        email: 'Correo Electrónico',
        password: 'Contraseña',
        forgot_password: '¿Olvidaste tu contraseña?',
        no_account: '¿No tienes cuenta?',
        have_account: '¿Ya tienes cuenta?',
        google_login: 'Continuar con Google',
        name: 'Nombre Completo',
        confirm_password: 'Confirmar Contraseña',
        error_login: 'Error al iniciar sesión',
        error_register: 'Error al registrarse',
        success_reset: 'Correo enviado con éxito'
      },
      dashboard: {
        welcome: 'Hola',
        total_balance: 'Balance Total',
        total_investment: 'Inversión Total',
        diversification: 'Diversificación',
        investments: 'Inversiones',
        assets: 'Activos',
        my_assets: 'Mis Activos',
        distribution: 'Distribución',
        history: 'Historial',
        history_title: 'Historial de Movimientos',
        no_history: 'No hay movimientos recientes.',
        add_asset: 'Agregar Activo',
        logout: 'Cerrar Sesión',
        performance: 'Rendimiento',
        quantity: 'Cantidad',
        value: 'Valor',
        price: 'Precio',
        empty_portfolio: 'No tienes activos aún.',
        start_investing: 'Comenzar a invertir',
        based_on: 'Basado en',
        buy: 'Compra',
        sell: 'Venta',
        update: 'Ajuste',
        delete: 'Eliminación'
      },
      profile: {
        title: 'Mi Perfil',
        subtitle: 'Gestiona tu información personal y cuenta',
        personal_info: 'Información Personal',
        account_stats: 'Estadísticas de la Cuenta',
        security: 'Seguridad y Preferencias',
        update_success: 'Perfil actualizado con éxito',
        joined: 'Miembro desde',
        save_changes: 'Guardar Cambios',
        change_password: 'Cambiar Contraseña',
        language: 'Idioma de la App',
        theme: 'Tema Visual',
        danger_zone: 'Zona de Peligro',
        delete_account: 'Eliminar Cuenta',
        security_score: 'Nivel de Seguridad',
        verified: 'Cuenta Verificada'
      },
      common: {
        loading: 'Cargando...',
        save: 'Guardar',
        cancel: 'Cancelar',
        delete: 'Eliminar',
        edit: 'Editar',
        search: 'Buscar',
        no_data: 'No hay datos',
        required: 'Requerido',
        invalid_email: 'Email inválido',
        min_length: 'Muy corto',
        password_pattern: 'Debe ser más compleja',
        password_mismatch: 'No coinciden',
        success: '¡Éxito!',
        error: 'Error',
        theme: 'Tema',
        language: 'Idioma',
        others: 'OTROS'
      }
    },
    en: {
      auth: {
        login: 'Login',
        register: 'Sign Up',
        email: 'Email Address',
        password: 'Password',
        forgot_password: 'Forgot password?',
        no_account: "No account?",
        have_account: 'Have an account?',
        google_login: 'Continue with Google',
        name: 'Full Name',
        confirm_password: 'Confirm Password',
        error_login: 'Login error',
        error_register: 'Sign up error',
        success_reset: 'Email sent'
      },
      dashboard: {
        welcome: 'Hello',
        total_balance: 'Total Balance',
        total_investment: 'Total Investment',
        diversification: 'Diversification',
        investments: 'Investments',
        assets: 'Assets',
        my_assets: 'My Assets',
        distribution: 'Distribution',
        history: 'History',
        history_title: 'Transaction History',
        no_history: 'No recent transactions.',
        add_asset: 'Add Asset',
        logout: 'Log Out',
        performance: 'Performance',
        quantity: 'Quantity',
        value: 'Value',
        price: 'Price',
        empty_portfolio: 'No assets yet.',
        start_investing: 'Start investing',
        based_on: 'Based on',
        buy: 'Buy',
        sell: 'Sell',
        update: 'Update',
        delete: 'Delete'
      },
      profile: {
        title: 'My Profile',
        subtitle: 'Manage your personal information and account',
        personal_info: 'Personal Information',
        account_stats: 'Account Statistics',
        security: 'Security & Preferences',
        update_success: 'Profile updated successfully',
        joined: 'Member since',
        save_changes: 'Save Changes',
        change_password: 'Change Password',
        language: 'App Language',
        theme: 'Visual Theme',
        danger_zone: 'Danger Zone',
        delete_account: 'Delete Account',
        security_score: 'Security Level',
        verified: 'Verified Account'
      },
      common: {
        loading: 'Loading...',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        search: 'Search',
        no_data: 'No data',
        required: 'Required',
        invalid_email: 'Invalid email',
        min_length: 'Too short',
        password_pattern: 'Must be complex',
        password_mismatch: 'Mismatch',
        success: 'Success!',
        error: 'Error',
        theme: 'Theme',
        language: 'Language',
        others: 'OTHERS'
      }
    }
  };

  constructor() {
    // Initial apply
    const lang = this.currentLang();
    document.documentElement.lang = lang;
  }

  public translate(key: string): string {
    const keys = key.split('.');
    let value = this.translations[this.currentLang()];
    
    for (const k of keys) {
      if (value && value[k]) {
        value = value[k];
      } else {
        return key;
      }
    }
    
    return value;
  }

  public setLanguage(lang: Language): void {
    this.currentLang.set(lang);
    localStorage.setItem(this.LANG_KEY, lang);
    document.documentElement.lang = lang;
  }

  private getInitialLanguage(): Language {
    const stored = localStorage.getItem(this.LANG_KEY) as Language;
    if (stored === 'es' || stored === 'en') return stored;

    const browserLang = navigator.language.split('-')[0];
    return browserLang === 'es' ? 'es' : 'en';
  }
}
