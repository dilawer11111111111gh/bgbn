# Downloads CC0 assets from Poly Haven (HDRI sky, PBR textures, glTF models) into assets/ . Runs on GitHub Actions.
import json, os, sys, urllib.request
UA = {'User-Agent': 'stick-toon-studio-assets'}
def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120).read()
def save(url, path):
    os.makedirs(os.path.dirname(path), exist_ok=True); data = get(url); open(path, 'wb').write(data); print(path, len(data))
want = json.load(open('tools/assets_wanted.json'))
man = {}
for kind in ('hdris', 'textures', 'models'):
    for aid in want.get(kind, []):
        try:
            files = json.loads(get(f'https://api.polyhaven.com/files/{aid}'))
            if kind == 'hdris':
                u = files['hdri'][want.get('hdri_res', '2k')]['hdr']['url']; p = f'assets/hdri/{aid}.hdr'; save(u, p); man[aid] = p
            elif kind == 'textures':
                res = want.get('tex_res', '1k'); out = {}
                for m, key in (('diff', 'Diffuse'), ('nor', 'nor_gl'), ('rough', 'Rough'), ('ao', 'AO'), ('arm', 'arm')):
                    if key in files and res in files[key]:
                        fmt = 'jpg' if 'jpg' in files[key][res] else list(files[key][res].keys())[0]
                        u = files[key][res][fmt]['url']; p = f'assets/tex/{aid}/{m}.{fmt}'; save(u, p); out[m] = p
                man[aid] = out
            else:
                res = want.get('model_res', '1k'); g = files['gltf'][res]['gltf']; base = f'assets/models/{aid}'
                save(g['url'], f'{base}/{aid}.gltf')
                for rel, inc in g.get('include', {}).items(): save(inc['url'], f'{base}/{rel}')
                man[aid] = f'{base}/{aid}.gltf'
        except Exception as e:
            print('FAILED', kind, aid, e)
json.dump(man, open('assets/manifest.json', 'w'), indent=1); print(json.dumps(man, indent=1))
