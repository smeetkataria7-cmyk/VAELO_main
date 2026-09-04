/* ==========================================================================
   VAELO — image manager for the work editor.

   Drag files onto a project, order them, pick the hero. Then either:

   * "Save into the site folder" — Chrome and Edge can write directly into
     your local copy of the repo through the File System Access API. Pick the
     VAELO_main folder once and every later save goes straight to disk.
   * "Download a zip" — every other browser gets assets/ as a zip to unpack
     over the repo.

   Files live in IndexedDB until saved, so a reload never loses them.
   ========================================================================== */
(function (global) {
  'use strict';

  /* ------------------------------------------------------------ storage */
  var DB = 'vaelo-editor', STORE = 'files', META = 'meta';
  function open() {
    return new Promise(function (res, rej) {
      var r = indexedDB.open(DB, 1);
      r.onupgradeneeded = function () {
        var db = r.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
        if (!db.objectStoreNames.contains(META)) db.createObjectStore(META);
      };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
  }
  function tx(store, mode, fn) {
    return open().then(function (db) {
      return new Promise(function (res, rej) {
        var t = db.transaction(store, mode), s = t.objectStore(store), out = fn(s);
        t.oncomplete = function () { res(out && out.result !== undefined ? out.result : out); };
        t.onerror = function () { rej(t.error); };
      });
    });
  }
  var store = {
    put: function (k, v) { return tx(STORE, 'readwrite', function (s) { s.put(v, k); }); },
    get: function (k) { return tx(STORE, 'readonly', function (s) { return s.get(k); }); },
    del: function (k) { return tx(STORE, 'readwrite', function (s) { s.delete(k); }); },
    keys: function () { return tx(STORE, 'readonly', function (s) { return s.getAllKeys(); }); },
    meta: function (k, v) {
      return arguments.length > 1
        ? tx(META, 'readwrite', function (s) { s.put(v, k); })
        : tx(META, 'readonly', function (s) { return s.get(k); });
    }
  };

  /* --------------------------------------------------------- the model */
  /* files[slug] = [{ id, name, type, size, blob }]  — order is display order */
  var files = {};

  function key(slug, id) { return slug + '/' + id; }

  function load(slug) {
    return store.keys().then(function (keys) {
      var mine = keys.filter(function (k) { return String(k).indexOf(slug + '/') === 0; });
      return Promise.all(mine.map(function (k) { return store.get(k); }));
    }).then(function (recs) {
      files[slug] = recs.filter(Boolean).sort(function (a, b) { return a.order - b.order; });
      return files[slug];
    });
  }

  function add(slug, fileList) {
    var list = files[slug] || (files[slug] = []);
    var incoming = Array.prototype.slice.call(fileList).filter(function (f) {
      return /^(image|video)\//.test(f.type);
    });
    return Promise.all(incoming.map(function (f, i) {
      var rec = {
        id: Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
        name: f.name, type: f.type, size: f.size,
        order: list.length + i, blob: f
      };
      list.push(rec);
      return store.put(key(slug, rec.id), rec);
    })).then(function () { return list; });
  }

  function remove(slug, id) {
    files[slug] = (files[slug] || []).filter(function (r) { return r.id !== id; });
    return store.del(key(slug, id)).then(function () { return reorder(slug, files[slug]); });
  }

  function reorder(slug, list) {
    files[slug] = list;
    return Promise.all(list.map(function (r, i) {
      r.order = i;
      return store.put(key(slug, r.id), r);
    }));
  }

  function move(slug, id, delta) {
    var list = files[slug] || [], i = list.findIndex(function (r) { return r.id === id; });
    var j = i + delta;
    if (i < 0 || j < 0 || j >= list.length) return Promise.resolve(list);
    var t = list[i]; list[i] = list[j]; list[j] = t;
    return reorder(slug, list).then(function () { return list; });
  }

  function makeHero(slug, id) {
    var list = files[slug] || [], i = list.findIndex(function (r) { return r.id === id; });
    if (i <= 0) return Promise.resolve(list);
    list.unshift(list.splice(i, 1)[0]);
    return reorder(slug, list).then(function () { return list; });
  }

  /* --------------------------------------------------- naming on disk */
  function ext(rec) {
    var m = /\.([a-z0-9]+)$/i.exec(rec.name);
    if (m) return '.' + m[1].toLowerCase();
    return rec.type.indexOf('video') === 0 ? '.mp4' : '.jpg';
  }
  function diskName(rec, i) { return String(i + 1).padStart(2, '0') + ext(rec); }
  function pathFor(slug, rec, i) { return 'assets/work/' + slug + '/' + diskName(rec, i); }

  function pathsFor(slug) {
    return (files[slug] || []).map(function (r, i) { return pathFor(slug, r, i); });
  }

  /* ------------------------------------------- writing into the folder */
  function canWriteDirect() { return typeof global.showDirectoryPicker === 'function'; }

  function ensurePermission(handle) {
    var opts = { mode: 'readwrite' };
    return handle.queryPermission(opts).then(function (p) {
      return p === 'granted' ? 'granted' : handle.requestPermission(opts);
    });
  }

  function getRoot(forcePick) {
    if (forcePick) {
      return global.showDirectoryPicker({ mode: 'readwrite' }).then(function (h) {
        return store.meta('root', h).then(function () { return h; });
      });
    }
    return store.meta('root').then(function (h) {
      if (!h) return getRoot(true);
      return ensurePermission(h).then(function (p) {
        return p === 'granted' ? h : getRoot(true);
      });
    });
  }

  function dir(parent, name) { return parent.getDirectoryHandle(name, { create: true }); }

  function writeFile(folder, name, blob) {
    return folder.getFileHandle(name, { create: true })
      .then(function (fh) { return fh.createWritable(); })
      .then(function (w) { return w.write(blob).then(function () { return w.close(); }); });
  }

  function saveToFolder(work, workJsText, onProgress) {
    var written = 0, total = 0;
    Object.keys(files).forEach(function (s) { total += files[s].length; });
    return getRoot().then(function (root) {
      return dir(root, 'assets').then(function (assets) {
        return dir(assets, 'work').then(function (workDir) {
          var chain = Promise.resolve();
          Object.keys(files).forEach(function (slug) {
            if (!files[slug].length) return;
            chain = chain.then(function () {
              return dir(workDir, slug).then(function (pd) {
                var inner = Promise.resolve();
                files[slug].forEach(function (rec, i) {
                  inner = inner.then(function () {
                    return writeFile(pd, diskName(rec, i), rec.blob).then(function () {
                      written++;
                      if (onProgress) onProgress(written, total, slug);
                    });
                  });
                });
                return inner;
              });
            });
          });
          return chain.then(function () {
            return writeFile(assets, 'work.js', new Blob([workJsText], { type: 'text/javascript' }));
          }).then(function () { return { written: written, total: total }; });
        });
      });
    });
  }

  /* --------------------------------------------------- zip fallback */
  function loadJSZip() {
    if (global.JSZip) return Promise.resolve(global.JSZip);
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
      s.onload = function () { res(global.JSZip); };
      s.onerror = function () { rej(new Error('zip library unavailable')); };
      document.head.appendChild(s);
    });
  }

  function saveZip(workJsText) {
    return loadJSZip().then(function (JSZip) {
      var zip = new JSZip();
      zip.file('assets/work.js', workJsText);
      Object.keys(files).forEach(function (slug) {
        files[slug].forEach(function (rec, i) {
          zip.file(pathFor(slug, rec, i), rec.blob);
        });
      });
      return zip.generateAsync({ type: 'blob' });
    }).then(function (blob) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'vaelo-assets.zip';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    });
  }

  global.VaeloImages = {
    load: load, add: add, remove: remove, move: move, makeHero: makeHero,
    list: function (slug) { return files[slug] || []; },
    pathsFor: pathsFor, diskName: diskName,
    canWriteDirect: canWriteDirect, saveToFolder: saveToFolder, saveZip: saveZip,
    pickFolder: function () { return getRoot(true); }
  };
})(window);
