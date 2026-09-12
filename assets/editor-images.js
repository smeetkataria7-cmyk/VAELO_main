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
  /* "site" is reserved for generic page images (the Site Manager's image
     swaps) that don't belong to any one work project. Sequential 01/02/...
     naming is fine within one work project's own folder, but "site" gets
     reused across unrelated pages and separate browser sessions - two
     people replacing different images would both start counting from 01
     and silently overwrite each other's upload. Each file's own random id
     (assigned once, at upload time) keeps them unique instead. */
  function pathFor(slug, rec, i) {
    if (slug === 'site') return 'assets/site/' + rec.id + ext(rec);
    return 'assets/work/' + slug + '/' + diskName(rec, i);
  }

  function pathsFor(slug) {
    return (files[slug] || []).map(function (r, i) { return pathFor(slug, r, i); });
  }

  /* ------------------------------------------- writing into the folder */
  function canWriteDirect() { return typeof global.showDirectoryPicker === 'function'; }

  function ensurePermission(handle) {
    var opts = { mode: 'readwrite' };
    if (typeof handle.queryPermission !== 'function') {
      return typeof handle.requestPermission === 'function'
        ? handle.requestPermission(opts)
        : Promise.resolve('granted');
    }
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

  /* ------------------------------------------------ publish to GitHub ---
     Commits assets/work.js and every file added this session straight to
     the repo through the GitHub REST API, in one atomic commit. A GitHub
     Action (.github/workflows/build-cases.yml) then regenerates work/*.html
     on push, so this is the only step needed to go live — no terminal,
     no local git. Requires a fine-grained PAT scoped to this repo with
     "Contents: Read and write", entered once and kept in localStorage. */
  var GH_OWNER = 'smeetkataria7-cmyk', GH_REPO = 'VAELO_main', GH_BRANCH = 'main';
  var TOKEN_KEY = 'vaelo-gh-token';

  function getToken() { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; } }
  function setToken(t) { try { localStorage.setItem(TOKEN_KEY, t || ''); } catch (e) {} }
  function forgetToken() { try { localStorage.removeItem(TOKEN_KEY); } catch (e) {} }

  function gh(path, token, opts) {
    opts = opts || {};
    return fetch('https://api.github.com' + path, {
      method: opts.method || 'GET',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (r) {
      if (r.ok) return r.json();
      return r.json().catch(function () { return {}; }).then(function (j) {
        var msg = (j && j.message) || (r.status + ' ' + r.statusText);
        if (r.status === 401) msg = 'Token rejected — check it was pasted in full and has not expired.';
        if (r.status === 403) msg = 'Forbidden — the token needs "Contents: Read and write" on ' + GH_OWNER + '/' + GH_REPO + '. (' + msg + ')';
        if (r.status === 404) msg = 'Repo or branch not found — check the token has access to ' + GH_OWNER + '/' + GH_REPO + '. (' + msg + ')';
        var err = new Error(msg); err.status = r.status; throw err;
      });
    });
  }

  function blobToBase64(blob) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { res(String(r.result).split(',')[1] || ''); };
      r.onerror = function () { rej(r.error); };
      r.readAsDataURL(blob);
    });
  }

  function createBlob(token, content, encoding) {
    return gh('/repos/' + GH_OWNER + '/' + GH_REPO + '/git/blobs', token, {
      method: 'POST', body: { content: content, encoding: encoding }
    }).then(function (b) { return b.sha; });
  }

  /** Publishes any number of text files (assets/work.js, assets/blog.js, ...)
   *  plus every media file added this session, in one atomic commit.
   *  textFiles: [{ path, content }] - content is UTF-8 text. */
  function publishToGitHub(textFiles, onProgress, attempt) {
    var token = getToken();
    if (!token) return Promise.reject(new Error('Paste a GitHub token first.'));

    var mediaJobs = [];
    Object.keys(files).forEach(function (slug) {
      files[slug].forEach(function (rec, i) {
        mediaJobs.push({ path: pathFor(slug, rec, i), blob: rec.blob });
      });
    });
    var total = 1 /* ref */ + 1 /* base commit */ + textFiles.length +
                mediaJobs.length + 1 /* tree */ + 1 /* commit */ + 1 /* ref update */;
    var done = 0;
    function step(label) { done++; if (onProgress) onProgress(done, total, label); }

    var refSha, baseTreeSha;
    return gh('/repos/' + GH_OWNER + '/' + GH_REPO + '/git/ref/heads/' + GH_BRANCH, token)
      .then(function (ref) { refSha = ref.object.sha; step('Reading current state'); })
      .then(function () {
        return gh('/repos/' + GH_OWNER + '/' + GH_REPO + '/git/commits/' + refSha, token);
      })
      .then(function (commit) { baseTreeSha = commit.tree.sha; step('Reading current state'); })
      .then(function () {
        var treeEntries = [];
        var chain = Promise.resolve();
        textFiles.forEach(function (tf) {
          chain = chain.then(function () { return createBlob(token, tf.content, 'utf-8'); })
            .then(function (sha) {
              treeEntries.push({ path: tf.path, mode: '100644', type: 'blob', sha: sha });
              step('Uploading ' + tf.path.split('/').pop());
            });
        });
        mediaJobs.forEach(function (job) {
          chain = chain.then(function () { return blobToBase64(job.blob); })
            .then(function (b64) { return createBlob(token, b64, 'base64'); })
            .then(function (sha) {
              treeEntries.push({ path: job.path, mode: '100644', type: 'blob', sha: sha });
              step('Uploading ' + job.path.split('/').pop());
            });
        });
        return chain.then(function () { return treeEntries; });
      })
      .then(function (treeEntries) {
        return gh('/repos/' + GH_OWNER + '/' + GH_REPO + '/git/trees', token, {
          method: 'POST', body: { base_tree: baseTreeSha, tree: treeEntries }
        });
      })
      .then(function (tree) {
        step('Building commit');
        return gh('/repos/' + GH_OWNER + '/' + GH_REPO + '/git/commits', token, {
          method: 'POST',
          body: { message: 'Publish update from the editor', tree: tree.sha, parents: [refSha] }
        });
      })
      .then(function (commit) {
        step('Publishing');
        return gh('/repos/' + GH_OWNER + '/' + GH_REPO + '/git/refs/heads/' + GH_BRANCH, token, {
          method: 'PATCH', body: { sha: commit.sha }
        }).then(function () { step('Done'); return commit; });
      })
      .catch(function (err) {
        /* someone else published in the moment between our ref read and
           write — refetch and try once more rather than failing outright */
        if (err.status === 422 && !attempt) return publishToGitHub(textFiles, onProgress, 1);
        throw err;
      });
  }

  global.VaeloImages = {
    load: load, add: add, remove: remove, move: move, makeHero: makeHero,
    list: function (slug) { return files[slug] || []; },
    pathsFor: pathsFor, diskName: diskName,
    canWriteDirect: canWriteDirect, saveToFolder: saveToFolder, saveZip: saveZip,
    pickFolder: function () { return getRoot(true); },
    getToken: getToken, setToken: setToken, forgetToken: forgetToken,
    publishToGitHub: publishToGitHub
  };
})(window);
