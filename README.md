# Message Alarm

Alternativa **gratuita** a WhatsApp Business para micro y pequeños emprendedores que no pueden costear un proveedor de mensajería.

La app **no envía mensajes automáticamente** (eso requiere APIs de pago). En su lugar, deja el mensaje listo y programado, dispara una **alarma** a la hora indicada y, con un toque, abre WhatsApp con el número y el texto precargados para que tú des el envío final.

## Características

- Mensajes programados con texto libre o desde **plantillas** reutilizables.
- Uno o varios destinatarios: número manual o selección múltiple desde la agenda del teléfono.
- Recurrencia opcional (diaria o semanal).
- Notificación local tipo alarma (sonido + vibración).
- Pantalla de ocurrencia: mensaje con copiar al portapapeles, botón "Enviar por WhatsApp" por destinatario y checklist manual de confirmados.
- Compartir por otras apps desde el share sheet del sistema.
- Backup local: exportar/importar todos tus datos como JSON.

## Principios

- **Todo local.** Sin backend, sin nube, sin cuentas. Tus datos nunca salen del teléfono.
- **Sin garantía de envío.** Ninguna integración permite verificar que un mensaje salió; "confirmado" es una marca manual tuya.
- **Simple y modular**, sin sobre-ingeniería.

Más detalle en [SPEC.md](SPEC.md).

## Stack

Expo (SDK 57) · React Native · TypeScript · `expo-sqlite` · `expo-notifications` · `expo-contacts` · `expo-linking` · `expo-sharing` · `expo-clipboard` · `expo-file-system` · React Navigation.

## Empezar

```bash
npm install
npm start        # Expo dev server
npm run android  # o: npm run ios
```

> Las notificaciones programadas y los contactos requieren un dispositivo o emulador real (no funcionan completos en web).

## Limitaciones conocidas

- Android puede retrasar alarmas por optimización de batería; la app te guía para excluirla.
- iOS limita a 64 notificaciones locales pendientes a la vez.

## Contribuir

Es un proyecto libre: issues y pull requests son bienvenidos.

## Licencia

[MIT](LICENSE) — úsalo, modifícalo y compártelo libremente.
