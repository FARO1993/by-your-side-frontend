# Privacidad y relaciones

El backend decide quién ve un perfil, una publicación, un seguimiento, un bloqueo o un silencio. El frontend muestra el estado que llega y dispara la acción. No replica las policies.

## Visibilidad

| Campo | Valores | Copy |
| --- | --- | --- |
| `profileVisibility` | `PUBLIC`, `PRIVATE` | Público, Privado |
| `visibility` de un post | `PUBLIC`, `FOLLOWERS_ONLY`, `PRIVATE` | Público, Solo seguidores, Solo yo |

La edición del perfil propio manda `profileVisibility` en `PATCH /api/users/me` junto con el nombre y la bio. Después de guardar se muestra la respuesta. Un `null` de bio, preferencias o estado no se reemplaza por un texto inventado.

## FollowState

`NONE`, `REQUESTED` y `FOLLOWING` se mantienen distintos. `REQUESTED` se muestra como "Solicitud enviada" y se puede cancelar. No se presenta como "Acompañás".

| Acción | Endpoint | Después |
| --- | --- | --- |
| Acompañar | `POST /api/follows/{userId}` | el `followState` de la respuesta |
| Dejar de acompañar | `DELETE /api/follows/{userId}` | `NONE` |
| Cancelar solicitud | `DELETE /api/follow-requests/{requestId}` | `NONE`, salvo un 409 |
| Aceptar | `POST /api/follow-requests/{requestId}/accept` | la solicitud sale de la lista |
| Rechazar | `POST /api/follow-requests/{requestId}/reject` | la solicitud sale de la lista |
| Dejar de acompañarte | `DELETE /api/follows/followers/{userId}` | esa persona sale de la lista |

Un `409` al aceptar, rechazar o cancelar muestra "Esa solicitud ya no está pendiente." y quita la acción. El perfil, si sigue abierto, vuelve a pedir el estado real.

En el perfil propio, las solicitudes recibidas, las enviadas y quienes te acompañan aparecen solo cuando hay filas. Aceptar vuelve a pedir esas listas, así que la persona aceptada entra en "Quienes te acompañan" sin recargar la página. Rechazar no vuelve a pedir seguidores.

## Deuda de contrato: PostCard

`PostCard` recibe `followedByCurrentUser`. Con `true` puede mostrar `FOLLOWING`. Con `false` no puede separar `NONE` de `REQUESTED`, así que no puede mostrar "Solicitud enviada" en el primer render. El frontend no infiere `REQUESTED` ni lo guarda como fuente de verdad.

Para resolverlo, `PostResponse` tendría que exponer `followState`: `NONE`, `REQUESTED` o `FOLLOWING`. Un `requestId` serviría después para cancelar desde la card, y no hace falta para representar `REQUESTED`. Queda como deuda futura de contrato, fuera de Fase 9.

## Bloqueo y silencio

| Acción | Endpoint |
| --- | --- |
| Bloquear | `POST /api/users/{userId}/block` |
| Desbloquear | `DELETE /api/users/{userId}/block` |
| Silenciar | `POST /api/users/{userId}/mute` |
| Dejar de silenciar | `DELETE /api/users/{userId}/mute` |

Bloquear pide confirmación. Después se vuelve a pedir el perfil. Si `blockedByCurrentUser` es true, la vista es la mínima que devuelve el backend y la única acción de relación es desbloquear. Desbloquear no restaura follows, solicitudes ni silencio.

Si la otra persona bloqueó, el perfil responde 404. La pantalla dice que no se pudo cargar. No dice que hubo un bloqueo.

Silenciar no cambia `followState`, no oculta el perfil directo y no impide escribir. El feed, Descubrir, los estados y la búsqueda de compañía los filtra el backend. El frontend no vuelve a filtrarlos.

## Errores

| Código | Lectura |
| --- | --- |
| 400 | el dato o el estado no sirven para esa acción |
| 404 | el recurso no está disponible |
| 409 | la relación cambió; una solicitud ya no está pendiente |
| 401 | el interceptor de sesión existente |

Un mensaje de chat que el backend rechaza vuelve al borrador con "No pudimos enviar el mensaje."
