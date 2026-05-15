function generateWav(
  type:
    | "correct"
    | "wrong"
    | "win"
    | "chime"
    | "combo"
    | "quest"
    | "awesome"
    | "pop",
): string {
  const sampleRate = 44100;
  let duration = 1.0;
  if (type === "correct") duration = 0.5;
  if (type === "wrong") duration = 0.5;
  if (type === "win") duration = 1.5;
  if (type === "chime") duration = 1.5;
  if (type === "combo") duration = 0.8;
  if (type === "quest") duration = 1.2;
  if (type === "awesome") duration = 1.0;
  if (type === "pop") duration = 0.1;

  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let val = 0;
    if (type === "correct") {
      const freq = 440 + Math.min(t * 8800, 440);
      val = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 10);
    } else if (type === "wrong") {
      const freq = 200 - t * 250;
      val = ((t * freq) % 1 > 0.5 ? 1 : -1) * Math.exp(-t * 10);
    } else if (type === "pop") {
      const freq = 800 - t * 6000;
      val = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 30);
    } else if (type === "win") {
      const notes = [440, 554.37, 659.25, 880];
      let o = 0;
      notes.forEach((f, idx) => {
        const start = idx * 0.15;
        if (t > start)
          o +=
            Math.sin(2 * Math.PI * f * (t - start)) *
            Math.exp(-(t - start) * 5);
      });
      val = o;
    } else if (type === "chime") {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      let o = 0;
      notes.forEach((f, idx) => {
        const start = idx * 0.15;
        if (t > start)
          o +=
            Math.sin(2 * Math.PI * f * (t - start)) *
            Math.exp(-(t - start) * 2);
      });
      val = o;
    } else if (type === "combo") {
      // Duolingo-style quick ascending ding
      const notes = [587.33, 739.99, 880.0]; // D5, F#5, A5
      let o = 0;
      notes.forEach((f, idx) => {
        const start = idx * 0.1;
        if (t > start)
          o +=
            Math.sin(2 * Math.PI * f * (t - start)) *
            Math.exp(-(t - start) * 12);
      });
      val = o;
    } else if (type === "quest") {
      // Fanfare style
      const notes = [440, 440, 440, 554.37, 659.25];
      let o = 0;
      notes.forEach((f, idx) => {
        const start = idx * 0.12;
        const dur = idx === 4 ? 4 : 10;
        if (t > start)
          o +=
            Math.sin(2 * Math.PI * f * (t - start)) *
            Math.exp(-(t - start) * dur);
      });
      val = o;
    } else if (type === "awesome") {
      // Playful upbeat synth
      const notes = [783.99, 1046.5, 1567.98]; // G5, C6, G6
      let o = 0;
      notes.forEach((f, idx) => {
        const start = idx * 0.15;
        if (t > start)
          o +=
            (Math.sin(2 * Math.PI * f * (t - start)) +
              Math.sin(2 * Math.PI * f * 1.01 * (t - start))) *
            Math.exp(-(t - start) * 6);
      });
      val = o;
    }
    buffer[i] = val * 0.5; // volume
  }

  const wavBuffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(wavBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, numSamples * 2, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    let s = Math.max(-1, Math.min(1, buffer[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  let binary = "";
  const bytes = new Uint8Array(wavBuffer);
  for (let i = 0; i < bytes.byteLength; i += 10000) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + 10000)),
    );
  }
  return "data:audio/wav;base64," + btoa(binary);
}

export const SOUND_URLS = {
  correct: generateWav("correct"),
  wrong: generateWav("wrong"),
  win: generateWav("win"),
  chime: generateWav("chime"),
  combo: generateWav("combo"),
  quest: generateWav("quest"),
  awesome: generateWav("awesome"),
  pop: generateWav("pop"),
};
