import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:7000";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [err, setErr] = useState("");

  const load = async () => {
    try {
      const res = await axios.get(`${API}/api/orders`);
      setOrders(res.data || []);
    } catch {
      setErr("⚠️ Could not load orders.");
    }
  };
  useEffect(() => {
    load();
  }, []);

  const download = (o) => {
    const id = o.orderId || o.id;
    if (!id) return alert("Missing orderId");
    window.open(`${API}/api/orders/download/${id}`, "_blank");
  };

  return (
    <div className="orders glass">
      <h2>📦 Completed Orders</h2>
      {err && <p className="warn">{err}</p>}
      {orders.length === 0 ? (
        <div className="empty">No orders yet.</div>
      ) : (
        <div className="order-grid">
          {orders.map((o, i) => (
            <div className="order-card glass" key={i}>
              <div className="stack">
                <div className="title">{o.product || "Order"}</div>
                <div className="muted">Order ID: {o.orderId || o.id}</div>
                <div className="muted">
                  Date:{" "}
                  {o.createdAt
                    ? new Date(o.createdAt).toLocaleString()
                    : o.date
                    ? new Date(o.date).toLocaleString()
                    : "N/A"}
                </div>
              </div>
              <div className="stack right">
                <div className="amt">₦{Number(o.amount || 0).toLocaleString()}</div>
                <button onClick={() => download(o)}>⬇️ Delivery Note</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
