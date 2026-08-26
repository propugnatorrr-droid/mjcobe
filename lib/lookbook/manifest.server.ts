import 'server-only';

/**
 * Generation metadata (model, prompt, seed, references) for every asset —
 * including the character-sheet reference that was never selected as site
 * imagery. Server-only: prompts describe exact wardrobe/identity-lock
 * instructions we don't need sitting in a public JS bundle.
 */
export type GenerationMetadata = {
  model: string;
  prompt: string;
  referenceIds?: string[];
  role: 'hero' | 'loop' | 'reference';
};

export const lookbookGenerationMetadata: Record<string, GenerationMetadata> = {
  hero: {
    model: 'gpt-image-2',
    prompt:
      'Reframe this exact scene as a tight cinematic chest-up performance shot of\n' +
      'MJC on the same beach at night.\n' +
      'MJC faces toward the camera with an intense, emotionally conflicted\n' +
      'expression. His eyes and mouth are clearly visible for accurate singing\n' +
      'and lip-sync. His lips are naturally closed in the starting frame.\n' +
      'Preserve his exact facial identity, skin tone, facial structure, short\n' +
      'facial hair, neck tattoos, glasses, burgundy-and-white knit beanie, silver\n' +
      'chain and dark forest-green oversized sweatshirt.\n' +
      'Keep the same moonlit beach, ocean, nighttime atmosphere and cinematic\n' +
      'blue color grade. The background should be softly out of focus.\n' +
      'Vertical 9:16, realistic skin texture, sharp facial detail, cinematic\n' +
      'lighting.\n' +
      'No other people, no text, no hands covering his face, no open mouth, no\n' +
      'facial distortion and no identity changes.',
    referenceIds: ['X2SRKv8mZBZDeNip6gP8'],
    role: 'hero',
  },
  loop: {
    model: 'byte-plus-seedance-2',
    prompt:
      '[Cinematography]: Continuous single take, no cuts, locked-off static camera — no push, no drift, no handheld motion. Extreme wide shot. Deep focus. Very wide anamorphic lens. The frame is composed with a low horizon line: the man occupies only the lower fifth of the image, small and distant, placed slightly off-center to the left, with vast empty sky filling everything above him. Enormous negative space around the figure. He is far enough away that he reads as a shape, not a face.\n' +
      "[Subject]: The man from @fVaTeP4dSDpKEyWG7g3K and @V4atf6iIkrEae6d4vcbd — the same figure, silhouetted at distance. His striped beanie, the bulk of the oversized dark green crewneck, black tapered joggers, and his overall proportions remain recognizable in outline. No denim. He should be identifiable as the same person by shape and wardrobe alone.\n" +
      '[Action]: He stands almost completely still at the waterline, facing out toward the ocean, his back three-quarters to camera. Barely perceptible motion only — the wind lifts the loose fabric of his sweater, his shoulders rise and fall once with a slow breath. Near the end of the clip he turns his head slowly to the left, in profile, looking down the length of the beach. He never turns fully to camera. No gestures, no arm movement, no walking. Stillness is the performance.\n' +
      '[Context]: A vast empty beach at night, the shoreline stretching away into darkness in both directions. A low moon sits just above the horizon over black water, laying a single broken column of cold light across the waves toward the figure. Thin sheets of water spread across the wet sand at his feet and recede. No other people anywhere in frame. The emptiness of the location is the subject as much as he is.\n' +
      '[Style & Ambiance]: Almost total silhouette — he is rendered as a dark shape against the moonlit water, with only a thin cold rim tracing the top of his beanie and one shoulder. Cold blue monochromatic grade, deeply crushed blacks with most of the frame near black, soft halation blooming around the moon and its reflection, fine 35mm film grain, extremely high contrast, wide tonal range between the black land and the lit water. Neo-noir music video, moody nighttime cinematography, shot on large-format digital with vintage anamorphic glass.\n' +
      '[Negative]: No cuts, no transitions, no camera movement, no morphing, no text or captions, no other people, no denim, no visible facial detail, no gestures.',
    referenceIds: ['fVaTeP4dSDpKEyWG7g3K', 'V4atf6iIkrEae6d4vcbd'],
    role: 'loop',
  },
  characterSheet: {
    model: 'gpt-image-2',
    prompt:
      'Create a character sheet of the same man from @J8TviP6GdF62a9VrxBe0 and @image2, shown in a four-panel grid: front view, three-quarter view, side profile, and back view. Full body, standing, neutral pose, consistent lighting. Take his face, beard, neck tattoos, and glasses from @image2; take his build and proportions from @image1. He wears clear-framed glasses, a maroon-and-white striped beanie, a thick silver Cuban chain, a dark green oversized crewneck sweater, black tapered jogger pants (not jeans — replace any denim with black joggers), and black-and-white low-top skate sneakers with a white side stripe. His neck tattoos and beard must be clearly visible and identical in every panel. Plain neutral grey background, even lighting, no text.',
    referenceIds: ['J8TviP6GdF62a9VrxBe0'],
    role: 'reference',
  },
};
