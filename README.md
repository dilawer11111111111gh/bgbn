# Tree short – code-rendered animation

Push to `main` and GitHub Actions renders the story named in `app.txt` (`tree` or `night`) on 8 machines x 4 CPUs (motion blur, 30 fps), joins it with the audio mix (`<app>/audio/mix.mp3`, else `voice.mp3`) and captions if present, and saves it:
- **Actions tab → latest run → Artifacts → final-video**, or
- branch **renders** → `videos/`.
