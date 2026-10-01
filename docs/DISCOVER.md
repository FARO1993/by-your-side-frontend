# Discover

La búsqueda de personas usa `GET /api/users/discover`. El backend decide el match, el orden y quién queda fuera por bloqueo, silencio o cuenta inactiva.

## Contrato

| Caso | Llamada |
| --- | --- |
| Input vacío | `GET /api/users/discover?page=0&size=20`, sin `q` |
| Texto | `GET /api/users/discover?q=texto&page=0&size=20` |

`q` se envía recién después de 300 ms. Un cambio de texto vuelve a la página 0 y reemplaza la lista. “Cargar más” pide la página siguiente y la agrega. Una respuesta vieja no pisa una búsqueda más nueva.

## Disponibilidad

Cada persona trae `available: boolean` en el mismo response. Si es `true`, la card dice “Disponible ahora”. Discover no llama a `GET /api/users/{id}/availability` y no muestra el tipo de compañía.

Un perfil `PRIVATE` puede estar disponible y seguir sin bio.

## Ánimo

Cada persona también trae `statusMood` en ese mismo response: el ánimo del status activo, o `null`. Si es `null`, la card no muestra ánimo ni un texto de ausencia. Si tiene valor, se muestra con el mismo copy y badge que el perfil (`STATUS_MOOD_UI`). Discover no llama a `GET /api/users/{id}/status`.

`statusMood` y `available` son independientes: pueden aparecer juntos, uno solo, o ninguno.
