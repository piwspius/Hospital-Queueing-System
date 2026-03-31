// app.js - fully fixed, error resilient, smooth queue management
const API_BASE = "https://hospital-queueing-system.onrender.com";

// Helper: show temporary toast-like feedback (optional but improves UX)
function showToast(message, isError = false) {
	// quick inline alert replacement (doesn't block UI)
	const toastDiv = document.createElement("div");
	toastDiv.innerText = message;
	toastDiv.style.position = "fixed";
	toastDiv.style.bottom = "20px";
	toastDiv.style.left = "50%";
	toastDiv.style.transform = "translateX(-50%)";
	toastDiv.style.backgroundColor = isError ? "#c44536" : "#1f6e43";
	toastDiv.style.color = "white";
	toastDiv.style.padding = "10px 20px";
	toastDiv.style.borderRadius = "40px";
	toastDiv.style.fontWeight = "500";
	toastDiv.style.fontSize = "0.85rem";
	toastDiv.style.zIndex = "999";
	toastDiv.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
	toastDiv.style.backdropFilter = "blur(8px)";
	document.body.appendChild(toastDiv);
	setTimeout(() => toastDiv.remove(), 2500);
}

// Load and render queue from backend
async function loadQueue() {
	try {
		const res = await fetch(`${API_BASE}/queue`);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const patients = await res.json();
		const container = document.getElementById("queueContainer");
		const countSpan = document.getElementById("queueCount");
		if (!container) return;

		countSpan.innerText = patients.length;

		if (!patients.length) {
			container.innerHTML = `<div class="empty-state"><i class="fas fa-queue"></i><p>Queue is empty — add a new patient above</p></div>`;
			return;
		}

		container.innerHTML = "";
		for (const p of patients) {
			const card = document.createElement("div");
			card.className = "patient-card";
			// safely escape complaint and name to avoid injection (basic)
			const safeName = escapeHtml(p.name);
			const safePhone = escapeHtml(p.phone);
			const safeComplaint = escapeHtml(p.complaint);
			const token = p.token || `T-${p.id}`;
			const arrivalTime = p.created_at
				? new Date(p.created_at).toLocaleTimeString([], {
						hour: "2-digit",
						minute: "2-digit",
					})
				: "just now";

			card.innerHTML = `
        <div class="card-token">#${escapeHtml(token)}</div>
        <div class="patient-name"><i class="fas fa-user-circle"></i> ${safeName}</div>
        <div class="detail-row"><i class="fas fa-mobile-alt"></i> ${safePhone}</div>
        <div class="complaint-text">📝 ${safeComplaint}</div>
        <div class="time-arrival">
          <span><i class="far fa-clock"></i> ${arrivalTime}</span>
          <button class="serve-btn-card" data-id="${p.id}">√ Served</button>
        </div>
      `;
			// attach event listener dynamically (cleaner than onclick string)
			const serveBtn = card.querySelector(".serve-btn-card");
			serveBtn.addEventListener("click", (e) => {
				e.stopPropagation();
				markServed(p.id);
			});
			container.appendChild(card);
		}
	} catch (err) {
		console.error("Load queue error:", err);
		const container = document.getElementById("queueContainer");
		if (container) {
			container.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>⚠️ Cannot reach server. Check connection or API.</p></div>`;
		}
		showToast("Failed to load queue. Check network.", true);
	}
}

// simple escape to avoid XSS
function escapeHtml(str) {
	if (!str) return "";
	return str
		.replace(/[&<>]/g, function (m) {
			if (m === "&") return "&amp;";
			if (m === "<") return "&lt;";
			if (m === ">") return "&gt;";
			return m;
		})
		.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function (c) {
			return c;
		});
}

async function markServed(id) {
	try {
		const response = await fetch(`${API_BASE}/patients/${id}`, {
			method: "DELETE",
		});
		if (!response.ok) throw new Error("Failed to mark as served");
		showToast(`Patient #${id} marked as served ✅`);
		await loadQueue(); // refresh immediately
	} catch (err) {
		console.error("Serve error:", err);
		showToast("Could not mark patient as served. Try again.", true);
	}
}

// Add new patient
document
	.getElementById("patientForm")
	?.addEventListener("submit", async (e) => {
		e.preventDefault();
		const name = document.getElementById("name").value.trim();
		const phone = document.getElementById("phone").value.trim();
		const complaint = document.getElementById("complaint").value.trim();

		if (!name || !phone || !complaint) {
			showToast("Please fill all fields", true);
			return;
		}

		try {
			const res = await fetch(`${API_BASE}/patients`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, phone, complaint }),
			});
			if (!res.ok) {
				const errText = await res.text();
				throw new Error(errText || "Server error");
			}
			showToast(`✅ ${name} added to queue`);
			e.target.reset();
			await loadQueue();
		} catch (err) {
			console.error("Add patient error:", err);
			showToast("Error adding patient. Is backend running?", true);
		}
	});

// Call next patient
document.getElementById("callNextBtn")?.addEventListener("click", async () => {
	try {
		const res = await fetch(`${API_BASE}/next`, { method: "POST" });
		if (!res.ok) {
			if (res.status === 404) {
				showToast("No patients in queue", true);
			} else {
				throw new Error(`HTTP ${res.status}`);
			}
			return;
		}
		const patient = await res.json();
		if (patient && patient.name) {
			showToast(
				`📢 NEXT: ${patient.name} (Token #${patient.token || "—"})`,
				false,
			);
		} else {
			showToast("Next patient called", false);
		}
		await loadQueue();
	} catch (err) {
		console.error("Call next error:", err);
		showToast("Unable to call next patient. Check API connection.", true);
	}
});

// Auto-refresh every 6 seconds (more reliable)
setInterval(() => {
	loadQueue().catch((e) => console.warn("auto-refresh failed", e));
}, 6000);

// initial load
loadQueue().catch(console.warn);
