# Zenith Finance

> Plataforma web de monitoreo de activos financieros con Angular 21+

![Angular](https://img.shields.io/badge/Angular-21-DD0031?logo=angular)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Enabled-3ECF8E?logo=supabase)

## Características

- **Autenticación segura** con Supabase Auth
- **Gestión de portafolio** de activos financieros
- **Tema claro/oscuro** con persistencia
- **Diseño responsive** para todos los dispositivos
- **Glassmorphism** design inspirado en Fluent UI
- **Lazy loading** y arquitectura modular
- **PWA Ready** con service workers

## Tecnologías

### Core

- **Angular 21** - Framework principal
- **TypeScript 5.9** - Lenguaje de programación
- **RxJS 7.8** - Manejo de estado reactivo
- **SCSS** - Estilos y theming

### UI & UX

- **Angular Material** - Componentes UI
- **Chart.js** - Gráficos y visualizaciones
- **Lucide Icons** - Iconografía moderna
- **Custom Design System** - Variables CSS personalizadas

### Backend & Auth

- **Supabase** - Backend as a Service
- **JWT** - Autenticación con tokens
- **PostgreSQL** - Base de datos (via Supabase)

## Instalación Local

```bash
# Clonar el repositorio
git clone https://github.com/Juan-7u7/ZenithFinance.git
cd ZenithFinance

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start
```

La aplicación estará disponible en `http://localhost:4200/`

## Scripts Disponibles

```bash
npm start          # Servidor de desarrollo
npm run build      # Build de producción
npm test           # Ejecutar tests
npm run watch      # Build con watch mode
```

## Configuración de Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Copia las credenciales del proyecto
3. Actualiza los archivos de environment:

```typescript
// src/environments/environment.ts
export const environment = {
  production: true,
  supabaseUrl: 'TU_SUPABASE_URL',
  supabaseKey: 'TU_SUPABASE_ANON_KEY',
};
```

## Deploy en Vercel

### Opción 1: Deploy Automático (Recomendado)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Juan-7u7/ZenithFinance)

1. Click en el botón "Deploy with Vercel"
2. Conecta tu cuenta de GitHub
3. Configura las variables de entorno:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
4. Deploy!

### Opción 2: Vercel CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login en Vercel
vercel login

# Deploy
vercel
```

### Opción 3: Desde GitHub

1. Importa el repositorio en [Vercel](https://vercel.com/new)
2. Configura el proyecto:
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/zenith-finance/browser`
3. Agrega las variables de entorno
4. Deploy!

## Configuración de Vercel

El proyecto incluye `vercel.json` con la configuración optimizada:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist/zenith-finance/browser",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## Estructura del Proyecto

```
src/
├── app/
│   ├── core/                 # Servicios core, guards, interceptors
│   │   ├── guards/          # Route guards
│   │   ├── interceptors/    # HTTP interceptors
│   │   ├── models/          # Tipos e interfaces
│   │   └── services/        # Servicios globales
│   ├── features/            # Módulos de funcionalidades
│   │   ├── auth/           # Autenticación
│   │   ├── dashboard/      # Dashboard principal
│   │   └── portfolio/      # Gestión de portafolio
│   └── shared/             # Componentes compartidos
├── environments/            # Configuración de entornos
└── styles.scss             # Estilos globales
```

## Características Implementadas

- [x] Sistema de autenticación completo
- [x] Guards de protección de rutas
- [x] Interceptores HTTP con JWT
- [x] Tema claro/oscuro
- [x] Formularios reactivos
- [x] Lazy loading de módulos
- [x] Design system con variables CSS
- [x] Responsive design
- [x] Configuración PWA

## Próximas Características

- [ ] Integración con API de criptomonedas (CoinGecko)
- [ ] Gráficos de precios en tiempo real
- [ ] Sistema de alertas de precios
- [ ] Gestión completa de portafolio
- [ ] Exportar reportes (PDF/CSV)
- [ ] Notificaciones push
- [ ] Multi-portafolio
- [ ] Dark mode automático

## Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT.

## Contacto

- GitHub: [@Juan-7u7](https://github.com/Juan-7u7)
- Repositorio: [ZenithFinance](https://github.com/Juan-7u7/ZenithFinance)

---

Hecho con ❤️ usando Angular y Supabase
