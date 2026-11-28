// grab hook for the render scripts (they call import('./core.js').grabJpeg)
export function grabJpeg(q = 0.93) {
  return new Promise((res) => window.__R.domElement.toBlob(async (b) => { const buf = new Uint8Array(await b.arrayBuffer()); let s = ''; const CH = 0x8000; for (let i = 0; i < buf.length; i += CH) s += String.fromCharCode.apply(null, buf.subarray(i, i + CH)); res(btoa(s)); }, 'image/jpeg', q));
}
