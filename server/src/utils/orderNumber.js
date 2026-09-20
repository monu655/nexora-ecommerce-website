// Human-readable, sortable order reference: NX-2K6-04812
export function generateOrderNumber(sequence) {
  const year = new Date().getFullYear().toString().slice(-2);
  const seq = String(sequence % 100000).padStart(5, '0');
  return `NX-${year}K${new Date().getMonth() + 1}-${seq}`;
}
