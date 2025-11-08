import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Training from "./Training";
import Orders from "./Orders";
import "./style.css";


const API = process.env.REACT_APP_API || "https://flowmind-chat.onrender.com";

function App() {
  const [tab, setTab] = useState("chat");
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [search, setSearch] = useState("");
  const [theme, setTheme] = useState("light"); // light | dark
  const endRef = useRef(null);

  // Theme hook
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Load messages
  const loadMessages = async () => {
    try {
      const res = await axios.get(`${API}/api/messages`);
      setMessages(res.data);
    } catch (e) {
      console.error("⚠️ Could not load messages");
    }
  };

  useEffect(() => {
    loadMessages();
    const t = setInterval(loadMessages, 4000);
    return () => clearInterval(t);
  }, []);

  // Scroll bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, tab]);

  // Send reply
  const sendReply = async () => {
    if (!replyText.trim()) return;
    try {
      await axios.post(`${API}/send-reply`, { text: replyText });
      setReplyText("");
      loadMessages();
    } catch (e) {
      console.error("❌ Reply failed:", e.message);
    }
  };

  return (
    <div className="fm-app">
      {/* Sidebar */}
      <aside className="fm-sidebar glass">
        <div className="brand">
          <div className="dot" />
          <h1>FlowMind</h1>
        </div>

        <nav>
          <button
            className={tab === "chat" ? "active" : ""}
            onClick={() => setTab("chat")}
          >
            💬 Conversations
          </button>
          <button
            className={tab === "training" ? "active" : ""}
            onClick={() => setTab("training")}
          >
            🧠 Business Training
          </button>
          <button
            className={tab === "orders" ? "active" : ""}
            onClick={() => setTab("orders")}
          >
            📦 Orders
          </button>
        </nav>

        <div className="theme-toggle">
          <span>Theme</span>
          <div
            className="toggle"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            <div className={`knob ${theme}`} />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="fm-main">
        {/* Top Search */}
        {tab === "chat" && (
          <div className="fm-top glass">
            <input
              placeholder="Search messages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        )}

        {/* Dynamic Panels */}
        <section className="fm-panel glass">
          {tab === "training" ? (
            <Training />
          ) : tab === "orders" ? (
            <Orders />
          ) : (
            <>
              {/* Chat Messages */}
              <div className="chat-list">
                {messages
                  .filter(
                    (m) =>
                      m.text?.toLowerCase().includes(search.toLowerCase()) ||
                      m.from?.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((m, i) => (
                    <div
                      key={i}
                      className={`msg ${
                        m.from === "FlowMind AI" ? "bot" : "user"
                      }`}
                    >
                      <div className="from">
                        <span>{m.from}</span>
                        <span className="time">
                          {new Date(m.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="text">{m.text}</div>
                    </div>
                  ))}
                <div ref={endRef} />
              </div>

              {/* Reply Box */}
              <div className="fm-reply">
                <input
                  placeholder="Type a reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendReply()}
                />
                <button onClick={sendReply}>Send</button>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
