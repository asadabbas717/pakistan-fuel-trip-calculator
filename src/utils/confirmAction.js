let queue = [];
const listeners = new Set();
function emit() {
  listeners.forEach((listener) => listener());
}
export function subscribeDialogs(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function getDialogs() {
  return queue;
}
export function dismissDialog(dialog) {
  if (queue[0] !== dialog) return false;
  queue = queue.slice(1);
  emit();
  return true;
}
export function showMessage(message, title = "SafarWise") {
  queue = [...queue, { message: String(message), title, label: "OK" }];
  emit();
}
export function confirmAction(
  message,
  action,
  { title = "Confirm deletion", label = "Delete", destructive = true } = {},
) {
  queue = [...queue, { message, title, label, destructive, action }];
  emit();
}
