import type { StringEntry } from './index';

// Strings for UI that already existed in the app but is not covered by the
// design's strings.json (alerts, empty states, template/contact pickers...).
// English translations are mine; the design only supplied the main screens.
export const APP_STRINGS: Record<string, StringEntry> = {
  'common.cancel': { es: 'Cancelar', en: 'Cancel' },
  'common.delete': { es: 'Eliminar', en: 'Delete' },
  'common.save': { es: 'Guardar', en: 'Save' },
  'common.close': { es: 'Cerrar', en: 'Close' },
  'common.loading': { es: 'Cargando...', en: 'Loading...' },
  'common.ok': { es: 'Listo', en: 'OK' },

  'home.empty': { es: 'Aún no tienes mensajes programados.', en: "You don't have any scheduled messages yet." },
  'home.create_first': { es: 'Crear el primero', en: 'Create the first one' },
  'home.count_one': { es: '1 mensaje', en: '1 message' },
  'home.to_names': { es: 'Para {names}', en: 'To {names}' },
  'home.paused': { es: 'Pausado', en: 'Paused' },
  'home.no_next': { es: 'Sin próxima fecha', en: 'No upcoming date' },
  'home.filter_empty': { es: 'No hay mensajes con este filtro.', en: 'No messages match this filter.' },
  'home.delete_title': { es: 'Eliminar mensaje', en: 'Delete message' },
  'home.delete_body': { es: '¿Eliminar este mensaje programado?', en: 'Delete this scheduled message?' },
  'home.pause': { es: 'Pausar', en: 'Pause' },
  'home.resume': { es: 'Reanudar', en: 'Resume' },
  'home.active_switch': { es: 'Alarma activa', en: 'Alarm active' },
  'home.recipients_count': { es: '{count} destinatarios', en: '{count} recipients' },
  'home.minutes': { es: '{n} min', en: '{n} min' },
  'home.day_today': { es: 'Hoy', en: 'Today' },
  'home.day_tomorrow': { es: 'Mañana', en: 'Tomorrow' },
  'home.day_every': { es: 'Todos', en: 'Every day' },
  'home.next_in': { es: 'en {time}', en: 'in {time}' },
  'compose.repeat_days': { es: 'Días de la semana', en: 'Days of the week' },
  'home.lock_today': { es: 'Hoy', en: 'Today' },
  'home.lock_alarms': { es: '{count} alarmas', en: '{count} alarms' },
  'home.lock_alarm_one': { es: '1 alarma', en: '1 alarm' },
  'home.lock_sent': { es: 'Enviados', en: 'Sent' },
  'home.lock_of': { es: '{done} de {total}', en: '{done} of {total}' },
  'home.lock_countdown': { es: 'Próxima alarma en {time}', en: 'Next alarm in {time}' },
  'home.lock_tap_to_send': { es: 'Toca para enviar a {names}', en: 'Tap to send to {names}' },
  'home.lock_now': { es: 'ahora', en: 'now' },
  'home.hours': { es: '{n} h', en: '{n} h' },

  'compose.edit_title': { es: 'Editar mensaje', en: 'Edit message' },
  'compose.save_changes': { es: 'Guardar cambios', en: 'Save changes' },
  'compose.saving': { es: 'Guardando...', en: 'Saving...' },
  'compose.change_time': { es: 'Cambiar hora, {time}', en: 'Change time, {time}' },
  'compose.change_date': { es: 'Cambiar fecha', en: 'Change date' },
  'compose.missing_message_title': { es: 'Falta el mensaje', en: 'Message missing' },
  'compose.missing_message_body': { es: 'Escribe el texto que quieres programar.', en: 'Write the text you want to schedule.' },
  'compose.missing_recipients_title': { es: 'Faltan destinatarios', en: 'Recipients missing' },
  'compose.missing_recipients_body': { es: 'Agrega al menos un contacto o número.', en: 'Add at least one contact or number.' },
  'compose.missing_days_title': { es: 'Falta la repetición', en: 'Repeat days missing' },
  'compose.missing_days_body': { es: 'Elige al menos un día de la semana.', en: 'Pick at least one day of the week.' },

  'contacts.error': {
    es: 'No pudimos cargar tus contactos. Inténtalo de nuevo.',
    en: "We couldn't load your contacts. Please try again.",
  },
  'contacts.retry': { es: 'Reintentar', en: 'Try again' },
  'contacts.empty': { es: 'No encontramos contactos con número de teléfono.', en: 'No contacts with a phone number were found.' },
  'contacts.loading': { es: 'Cargando contactos…', en: 'Loading contacts…' },
  'contacts.permission': {
    es: 'Necesitamos permiso para acceder a tus contactos y poder elegir destinatarios.',
    en: 'We need permission to access your contacts so you can pick recipients.',
  },
  'contacts.multiple_body': {
    es: 'Este contacto tiene varios números. Elige cuál usar:',
    en: 'This contact has several numbers. Choose which one to use:',
  },
  'contacts.add_selected': { es: 'Agregar seleccionados ({n})', en: 'Add selected ({n})' },

  'templates.empty': { es: 'Aún no tienes plantillas.', en: "You don't have any templates yet." },
  'templates.new': { es: '+ Nueva plantilla', en: '+ New template' },
  'templates.name': { es: 'Nombre', en: 'Name' },
  'templates.name_placeholder': { es: 'Ej. Recordatorio de pago', en: 'E.g. Payment reminder' },
  'templates.message_placeholder': { es: 'Escribe el mensaje de la plantilla...', en: 'Write the template message...' },
  'templates.missing_title': { es: 'Faltan datos', en: 'Missing details' },
  'templates.missing_body': { es: 'Escribe un nombre y el texto de la plantilla.', en: 'Enter a name and the template text.' },
  'templates.delete_title': { es: 'Eliminar plantilla', en: 'Delete template' },
  'templates.delete_body': { es: '¿Eliminar "{name}"?', en: 'Delete "{name}"?' },

  'occurrence.copy': { es: 'Copiar', en: 'Copy' },
  'occurrence.copied_title': { es: 'Copiado', en: 'Copied' },
  'occurrence.copied_body': { es: 'El mensaje se copió al portapapeles.', en: 'The message was copied to the clipboard.' },
  'occurrence.see_more': { es: 'Ver más', en: 'See more' },
  'occurrence.see_less': { es: 'Ver menos', en: 'See less' },
  'occurrence.share': { es: 'Compartir por otra app', en: 'Share with another app' },
  'occurrence.recipients': { es: 'Destinatarios', en: 'Recipients' },

  'settings.export_error_title': { es: 'No se pudo exportar', en: 'Could not export' },
  'settings.export_error_body': {
    es: 'Ocurrió un error al generar el archivo de backup.',
    en: 'An error occurred while creating the backup file.',
  },
  'settings.import_confirm_body': {
    es: 'Esto reemplaza todos los datos actuales (contactos, plantillas y mensajes programados) con los del archivo elegido. ¿Continuar?',
    en: 'This replaces all current data (contacts, templates and scheduled messages) with the chosen file. Continue?',
  },
  'settings.import_ok_body': { es: 'Los datos se restauraron desde el backup.', en: 'Your data was restored from the backup.' },
  'settings.import_invalid_title': { es: 'Archivo inválido', en: 'Invalid file' },
  'settings.import_invalid_body': {
    es: 'Ese archivo no es un backup válido de Message Alarm.',
    en: "That file isn't a valid Message Alarm backup.",
  },
  'settings.import_error_title': { es: 'No se pudo importar', en: 'Could not import' },
  'settings.import_error_body': {
    es: 'Ocurrió un error al leer el archivo de backup.',
    en: 'An error occurred while reading the backup file.',
  },

  'about.limit_title': { es: 'Una limitación honesta', en: 'An honest limitation' },
  'about.limit_body': {
    es: 'Ninguna integración (WhatsApp, Instagram, LinkedIn...) permite confirmar que un mensaje realmente se envió. Por eso el estado de cada destinatario lo marcas tú, no la app.',
    en: "No integration (WhatsApp, Instagram, LinkedIn...) can confirm that a message was really sent. That's why you mark each recipient's status yourself, not the app.",
  },

  'notification.title': { es: 'Mensaje programado', en: 'Scheduled message' },
  'notification.channel': { es: 'Alarmas de mensajes', en: 'Message alarms' },
};
