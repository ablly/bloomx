import { mkdirSync, writeFileSync } from 'node:fs';

const sampleRate = 48000;
const duration = 18;
const totalSamples = sampleRate * duration;
const left = new Float32Array(totalSamples);
const right = new Float32Array(totalSamples);

const notes = [
  [0.4, 523.25, 0.18],
  [1.35, 659.25, 0.13],
  [2.2, 783.99, 0.14],
  [3.25, 587.33, 0.13],
  [4.4, 698.46, 0.12],
  [5.35, 880.0, 0.1],
  [6.5, 659.25, 0.13],
  [7.65, 987.77, 0.09],
  [8.85, 783.99, 0.11],
  [10.1, 587.33, 0.12],
  [11.35, 739.99, 0.09],
  [12.65, 880.0, 0.08],
  [14.2, 659.25, 0.11],
  [15.35, 523.25, 0.12],
];

function addBell(startSeconds, frequency, gain) {
  const start = Math.floor(startSeconds * sampleRate);
  const length = Math.floor(3.2 * sampleRate);
  const pan = Math.sin(startSeconds * 1.7) * 0.32;
  const leftGain = Math.sqrt((1 - pan) * 0.5);
  const rightGain = Math.sqrt((1 + pan) * 0.5);

  for (let index = 0; index < length; index += 1) {
    const sampleIndex = start + index;
    if (sampleIndex >= totalSamples) break;

    const t = index / sampleRate;
    const attack = Math.min(1, t / 0.028);
    const decay = Math.exp(-t * 1.24);
    const shimmer = Math.exp(-t * 2.8);
    const body =
      Math.sin(2 * Math.PI * frequency * t) * 0.76 +
      Math.sin(2 * Math.PI * frequency * 2.01 * t) * 0.18 * shimmer +
      Math.sin(2 * Math.PI * frequency * 3.02 * t) * 0.08 * shimmer;
    const air = Math.sin(2 * Math.PI * (frequency * 0.5) * t + 0.7) * 0.1;
    const value = (body + air) * gain * attack * decay;

    left[sampleIndex] += value * leftGain;
    right[sampleIndex] += value * rightGain;

    const echoIndex = sampleIndex + Math.floor(0.42 * sampleRate);
    if (echoIndex < totalSamples) {
      left[echoIndex] += value * leftGain * 0.22;
      right[echoIndex] += value * rightGain * 0.22;
    }
  }
}

for (const [start, frequency, gain] of notes) {
  addBell(start, frequency, gain);
  addBell(start + 0.06, frequency * 2, gain * 0.18);
}

for (let index = 0; index < totalSamples; index += 1) {
  const t = index / sampleRate;
  const bed =
    Math.sin(2 * Math.PI * 130.81 * t) * 0.008 +
    Math.sin(2 * Math.PI * 196.0 * t + 1.2) * 0.006;
  const fadeIn = Math.min(1, t / 2);
  const fadeOut = Math.min(1, (duration - t) / 2);
  const envelope = Math.max(0, Math.min(fadeIn, fadeOut));
  left[index] += bed * envelope;
  right[index] += bed * envelope;
}

function writeString(view, offset, value) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function encodeWav(leftChannel, rightChannel) {
  const channels = 2;
  const bitsPerSample = 16;
  const blockAlign = (channels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = leftChannel.length * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let index = 0; index < leftChannel.length; index += 1) {
    const l = Math.max(-1, Math.min(1, leftChannel[index]));
    const r = Math.max(-1, Math.min(1, rightChannel[index]));
    view.setInt16(offset, l < 0 ? l * 0x8000 : l * 0x7fff, true);
    view.setInt16(offset + 2, r < 0 ? r * 0x8000 : r * 0x7fff, true);
    offset += 4;
  }

  return Buffer.from(buffer);
}

mkdirSync('assets', { recursive: true });
writeFileSync('assets/bloomx-music-box.wav', encodeWav(left, right));
console.log('Wrote assets/bloomx-music-box.wav');
