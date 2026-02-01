// Web Audio API sound effects — Bouncy arcade theme for Helix Jump

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  }
  return audioContext
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.3
) {
  try {
    const ctx = getAudioContext()

    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)

    gainNode.gain.setValueAtTime(volume, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration)
  } catch {
    // Audio not available, silently fail
  }
}

// Ball bounces on safe platform — short rubbery pop
export function playBounceSound() {
  playTone(350, 0.06, 'sine', 0.12)
  setTimeout(() => playTone(500, 0.04, 'sine', 0.07), 15)
}

// Platform cracking — progressively more alarming
export function playCrackSound(bouncesRemaining: number) {
  if (bouncesRemaining === 2) {
    // First crack — subtle
    playTone(200, 0.05, 'triangle', 0.08)
  } else if (bouncesRemaining === 1) {
    // Second crack — louder, lower
    playTone(160, 0.07, 'square', 0.1)
    setTimeout(() => playTone(120, 0.05, 'triangle', 0.07), 25)
  }
}

// Platform breaks apart — crumble sound
export function playBreakSound() {
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') ctx.resume()

    // Quick descending crumble
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(300, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.2)
    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.2)

    // Scatter particles sound
    setTimeout(() => {
      playTone(180, 0.04, 'triangle', 0.06)
      playTone(250, 0.03, 'sine', 0.05)
    }, 60)
  } catch {
    // Audio not available
  }
}

// Hit danger zone — harsh buzz
export function playDangerSound() {
  playTone(120, 0.15, 'sawtooth', 0.18)
  setTimeout(() => playTone(80, 0.12, 'square', 0.14), 40)
}

// Level up / new level reached — ascending chime
export function playLevelSound() {
  playTone(500, 0.06, 'triangle', 0.1)
  setTimeout(() => playTone(700, 0.05, 'triangle', 0.08), 30)
  setTimeout(() => playTone(900, 0.04, 'triangle', 0.06), 60)
}

// Game over — low descending drone
export function playGameOverSound() {
  playTone(250, 0.3, 'sawtooth', 0.2)
  setTimeout(() => playTone(150, 0.25, 'sawtooth', 0.15), 80)
  setTimeout(() => playTone(80, 0.3, 'square', 0.1), 180)
}

// Resume audio context on user interaction (required by browsers)
export function initAudio() {
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') {
      ctx.resume()
    }
  } catch {
    // Audio not available
  }
}
