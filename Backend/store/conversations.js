export const conversations = new Map();
export const humanSessions = new Map();

export function addMessage(user, from, text) {
  if (!conversations.has(user)) {
    conversations.set(user, []);
  }

  conversations.get(user).push({
    from,
    text,
    time: Date.now(),
  });
}
