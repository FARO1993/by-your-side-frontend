# Respuestas a un post

Cada persona puede dejar una sola respuesta activa por publicación. El backend la guarda con `PUT /api/posts/{postId}/response` y la quita con `DELETE /api/posts/{postId}/response`.

## Tipos

`PostResponseType`: `WITH_YOU`, `NOT_ALONE`, `HUG`, `READING`, `TELL_ME_MORE`, `LISTENING`.

Presencia: `WITH_YOU`, `NOT_ALONE`, `HUG`.
Escucha: `READING`, `TELL_ME_MORE`, `LISTENING`.

No es `StatusReactionType`. Un post no muestra el tipo de compañía ni reacciones de estado.

## En la card

`currentUserResponseType` dice cuál está activa, o `null`. Elegir la misma otra vez la quita. Elegir otra la reemplaza.

Los conteos visibles son `presenceCount` y `listeningCount`. Si los dos son 0, no se muestra la fila.

El cliente no llama a `POST` ni `DELETE /api/posts/{postId}/support`.
