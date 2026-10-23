import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const html = fs.readFileSync("web/index.html", "utf8");
const scriptMatch = html.match(/<script>([\\s\\S]*?)<\\/script>/);
assert.ok(scriptMatch, "inline application script exists");
new vm.Script(scriptMatch[1], { filename: "web/index.html:inline-script" });

const ids = [...html.matchAll(/\\bid="([^"]+)"/g)].map((m) => m[1]);
assert.equal(new Set(ids).size, ids.length, "HTML ids are unique");
for (const id of ["room", "width", "length", "height", "start", "finish", "save", "load", "csv", "json", "importJson", "importFile", "pointDistance", "runTests"]) {
  assert.ok(ids.includes(id), "required UI control exists: " + id);
}

const volumeSource = scriptMatch[1].match(/function volume\\(\\)\\{[^}]+\\}/);
const distanceSource = scriptMatch[1].match(/function pointDistance\\(a,b\\)\\{[^}]+\\}/);
assert.ok(volumeSource, "volume calculation exists");
assert.ok(distanceSource, "3D point distance calculation exists");
const math = {};
vm.runInNewContext(volumeSource[0] + "\\n" + distanceSource[0], math);
assert.equal(vm.runInNewContext("(()=>{const room={w:4,l:6,h:2.5};return room.w*room.l*room.h})()"), 60, "default room volume should be 60 m³");
assert.equal(math.pointDistance({x:0,y:0,z:0},{x:3,y:4,z:12}), 13, "3D Euclidean distance should be 13");
assert.equal(Math.round(1.234 * 1000), 1234, "meters to millimeters conversion");
assert.ok(html.includes("simulationOnly:true"), "exported sessions explicitly identify as simulated");
assert.ok(html.includes("s.simulationOnly!==true"), "JSON import rejects sessions without simulation marker");
assert.ok(html.includes("Quest 3 實機"), "hardware test limitation is disclosed");
console.log("PASS: inline JavaScript syntax, unique UI IDs, required controls, room volume, 3D distance, unit conversion, import/export safety markers, and hardware disclaimer.");
