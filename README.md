# CutLab AI — Virtual Men's Barber & Haircut Try-On Studio

**CutLab AI** is an interactive AI grooming & haircut studio where you upload a portrait (or snap a live camera selfie), scan your 3D facial bone structure, and test unlimited men's barbershop cuts on your actual photo to find the cut that suits your face best.

## Key Features

- **478-Point 3D Facial Biometric Scanner (`@mediapipe/tasks-vision`)**: Measures face length-to-width, jaw-to-cheekbone, forehead-to-cheekbone, and vertical facial thirds (`Oval`, `Square`, `Diamond`, `Round`, `Heart`, `Oblong`) with an interactive 3D Face Mesh overlay.
- **16 Men's Barbershop Presets + Guard Specs**: Ranked dynamically by **Face Suitability `%`** — Low Taper + Textured Fringe, Burst Fade + Curls, French Crop + Drop Fade, #2 Buzz + Skin Fade, 90s Warrior Cut, Modern Mullet, Old Money Scissor Taper, Middle Part Curtains, Blowout Taper, Executive Side Part, Slick Back, and more.
- **Custom Fade, Beard & Color Modifiers**: Mix any cut with Low Taper, Mid Fade, High Skin Fade, Drop Fade, or Burst Fade + Clean Shaven, 3mm Stubble, Boxed Beard, or Goatee + 6 hair colors.
- **Conversational AI Master Barber (`Marco`)**: Ask what suits your face shape or describe any custom haircut in natural language — Marco answers with tailored barber guard numbers and automatically triggers live rendering on your portrait.
- **Zero-Key Out-of-the-Box + Optional BYOK Gemini Pro**: Runs free out-of-the-box using identity-preserving `FLUX.1-Kontext` image editing, with an optional Google Gemini API key slot for multimodal Gemini Pro Studio.
- **Interactive Before/After Split Curtain + Side-by-Side Winner Showdown**: Drag pixel-for-pixel across your forehead, hairline, temples, and beard, or compare looks side-by-side.
- **"Show My Barber" Spec Card Export**: Download a high-resolution PNG card containing your Before/After portrait and exact clipper guard & styling product instructions to hand directly to your barber.

## Quick Start

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` — Start development server
- `npm test` — Run Vitest test suite
- `npm run build` — Type-check & build production bundle
