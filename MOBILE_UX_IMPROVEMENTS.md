# 📱 Mejoras Móviles - Utilidades en Centro de Automatización

## 📝 Cambios Realizados

Se han movido las funcionalidades de exportación y calculadora al Centro de Automatización para optimizar la experiencia en dispositivos móviles.

### 1️⃣ Ocultar Botones en Header (Móvil)

Se confirmó que los botones ya tienen la clase `desktop-only`, por lo que se ocultan automáticamente en pantallas menores a 768px.

```html
<!-- Estos botones solo aparecen en escritorio -->
<button class="desktop-only" (click)="openWhatIfCalculator()">...</button>
<button class="desktop-only" (click)="exportToPDF()">...</button>
<button class="desktop-only" (click)="exportToCSV()">...</button>
```

---

### 2️⃣ Nueva Pestaña "Utilidades"

Se ha agregado una tercera pestaña en el Centro de Automatización (`app-automation-center`) llamada **Utilidades**.

**Contenido:**

- 🧮 **Calculadora What-If**: Simula inversiones pasadas
- 📄 **Exportar PDF**: Reporte profesional
- 📊 **Exportar CSV**: Datos en formato Excel

**Ubicación:**

- Accesible desde el icono ⚡ (Zap) en el header
- Funciona tanto en móvil como en escritorio

---

### 3️⃣ Implementación Técnica

**Automation Center (`automation-center.component.ts`):**

- Agregados `Output` events: `openWhatIf`, `exportPdf`, `exportCsv`
- Agregada lógica para pestaña 'utilities'
- Agregados nuevos iconos y estilos

**Dashboard (`dashboard.component.html`):**

- Conectados los eventos del Automation Center a los métodos del Dashboard

```html
<app-automation-center
  (openWhatIf)="openWhatIfCalculator()"
  (exportPdf)="exportToPDF()"
  (exportCsv)="exportToCSV()"
></app-automation-center>
```

---

## 🎨 Resultado Final

### En Escritorio 💻

- Los botones siguen visibles en el header para acceso rápido.
- TAMBIÉN están disponibles en el Centro de Automatización.

### En Móvil 📱

- Los botones del header DESAPARECEN (más espacio limpio).
- El usuario toca el icono ⚡ (Zap).
- Selecciona la pestaña "Utilidades".
- Accede a todas las herramientas desde ahí.

---

## 🧪 Cómo Probar

1. **Abrir en Móvil (o reducir ventana < 768px)**
2. Verificar que los iconos de Calculadora, PDF y CSV **no aparecen** en el header.
3. Tocar el icono ⚡ (Automatización).
4. Ver una nueva pestaña con icono de Caja (📦) llamada "Utilidades".
5. Tocar la pestaña.
6. Probar los botones:
   - Calculadora: Debe abrir el modal.
   - PDF: Debe descargar el reporte.
   - CSV: Debe descargar el archivo.

**¡La experiencia móvil ahora es mucho más limpia y organizada!** 🚀
