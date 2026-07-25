<script>
/**
 * Deterministic, generated stand-in shown when a recipe (or homemade ingredient)
 * has no uploaded image. Everything is derived from `name`, so the same name always
 * produces the same art — no external assets, so no copyright or broken-link risk,
 * and the grid looks designed rather than empty.
 */
export default {
  name: 'RecipePlaceholder',
  props: {
    name: { type: String, default: '' },
  },
  computed: {
    // Simple deterministic string hash -> non-negative integer.
    hash() {
      let h = 0
      for (let i = 0; i < this.name.length; i++) {
        h = (Math.imul(h, 31) + this.name.charCodeAt(i)) | 0
      }
      return Math.abs(h)
    },
    hue() {
      return this.hash % 360
    },
    // Unique gradient id per art so multiple SVGs on one page don't share a <defs>.
    gradId() {
      return `recipe-ph-${this.hash}`
    },
    fromColor() {
      return `hsl(${this.hue} 58% 46%)`
    },
    toColor() {
      return `hsl(${(this.hue + 42) % 360} 62% 32%)`
    },
    // Pick one of a few glass silhouettes for visual variety across the grid.
    glass() {
      return ['martini', 'coupe', 'highball', 'rocks'][this.hash % 4]
    },
  },
}
</script>

<template>
  <svg
    class="w-full h-full"
    viewBox="0 0 400 300"
    preserveAspectRatio="xMidYMid slice"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    :aria-label="`${name} placeholder`"
  >
    <defs>
      <linearGradient :id="gradId" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" :stop-color="fromColor" />
        <stop offset="100%" :stop-color="toColor" />
      </linearGradient>
    </defs>

    <rect width="400" height="300" :fill="`url(#${gradId})`" />

    <!-- Glass silhouette (decorative), centered -->
    <g
      transform="translate(200 150)"
      fill="none"
      stroke="white"
      stroke-opacity="0.9"
      stroke-width="5"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <template v-if="glass === 'martini'">
        <path d="M-52 -60 L52 -60 L0 -2 Z" fill="white" fill-opacity="0.14" />
        <line x1="0" y1="-2" x2="0" y2="52" />
        <line x1="-34" y1="56" x2="34" y2="56" />
      </template>

      <template v-else-if="glass === 'coupe'">
        <path d="M-54 -46 A 54 30 0 0 0 54 -46 Z" fill="white" fill-opacity="0.14" />
        <line x1="0" y1="-16" x2="0" y2="52" />
        <line x1="-34" y1="56" x2="34" y2="56" />
      </template>

      <template v-else-if="glass === 'highball'">
        <path d="M-30 -62 L-26 58 L26 58 L30 -62 Z" fill="white" fill-opacity="0.14" />
        <line x1="-28" y1="-24" x2="28" y2="-24" />
      </template>

      <template v-else>
        <path d="M-38 -20 L-33 58 L33 58 L38 -20 Z" fill="white" fill-opacity="0.14" />
        <line x1="-36" y1="14" x2="36" y2="14" />
      </template>
    </g>
  </svg>
</template>
