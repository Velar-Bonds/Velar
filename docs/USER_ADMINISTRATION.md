# Administración de usuarios

`/tse/usuarios` es el directorio operativo para roles `admin` y `tse`. El backend es la fuente de verdad de permisos: TSE puede consultar y auditar; solo admin puede cambiar roles o estado de cuenta.

La lista usa `GET /api/users?page=&limit=&role=&search=` y nunca carga la tabla completa. Cada cambio de rol, activación o desactivación genera un evento append-only con el actor y `targetUserId`.

## Operaciones

- Selección de la página actual + `POST /api/users/bulk-role` para asignación masiva.
- `PATCH /api/users/:id/role` para cambios puntuales.
- `PATCH /api/users/:id/deactivate` y `/reactivate` para ciclo de cuenta.
- `GET /api/users/:id/audit` para historial individual.

No se debe confiar en los controles de la UI para autorización: las rutas aplican RBAC en el backend.
