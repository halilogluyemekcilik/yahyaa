// Fisher–Yates karıştırma algoritması
export function shuffleArray(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); // 0..i arası rastgele indeks
    [array[i], array[j]] = [array[j], array[i]]; // Elemanları swap et
  }
  return array;
}