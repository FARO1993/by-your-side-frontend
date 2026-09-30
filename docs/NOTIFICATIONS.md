# Novedades

REST y WebSocket usan el mismo `Notification`. La identidad es `id`.

## Payload

Cada aviso trae `postId`, `statusId` y `followRequestId` por separado. Pueden ser `null`. No se reinterpreta `postId` como un estado ni como una solicitud.

| Tipo | Destino |
| --- | --- |
| `NEW_POST_RESPONSE`, `NEW_COMMENT` | `/posts/{postId}` si hay `postId` |
| `NEW_STATUS_REACTION` | `/feed` si hay `statusId`. No existe una ruta de un estado suelto. |
| `NEW_FOLLOWER`, `FOLLOW_REQUEST_ACCEPTED` | perfil de quien actuó |
| `FOLLOW_REQUEST_RECEIVED` | perfil de quien pidió acompañarte. Aceptar o rechazar está en la propia novedad y usa `POST /api/follow-requests/{id}/accept` o `/reject`. |

`NEW_POST_RESPONSE` no incluye el tipo de respuesta del post. El texto es “respondió a tu publicación”.

## Lectura

`PATCH /api/notifications/{id}/read` marca una. No lleva body. Al abrir una no leída, la lista la marca al instante y el contador baja uno. Si el PATCH falla, ambos vuelven atrás y la navegación igual sigue. `PATCH /api/notifications/read-all` deja el contador en 0.

## WebSocket

Entra por `/user/queue/notifications`. Un id nuevo se antepone y el contador se vuelve a leer con `GET /api/notifications/unread-count`. Un id que ya está no se duplica, no se mueve y no vuelve a pedir el contador. Si esa lectura falla, la novedad queda visible y el contador conserva el último valor. La página siguiente, si se agrega, se concatena y se deduplica por `id`.

El backend ya no crea avisos entre personas bloqueadas. Silenciar a alguien no los oculta. El cliente no filtra por bloqueo ni por silencio.

Una solicitud que ya no está pendiente responde `409`. La novedad queda, y los botones de aceptar o rechazar se retiran.
