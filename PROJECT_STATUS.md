# Zenith Finance - Proyecto de Monitoreo de Activos Financieros

## Estado Actual del Proyecto

### Dependencias Instaladas

- **@angular/material** - Componentes UI base
- **@angular/cdk** - Component Development Kit
- **ng2-charts** - Biblioteca de gráficos
- **chart.js** - Motor de gráficos
- **lucide-angular** - Iconos modernos
- **@angular/service-worker** - Soporte PWA
- **@supabase/supabase-js** - Backend y autenticación

### Estructura de Carpetas Creada

```
src/app/
├── core/
│   ├── guards/
│   │   └── auth.guard.ts ✓
│   ├── interceptors/
│   │   └── auth.interceptor.ts ✓
│   ├── models/
│   │   ├── auth.model.ts ✓
│   │   └── asset.model.ts ✓
│   └── services/
│       ├── auth.service.ts ✓
│       ├── supabase.ts ✓
│       └── theme.service.ts ✓
├── shared/
│   └── components/
├── features/
│   ├── auth/
│   │   ├── auth.routes.ts ✓
│   │   ├── login/ (pendiente)
│   │   └── register/ (pendiente)
│   ├── dashboard/
│   │   ├── dashboard.routes.ts ✓
│   │   └── dashboard.component.ts (pendiente)
│   └── portfolio/
│       ├── portfolio.routes.ts ✓
│       └── portfolio.component.ts (pendiente)
├── app.config.ts ✓ (actualizado con providers)
└── app.routes.ts ✓ (configurado con lazy loading)
```

### Funcionalidades Implementadas

#### 1. Autenticación (JWT con Supabase)

- [x] Servicio de autenticación completo
- [x] Login/Logout/Register
- [x] Refresh token automático
- [x] Almacenamiento en localStorage
- [x] BehaviorSubject para estado reactivo

#### 2. Guards e Interceptors

- [x] AuthGuard con redirección
- [x] AuthInterceptor para inyección de token
- [x] Manejo automático de refresh token en errores 401

#### 3. Sistema de Theming

- [x] Servicio de tema con signals
- [x] Modo claro/oscuro
- [x] Persistencia en localStorage
- [x] Detección de preferencia del sistema
- [x] Variables CSS personalizadas (Fluent UI style)
- [x] Glassmorphism effects
- [x] Utility classes responsivas

#### 4. Configuración

- [x] HTTP Client configurado
- [x] Animaciones de Angular Material
- [x] Interceptores registrados
- [x] Lazy loading en routes

### Características del Sistema de Estilos

#### Variables de Tema

- Colores primarios (50-900)
- Superficies (background, card, hover, border)
- Textos (primary, secondary, tertiary)
- Estados (success, warning, error, info)
- Sombras y elevaciones
- Glassmorphism
- Bordes redondeados
- Espaciado consistente
- Tipografía

#### Utility Classes

- `.glass-card` - Efecto de cristal con blur
- `.card` - Tarjeta básica
- `.flex`, `.flex-column`, `.flex-center`, `.flex-between`
- `.grid-cols-2/3/4` - Grids responsivos
- Clases de texto y color
- Clases de espaciado
- `.container` - Contenedor responsivo

### Modelos de Datos Creados

#### Auth Models

- `User` - Información del usuario
- `AuthResponse` - Respuesta de autenticación
- `LoginCredentials` - Credenciales de login
- `RegisterData` - Datos de registro

#### Asset Models

- `Asset` - Activo financiero
- `PriceHistory` - Historial de precios
- `PortfolioAsset` - Activo en portafolio
- `PriceAlert` - Alerta de precio
- `Portfolio` - Portafolio completo

## Próximos Pasos (En Orden de Prioridad)

### Fase 1: Componentes de Autenticación

1. **LoginComponent** - Formulario reactivo de login
2. **RegisterComponent** - Formulario reactivo de registro
3. **Navbar/Header** - Con botón de tema y logout

### Fase 2: Dashboard Core

1. **DashboardComponent** - Vista principal
2. **AssetService** - Servicio para consumir API (CoinGecko)
3. **Asset List Component** - Lista de activos con búsqueda
4. **Asset Card Component** - Tarjeta individual de activo
5. **Search Component** - Buscador con debounce

