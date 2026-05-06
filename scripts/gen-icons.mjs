import sharp from 'sharp'
import { mkdirSync } from 'fs'

mkdirSync('public/icons', { recursive: true })

const svg = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <rect width="512" height="512" rx="80" fill="#1a1a1a"/>
  <text x="256" y="340" text-anchor="middle"
        font-family="sans-serif" font-size="300" font-weight="700" fill="#4a90d9">D</text>
</svg>
`)

await sharp(svg).resize(192).toFile('public/icons/icon-192.png')
await sharp(svg).resize(512).toFile('public/icons/icon-512.png')
console.log('Icons created: icon-192.png, icon-512.png')
