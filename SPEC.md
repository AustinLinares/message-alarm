# Message Alarm — Especificación del proyecto

## Visión

Alternativa gratuita a WhatsApp Business para micro y pequeños emprendedores (MIPE)
que no pueden costear un proveedor de mensajería. La app no envía mensajes de forma
automática (eso requiere APIs pagas) — en su lugar, deja el mensaje **listo y
programado**, dispara una **alarma/recordatorio** a la hora indicada, y con un toque
abre WhatsApp (u otra app) con el número y el texto precargados para que el usuario
dé el envío final.

## Principios

- **Todo local.** Sin backend, sin base de datos externa, sin sincronización en la
  nube. La única forma de mover datos entre dispositivos es un export/import manual
  (archivo JSON vía share sheet).
- **No se puede garantizar el envío.** Ninguna integración (WhatsApp, Instagram,
  LinkedIn, etc.) permite confirmar que un mensaje salió. El usuario marca
  manualmente cada destinatario como `confirmed`.
- **Modular desde el inicio**, pensado para agregar módulos futuros sin
  reestructurar, pero sin sobre-ingeniería (no hay abstracciones para casos que aún
  no existen).
- **Código en inglés** (modelos de datos, nombres de variables/funciones).
  Comentarios solo cuando el código no es autoexplicativo, breves.

## Alcance del MVP

- Crear mensajes programados con: texto (libre o desde plantilla), uno o varios
  destinatarios, fecha/hora de inicio, recurrencia opcional (diaria / semanal).
- Elegir destinatarios por número manual o seleccionándolos (multi-select, agrupado)
  desde la agenda del teléfono — se copian como snapshot local, no quedan
  sincronizados con el sistema.
- Notificación local tipo alarma (sonido + vibración) a la hora programada.
- Pantalla de "ocurrencia" al abrir la alarma: mensaje colapsable (con copiar al
  portapapeles) + checklist de destinatarios, cada uno con botón "Enviar por
  WhatsApp" (deep link) y check manual de `confirmed`. Botón de compartir genérico
  para otras redes.
- Plantillas de mensajes reutilizables (crear/editar/eliminar).
- Export/import de toda la data como archivo JSON local.

### Fuera de alcance (futuro)

- Envío realmente automático / integración con APIs pagas de mensajería.
- Sincronización en la nube entre dispositivos.
- Estadísticas, multi-usuario, roles.

## Modelo de datos

```ts
interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
}

interface MessageTemplate {
  id: string;
  name: string;
  text: string;
}

type RecurrenceType = 'none' | 'daily' | 'weekly';

interface Recurrence {
  type: RecurrenceType;
  daysOfWeek?: number[]; // 0-6, solo si type === 'weekly'
}

interface ScheduledMessage {
  id: string;
  text: string;
  templateId?: string;
  recipientIds: string[]; // Contact.id[]
  startAt: string; // ISO datetime
  recurrence: Recurrence;
  isActive: boolean;
}

type RecipientStatus = 'pending' | 'confirmed';

interface RecipientDelivery {
  contactId: string;
  status: RecipientStatus;
}

// Se crea una instancia cada vez que la alarma dispara (soporta recurrencia
// sin arrastrar el checklist de ocurrencias pasadas).
interface MessageOccurrence {
  id: string;
  scheduledMessageId: string;
  firedAt: string; // ISO datetime
  recipients: RecipientDelivery[];
}
```

## Flujos principales

1. **Crear mensaje programado**: texto (o plantilla) → destinatarios (manual y/o
   selector de contactos) → fecha/hora → recurrencia → guardar.
2. **Alarma dispara** → se crea un `MessageOccurrence` con `recipients` en estado
   `pending` para cada `recipientId` del mensaje.
3. **Pantalla de ocurrencia**: mensaje colapsado si excede ~180 caracteres (toggle
   "Ver más/Ver menos") + botón copiar. Lista de destinatarios, cada uno con botón
   "Enviar" (abre `wa.me/<numero>?text=<mensaje>`) y check independiente para marcar
   `confirmed`. Botón de compartir genérico (share sheet del sistema) aparte del
   checklist.
4. **Recurrencia**: al completarse o vencer una ocurrencia, se calcula y programa la
   siguiente según `recurrence`.

## Selección de contactos

- `expo-contacts` pide permiso nativo (`READ_CONTACTS` / `NSContactsUsageDescription`)
  la primera vez.
- Lista con checkboxes, agrupada alfabéticamente, selección múltiple + botón
  "Agregar seleccionados".
- Si un contacto tiene varios números, se pide elegir cuál usar antes de agregarlo.
- Los contactos elegidos se copian (snapshot) a la tabla local `Contact`; no hay
  sincronización posterior con la agenda del sistema. Se pueden editar a mano dentro
  de la app.

## Arquitectura (carpetas)

```
src/
  features/
    scheduledMessages/   # crear/listar mensajes programados, ocurrencias
    templates/            # CRUD de plantillas
    contacts/              # selector de contactos, tabla local de contactos
    settings/               # export/import, permisos, batería
  shared/
    db/                      # setup de SQLite y queries compartidas
    notifications/       # programar/cancelar notificaciones locales
    integrations/         # builders de deep links (WhatsApp, etc.)
    types/                    # tipos compartidos entre features
```

## Stack técnico

Expo + React Native + TypeScript. Librerías: `expo-sqlite`, `expo-notifications`,
`expo-contacts`, `expo-linking`, `expo-sharing`, `expo-clipboard`,
`expo-file-system`.

## Riesgos conocidos

- Android puede retrasar notificaciones programadas por optimización de batería;
  hay que guiar al usuario a excluir la app.
- iOS limita a 64 notificaciones locales pendientes simultáneas.
- Ninguna integración permite verificar el envío real; el estado `confirmed` es
  siempre una declaración manual del usuario, no un hecho verificado.
