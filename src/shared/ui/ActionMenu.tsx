import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export interface ActionMenuItem {
  key: string;
  label: string;
  icon?: ReactNode;
  destructive?: boolean;
  onPress: () => void;
}

interface ActionMenuProps {
  visible: boolean;
  items: ActionMenuItem[];
  onClose: () => void;
}

export function ActionMenu({ visible, items, onClose }: ActionMenuProps) {
  const theme = useTheme();
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close">
        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.color.surface, borderRadius: theme.radius.cardLarge },
          ]}
        >
          {items.map((item, index) => (
            <Pressable
              key={item.key}
              accessibilityRole="menuitem"
              onPress={() => {
                onClose();
                item.onPress();
              }}
              style={[
                styles.item,
                index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.color.divider },
              ]}
            >
              {item.icon}
              <Text
                style={{
                  fontFamily: theme.font.body(600),
                  fontSize: 16,
                  color: item.destructive ? theme.color.danger : theme.color.text,
                  flexShrink: 1,
                }}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(20,22,43,0.45)', justifyContent: 'flex-end', padding: 16 },
  sheet: { overflow: 'hidden' },
  item: { minHeight: 56, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
});
