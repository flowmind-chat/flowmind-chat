import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "./style.css";
import Training from "./Training";

const API = "http://localhost:7000";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [compose, setCompose] = useState("");
  const [tab, setTab] = useState("chat");
  const [menuOpen, setMenuOpen] = useState(false);
  const endRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const r = await axios.get(`${API}/api/messages`);
      setMessages(r.data);
    } catch {
      console.error("⚠️ Could not load messages");
    }
  };

  useEffect(() => {
    fetchMessages();
    const i = setInterval(fetchMessages, 4000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeThread]);

  const send = async () => {
    if (!activeThread || !compose.trim()) return;
    try {
      await axios.post(`${API}/send-reply`, {
        to: activeThread,
        text: compose,
      });
      setCompose("");
      fetchMessages();
    } catch (err) {
      console.error("❌ Send failed:", err.message);
    }
  };

  if (tab === "training") return <Training goBack={() => setTab("chat")} />;

  const threads = [...new Set(messages.map((m) => m.from))];

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <header className="sidebar-header">
          <h2>📞 Threads</h2>
          <button
            className="menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ☰
          </button>
        </header>
        <div className="thread-list">
          {threads.map((num) => (
            <div
              key={num}
              className={`thread ${num === activeThread ? "active" : ""}`}
              onClick={() => {
                setActiveThread(num);
                setMenuOpen(false);
              }}
            >
              {num}
            </div>
          ))}
        </div>
      </aside>

      {/* Chat Section */}
      <main className="chatbox">
        <header>
          <h2>💬 FlowMind Chat</h2>
          <button onClick={() => setTab("training")}>🧠 Training</button>
        </header>

        <section className="messages">
          {activeThread ? (
            messages
              .filter((m) => m.from === activeThread || m.from === "FlowMind AI")
              .map((m, i) => (
                <div
                  key={i}
                  className={`msg ${
                    m.from === "FlowMind AI" ? "bot" : "user"
                  }`}
                >
                  <div className="meta">
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
              ))
          ) : (
            <p className="empty">Select a thread to start chatting</p>
          )}
          <div ref={endRef} />
        </section>

        {activeThread && (
          <footer>
            <input
              type="text"
              value={compose}
              placeholder="Type reply..."
              onChange={(e) => setCompose(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <button onClick={send}>Send</button>
          </footer>
        )}
      </main>
    </div>
  );
}
