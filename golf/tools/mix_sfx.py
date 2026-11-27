# mix_sfx.py : drop the user's SFX files onto the golf video at the story beats (no re-render needed).
#   python3 -I mix_sfx.py <sfx_dir> <video_in.mp4> <video_out.mp4>
# Files are matched to cue names by their file name (case/space/underscore/number-prefix insensitive),
# e.g. "06_dog_chew.wav", "Dog Chew.mp3" -> "dog chew". Missing files are simply skipped (listed at the end).
import sys, os, re, json, subprocess, numpy as np
SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
CUES = json.load(open(os.path.join(HERE, 'sfx_cues.json')))
def norm(s): s = os.path.splitext(os.path.basename(s))[0].lower(); s = re.sub(r'^[0-9]+[\s._-]*', '', s); return re.sub(r'[^a-z]', '', s)
def load(fn):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', fn, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()
def main():
    sdir, vin, vout = sys.argv[1:4]
    files = {norm(f): os.path.join(sdir, f) for f in os.listdir(sdir) if f.lower().endswith(('.wav', '.mp3', '.ogg', '.m4a', '.aac', '.flac'))}
    voice = load(vin); n = len(voice); mix = np.zeros_like(voice); used, missing = [], []
    for name, spec in CUES.items():
        key = norm(name); fn = files.get(key) or next((v for k, v in files.items() if key in k or k in key), None)
        if not fn: missing.append(name); continue
        clip = load(fn); used.append(name)
        for c in spec['at']:
            t0, gain = c[0], 10 ** (c[1] / 20) if len(c) > 1 else 10 ** (spec.get('db', -6) / 20); dur = c[2] if len(c) > 2 else None
            seg = clip; off = c[3] if len(c) > 3 else 0
            if dur:   # loop / trim to the asked length with short fades; off = start inside the clip (seconds, or 'end' = take its last part)
                L = int(dur * SR); src = clip[max(0, len(clip) - L):] if off == 'end' else clip[int(off * SR):]
                reps = int(np.ceil(L / max(1, len(src)))); seg = np.tile(src, (reps, 1))[:L].copy(); f = min(len(seg) // 4, int(0.12 * SR)); ramp = np.linspace(0, 1, f)[:, None]
                if off != 'end': seg[:min(f, int(0.02 * SR))] *= np.linspace(0, 1, min(f, int(0.02 * SR)))[:, None]
                seg[-f:] *= ramp[::-1]
            a = int(t0 * SR)
            if a >= n: continue
            b = min(n, a + len(seg)); mix[a:b] += seg[:b - a] * gain
    # duck everything under the voice (voice stays on top), then gentle limiter
    env = np.abs(voice).max(axis=1); k = int(0.05 * SR); env = np.convolve(env, np.ones(k) / k, mode='same'); duck = 1 - 0.45 * np.clip(env / 0.08, 0, 1)
    out = voice + mix * duck[:, None]; peak = np.abs(out).max(); out = out / max(1, peak / 0.98)
    wav = vout + '.mix.f32'; out.astype(np.float32).tofile(wav)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', vin, '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', vout], check=True); os.remove(wav)
    print('used:', ', '.join(used)); print('missing:', ', '.join(missing) or 'none')
main()
