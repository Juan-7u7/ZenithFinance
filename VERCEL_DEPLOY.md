# Instrucciones de Despliegue en Vercel

## Pasos para Desplegar Zenith Finance en Vercel

### 1. Preparación

El proyecto ya está configurado para Vercel con el archivo `vercel.json`. No necesitas cambios adicionales.

### 2. Variables de Entorno Requeridas

En el dashboard de Vercel, configura estas variables de entorno:

```
SUPABASE_URL=https://rbrxeyxzqohordeyirnn.supabase.co
SUPABASE_ANON_KEY=tu_clave_aqui
```

**IMPORTANTE**: No compartas tu `SUPABASE_ANON_KEY` públicamente. Úsala solo en las configuraciones de Vercel.

### 3. Opción A: Deploy desde la Web de Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Click en "Add New..." → "Project"
3. Importa el repositorio: `Juan-7u7/ZenithFinance`
4. Configura el proyecto:
   - **Project Name**: zenith-finance (o el que prefieras)
   - **Framework Preset**: Other (o déjalo detectar automáticamente)
   - **Root Directory**: `./`
   - **Build Command**: `npm run build` (ya configurado)
   - **Output Directory**: `dist/zenith-finance/browser` (ya configurado)
5. Agrega las variables de entorno
6. Click en "Deploy"

### 4. Opción B: Deploy con Vercel CLI

```bash
# Instalar Vercel CLI globalmente
npm install -g vercel

# Autenticarse
vercel login

# Primer deploy (interactivo)
vercel

# Responde las preguntas:
# - Set up and deploy? Yes
# - Which scope? Tu cuenta
# - Link to existing project? No
# - Project name? zenith-finance
# - In which directory is your code? ./
# - Want to override settings? No

# Deploy a producción
vercel --prod
```

### 5. Configuración Automática

El archivo `vercel.json` ya incluye:

- Build command optimizado
- Output directory correcto
- Rewrites para SPA routing (importante para Angular)
- Configuración de instalación

### 6. Verificación Post-Deploy

Después del deploy, verifica:

1. La app carga correctamente
2. El routing funciona (navega a /dashboard, /portfolio)
3. El tema claro/oscuro funciona
4. La autenticación con Supabase funciona

### 7. Dominio Personalizado (Opcional)

En el dashboard de Vercel:

1. Ve a tu proyecto
2. Settings → Domains
3. Agrega tu dominio personalizado
4. Sigue las instrucciones para configurar DNS

### 8. Continuous Deployment

Vercel automáticamente:

- Hace deploy de cada push a master
- Crea preview deployments para PRs
- Ejecuta el build en cada cambio

### 9. Troubleshooting

#### Error: "Page not found" en rutas

**Solución**: El archivo `vercel.json` ya incluye los rewrites necesarios. Si persiste, verifica que el archivo esté en la raíz del proyecto.

#### Error de build

**Solución**:

1. Verifica que todas las dependencias estén en `package.json`
2. Ejecuta `npm install` localmente para verificar
3. Ejecuta `npm run build` localmente para asegurar que funciona

#### Variables de entorno no funcionan

**Solución**:

1. Verifica que las hayas agregado en Settings → Environment Variables
2. Asegúrate de que estén en el ambiente correcto (Production, Preview, Development)
3. Re-deploy después de agregar variables

### 10. Monitoreo

Vercel provee:

- Analytics automático
- Logs en tiempo real
- Métricas de performance

Accede desde: Tu Proyecto → Analytics

### 11. URLs de Deploy

Después del deploy tendrás:

- **Production**: `https://zenith-finance.vercel.app`
- **Preview**: Una URL única para cada PR/branch

### 12. Comandos Útiles de Vercel CLI

```bash
# Ver logs
vercel logs

# Ver deployments
vercel ls

# Información del proyecto
vercel inspect

# Abrir el dashboard
vercel open

# Remover deployment
vercel remove [deployment-url]
```

---

## Checklist de Pre-Deploy

- [x] `vercel.json` configurado
- [x] `.gitignore` incluye `.vercel`
- [x] Build funciona localmente (`npm run build`)
- [x] Variables de entorno identificadas
- [ ] Variables de entorno configuradas en Vercel
- [ ] Primer deploy ejecutado
- [ ] Verificación de funcionalidad completada

## Soporte

Si encuentras problemas:

1. Revisa los logs en el dashboard de Vercel
2. Verifica la [documentación de Vercel](https://vercel.com/docs)
3. Contacta al equipo de desarrollo
