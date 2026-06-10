const SPREADSHEET_ID = '1X-L49ZRnERMYXsLSXRd5Yk-b9pYRh3ApOufeTEK_qG4';
const SHEET_NAME = 'Index';

const CATEGORY_META = [
  ['arquitectura-general', 'Arquitectura general'],
  ['urbanismo-espacio-publico', 'Urbanismo y espacio publico'],
  ['construccion-materiales', 'Construccion y materiales'],
  ['vivienda-habitar', 'Vivienda y habitar'],
  ['salud-equipamiento', 'Salud y equipamiento'],
  ['accesibilidad-diseno-universal', 'Accesibilidad y diseno universal'],
  ['normativa-practica-profesional', 'Normativa y practica profesional'],
  ['recursos-autocad', 'Recursos AutoCAD']
];

function doGet(e) {
  const callback = e && e.parameter && e.parameter.callback;

  try {
    const payload = readSheetPayload_();
    return output_(payload, callback);
  } catch (err) {
    return output_({
      success: false,
      error: String(err && err.message ? err.message : err)
    }, callback);
  }
}

function readSheetPayload_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.getActiveSheet();
  const values = sheet.getDataRange().getValues();

  if (!values || values.length <= 1) {
    return {
      success: true,
      generatedAt: new Date().toISOString(),
      folders: []
    };
  }

  const headers = values[0].map(function(header) {
    return normalize_(header);
  });

  const idx = {
    title: findHeader_(headers, ['title', 'titulo', 'name', 'nombre']),
    category: findHeader_(headers, ['category', 'categoria']),
    fileId: findHeader_(headers, ['fileid', 'file-id', 'id']),
    mimeType: findHeader_(headers, ['mimetype', 'mime-type', 'mime']),
    size: findHeader_(headers, ['size', 'tamano', 'bytes', 'mb']),
    folder: findHeader_(headers, ['folder', 'carpeta', 'path', 'ruta']),
    tags: findHeader_(headers, ['tags', 'etiquetas']),
    url: findHeader_(headers, ['url', 'viewurl', 'view-url']),
    downloadUrl: findHeader_(headers, ['downloadurl', 'download-url']),
    thumbnail: findHeader_(headers, ['thumbnail', 'thumb']),
    rootFolderId: findHeader_(headers, ['rootfolderid', 'root-folder-id']),
    sourceFolderId: findHeader_(headers, ['sourcefolderid', 'source-folder-id', 'folderid', 'folder-id'])
  };

  if (idx.title < 0 || idx.fileId < 0) {
    throw new Error('El Sheet necesita columnas title/name y fileId/id.');
  }

  const groups = {};

  CATEGORY_META.forEach(function(meta) {
    groups[meta[0]] = {
      id: meta[0],
      name: meta[1],
      category: meta[1],
      folder: meta[1],
      count: 0,
      libros: []
    };
  });

  const seen = {};

  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const fileId = cell_(row, idx.fileId);
    const title = cell_(row, idx.title);
    if (!fileId || !title || seen[fileId]) continue;
    seen[fileId] = true;

    const folder = cell_(row, idx.folder);
    const category = resolveCategory_(cell_(row, idx.category), folder, cell_(row, idx.tags), cell_(row, idx.mimeType), title);
    const group = groups[category] || groups['arquitectura-general'];

    const item = {
      id: fileId,
      title: cleanTitle_(title),
      name: cleanTitle_(title),
      category: group.name,
      folder: folder || group.name,
      mimeType: cell_(row, idx.mimeType),
      size: toNumber_(cell_(row, idx.size)),
      tags: splitTags_(cell_(row, idx.tags)),
      url: cell_(row, idx.url) || 'https://drive.google.com/file/d/' + fileId + '/view?usp=drivesdk',
      viewUrl: cell_(row, idx.url) || 'https://drive.google.com/file/d/' + fileId + '/view',
      downloadUrl: cell_(row, idx.downloadUrl) || 'https://drive.google.com/uc?export=download&id=' + fileId,
      thumbnail: cell_(row, idx.thumbnail) || 'https://drive.google.com/thumbnail?id=' + fileId + '&sz=w600',
      folderId: cell_(row, idx.sourceFolderId),
      rootFolderId: cell_(row, idx.rootFolderId)
    };

    group.libros.push(item);
    group.count = group.libros.length;
  }

  const folders = CATEGORY_META
    .map(function(meta) { return groups[meta[0]]; })
    .filter(function(group) { return group.libros.length > 0; });

  return {
    success: true,
    generatedAt: new Date().toISOString(),
    folders: folders
  };
}

