const API_BASE = "http://localhost:8000";
async function loadQueue() {
  try {
    const res = await fetch(`${API_BASE}/queue`);
    const patients = await res.json();
    const container = document.getElementById("queueContainer");
    document.getElementById("queueCount").innerText = patients.length;
    if (patients.length === 0) {
      container.innerHTML = "<div class="empty-state"><p>Queue is empty</p></div>";
      return;
    }
    container.innerHTML = "";
    patients.forEach(p => {
      const card = document.createElement("div");
      card.className = "patient-card";
      card.innerHTML = `
        <div class="card-token">#${p.token}</div>
        <div class="patient-name"><i class="fas fa-user-circle"></i> ${p.name}</div>
        <div class="detail-row"><i class="fas fa-mobile-alt"></i> ${p.phone}</div>
        <div class="complaint-text">${p.complaint}</div>
        <div class="time-arrival">
          <span><i class="far fa-clock"></i> ${new Date(p.created_at).toLocaleTimeString()}</span>
          <button class="serve-btn-card" onclick="markServed(${p.id})">Served</button>
        </div>
      \`;
      container.appendChild(card);
    });
  } catch (err) { console.error(err); }
}
async function markServed(id) { await fetch(`${API_BASE}/patients/${id}`, { method: "DELETE" }); loadQueue(); }
document.getElementById("patientForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value;
  const phone = document.getElementById("phone").value;
  const complaint = document.getElementById("complaint").value;
  await fetch(`${API_BASE}/patients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, phone, complaint })
  });
  e.target.reset();
  loadQueue();
});
document.getElementById("callNextBtn").addEventListener("click", async () => {
  const res = await fetch(`${API_BASE}/next`, { method: "POST" });
  if (res.ok) {
    const p = await res.json();
    alert(`Calling: ${p.name}`);
    loadQueue();
  }
});
setInterval(loadQueue, 5000);
loadQueue();