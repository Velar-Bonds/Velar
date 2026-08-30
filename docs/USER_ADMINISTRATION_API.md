# API de administración de usuarios

| Método | Ruta | Rol | Resultado |
| --- | --- | --- | --- |
| GET | `/api/users` | admin, tse | `{ data, total, page, limit }` |
| PATCH | `/api/users/:id/role` | admin | Perfil actualizado |
| POST | `/api/users/bulk-role` | admin | `{ ok: true, updated }` |
| GET | `/api/users/:id/audit` | admin, tse | Eventos de auditoría |
| PATCH | `/api/users/:id/deactivate` | admin | Cuenta bloqueada |
| PATCH | `/api/users/:id/reactivate` | admin | Cuenta desbloqueada |

Los parámetros de búsqueda aceptados son `page`, `limit`, `role` y `search` (nombre o correo).