function resolveCategory_(category, folder, tags, mimeType, title) {
  const raw = normalize_([category, folder, tags, mimeType, title].join(' '));

  const direct = {
    'arquitectura-general': 'arquitectura-general',
    'arquitectura': 'arquitectura-general',
    'urbanismo-y-espacio-publico': 'urbanismo-espacio-publico',
    'urbanismo-espacio-publico': 'urbanismo-espacio-publico',
    'construccion-y-materiales': 'construccion-materiales',
    'construccion-materiales': 'construccion-materiales',
    'vivienda-y-habitar': 'vivienda-habitar',
    'vivienda-habitar': 'vivienda-habitar',
    'salud-y-equipamiento': 'salud-equipamiento',
    'salud-equipamiento': 'salud-equipamiento',
    'accesibilidad-y-diseno-universal': 'accesibilidad-diseno-universal',
    'accesibilidad-diseno-universal': 'accesibilidad-diseno-universal',
    'normativa-y-practica-profesional': 'normativa-practica-profesional',
    'normativa-practica-profesional': 'normativa-practica-profesional',
    'recursos-autocad': 'recursos-autocad',
    'autocad': 'recursos-autocad'
  };

  if (direct[normalize_(category)]) return direct[normalize_(category)];
  if (hasAny_(raw, ['autocad', ' cad ', 'dwg', 'dxf', 'hatch', 'hatches', 'patron', 'patrones', 'bloque', 'bloques'])) return 'recursos-autocad';
  if (hasAny_(raw, ['urbanismo', 'urbano', 'ciudad', 'calle', 'movilidad', 'territorio', 'paisaje'])) return 'urbanismo-espacio-publico';
  if (hasAny_(raw, ['construccion', 'material', 'madera', 'concreto', 'hormigon', 'acero', 'estructura', 'geologia', 'geotecnia'])) return 'construccion-materiales';
  if (hasAny_(raw, ['vivienda', 'habitar', 'casa', 'residencial'])) return 'vivienda-habitar';
  if (hasAny_(raw, ['salud', 'hospital', 'equipamiento', 'escuela', 'biblioteca', 'oncologia'])) return 'salud-equipamiento';
  if (hasAny_(raw, ['accesibilidad', 'universal', 'discapacidad', 'ergonomia', 'dimension'])) return 'accesibilidad-diseno-universal';
  if (hasAny_(raw, ['normativa', 'reglamento', 'codigo', 'etica', 'practica-profesional'])) return 'normativa-practica-profesional';
  return 'arquitectura-general';
}

function output_(payload, callback) {
  const json = JSON.stringify(payload);
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function findHeader_(headers, names) {
  for (let i = 0; i < names.length; i++) {
    const target = normalize_(names[i]);
    const found = headers.indexOf(target);
    if (found >= 0) return found;
  }
  return -1;
}

function cell_(row, index) {
  if (index < 0) return '';
  return String(row[index] == null ? '' : row[index]).trim();
}

function cleanTitle_(value) {
  return String(value || '')
    .replace(/\.[^.]+$/, '')
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitTags_(value) {
  return String(value || '')
    .split(/[,;]/)
    .map(function(tag) { return tag.trim(); })
    .filter(Boolean);
}

function toNumber_(value) {
  const number = Number(value);
  return isFinite(number) ? number : 0;
}

function hasAny_(value, words) {
  return words.some(function(word) {
    return value.indexOf(normalize_(word)) !== -1;
  });
}

function normalize_(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
