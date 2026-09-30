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
