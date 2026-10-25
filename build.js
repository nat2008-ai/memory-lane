/* Build a self-contained index.html for "Memory Lane".
 *
 * Source of truth for markup + component logic is the Claude Design export
 * (src/Memory Lane.dc.html). We strip the proprietary Claude runtime
 * (support.js / image-slot.js) and drive the exact same markup + component
 * through our own tiny reactive runtime (see RUNTIME below). Photos are wired
 * in: 3 booth photos, an altar backdrop for the opening screen, and a kiss
 * backdrop for screen 02.
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const src = fs.readFileSync(path.join(ROOT, 'src', 'Memory Lane.dc.html'), 'utf8');

// --- extract pieces from the export -----------------------------------------
const baseCss = src.match(/<style>([\s\S]*?)<\/style>/)[1];           // base rules + @keyframes (lives in <helmet>)
let xdc = src.match(/<x-dc>([\s\S]*?)<\/x-dc>/)[1];                    // the whole app markup
xdc = xdc.replace(/<helmet>[\s\S]*?<\/helmet>/, '').trim();           // drop the helmet (fonts/keyframes/image-slot.js)
const component = src.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)[1]; // class Component extends DCLogic

// --- edit markup: booth photos ----------------------------------------------
function boothImg(n) {
  return '<img src="assets/booth-' + n + '.jpg" alt="" ' +
    'style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">';
}
xdc = xdc.replace(/<image-slot id="booth-photo-1"[^>]*><\/image-slot>/, boothImg(1));
xdc = xdc.replace(/<image-slot id="booth-photo-2"[^>]*><\/image-slot>/, boothImg(2));
xdc = xdc.replace(/<image-slot id="booth-photo-3"[^>]*><\/image-slot>/, boothImg(3));

// --- edit markup: replace screen 01 with a photo-backed opening -------------
const NEW_S01 =
'<section data-screen-label="01 Home — The Church" onClick="{{ tapChurch }}" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;cursor:pointer;user-select:none;overflow:hidden">' +
  '<div style="position:absolute;inset:0;background:url(assets/altar.jpg) center/cover"></div>' +
  '<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(42,4,8,.55) 0%,rgba(42,4,8,.12) 34%,rgba(42,4,8,.55) 70%,rgba(42,4,8,.96) 100%)"></div>' +
  '<div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;padding:0 24px 40px">' +
    '<div style="font-size:13px;letter-spacing:.32em;text-transform:uppercase;color:#e6cfc0">Ryan &amp; Sheila</div>' +
    '<h1 style="margin:2px 0 0;font-family:\'Great Vibes\',cursive;font-weight:400;font-size:clamp(40px,7vh,56px);line-height:1.02;color:#e8c97e;text-wrap:balance">Walk through memory lane</h1>' +
    '<div style="font-style:italic;font-size:19px;color:#e6cfc0;opacity:{{ homeHintOp }};transition:opacity .4s;animation:ml-breathe 2.4s ease-in-out infinite">Tap to begin</div>' +
  '</div>' +
'</section>';
{
  const a = xdc.indexOf('<section data-screen-label="01 Home');
  const b = xdc.indexOf('</section>', a) + '</section>'.length;
  xdc = xdc.slice(0, a) + NEW_S01 + xdc.slice(b);
}

// --- edit markup: add a dim kiss backdrop behind screen 02 ------------------
xdc = xdc.replace(
  /<section data-screen-label="02 The Proposal"[^>]*>/,
  '<section data-screen-label="02 The Proposal" style="position:absolute;inset:0;user-select:none;overflow:hidden">' +
    '<div style="position:absolute;inset:0;background:url(assets/kiss.jpg) center/cover;opacity:.16;pointer-events:none;z-index:0"></div>' +
    '<div style="position:absolute;inset:0;background:radial-gradient(120% 75% at 50% 42%,rgba(106,13,22,.45),rgba(60,6,12,.86));pointer-events:none;z-index:0"></div>' +
    '<div style="position:absolute;inset:0;z-index:1;display:flex;flex-direction:column;align-items:center;padding:48px 24px 72px">'
);
{
  const a = xdc.indexOf('data-screen-label="02 The Proposal"');
  const b = xdc.indexOf('</section>', a);
  xdc = xdc.slice(0, b) + '</div>' + xdc.slice(b);
}

// --- our tiny reactive runtime ----------------------------------------------
const RUNTIME = `
/* ---- Memory Lane: minimal fine-grained reactive runtime (no deps) ---- */
(function (global) {
  var UNITLESS = new Set(['opacity','zIndex','z-index','flex','flexGrow','flexShrink','fontWeight','lineHeight','order','zoom']);
  function styleObjToCss(o) {
    var s = '';
    for (var k in o) {
      var v = o[k]; if (v == null) continue;
      var prop = k.replace(/[A-Z]/g, function (m) { return '-' + m.toLowerCase(); });
      if (typeof v === 'number' && !UNITLESS.has(k)) v = v + 'px';
      s += prop + ':' + v + ';';
    }
    return s;
  }
  var exprCache = new Map();
  function compileExpr(srcx) {
    if (exprCache.has(srcx)) return exprCache.get(srcx);
    var fn;
    try { fn = new Function('d', 'with (d) { return (' + srcx + '); }'); }
    catch (e) { fn = function () { return undefined; }; }
    exprCache.set(srcx, fn);
    return fn;
  }
  function parseTokens(str) {
    var toks = [], last = 0, re = /\\{\\{\\s*([\\s\\S]*?)\\s*\\}\\}/g, m;
    while ((m = re.exec(str))) {
      if (m.index > last) toks.push({ t: str.slice(last, m.index) });
      toks.push({ e: compileExpr(m[1]) });
      last = m.index + m[0].length;
    }
    if (last < str.length) toks.push({ t: str.slice(last) });
    return toks;
  }
  function evalToks(toks, data) {
    if (toks.length === 1 && toks[0].e) return toks[0].e(data);       // single expr -> raw value
    var s = '';
    for (var i = 0; i < toks.length; i++) {
      var tk = toks[i];
      s += (tk.t != null) ? tk.t : (tk.e(data) == null ? '' : tk.e(data));
    }
    return s;
  }
  function dataFor(comp, scope) { return scope ? Object.assign({}, comp._vals, scope) : comp._vals; }

  var EVT = { onclick:'click', onpointerdown:'pointerdown', onpointermove:'pointermove',
              onpointerup:'pointerup', onpointercancel:'pointercancel', onwheel:'wheel' };

  function processNode(node, binds, ctx) {
    if (node.nodeType === 3) {
      if (node.nodeValue.indexOf('{{') !== -1) binds.push({ type:'text', node:node, toks:parseTokens(node.nodeValue), ctx:ctx });
      return;
    }
    if (node.nodeType !== 1) return;
    var tag = node.tagName.toLowerCase();
    if (tag === 'sc-if') {
      var tplIf = document.createElement('template');
      while (node.firstChild) tplIf.content.appendChild(node.firstChild);
      var anchorIf = document.createComment('if');
      node.parentNode.replaceChild(anchorIf, node);
      binds.push({ type:'if', anchor:anchorIf, toks:parseTokens(node.getAttribute('value')), tpl:tplIf, ctx:ctx, mounted:null });
      return;
    }
    if (tag === 'sc-for') {
      var tplFor = document.createElement('template');
      while (node.firstChild) tplFor.content.appendChild(node.firstChild);
      var anchorFor = document.createComment('for');
      node.parentNode.replaceChild(anchorFor, node);
      binds.push({ type:'for', anchor:anchorFor, listToks:parseTokens(node.getAttribute('list')),
                   asName:node.getAttribute('as'), tpl:tplFor, ctx:ctx, len:-1, mounted:[] });
      return;
    }
    if (node.hasAttribute('style') && node.getAttribute('style').indexOf('{{') !== -1) {
      binds.push({ type:'style', node:node, toks:parseTokens(node.getAttribute('style')), ctx:ctx });
    }
    var attrs = Array.prototype.slice.call(node.attributes);
    for (var i = 0; i < attrs.length; i++) {
      var nm = attrs[i].name.toLowerCase();
      if (EVT[nm]) {
        (function (evt, toks) {
          node.addEventListener(evt, function (e) {
            var fn = evalToks(toks, dataFor(ctx.comp, ctx.scope));
            if (typeof fn === 'function') fn(e);
          });
        })(EVT[nm], parseTokens(attrs[i].value));
        node.removeAttribute(attrs[i].name);
      }
    }
    var kids = Array.prototype.slice.call(node.childNodes);
    for (var j = 0; j < kids.length; j++) processNode(kids[j], binds, ctx);
  }

  function mountFragment(tpl, ctx, anchor) {
    var frag = tpl.content.cloneNode(true);
    var nodes = Array.prototype.slice.call(frag.childNodes);
    var sub = [];
    for (var i = 0; i < nodes.length; i++) processNode(nodes[i], sub, ctx);
    anchor.parentNode.insertBefore(frag, anchor);
    return { binds: sub, nodes: nodes };
  }

  function patchBinds(binds, comp) {
    for (var i = 0; i < binds.length; i++) {
      var b = binds[i];
      var data = dataFor(comp, b.ctx && b.ctx.scope);
      if (b.type === 'text') {
        b.node.nodeValue = evalToks(b.toks, data);
      } else if (b.type === 'style') {
        var v = evalToks(b.toks, data);
        b.node.setAttribute('style', (v && typeof v === 'object') ? styleObjToCss(v) : v);
      } else if (b.type === 'if') {
        var on = !!evalToks(b.toks, data);
        if (on && !b.mounted) { b.mounted = mountFragment(b.tpl, b.ctx, b.anchor); patchBinds(b.mounted.binds, comp); }
        else if (!on && b.mounted) { removeNodes(b.mounted.nodes); b.mounted = null; }
        else if (on && b.mounted) { patchBinds(b.mounted.binds, comp); }
      } else if (b.type === 'for') {
        var list = evalToks(b.listToks, data) || [];
        if (list.length !== b.len) {
          for (var k = 0; k < b.mounted.length; k++) removeNodes(b.mounted[k].nodes);
          b.mounted = [];
          for (var n = 0; n < list.length; n++) {
            var scope = Object.assign({}, b.ctx && b.ctx.scope);
            scope[b.asName] = list[n];
            var inst = mountFragment(b.tpl, { comp: comp, scope: scope }, b.anchor);
            b.mounted.push(inst);
            patchBinds(inst.binds, comp);
          }
          b.len = list.length;
        } else {
          for (var m2 = 0; m2 < b.mounted.length; m2++) patchBinds(b.mounted[m2].binds, comp);
        }
      }
    }
  }
  function removeNodes(nodes) { for (var i = 0; i < nodes.length; i++) if (nodes[i].parentNode) nodes[i].parentNode.removeChild(nodes[i]); }

  function DCLogic(props) { this.props = props || {}; this.state = {}; }
  DCLogic.prototype.setState = function (partial) {
    Object.assign(this.state, typeof partial === 'function' ? partial(this.state) : partial);
    this._schedule();
  };
  DCLogic.prototype._schedule = function () {
    if (this._pending) return; this._pending = true;
    var self = this;
    requestAnimationFrame(function () { self._pending = false; self._render(); });
  };
  DCLogic.prototype._render = function () { this._vals = this.renderVals(); patchBinds(this._rootBinds, this); };

  function mountApp(Cls, tpl, root, props) {
    var comp = new Cls(props);
    var frag = tpl.content.cloneNode(true);
    var nodes = Array.prototype.slice.call(frag.childNodes);
    var binds = [];
    var ctx = { comp: comp, scope: null };
    for (var i = 0; i < nodes.length; i++) processNode(nodes[i], binds, ctx);
    comp._rootBinds = binds;
    comp._vals = comp.renderVals();
    root.appendChild(frag);
    patchBinds(binds, comp);
    if (comp.componentDidMount) comp.componentDidMount();
    return comp;
  }

  global.DCLogic = DCLogic;
  global.mountApp = mountApp;
})(window);
`;

// --- assemble index.html -----------------------------------------------------
const head =
'<!DOCTYPE html>\n<html lang="en">\n<head>\n' +
'<meta charset="utf-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
'<title>Memory Lane — Ryan & Sheila</title>\n' +
'<meta name="description" content="A walk through memory lane — Ryan & Sheila.">\n' +
'<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
'<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
'<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Great+Vibes&display=swap">\n' +
'<style>\n' + baseCss + '\n</style>\n' +
'</head>\n<body>\n' +
'<div id="app-root"></div>\n' +
'<template id="app-tpl">';

const tail =
'</template>\n' +
'<script>\n' +
RUNTIME + '\n' +
component + '\n' +
'var q = new URLSearchParams(location.search);\n' +
"var props = { startScreen: q.get('screen') || '0', sound: true, songUrl: '' };\n" +
"mountApp(Component, document.getElementById('app-tpl'), document.getElementById('app-root'), props);\n" +
'</script>\n' +
'</body>\n</html>\n';

const out = head + xdc + tail;
fs.writeFileSync(path.join(ROOT, 'index.html'), out, 'utf8');
console.log('wrote index.html (' + out.length + ' bytes)');
