export function ok(res, data) {
  return res.status(200).json(data);
}

export function error(res, message, code = 400) {
  return res.status(code).json({ error: message });
}
