import { SafeAreaView, View, Text } from 'react-native'

export default function Profile() {
  return (
    <SafeAreaView className="flex flex-1 bg-white">
      <View className="flex-1 items-center justify-center">
        <Text className="text-xl font-bold text-primary-500">
          Profile works!
        </Text>
      </View>
    </SafeAreaView>
  )
}
