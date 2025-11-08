import React, { useState, useEffect } from "react";
import axios from "axios";

const API = "http://localhost:7000";

export default function Training({ goBack }) {
  const [data, setData] = useState({
    company: { name: "", tone: "" },
    notes: "",
    products: [],
    faq: [],
  });
  const [status, setStatus] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await axios.get(`${API}/api/knowledge`);
      setData(res.data);
    } catch {
      setStatus("⚠️ Could not load knowledge base");
    }
  };

  const save = async () => {
    try {
      await axios.post(`${API}/api/knowledge`, data);
      setStatus("✅ Knowledge base saved successfully");
    } catch {
      setStatus("❌ Error saving knowledge base");
    }
  };

  const updateField = (path, value) => {
    setData((prev) => {
      const newData = { ...prev };
      const keys = path.split(".");
      let obj = newData;
      keys.slice(0, -1).forEach((key) => {
        obj[key] = obj[key] || {};
        obj = obj[key];
      });
      obj[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const addProduct = () =>
    setData((p) => ({
      ...p,
      products: [...p.products, { name: "", description: "", price: "" }],
    }));

  const addFAQ = () =>
    setData((p) => ({
      ...p,
      faq: [...p.faq, { question: "", answer: "" }],
    }));

  return (
    <div className="training glass">
      <div className="training-header">
        <h2>Business Training</h2>
        <p className="sub">Train FlowMind to understand your business better.</p>
      </div>

      <div className="training-inner">
        <div className="grid">
          {/* Company Info */}
          <div className="card">
            <h3>🏢 Company Info</h3>
            <label>Business Name</label>
            <input
              value={data.company.name}
              onChange={(e) => updateField("company.name", e.target.value)}
              placeholder="e.g. FlowMind Technologies"
            />
            <label>AI Tone / Voice</label>
            <input
              value={data.company.tone}
              onChange={(e) => updateField("company.tone", e.target.value)}
              placeholder="e.g. Professional, Friendly"
            />
          </div>

          {/* Important Notes */}
          <div className="card">
            <h3>🧠 Important Notes</h3>
            <label>Internal notes for AI</label>
            <textarea
              value={data.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Write specific details FlowMind should always remember..."
            />
          </div>

          {/* Products Section */}
          <div className="card">
            <h3>🛍️ Products / Services</h3>
            {data.products.map((p, i) => (
              <div key={i}>
                <label>Product Name</label>
                <input
                  value={p.name}
                  onChange={(e) => {
                    const updated = [...data.products];
                    updated[i].name = e.target.value;
                    setData({ ...data, products: updated });
                  }}
                />
                <label>Description</label>
                <textarea
                  value={p.description}
                  onChange={(e) => {
                    const updated = [...data.products];
                    updated[i].description = e.target.value;
                    setData({ ...data, products: updated });
                  }}
                />
                <label>Price</label>
                <input
                  value={p.price}
                  onChange={(e) => {
                    const updated = [...data.products];
                    updated[i].price = e.target.value;
                    setData({ ...data, products: updated });
                  }}
                />
                <hr style={{ margin: "14px 0", border: "0.5px dashed var(--panel-border)" }} />
              </div>
            ))}
            <button className="alt" onClick={addProduct}>+ Add Product</button>
          </div>

          {/* FAQs */}
          <div className="card">
            <h3>❓ FAQs</h3>
            {data.faq.map((f, i) => (
              <div key={i}>
                <label>Question</label>
                <input
                  value={f.question}
                  onChange={(e) => {
                    const updated = [...data.faq];
                    updated[i].question = e.target.value;
                    setData({ ...data, faq: updated });
                  }}
                />
                <label>Answer</label>
                <textarea
                  value={f.answer}
                  onChange={(e) => {
                    const updated = [...data.faq];
                    updated[i].answer = e.target.value;
                    setData({ ...data, faq: updated });
                  }}
                />
                <hr style={{ margin: "14px 0", border: "0.5px dashed var(--panel-border)" }} />
              </div>
            ))}
            <button className="alt" onClick={addFAQ}>+ Add FAQ</button>
          </div>
        </div>
      </div>

      <div className="actions">
        <button className="primary" onClick={save}>💾 Save Knowledge</button>
        <button className="alt" onClick={goBack}>← Back</button>
        <span className="status">{status}</span>
      </div>
    </div>
  );
}