### Fase 3: Gráficos y Visualización

1. **PriceChartComponent** - Gráfico de precios (Chart.js)
2. **PortfolioChartComponent** - Gráfico de distribución
3. **TrendIndicator** - Indicador de tendencia

### Fase 4: Portfolio Management

1. **PortfolioComponent** - Vista de portafolio
2. **PortfolioService** - Gestión de portafolio
3. **AddAssetModal** - Modal para agregar activos
4. **TransactionHistory** - Historial de transacciones

### Fase 5: Price Alerts

1. **AlertService** - Servicio de alertas
2. **AlertListComponent** - Lista de alertas
3. **CreateAlertModal** - Modal para crear alertas
4. **Notification System** - Sistema de notificaciones

### Fase 6: PWA & Optimización

1. Configurar Service Worker
2. Agregar manifest.json
3. Optimizar para dispositivos móviles
4. Añadir splash screens
5. Configurar estrategias de caché

### Fase 7: Features Avanzadas

1. Real-time updates con WebSockets
2. Exportar datos (CSV/PDF)
3. Configuración de perfil de usuario
4. Dashboard personalizable
5. Múltiples portafolios

## Checklist de Requisitos Técnicos

### Must-Have

- [x] HttpClient con interfaces tipadas
- [x] RxJS Observables y Subjects
- [x] RxJS Operators: map, filter, tap, switchMap, catchError
- [x] Lazy Loading en módulos
- [ ] Formularios Reactivos (auth y perfil)
- [x] Interceptores HTTP
- [x] Guards de autenticación
- [ ] Manejo de errores global
- [ ] Loading states
- [ ] Responsive design
- [x] Theming (claro/oscuro)

### Nice-to-Have

- [ ] Animaciones de transición
- [ ] Skeleton loaders
- [ ] Infinite scroll
- [ ] Virtual scrolling
- [ ] Drag & drop
- [ ] Keyboard shortcuts
- [ ] Accessibility (ARIA)
- [ ] Tests unitarios
- [ ] E2E tests

## Comandos Útiles

```bash
# Desarrollo
npm start

# Build producción
npm run build

# Tests
npm test

# Lint
ng lint

# Crear componente
ng generate component features/nombre --standalone

# Crear servicio
ng generate service core/services/nombre
```

## Notas de Desarrollo

### Estilo de Código

- Usar standalone components
- Preferir signals sobre Observables para estado local
- Usar Observables para datos asíncronos
- Implementar OnPush change detection cuando sea posible
- Seguir guía de estilos de Angular

### Convenciones

- Prefijo `auth` para servicios de autenticación
- Sufijo `Service` para servicios
- Sufijo `Component` para componentes
- Interfaces en `core/models`
- Componentes compartidos en `shared/components`
- Features en `features/nombre-feature`

### Performance

- Lazy loading para todas las rutas principales
- trackBy en \*ngFor
- Unsubscribe de Observables (async pipe o takeUntil)
- Optimizar imágenes
- Code splitting
- Tree shaking

## Recursos Externos a Integrar

### APIs

- **CoinGecko API** - Datos de criptomonedas (gratuita)
  - https://www.coingecko.com/api/documentation
  - Endpoints: /coins/markets, /coins/{id}/market_chart

### Iconos

- **Lucide Icons** - https://lucide.dev/
  - TrendingUp, TrendingDown
  - DollarSign, Bitcoin
  - Bell, Settings, User

## Estado de Supabase

### Configuración Actual

- URL: https://rbrxeyxzqohordeyirnn.supabase.co
- Autenticación configurada
- Conexión verificada

### Tablas Necesarias

1. **users** - Ya gestionado por Supabase Auth
2. **portfolios** - Portafolios de usuarios
3. **portfolio_assets** - Activos en portafolio
4. **price_alerts** - Alertas de precio
5. **transactions** - Historial de transacciones

### Políticas RLS a Configurar

- Usuarios solo pueden ver sus propios portafolios
- Usuarios solo pueden crear/editar/eliminar sus propios activos
- Usuarios solo pueden ver sus propias alertas

---

**Última actualización:** 2026-02-05
**Versión:** 0.1.0
**Estado:** Estructura base completada - Listo para desarrollo de componentes
