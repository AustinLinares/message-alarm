import { ScrollView, StyleSheet, Text, View } from 'react-native';

interface Section {
  title: string;
  body: string;
}

const SECTIONS: Section[] = [
  {
    title: 'El problema',
    body:
      'WhatsApp Business API cobra por conversación, y las alternativas gratuitas de mensajería automatizada ' +
      'suelen terminar bloqueadas después de enviar algunos mensajes. Para un negocio que recién empieza, ' +
      'ninguna de las dos opciones es realista.',
  },
  {
    title: 'La idea',
    body:
      'Message Alarm no envía mensajes por ti — eso requeriría una API paga. En vez de eso, te ayuda a dejar el ' +
      'mensaje listo, programar una alarma, y con un toque abrir WhatsApp (u otra app) con el número y el texto ' +
      'ya cargados. El envío final siempre lo confirmas tú.',
  },
  {
    title: '¿Para quién es?',
    body:
      'Está pensada para micro y pequeños emprendedores que están iniciando y todavía no pueden costear un ' +
      'proveedor de mensajería o una integración empresarial. No busca reemplazar una solución de mensajería ' +
      'masiva para empresas grandes.',
  },
  {
    title: 'Privacidad',
    body:
      'Todo se guarda solo en este dispositivo. No hay backend ni nube, y los mensajes que compones no se ' +
      'comparten con nadie más que contigo. Para llevar tus datos a otro celular, usa el backup manual en Ajustes.',
  },
  {
    title: 'Una limitación honesta',
    body:
      'Ninguna integración (WhatsApp, Instagram, LinkedIn...) permite confirmar que un mensaje realmente se ' +
      'envió. Por eso el check de "confirmado" en cada destinatario lo marcas tú mismo, no la app.',
  },
];

export function AboutScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>
        Una alternativa gratuita a WhatsApp Business, pensada para negocios que recién empiezan.
      </Text>
      {SECTIONS.map((section) => (
        <View key={section.title} style={styles.card}>
          <Text style={styles.cardTitle}>{section.title}</Text>
          <Text style={styles.cardBody}>{section.body}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, gap: 12 },
  intro: { fontSize: 15, fontWeight: '600', color: '#111', lineHeight: 21, marginBottom: 4 },
  card: { backgroundColor: '#f2f2f2', borderRadius: 12, padding: 16 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#128C7E', marginBottom: 6 },
  cardBody: { fontSize: 14, color: '#333', lineHeight: 20 },
});
