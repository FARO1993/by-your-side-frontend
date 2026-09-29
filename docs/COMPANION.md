# Compañía (B4B)

El frontend usa el contrato de Companion Need, Companion Offering, búsqueda compatible, disponibilidad pública y preferencias estables. El backend es la fuente de verdad. No hay CompanionMatch, score ni ranking.

## Contratos

| Acción | Endpoint |
| --- | --- |
| Need activo | `PUT`, `GET /mine`, `DELETE /api/companion/need` |
| Offering activo | `PUT`, `GET /mine`, `DELETE /api/companion/offering` |
| Candidatos compatibles | `GET /api/companion/offering/compatible` |
| Disponibilidad pública | `GET /api/users/{userId}/availability` |
| Preferencias | `GET` y `PATCH /api/users/me/companion-preferences` |
| Conversación | `POST /api/conversations/{userId}` |

`GET mine` y la disponibilidad pública tratan `200` con cuerpo vacío como ausencia. Un `404` de disponibilidad pública oculta la señal. `null` en `companionPreferences` de un perfil limitado no es lo mismo que `[]`.

## UI

Need y Offering pueden estar activos a la vez. Home confirma un Need y abre Modo compañía, donde se buscan candidatos. Confirmar un Offering deja el estado en Home. Elegir a alguien abre la conversación existente, sin mensaje automático.

Las preferencias describen cómo la persona suele acompañar. Guardarlas no crea un Offering.

Un perfil privado puede mostrar “Disponible ahora” si el endpoint público devuelve un objeto. Las preferencias del perfil solo se muestran cuando el arreglo trae valores.

## Legacy

Este frontend no llama a `/api/availability`. El backend puede seguir exponiendo ese adapter por compatibilidad. Need y Offering son los contratos que usa la UI.
