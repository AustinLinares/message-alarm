import { StyleSheet, Text, View } from 'react-native';
import { fontFamily } from '../../shared/theme/fonts';
import type { GradientId, ThemeId } from '../../shared/theme/themes';
import { GradientText } from '../../shared/ui/GradientText';
import { RadialGlow } from '../../shared/ui/RadialGlow';

// Miniatures from Apariencia.dc.html: each draws just a clock and a bar in the theme's own look.
export function ThemePreview({ id, gradient }: { id: ThemeId; gradient: GradientId }) {
  switch (id) {
    case 'indigo':
      return (
        <View style={[styles.base, { backgroundColor: '#F4F5F8', borderWidth: 1, borderColor: '#E3E4EC' }]}>
          <Text style={{ fontFamily: fontFamily('Space Grotesk', 600), fontSize: 34, letterSpacing: -1, color: '#14162B' }}>
            18:30
          </Text>
          <View style={{ height: 10, width: '70%', borderRadius: 6, backgroundColor: '#4338CA' }} />
        </View>
      );
    case 'suizo':
      return (
        <View style={[styles.base, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#0A0A0A', borderRadius: 0 }]}>
          <Text style={{ fontFamily: fontFamily('Inter Tight', 800), fontSize: 38, letterSpacing: -2, color: '#0A0A0A' }}>
            18:30
          </Text>
          <View style={{ height: 10, width: 10, borderRadius: 5, backgroundColor: '#FF4D00' }} />
        </View>
      );
    case 'cristal':
      return (
        <View style={[styles.base, { backgroundColor: '#0B1026' }]}>
          <RadialGlow
            glows={[
              { cx: '15%', cy: '10%', r: '70%', color: '#3B2D8F' },
              { cx: '90%', cy: '90%', r: '70%', color: '#0E6E8C' },
            ]}
          />
          <Text style={{ fontFamily: fontFamily('Outfit', 200), fontSize: 38, letterSpacing: -2, color: '#F4F6FF' }}>
            18:30
          </Text>
          <View style={{ height: 10, width: '70%', borderRadius: 6, backgroundColor: '#5EE6F0' }} />
        </View>
      );
    case 'bloqueo':
      return (
        <View style={[styles.base, { backgroundColor: '#0C0A11', alignItems: 'center' }]}>
          <RadialGlow glows={[{ cx: '50%', cy: '40%', r: '60%', color: '#FF6B8B', opacity: 0.3 }]} />
          <GradientText gradient={gradient} style={{ fontFamily: fontFamily('Nunito', 900), fontSize: 38, letterSpacing: -1 }}>
            18:30
          </GradientText>
          <View style={{ height: 10, width: '60%', borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.14)' }} />
        </View>
      );
  }
}

const styles = StyleSheet.create({
  base: { height: 120, paddingHorizontal: 14, borderRadius: 14, justifyContent: 'center', gap: 10, overflow: 'hidden' },
});
