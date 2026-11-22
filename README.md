# Message Alarm

A **free** alternative to WhatsApp Business for micro and small business owners who can't afford a messaging provider.

The app does **not** send messages automatically (that requires paid APIs). Instead, it gets your message ready and scheduled, fires an **alarm** at the right time, and with one tap opens WhatsApp (or another app) with the number and text already filled in, so you just hit send.

## Why this exists

The WhatsApp Business API charges per conversation, and free automated-messaging alternatives tend to get blocked after a few messages. For a business that is just starting out, neither option is realistic.

Message Alarm takes a different approach: it doesn't try to automate the send, it removes everything around it (remembering, finding the contact, retyping the message), and leaves the final send to you. That keeps it free, and keeps your number safe from bans.

It's built for micro and small entrepreneurs, not as a replacement for bulk-messaging solutions for large companies.

## Why local?

Messages to your customers are private, and we chose not to take that away from you. Message Alarm has no server, no accounts and no cloud sync, so there is nothing for us to collect, store or share:

- **You own your data.** Messages, templates and contacts live only in a local database on your phone.
- **Nothing is shared.** The text you write is never sent to us or to any third party. The only time it leaves the app is when you tap send and hand it to WhatsApp (or the share sheet) yourself.
- **Contacts are copied, not synced.** Picked contacts are stored as a local snapshot; the app never keeps a live link to your address book.
- **You decide when data moves.** Switching phones is a manual JSON export/import that you control, with no hidden uploads.

The trade-off is that there is no automatic cross-device sync. We think that's worth it for full control over your data.

## Features

- Scheduled messages with free text or reusable **templates**.
- One or many recipients: type a number or multi-select from your phone's contacts.
- Optional recurrence (daily or weekly).
- Local alarm-style notification (sound + vibration).
- Occurrence screen: copy the message, "Send via WhatsApp" button per recipient, and a manual checklist of who you've confirmed.
- Share through other apps via the system share sheet.
- Local backup: export/import all your data as JSON.

## Principles

- **Everything is local.** No backend, no cloud, no accounts. Your data never leaves your phone.
- **No delivery guarantee.** No integration can verify a message was actually sent; "confirmed" is a manual mark made by you.
- **Simple and modular**, without over-engineering.

See [SPEC.md](SPEC.md) for details (in Spanish).

## Tech stack

Expo (SDK 57) · React Native · TypeScript · `expo-sqlite` · `expo-notifications` · `expo-contacts` · `expo-linking` · `expo-sharing` · `expo-clipboard` · `expo-file-system` · React Navigation.

## Getting started

```bash
npm install
npm start        # Expo dev server
npm run android  # or: npm run ios
```

> Scheduled notifications and contacts need a real device or emulator; they don't fully work on web.

## Known limitations

- Android may delay alarms due to battery optimization; the app guides you to exclude it.
- iOS limits the number of pending local notifications to 64.

## Contributing

This is a free and open project. Issues and pull requests are welcome.

## License

[MIT](LICENSE): use it, modify it and share it freely.
