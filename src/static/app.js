document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select options (keep placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants HTML
        const participants = details.participants || [];
        let participantsHTML = "";
        if (participants.length === 0) {
          participantsHTML = `<p class="info">No participants yet. Be the first to sign up!</p>`;
        } else {
          participantsHTML = `<div class="participants"><h5>Participants</h5><ul class="participants-list">`;
          participants.forEach((p) => {
            const local = (p.split("@")[0] || "").split(/[\.\-_]/).filter(Boolean);
            const initials = local.map(s => s[0]).slice(0, 2).join("").toUpperCase() || p.slice(0,2).toUpperCase();
            participantsHTML += `<li><span class="participant-avatar">${initials}</span><span class="participant-email">${p}</span><button class="delete-participant" data-activity="${encodeURIComponent(name)}" data-email="${encodeURIComponent(p)}" aria-label="Remove participant">✖</button></li>`;
          });
          participantsHTML += `</ul></div>`;
        }

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsHTML}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities to reflect the new participant
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();

  // Event delegation for delete buttons
  activitiesList.addEventListener("click", async (e) => {
    const btn = e.target.closest(".delete-participant");
    if (!btn) return;

    const activityName = decodeURIComponent(btn.dataset.activity || "");
    const email = decodeURIComponent(btn.dataset.email || "");

    if (!activityName || !email) return;

    if (!confirm(`Unregister ${email} from ${activityName}?`)) return;

    try {
      const resp = await fetch(`/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`, { method: "POST" });
      const result = await resp.json();
      if (resp.ok) {
        // Refresh list
        fetchActivities();
      } else {
        alert(result.detail || "Failed to unregister participant");
      }
    } catch (err) {
      console.error("Error unregistering:", err);
      alert("Failed to unregister participant. Please try again.");
    }
  });
});
