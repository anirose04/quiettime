/* quiet time — dominoes: makes puzzles off the main thread so the page never stalls */
importScripts('dominoes-puzzles.js', 'dominoes-solver.js', 'dominoes-generator.js');
onmessage = e => {
  const { job, level, seed } = e.data;
  let puzzle = null;
  try { puzzle = DMGenerator.generate(level, seed); } catch (err) { puzzle = null; }
  postMessage({ job, puzzle });
};
