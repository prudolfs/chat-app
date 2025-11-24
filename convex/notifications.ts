import { action } from './_generated/server'
import { v } from 'convex/values'
import { api } from './_generated/api'

type Participant = {
  userId: string
  profile: {
    pushToken?: string
    isOnline?: boolean
  } | null
}

type NotificationRecipient = {
  to: string
  sound: string
  title: string
  body: string
  data: {
    chatRoomId: string // Serialized as string for notification payload
    type: string
  }
}

type NotificationResponse = {
  sent: number
  error?: string
}

type ExpoPushResponse = {
  data?: Array<{ status: string }>
}

/**
 * Send push notifications to all users in a chat room except the sender
 */
export const sendPushNotifications = action({
  args: {
    chatRoomId: v.id('chatRooms'),
    senderId: v.string(),
    messageText: v.string(),
    senderName: v.string(),
  },
  handler: async (
    ctx,
    { chatRoomId, senderId, messageText, senderName },
  ): Promise<NotificationResponse> => {
    // Get all participants in the chat room
    const participants = (await ctx.runQuery(
      api.chatRooms.getChatRoomParticipants,
      {
        chatRoomId,
      },
    )) as Participant[] | null

    if (!participants) {
      return { sent: 0 }
    }

    // Filter out the sender and only send to offline users (app closed/backgrounded)
    // Users with app open will see messages in real-time, so no push notification needed
    const recipients: NotificationRecipient[] = participants
      .filter(
        (p: Participant) =>
          p.userId !== senderId && p.profile?.pushToken && !p.profile.isOnline, // Only send to offline users
      )
      .map((p: Participant) => ({
        to: p.profile!.pushToken!,
        sound: 'default',
        title: senderName,
        body:
          messageText.length > 100
            ? messageText.substring(0, 100) + '...'
            : messageText,
        data: {
          chatRoomId: chatRoomId as string,
          type: 'message',
        },
      }))

    if (recipients.length === 0) {
      return { sent: 0 }
    }

    // Send push notifications via Expo's API
    try {
      const response: Response = await fetch(
        'https://exp.host/--/api/v2/push/send',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'Accept-Encoding': 'gzip, deflate',
          },
          body: JSON.stringify(recipients),
        },
      )

      if (!response.ok) {
        console.error(
          'Failed to send push notifications:',
          await response.text(),
        )
        return { sent: 0, error: 'Failed to send notifications' }
      }

      const result = (await response.json()) as ExpoPushResponse
      const successCount =
        result.data?.filter((r: { status: string }) => r.status === 'ok')
          .length || 0

      return { sent: successCount }
    } catch (error) {
      console.error('Error sending push notifications:', error)
      return { sent: 0, error: String(error) }
    }
  },
})
