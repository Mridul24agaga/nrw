import DirectMessages from "../components/chat/direct-messages"

export default function ChatPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      <DirectMessages />
    </div>
  )
}

