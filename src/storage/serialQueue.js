// Serialize collection updates in this app instance, including after a failure.
export function createSerialQueue() {
  let tail = Promise.resolve();
  return (operation) => {
    const result = tail.then(operation);
    tail = result.catch(() => {});
    return result;
  };
}
