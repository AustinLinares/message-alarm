import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { exportBackup, importBackup } from './backupService';

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [working, setWorking] = useState(false);

  async function handleExport() {
    setWorking(true);
    try {
      await exportBackup();
    } catch {
      Alert.alert('No se pudo exportar', 'Ocurrió un error al generar el archivo de backup.');
    } finally {
      setWorking(false);
    }
  }

  async function handleImport() {
    Alert.alert(
      'Importar backup',
      'Esto reemplaza todos los datos actuales (contactos, plantillas y mensajes programados) con los del archivo elegido. ¿Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Importar',
          style: 'destructive',
          onPress: async () => {
            setWorking(true);
            try {
              const result = await importBackup();
              if (result === 'imported') {
                Alert.alert('Listo', 'Los datos se restauraron desde el backup.');
              } else if (result === 'invalid') {
                Alert.alert('Archivo inválido', 'Ese archivo no es un backup válido de Message Alarm.');
              }
            } catch {
              Alert.alert('No se pudo importar', 'Ocurrió un error al leer el archivo de backup.');
            } finally {
              setWorking(false);
            }
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Backup</Text>
      <Text style={styles.description}>
        Todo se guarda solo en este dispositivo. Para llevar tus datos a otro celular, exporta un archivo y
        pásalo (por WhatsApp, correo, etc.) para importarlo allá.
      </Text>
      <TouchableOpacity style={styles.primaryButton} disabled={working} onPress={handleExport}>
        <Text style={styles.primaryButtonText}>Exportar backup</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} disabled={working} onPress={handleImport}>
        <Text style={styles.secondaryButtonText}>Importar backup</Text>
      </TouchableOpacity>

      {Platform.OS === 'android' && (
        <View style={styles.batteryCard}>
          <Text style={styles.label}>Alarmas confiables</Text>
          <Text style={styles.description}>
            Android puede retrasar o silenciar las alarmas para ahorrar batería. Para que suenen a tiempo,
            excluye la app de la optimización de batería desde sus ajustes.
          </Text>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => Linking.openSettings()}>
            <Text style={styles.secondaryButtonText}>Abrir ajustes de la app</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.aboutCard}>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('About')}>
          <Text style={styles.secondaryButtonText}>Acerca de Message Alarm</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 16 },
  description: { fontSize: 13, color: '#666', marginTop: 4, lineHeight: 18 },
  primaryButton: { backgroundColor: '#25D366', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 12 },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  secondaryButton: { backgroundColor: '#eee', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 },
  secondaryButtonText: { color: '#333', fontWeight: '600' },
  batteryCard: { marginTop: 28, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#eee' },
  aboutCard: { marginTop: 28, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#eee' },
});
