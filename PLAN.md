# Plan de ejecucion nocturna (MVP manana AM)

## Objetivo de negocio

Entregar una app funcional que permita generar y editar workbooks biblicos con citas/fuentes desde BEREAN para dos perfiles: profesor/lider y estudiante individual.

## Decision de alcance

- Incluir: generacion, edicion, exportacion, fuentes.
- Excluir (post-MVP): autenticacion, colaboracion multiusuario, base de datos persistente avanzada, app nativa empaquetada.

## Ciclo de trabajo (developer + auditor)

1. Implementar modulo.
2. Verificar con prueba automatica o smoke test.
3. Auditar contra criterio de uso real.
4. Ajustar y repetir.

## Hitos de esta noche

1. Scaffold proyecto local Node/Express + UI web.
2. Integracion BEREAN scholar/question con manejo de errores.
3. Motor de workbook en secciones reutilizables.
4. UI editable con export Markdown/PDF.
5. Tests basicos y script de auditoria.
6. Documentacion para demo de manana.

## Criterios de aceptacion

- El usuario puede generar un workbook en menos de 1 minuto.
- El workbook muestra contenido estructurado y fuentes.
- El contenido se puede editar antes de exportar.
- El sistema tolera limite diario de API con mensaje claro.

## Riesgos y mitigaciones

- Limite 20 requests/dia/IP: cache local, prompts compactos, reintentos controlados.
- Calidad variable de respuesta: plantilla de secciones y prompts guiados.
- Tiempo corto: priorizar funcionalidad visible sobre arquitectura compleja.
