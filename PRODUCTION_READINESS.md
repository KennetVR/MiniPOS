# MiniPOS — Guía de Preparación para Producción (Pre-Production Readiness)

Este documento detalla los pasos obligatorios que deben completarse antes de realizar el despliegue final y la distribución de MiniPOS en entornos productivos.

---

## 1. Provisionamiento de Usuarios en Supabase Auth
El sistema utiliza Supabase Auth conectado a una tabla pública `profiles`. Un usuario autenticado no podrá ingresar si su UUID no cuenta con un registro activo asociado en la base de datos.

### Pasos:
1. Ingresa al panel de control de tu proyecto en [Supabase Dashboard](https://app.supabase.com/).
2. Dirígete a la sección **Authentication > Users**.
3. Haz clic en **Add User > Invite User** e ingresa el correo electrónico del administrador o vendedor autorizado.
4. Una vez que el usuario acepte la invitación y configure su contraseña, vincula su UUID generado en Auth con la tabla `profiles` ejecutando una inserción SQL en el **SQL Editor**:
   ```sql
   INSERT INTO public.profiles (id, username, nombre, role, estado)
   VALUES 
     ('UUID_GENERADO_DE_SUPABASE_AUTH', 'admin', 'Administrador Principal', 'administrator', true);
   ```

---

## 2. Validación de Base de Datos y pgTAP
Antes de certificar la base de datos para producción, es necesario validar la integridad transaccional de los triggers y las funciones RPC (`create_sale`, `create_inventory_receipt`, `create_product`).

### Pasos:
1. Asegúrate de que las migraciones ubicadas en `supabase/migrations/` se hayan aplicado completamente en el proyecto remoto.
2. Si dispones de un entorno de pruebas local de Supabase con pgTAP instalado, ejecuta las aserciones de prueba:
   ```bash
   supabase test db
   ```
3. Verifica que todas las pruebas pasen sin errores, garantizando que el stock y las reglas de negocio de inventario compartido funcionen exactamente como se espera.

---

## 3. Compilación y Firma de Binarios para Producción

### A. Cliente Móvil (Android APK / AAB)
Para generar una versión de lanzamiento optimizada y firmada para Google Play Store o distribución directa:
1. Configura tus credenciales de firma (Keystore) en `mobile/android/gradle.properties`.
2. Genera el paquete de producción:
   ```bash
   cd mobile
   npx expo run:android --variant release
   # O alternativamente generando el APK de producción nativo con Gradle:
   cd android
   ./gradlew assembleRelease
   ```
3. El APK firmado se ubicará en `mobile/android/app/build/outputs/apk/release/`.

### B. Cliente de Escritorio (Electron Desktop)
Para generar el instalador ejecutable de escritorio:
1. Ejecuta el empaquetado de producción en la raíz del proyecto:
   ```bash
   npm run build
   npm run package
   ```
2. Los instaladores generados se ubicarán en la carpeta `release/`.

---
*MiniPOS Architecture & Engineering Team — 2026*
