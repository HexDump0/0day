/* models/pack.bin loader — a custom binary: int16 positions, u8 baked AO,
   u8 rgb albedo, int8 smooth normals, u16/u32 indices; ~900 KB for all six.
   Format: [u32 magic 'A5CI'][u32 jsonLen][json][payload]. Parsed once and
   cached (module-level), shared between the WebGL path and the 2D fallback. */

export interface PackModel {
  verts: Int16Array;
  ao: Uint8Array;
  col: Uint8Array;
  nrm: Int8Array;
  indices: Uint16Array | Uint32Array;
  radius: number;
  idx32: boolean;
}

export type PackData = Record<string, PackModel>;

interface ManifestEntry {
  id: string;
  vertCount: number;
  idxCount: number;
  vertOffset: number;
  aoOffset: number;
  colOffset: number;
  nrmOffset: number;
  idxOffset: number;
  idx32?: boolean;
  radius: number;
  dims: number[];
}

let packData: PackData | null = null;

export async function fetchPack(): Promise<PackData> {
  if (packData) return packData;
  const res = await fetch('models/pack.bin');
  if (!res.ok) throw new Error('pack.bin ' + res.status);
  const buf = await res.arrayBuffer();
  const dv = new DataView(buf);
  if (dv.getUint32(0, false) !== 0x41354349) throw new Error('bad magic'); // 'A5CI'
  const jsonLen = dv.getUint32(4, true);
  const manifest: ManifestEntry[] = JSON.parse(
    new TextDecoder().decode(new Uint8Array(buf, 8, jsonLen)).replace(/\0+$/, ''),
  );
  const base = 8 + jsonLen;
  const byId: PackData = {};
  for (const m of manifest) {
    byId[m.id] = {
      verts: new Int16Array(buf, base + m.vertOffset, m.vertCount * 3),
      ao: new Uint8Array(buf, base + m.aoOffset, m.vertCount),
      col: new Uint8Array(buf, base + m.colOffset, m.vertCount * 3),
      nrm: new Int8Array(buf, base + m.nrmOffset, m.vertCount * 3),
      indices: m.idx32
        ? new Uint32Array(buf, base + m.idxOffset, m.idxCount)
        : new Uint16Array(buf, base + m.idxOffset, m.idxCount),
      radius: m.radius,
      idx32: !!m.idx32,
    };
  }
  packData = byId;
  return byId;
}
