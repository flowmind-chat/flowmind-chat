import React, { useEffect, useState } from "react";
import axios from "axios";
const API = "http://localhost:7000";

export default function Training() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios
      .get(`${API}/api/knowledge`)
      .then((r) => {
        setData(r.data);
        setLoading(false);
      })
      .catch(() => alert("⚠️ Could not load knowledge base."));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await axios.post(`${API}/api/knowledge`, data);
      alert("✅ Business knowledge updated!");
    } catch {
      alert("❌ Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
  if (!data) return <div style={{ padding: 20 }}>No data found.</div>;

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ color: "#2D68C4" }}>🧠 FlowMind AI Business Trainer</h2>

      <section style={{ marginTop: 20 }}>
        <h3>🏢 Company Info</h3>
        <input
          style={{ display: "block", marginBottom: 10, width: "80%" }}
          placeholder="Company Name"
          value={data.company.name}
          onChange={(e) =>
            setData({ ...data, company: { ...data.company, name: e.target.value } })
          }
        />
        <textarea
          style={{ display: "block", marginBottom: 10, width: "80%", height: 60 }}
          placeholder="Mission"
          value={data.company.mission}
          onChange={(e) =>
            setData({ ...data, company: { ...data.company, mission: e.target.value } })
          }
        />
        <input
          style={{ display: "block", marginBottom: 20, width: "80%" }}
          placeholder="Tone"
          value={data.company.tone}
          onChange={(e) =>
            setData({ ...data, company: { ...data.company, tone: e.target.value } })
          }
        />
      </section>

      <section>
        <h3>📝 Important Notes</h3>
        <textarea
          style={{
            display: "block",
            marginBottom: 20,
            width: "80%",
            height: 100,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            padding: "8px",
          }}
          placeholder="Add key notes or reminders for FlowMind AI..."
          value={data.notes || ""}
          onChange={(e) => setData({ ...data, notes: e.target.value })}
        />
      </section>

      <section>
        <h3>📦 Products</h3>
        {data.products.map((p, i) => (
          <div
            key={i}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: 10,
              marginBottom: 10,
              width: "85%",
            }}
          >
            <input
              style={{ display: "block", marginBottom: 6, width: "100%" }}
              value={p.name}
              onChange={(e) => {
                const updated = [...data.products];
                updated[i].name = e.target.value;
                setData({ ...data, products: updated });
              }}
            />
            <textarea
              style={{ display: "block", marginBottom: 6, width: "100%", height: 60 }}
              value={p.description}
              onChange={(e) => {
                const updated = [...data.products];
                updated[i].description = e.target.value;
                setData({ ...data, products: updated });
              }}
            />
            <input
              type="number"
              style={{ display: "block", marginBottom: 6, width: "100%" }}
              value={p.price}
              onChange={(e) => {
                const updated = [...data.products];
                updated[i].price = Number(e.target.value);
                setData({ ...data, products: updated });
              }}
            />
          </div>
        ))}
      </section>

      <section>
        <h3>❓ FAQs</h3>
        {data.faq.map((f, i) => (
          <div
            key={i}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: 10,
              marginBottom: 10,
              width: "85%",
            }}
          >
            <input
              style={{ display: "block", marginBottom: 6, width: "100%" }}
              value={f.question}
              onChange={(e) => {
                const updated = [...data.faq];
                updated[i].question = e.target.value;
                setData({ ...data, faq: updated });
              }}
            />
            <textarea
              style={{ display: "block", marginBottom: 6, width: "100%", height: 60 }}
              value={f.answer}
              onChange={(e) => {
                const updated = [...data.faq];
                updated[i].answer = e.target.value;
                setData({ ...data, faq: updated });
              }}
            />
          </div>
        ))}
      </section>

      <button
        style={{
          background: "#2D68C4",
          color: "white",
          padding: "10px 20px",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          marginTop: 10,
        }}
        onClick={save}
        disabled={saving}
      >
        {saving ? "Saving..." : "💾 Save Knowledge"}
      </button>
    </div>
  );
}
