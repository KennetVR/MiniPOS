import { useCallback, useEffect, useRef, useState, type PropsWithChildren, type ReactElement, type ReactNode, type Ref } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type RefreshControlProps, type TextInputProps, type ViewStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export const colors = {
  background: '#f1f5f9',
  surface: '#ffffff',
  surfaceMuted: '#f8fafc',
  border: '#e2e8f0',
  borderStrong: '#cbd5e1',
  text: '#0f172a',
  muted: '#64748b',
  subtle: '#94a3b8',
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  primarySoft: '#dbeafe',
  danger: '#b91c1c',
  dangerBackground: '#fee2e2',
  success: '#047857',
  successBackground: '#d1fae5',
  warning: '#b45309',
  warningBackground: '#fef3c7'
} as const

type ScreenProps = PropsWithChildren<{
  scroll?: boolean
  style?: ViewStyle
  refreshControl?: ReactElement<RefreshControlProps>
  /** Content pinned to the bottom; it stays visible above the keyboard. */
  footer?: ReactNode
}>

/**
 * Base screen. Uses KeyboardAvoidingView with an offset measured from the real window
 * position, so it works both in tab screens and in stack screens with a native header.
 */
export function Screen({ children, scroll = true, style, refreshControl, footer }: ScreenProps) {
  const containerRef = useRef<View>(null)
  const [offset, setOffset] = useState(0)

  const measure = useCallback(() => {
    containerRef.current?.measureInWindow((_x, y) => {
      if (Number.isFinite(y)) setOffset(Math.max(0, y))
    })
  }, [])

  const content = scroll
    ? (
      <ScrollView
        contentContainerStyle={[styles.scrollContent, style]}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
        style={styles.flex}
      >
        {children}
      </ScrollView>
    )
    : <View style={[styles.fixedContent, style]}>{children}</View>

  return (
    <SafeAreaView style={styles.safeArea}>
      <View collapsable={false} onLayout={measure} ref={containerRef} style={styles.flex}>
        <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={offset} style={styles.flex}>
          {content}
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  )
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

export function Button({ label, onPress, disabled = false, variant = 'primary', style }: { label: string; onPress: () => void; disabled?: boolean; variant?: 'primary' | 'secondary' | 'danger'; style?: ViewStyle }) {
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
        disabled && styles.disabledButton,
        style
      ]}
    >
      <Text style={[styles.buttonText, variant === 'secondary' && styles.darkButtonText]}>{label}</Text>
    </Pressable>
  )
}

type FieldProps = TextInputProps & { label: string; hint?: string; containerStyle?: ViewStyle; ref?: Ref<TextInput> }

export function Field({ label, hint, containerStyle, ref, ...props }: FieldProps) {
  const [focused, setFocused] = useState(false)
  return (
    <View style={[styles.fieldGroup, containerStyle]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        {...props}
        onBlur={(event) => { setFocused(false); props.onBlur?.(event) }}
        onFocus={(event) => { setFocused(true); props.onFocus?.(event) }}
        placeholderTextColor={colors.subtle}
        ref={ref}
        style={[styles.input, focused && styles.inputFocused, props.multiline && styles.multilineInput, props.style]}
      />
      {hint ? <Text style={styles.smallText}>{hint}</Text> : null}
    </View>
  )
}

export function FieldRow({ children }: PropsWithChildren) {
  return <View style={styles.fieldRow}>{children}</View>
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressedButton]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  )
}

export function Notice({ children, tone = 'danger' }: PropsWithChildren<{ tone?: 'danger' | 'warning' | 'success' }>) {
  return <Text style={[styles.notice, tone === 'warning' && styles.warningNotice, tone === 'success' && styles.successNotice]}>{children}</Text>
}

export type ToastMessage = { tone: 'danger' | 'success' | 'warning'; text: string } | null

/** Auto-dismissing message state; success and warning hide after a few seconds. */
export function useToast() {
  const [toast, setToast] = useState<ToastMessage>(null)
  useEffect(() => {
    if (!toast || toast.tone === 'danger') return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])
  return [toast, setToast] as const
}

export function Toast({ toast, onDismiss }: { toast: ToastMessage; onDismiss: () => void }) {
  if (!toast) return null
  return (
    <Pressable accessibilityHint="Toca para cerrar" accessibilityRole="alert" onPress={onDismiss}>
      <Notice tone={toast.tone}>{toast.text}</Notice>
    </Pressable>
  )
}

export function Loading({ label = 'Cargando...' }: { label?: string }) {
  return <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={styles.muted}>{label}</Text></View>
}

export function EmptyState({ label }: { label: string }) {
  return <Text style={styles.empty}>{label}</Text>
}

export function formatMoney(value: number): string {
  return `S/ ${(Number.isFinite(value) ? value : 0).toFixed(2)}`
}

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 24 },
  fixedContent: { flex: 1, padding: 16, gap: 12 },
  footer: { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  headerCopy: { flex: 1, gap: 2 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  button: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 12, justifyContent: 'center', minHeight: 50, paddingHorizontal: 18 },
  secondaryButton: { backgroundColor: '#e2e8f0' },
  dangerButton: { backgroundColor: colors.danger },
  pressedButton: { opacity: 0.75 },
  disabledButton: { opacity: 0.45 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  darkButtonText: { color: colors.text },
  fieldGroup: { gap: 6 },
  fieldRow: { flexDirection: 'row', gap: 12 },
  fieldLabel: { color: colors.text, fontSize: 13, fontWeight: '700' },
  input: { backgroundColor: colors.surface, borderColor: colors.borderStrong, borderRadius: 12, borderWidth: 1, color: colors.text, fontSize: 16, minHeight: 50, paddingHorizontal: 14 },
  inputFocused: { borderColor: colors.primary, borderWidth: 2, paddingHorizontal: 13 },
  multilineInput: { minHeight: 84, paddingTop: 12, textAlignVertical: 'top' },
  chip: { borderColor: colors.borderStrong, borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: colors.surface },
  chipSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  chipTextSelected: { color: colors.primaryDark, fontWeight: '700' },
  notice: { backgroundColor: colors.dangerBackground, borderRadius: 12, color: colors.danger, fontSize: 14, lineHeight: 20, padding: 12, overflow: 'hidden' },
  warningNotice: { backgroundColor: colors.warningBackground, color: colors.warning },
  successNotice: { backgroundColor: colors.successBackground, color: colors.success },
  loading: { alignItems: 'center', flex: 1, gap: 12, justifyContent: 'center' },
  muted: { color: colors.muted, fontSize: 15 },
  empty: { color: colors.muted, fontSize: 15, paddingVertical: 24, textAlign: 'center' },
  statValue: { color: colors.text, fontSize: 24, fontWeight: '800' },
  statLabel: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  rowBetween: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { flexBasis: '47%', flexGrow: 1, minWidth: 140 },
  productCopy: { flex: 1, gap: 3 },
  listRow: { borderBottomColor: colors.border, borderBottomWidth: 1, paddingVertical: 10 },
  quantityControls: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  quantityButton: { alignItems: 'center', backgroundColor: '#e2e8f0', borderRadius: 22, height: 44, justifyContent: 'center', width: 44 },
  quantityText: { color: colors.text, fontSize: 18, fontWeight: '800', minWidth: 28, textAlign: 'center' },
  total: { color: colors.text, fontSize: 24, fontWeight: '800', textAlign: 'right' },
  paymentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  paymentOption: { borderColor: colors.border, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  selectedPayment: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
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
