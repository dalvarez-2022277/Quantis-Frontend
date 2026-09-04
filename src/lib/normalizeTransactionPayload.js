function parseMonto(value) {
  if (value === null || value === undefined || value === '') return undefined;
  const n =
    typeof value === 'number'
      ? value
      : parseFloat(String(value).replace(/,/g, '').trim());
  if (Number.isNaN(n)) return undefined;
  return n;
}

function normalizeCuentaId(value) {
  if (value === null || value === undefined || value === '') return undefined;
  const s = String(value).trim();
  if (s.length !== 24) return undefined;
  return s;
}

export function normalizeIngresoPayload(body) {
  if (!body || typeof body !== 'object') return body;
  const out = { ...body };
  const m = parseMonto(out.monto);
  if (m !== undefined) out.monto = m;
  if (out.cuentaId === null) {
    /* permitir quitar cuenta en PUT */
  } else {
    const cid = normalizeCuentaId(out.cuentaId);
    if (cid !== undefined) out.cuentaId = cid;
    else delete out.cuentaId;
  }
  return out;
}

export function normalizeGastoPayload(body) {
  if (!body || typeof body !== 'object') return body;
  const out = { ...body };
  const m = parseMonto(out.monto);
  if (m !== undefined) out.monto = m;
  if (out.cuentaId === null) {
    /* permitir quitar cuenta en PUT */
  } else {
    const cid = normalizeCuentaId(out.cuentaId);
    if (cid !== undefined) out.cuentaId = cid;
    else delete out.cuentaId;
  }
  return out;
}
