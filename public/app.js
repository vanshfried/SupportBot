let currentUser = null;

async function loadConversations() {
  const res = await fetch("/conversations");
  const data = await res.json();

  const usersDiv = document.getElementById("users");
  usersDiv.innerHTML = "";

  Object.keys(data).forEach((user) => {
    const div = document.createElement("div");
    div.className = "user";
    div.innerText = user;

    div.onclick = () => openChat(user, data[user]);

    usersDiv.appendChild(div);
  });
}

function openChat(user, messages) {
  currentUser = user;

  document.getElementById("chatUser").innerText = user;

  const msgBox = document.getElementById("messages");
  msgBox.innerHTML = "";

  messages.forEach((m) => {
    const div = document.createElement("div");
    div.className = "msg " + (m.from === "user" ? "userMsg" : "agentMsg");

    div.innerText = m.text;

    msgBox.appendChild(div);
  });
}

async function sendReply() {
  const input = document.getElementById("messageInput");
  const message = input.value;

  if (!message || !currentUser) return;

  await fetch("/agent/reply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: currentUser,
      message,
    }),
  });

  input.value = "";

  loadConversations();
}

async function endSession() {
  if (!currentUser) return;

  await fetch("/agent/end", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user: currentUser,
    }),
  });

  alert("Returned to bot");
}

setInterval(loadConversations, 2000);

loadConversations();
