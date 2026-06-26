// Dependency-free deterministic avatar generator.
// Replaces the EVM @metamask/jazzicon usage. Returns an SVG HTML string
// suitable for v-html, generated deterministically from a numeric seed.

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hsl(rng: () => number, lightness: number) {
  return `hsl(${Math.floor(rng() * 360)}, ${55 + Math.floor(rng() * 30)}%, ${lightness}%)`
}

/**
 * Generate a deterministic avatar as an SVG HTML string.
 * @param size pixel size of the square avatar
 * @param seed numeric seed (e.g. a per-user seed); random if undefined
 */
export function getAvatarImg(size: number, seed?: number): string {
  const s = seed === undefined || seed === null ? Math.floor(Math.random() * 1e7) : seed
  const rng = mulberry32(s)
  const bg = hsl(rng, 45)
  const fg = hsl(rng, 70)

  // 5x5 symmetric identicon grid
  const cells = 5
  const unit = size / cells
  let rects = ''
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < Math.ceil(cells / 2); x++) {
      if (rng() > 0.5) {
        const rx = x * unit
        const mx = (cells - 1 - x) * unit
        rects += `<rect x="${rx}" y="${y * unit}" width="${unit}" height="${unit}" fill="${fg}"/>`
        if (mx !== rx) {
          rects += `<rect x="${mx}" y="${y * unit}" width="${unit}" height="${unit}" fill="${fg}"/>`
        }
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="border-radius:9999px">` +
    `<rect width="${size}" height="${size}" fill="${bg}"/>${rects}</svg>`
}
