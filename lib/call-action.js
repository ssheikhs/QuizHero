/**
 * Run a server action from the browser and always get back { ok, error, ... } —
 * a network failure or server crash becomes a friendly error instead of a stuck button.
 */
export async function callAction(action, ...args) {
  try {
    return (await action(...args)) ?? { ok: false, error: "No response from the server." };
  } catch (error) {
    console.error(error);
    return { ok: false, error: "Something went wrong on the server. Please try again." };
  }
}
