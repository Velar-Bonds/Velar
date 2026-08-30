# Plan de prueba: administración de usuarios

1. Como admin, consultar página 2 con límite 20, rol `comprador` y búsqueda `ana`; comprobar `total` y rango.
2. Como TSE, comprobar que se puede consultar directorio y auditoría, pero no mutar roles ni cuentas.
3. Como admin, asignar un rol a varios IDs y confirmar un evento `user_role_changed` por ID actualizado.
4. Desactivar y reactivar una cuenta distinta al actor y comprobar eventos de auditoría.
5. Verificar que el UI mantiene la página, vacía la selección tras un lote y no muestra controles mutables a TSE.
