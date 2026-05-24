import { useEffect, useState } from "react";
import { sendChatMessage, sendPublicChatMessage, fetchChatbotInfo } from "@/api/ordersApi";

function ChatbotWidget() {

  const [isOpen, setIsOpen] = useState(false);

  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadInfo = async () => {
      try {
        await fetchChatbotInfo();
      } catch (error) {
        console.warn("Chatbot info unavailable", error);
      }
    };

    loadInfo();
  }, []);

  const sendMessage = async () => {

    if (!message.trim()) return;

    const userMessage = {
      role: "user",
      text: message
    };

    setMessages((prev) => [...prev, userMessage]);

    setLoading(true);

    try {
      // Use authenticated chat if access token exists, otherwise use public chat
      const hasToken = !!localStorage.getItem('access_token')
      const apiCall = hasToken ? sendChatMessage : sendPublicChatMessage

      const res = await apiCall(message)

      const botMessage = {
        role: "assistant",
        text: res.data.assistant?.message || res.data.response || "No response received.",
        sources: res.data.sources || []
      };

      setMessages((prev) => [...prev, botMessage]);

    } catch (error) {

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Server error."
        }
      ]);

    }

    setMessage("");

    setLoading(false);
  };

  return (
    <>
      {/* Floating Button */}
          <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          border: "none",
          backgroundColor: "#2563eb",
          color: "white",
          fontSize: "24px",
          cursor: "pointer",
          zIndex: 9999
        }}
      >
        💬
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "90px",
            right: "20px",
            width: "350px",
            height: "500px",
            backgroundColor: "white",
            border: "1px solid #ccc",
            borderRadius: "10px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 9999,
            boxShadow: "0 0 10px rgba(0,0,0,0.2)"
          }}
        >

          {/* Header */}
          <div
            style={{
              padding: "15px",
              backgroundColor: "#2563eb",
              color: "white",
              fontWeight: "bold"
            }}
          >
            AI Assistant
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              padding: "10px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "10px"
            }}
          >

            {messages.map((msg, index) => (

              <div
                key={index}
                style={{
                  alignSelf:
                    msg.role === "user"
                        ? "flex-end"
                        : "flex-start",

                    backgroundColor:
                      msg.role === "user"
                        ? "#2563eb"
                        : "#f1f1f1",

                    color:
                      msg.role === "user"
                        ? "white"
                        : "black",

                  padding: "10px",
                  borderRadius: "10px",
                  maxWidth: "80%"
                }}
              >
                <div>{msg.text}</div>
                {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#333' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 4 }}>Source{msg.sources.length>1? 's':''}:</div>
                    <ul style={{ paddingLeft: 18, margin: 0 }}>
                      {msg.sources.map((s, i) => (
                        <li key={i} style={{ marginBottom: 2 }}>
                          <a href={s} target="_blank" rel="noreferrer">{s}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

            ))}

            {loading && (
              <div>
                AI is typing...
              </div>
            )}

          </div>

          {/* Input */}
          <div
            style={{
              display: "flex",
              padding: "10px",
              borderTop: "1px solid #ccc"
            }}
          >

            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type message..."
              style={{
                flex: 1,
                padding: "10px"
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
            />

            <button
              onClick={sendMessage}
              style={{
                marginLeft: "10px",
                padding: "10px 15px",
                backgroundColor: "#2563eb",
                color: "white",
                border: "none",
                cursor: "pointer"
              }}
            >
              Send
            </button>

          </div>

        </div>
      )}
    </>
  );
}

export default ChatbotWidget;