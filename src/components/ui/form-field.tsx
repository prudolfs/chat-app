import { View, Text, TextInput } from 'react-native'

export function FormField({
  label,
  ...props
}: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View>
      <Text className="mb-2 font-medium text-secondary-700">{label}</Text>
      <TextInput
        className="rounded-xl border border-secondary-300 bg-white px-4 py-3 text-base"
        {...props}
      />
    </View>
  )
}
