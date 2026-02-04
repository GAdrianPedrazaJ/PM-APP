// pegadoExcel.js
// Utilidad para procesar texto pegado desde Excel y convertirlo en filas

/**
 * Divide el texto en líneas y tokens limpios
 * @param {string} text - Texto pegado desde Excel
 * @returns {Array<Array<string>>} - Arreglo de tokens por fila
 */
export function parseLines(text) {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l);
  const out = [];

  for (let line of lines) {
    if (!line || /total/i.test(line)) continue;
    // dividir por tabs o múltiples espacios
    let values = line.split(/\t+|\s{2,}/).map(v => v.trim()).filter(v => v && v !== '-' && v !== '–');
    // si contiene " - " (ej: código - descripción), dividir
    values = values.flatMap(tok => tok.includes(' - ') ? tok.split(/\s-\s/).map(s => s.trim()) : [tok]);
    values = values.filter(v => v !== '-' && v !== '–');
    if (values.length) out.push(values);
  }

  return out;
}

/**
 * Convierte tokens en objeto según el esquema definido
 * @param {Array<string>} tokens - Tokens de una fila
 * @param {Array<string>} schema - Nombres de campos en orden
 * @returns {Object} - Objeto con los campos mapeados
 */
export function mapTokens(tokens, schema) {
  const obj = {};
  schema.forEach((field, idx) => {
    obj[field] = tokens[idx] || '';
  });
  return obj;
}

/**
 * Procesa texto completo según un esquema
 * @param {string} text - Texto pegado desde Excel
 * @param {Array<string>} schema - Nombres de campos en orden
 * @returns {Array<Object>} - Arreglo de objetos listos para insertar
 */
export function parseExcelData(text, schema) {
  const lines = parseLines(text);
  return lines.map(tokens => mapTokens(tokens, schema));
}
