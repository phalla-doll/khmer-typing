# Khmer Typing ⌨️

A premium, highly tactile typing playground designed for focus, speed, and elegance. Built with Next.js, Framer Motion, and Tailwind CSS.

## ✨ Features

- **Dynamic Difficulty Engine**: Seamlessly switch between Easy (top 100 common sight words), Medium (conversational syntax), and Hard (computer science jargon and complex vocabulary) levels to test your skills.
- **Spatially-Aware Typo Forgiveness**: Features a custom QWERTY adjacency matrix. If you "fat finger" a neighboring key (e.g., hitting `t` instead of `y`), the engine triggers a 500ms *Grace Window*. The character highlights amber—allowing you to backspace without penalizing your WPM or accuracy. If ignored, the error locks as a genuine mistake.
- **Precision Metrics & Layout**: 
  - Live Words-Per-Minute (WPM) and Accuracy tracking.
  - Strict Mathematical Grid: The typing canvas uses a true mathematical inline word-block layout combined with `JetBrains Mono` and 0-tracking parameters. Words wrap beautifully without orphan characters breaking across lines.
- **Time Limits**: Select from 15s, 30s, or 60s dynamically refreshing tests.
- **Interactive UI**: Fluid micro-animations including a custom magnetic profile button, tactile switch delays, and a softly pulsating custom cursor.

## 🎨 Design Aesthetic ("Natural Tones")

The platform is meticulously styled to avoid the standard "cyberpunk" or "neon AI" cliches, leaning heavily into a premium, organic look.

- **Color Palette**: 
  - **Base/Canvas**: Earthy, ultra-light neutral (`#F5F2ED`)
  - **Typography (Base)**: Warm dark charcoal (`#434343`)
  - **Untyped States**: Soft muted gray (`#BCB7AF`)
  - **Primary Accents**: Mossy, muted green (`#8A9A5B`) for success/active states
  - **Error/Correction States**: Terracotta red (`#D27D6B`) and a warm amber (`#D2A76B`) for grace window detection.
- **Typography**: 
  - **UI/Headlines**: *Outfit* — highly legible and modern sans-serif with a touch of geometric precision.
  - **Typing Code Block**: *JetBrains Mono* (Font-Weight: Light) — ensuring exact visual tracking and terminal-grade spacing parameters.
- **Materiality & Motion**: Glassmorphism tooltips, delicate diffuse shadows (`rgba(0,0,0,0.05)`), and Framer Motion spring physics give every button natural weight and magnetic pull.

## 📂 Project Structure

```text
/
├── app/
│   ├── page.tsx          # Main playground: Key capture, generator, grid rendering
│   ├── layout.tsx        # Global font setup (Outfit/JetBrains) and CSS/Metadata
│   ├── globals.css       # Tailwind base injections
│   └── icon.svg          # Premium keycap favicon
├── lib/
│   └── utils.ts          # Utility classes (cn merge)
├── public/               # Static assets
├── package.json          # Dependency tracking
└── next.config.ts        # Next.js configuration
```

## 🚀 Getting Started

1. Set up dependencies: `npm install`
2. Run the dev server: `npm run dev`
3. Launch `http://localhost:3000` to start typing!
