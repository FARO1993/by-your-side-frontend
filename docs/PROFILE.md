# Perfil y estado

El perfil no trae el estado embebido. Cada perfil abierto pide una sola vez `GET /api/users/{userId}/status`.

| Respuesta | Qué se muestra |
| --- | --- |
| `200` con `Status` | el ánimo actual |
| `200` con body vacío | nada. Es un perfil accesible sin estado activo. |
| `404` | nada. El estado no es accesible. No se dice que la persona no tiene estado. |

El inicio sigue usando `GET /api/statuses/feed`. Silenciar a alguien no oculta el estado en su perfil: eso lo decide el backend en el endpoint puntual.

`PATCH /api/users/me` guarda el nombre y la bio ya recortados. Un nombre que queda vacío no se envía. Una bio que queda vacía se envía como `""`: el backend la persiste como `null`. Un `null` en el body no la limpia, significa no tocarla. La pantalla muestra el perfil que devuelve esa respuesta.
