# Diseño y Estrategia de la Tabla Portfolio

**Propósito Central**: La tabla `portfolio` (o `user_assets`) es el núcleo operativo de la aplicación. Su función principal es registrar y persistir la relación entre los usuarios y los activos financieros que poseen.

## 1. Almacenamiento de la Propiedad del Activo

- **Rol**: Es la fuente de la verdad sobre qué tiene el usuario y cuánto.
- **Dependencia**: El Dashboard depende totalmente de esta tabla para saber de qué activos consultar precios. Sin estos registros, la aplicación no tiene contexto sobre el usuario.

## 2. Flujo de Cálculo de Balance (RxJS)

Esta tabla actúa como el "disparador" del flujo de datos reactivo:

1.  **Leer**: Obtener los activos del usuario desde `portfolio`/`user_assets`.
2.  **Extraer**: Identificar los símbolos (ej. BTC, ETH, AAPL).
3.  **Consultar Precios**: Llamar a la API externa para precios en tiempo real de esos símbolos específicos.
4.  **Calcular**: `(cantidad_en_portfolio * precio_tiempo_real) = balance_total`.

## 3. Seguridad (RLS)

- **Restricción**: Columna `user_id` vinculada a `auth.users`.
- **Política**:
  - Los usuarios SOLO pueden seleccionar/insertar/actualizar/borrar filas donde el `user_id` coincida con su UID autenticado.
  - Aislamiento estricto: El Usuario A solo ve los datos del Usuario A.

## 4. Seguimiento de Inversión (Performance)

- **Columna Clave**: `purchase_price` (guardado al momento de la transacción).
- **Lógica**:
  - `Ganancia/Pérdida = (Precio_Actual - Precio_Compra) * Cantidad`
  - Este precio estático de compra vs. el precio volátil de la API es la base para todas las métricas de rendimiento.

---

_Nota_: Actualmente implementado como `user_assets` en `PortfolioService`. En el futuro se podría renombrar a `portfolio` si se desea alineación semántica, pero la estructura permanece idéntica.
