const fs = require("fs");
const html = fs.readFileSync(require("path").join(__dirname, "..", "index.html"), "utf8");
const src = html.slice(html.indexOf("// ENGINE-START"), html.indexOf("// ENGINE-END"));
const RR = new Function(src + "; return RR;")();

const cases = [
  ["<.+>", "g", "<b>bold</b> and <i>it</i>"],
  ["<.+?>", "g", "<b>bold</b> and <i>it</i>"],
  ["^(a+)+$", "", "aaaaaaaaaaaab"],
  ["^a+$", "", "aaaaaaaaaaaab"],
  ["^(a|aa)+$", "", "aaaaaaaaaaaaa!"],
  ["\\s+$", "", "total:              x"],
  ["^[\\w.+-]+@[\\w-]+\\.[\\w.]+$", "", "ada.lovelace@example.org"],
  ["\\b(\\w+)\\s+\\1\\b", "gi", "This is is a test. The the end."],
  ["^(?=.*\\d)(?=.*[A-Z]).{8,}$", "", "correcthorse9Battery"],
  ["(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})", "g", "Due 2026-11-02, shipped 2026-11-14"],
  ["(?:(a)|b)+", "", "ab"],
  ["(a*)*b", "", "aaab"],
  ["(a|ab)(c|bcd)(d*)", "", "abcd"],
  ["x*", "g", "axxb"],
  ["", "g", "abc"],
  ["a{2,3}?", "g", "aaaaaaa"],
  ["[^a-c\\d]+", "g", "abcXYZ123def"],
  ["^\\w+$", "gm", "one\ntwo\nthree"],
  ["a.c", "s", "a\nc"],
  ["a.c", "", "a\nc"],
  ["\\Bend\\b", "g", "weekend ending end"],
  ["(?!foo)\\w+", "g", "foo bar food"],
  ["(\\d+)-\\1", "", "12-12 and 34-35"],
  ["[a-z-]+", "g", "well-known x-y"],
  ["\\x41\\u0042[\\t ]", "", "AB "],
  ["HELLO", "i", "say hello"],
  ["[A-Z]+", "gi", "abcDEF"],
  ["(a)|(b)", "g", "ab"],
  ["((a)|b)+", "", "ab"],
  ["(?:a|b)*?c", "", "ababc"],
  ["\\k<x>(?<x>a)", "", "aa"],
  ["(a\\1)", "", "aa"],
  ["a{3}", "", "aa{3}aaa"],
  ["a{,3}", "", "a{,3}"],
  ["(?=(\\w+))\\1:", "", "abc:"],
];
let fail = 0;
for (const [p, f, s] of cases) {
  const parsed = RR.parse(p);
  const r = RR.run(parsed, s, f, { limit: 2000000 });
  const c = RR.compareNative(parsed, s, f, r);
  const status = r.aborted ? "ABORT" : c.ok ? "ok" : "DIFF";
  if (status !== "ok") fail++;
  console.log(status.padEnd(6), `/${p}/${f}`.padEnd(50), "frames", r.trace.length, "bt", r.stats.backtracks, c.ok ? "" : c.msg);
}
for (const bad of ["(", "a)", "*a", "a**", "[b-a]", "(?<=a)b", "\\2(a)", "^*", "a{3,1}", "\\"]) {
  try { RR.parse(bad); console.log("NO ERROR for", bad); fail++; }
  catch (e) { console.log("err ok", JSON.stringify(bad).padEnd(12), e.message, "@", e.pos); }
}
// random fuzz against native
const atoms = ["a", "b", ".", "[ab]", "(a|b)", "(?:ab)", "a*", "b+", "(a)?", "\\w", "a*?", "(b|)", "^", "$", "\\b", "(?=a)", "(?!b)"];
let fz = 0;
for (let t = 0; t < 4000; t++) {
  let p = "";
  const k = 1 + Math.floor(Math.random() * 4);
  for (let j = 0; j < k; j++) p += atoms[Math.floor(Math.random() * atoms.length)];
  if (Math.random() < .3) p = "(" + p + ")" + ["*", "+", "?", "{1,2}"][Math.floor(Math.random() * 4)];
  let s = "";
  const L = Math.floor(Math.random() * 7);
  for (let j = 0; j < L; j++) s += "ab c"[Math.floor(Math.random() * 4)];
  const f = Math.random() < .5 ? "g" : "";
  let parsed;
  try { new RegExp(p, f); } catch { continue; }
  try { parsed = RR.parse(p); } catch (e) { console.log("PARSE FAIL", p, e.message); fz++; continue; }
  const r = RR.run(parsed, s, f, { limit: 2000000 });
  const c = RR.compareNative(parsed, s, f, r);
  if (!c.ok) { fz++; if (fz < 15) console.log("FUZZ DIFF", `/${p}/${f}`, JSON.stringify(s), c.msg); }
}
console.log("fixed-case failures:", fail, "fuzz failures:", fz);
process.exitCode = fail || fz ? 1 : 0;
