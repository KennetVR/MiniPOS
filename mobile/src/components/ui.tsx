import type { PropsWithChildren, ReactElement, ReactNode } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type RefreshControlProps, type TextInputProps, type ViewStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export const colors = {
  background: '#f8fafc',
  surface: '#ffffff',
  border: '#dbe4ee',
  text: '#0f172a',
  muted: '#64748b',
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  danger: '#b91c1c',
  dangerBackground: '#fee2e2',
  success: '#047857',
  warning: '#b45309',
  warningBackground: '#fef3c7'
} as const

export function Screen({ children, scroll = true, style, refreshControl }: PropsWithChildren<{ scroll?: boolean; style?: ViewStyle; refreshControl?: ReactElement<RefreshControlProps> }>) {
  const content = scroll
    ? <ScrollView contentContainerStyle={[styles.scrollContent, style]} keyboardShouldPersistTaps="handled" refreshControl={refreshControl}>{children}</ScrollView>
    : <View style={[styles.fixedContent, style]}>{children}</View>

  return <SafeAreaView style={styles.safeArea}>{content}</SafeAreaView>
}

export function Header({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerCopy}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  )
}

export function Card({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return <View style={[styles.card, style]}>{children}</View>
}

export function Button({ label, onPress, disabled = false, variant = 'primary' }: { label: string; onPress: () => void; disabled?: boolean; variant?: 'primary' | 'secondary' | 'danger' }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.secondaryButton,
        variant === 'danger' && styles.dangerButton,
        pressed && !disabled && styles.pressedButton,
        disabled && styles.disabledButton
      ]}
    >
      <Text style={[styles.buttonText, variant !== 'primary' && styles.darkButtonText]}>{label}</Text>
    </Pressable>
  )
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor="#94a3b8"
        style={[styles.input, props.multiline && styles.multilineInput, props.style]}
      />
    </View>
  )
}

export function Notice({ children, tone = 'danger' }: PropsWithChildren<{ tone?: 'danger' | 'warning' | 'success' }>) {
  return <Text style={[styles.notice, tone === 'warning' && styles.warningNotice, tone === 'success' && styles.successNotice]}>{children}</Text>
}

export function Loading({ label = 'Cargando...' }: { label?: string }) {
  return <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={styles.muted}>{label}</Text></View>
}

export function EmptyState({ label }: { label: string }) {
  return <Text style={styles.empty}>{label}</Text>
}

export const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 20, gap: 16 },
  fixedContent: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  headerCopy: { flex: 1, gap: 4 },
  title: { color: colors.text, fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 21 },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  button: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 12, justifyContent: 'center', minHeight: 48, paddingHorizontal: 18 },
  secondaryButton: { backgroundColor: '#e2e8f0' },
  dangerButton: { backgroundColor: colors.danger },
  pressedButton: { opacity: 0.78 },
  disabledButton: { opacity: 0.45 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  darkButtonText: { color: colors.text },
  fieldGroup: { gap: 7 },
  fieldLabel: { color: colors.text, fontSize: 14, fontWeight: '700' },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 10, borderWidth: 1, color: colors.text, fontSize: 16, minHeight: 48, paddingHorizontal: 14 },
  multilineInput: { minHeight: 90, paddingTop: 12, textAlignVertical: 'top' },
  notice: { backgroundColor: colors.dangerBackground, borderRadius: 10, color: colors.danger, fontSize: 14, lineHeight: 20, padding: 12 },
  warningNotice: { backgroundColor: colors.warningBackground, color: colors.warning },
  successNotice: { backgroundColor: '#d1fae5', color: colors.success },
  loading: { alignItems: 'center', flex: 1, gap: 12, justifyContent: 'center' },
  muted: { color: colors.muted, fontSize: 15 },
  empty: { color: colors.muted, fontSize: 16, paddingVertical: 28, textAlign: 'center' },
  statValue: { color: colors.text, fontSize: 24, fontWeight: '800' },
  statLabel: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  rowBetween: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { flexBasis: '47%', flexGrow: 1, minWidth: 140 },
  productCopy: { flex: 1, gap: 4 },
  listRow: { borderBottomColor: colors.border, borderBottomWidth: 1, paddingVertical: 10 },
  quantityControls: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  quantityButton: { alignItems: 'center', backgroundColor: '#e2e8f0', borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  total: { color: colors.text, fontSize: 24, fontWeight: '800', textAlign: 'right' },
  paymentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  paymentOption: { borderColor: colors.border, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  selectedPayment: { backgroundColor: '#dbeafe', borderColor: colors.primary },
  selectedPaymentText: { color: colors.primaryDark, fontSize: 13, fontWeight: '700' },
  scannerCard: { minHeight: 300 },
  scanner: { borderRadius: 12, flex: 1, minHeight: 240, overflow: 'hidden' },
  dangerLink: { color: colors.danger, fontSize: 14, fontWeight: '700' },
  statusLink: { fontSize: 14, fontWeight: '700' },
  settingRow: { borderTopColor: colors.border, borderTopWidth: 1, marginTop: 12, paddingTop: 12 },
  divider: { backgroundColor: colors.border, height: 1 },
  smallText: { color: colors.muted, fontSize: 13 },
  strong: { color: colors.text, fontSize: 16, fontWeight: '700' }
})
