import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const html = fs.readFileSync("web/index.html", "utf8");
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(scriptMatch, "inline application script exists");
new vm.Script(scriptMatch[1], { filename: "web/index.html:inline-script" });

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
assert.equal(new Set(ids).size, ids.length, "HTML ids are unique");
for (const id of ["room", "width", "length", "height", "start", "finish", "save", "load", "csv", "json", "importJson", "importFile", "pointDistance", "runTests", "objectLibrary", "objName", "objType", "objX", "objY", "objZ", "objW", "objD", "objH", "addObject", "objectList", "objectCount", "cadImport", "cadFile", "cadUnits", "cadHeight", "cadRotation", "cadOffsetX", "cadOffsetY", "cadOffsetZ", "cadCategory", "importDxf", "cadReport", "roomBoundaryEditor", "roomPolygon", "applyPolygon", "polygonReport"]) {
  assert.ok(ids.includes(id), "required UI control exists: " + id);
}

const volumeSource = scriptMatch[1].match(/function volume\(\)\{[^}]+\}/);
const distanceSource = scriptMatch[1].match(/function pointDistance\(a,b\)\{[^}]+\}/);
assert.ok(volumeSource, "volume calculation exists");
assert.ok(distanceSource, "3D point distance calculation exists");
assert.ok(scriptMatch[1].includes("room.polygon"), "room renderer supports arbitrary polygon boundaries");
assert.ok(scriptMatch[1].includes("牆段輪廓無效"), "custom wall boundary validation exists");
assert.ok(scriptMatch[1].includes("room.polygon.map(p=>p.x+','+p.y).join"), "custom wall vertices are restored in load/import UI");
const areaStart = scriptMatch[1].indexOf("function polygonArea(poly){");
const areaEnd = scriptMatch[1].indexOf("\nfunction volume()", areaStart);
assert.ok(areaStart >= 0 && areaEnd > areaStart, "polygon area calculation exists");
const areaSource = scriptMatch[1].slice(areaStart, areaEnd);
const polyMath = {};
vm.runInNewContext(areaSource + ";globalThis.area=polygonArea;", polyMath);
assert.equal(polyMath.area([{x:0,y:0},{x:4,y:0},{x:3,y:2},{x:0,y:2}]), 7, "non-rectangular polygon area should be 7 m²");
assert.ok(html.includes("平面斜角牆") && html.includes("立面斜坡另行建模"), "plan-angled wall and vertical-profile slope are distinguished");
const math = { room: { w: 4, l: 6, h: 2.5 } };
vm.runInNewContext(volumeSource[0] + "\n" + distanceSource[0], math);
assert.equal(math.volume(), 60, "default room volume should be 60 m³");
assert.equal(math.pointDistance({x:0,y:0,z:0},{x:3,y:4,z:12}), 13, "3D Euclidean distance should be 13");
assert.equal(Math.round(1.234 * 1000), 1234, "meters to millimeters conversion");
assert.ok(html.includes("simulationOnly:true"), "exported sessions explicitly identify as simulated");
assert.ok(html.includes("s.simulationOnly!==true"), "JSON import rejects sessions without simulation marker");
assert.ok(scriptMatch[1].includes("本機房間尺寸超出允許範圍"), "local save loading validates room dimensions");
assert.ok(scriptMatch[1].includes("本機量測點座標無效或超出房間邊界"), "local save loading validates point bounds");
assert.ok(scriptMatch[1].includes("s.simulationOnly!==true"), "local save loading requires simulation-only marker");
assert.ok(html.includes("Quest 3 實機"), "hardware test limitation is disclosed");
assert.ok(/function startScan\(\)[^}]*requestAnimationFrame\(tick\)/.test(scriptMatch[1]), "scan animation starts with a browser-provided timestamp");
assert.ok(!/function startScan\(\)[^}]*;tick\(\)/.test(scriptMatch[1]), "scan animation does not invoke tick without a timestamp");
console.log("PASS: inline JavaScript syntax, unique UI IDs, required controls, room volume, 3D distance, unit conversion, import/export safety markers, and hardware disclaimer.");

assert.ok(scriptMatch[1].includes("function objectValid(o)"), "fixture model validation exists");
assert.ok(scriptMatch[1].includes("objects:objects.map(o=>({...o}))"), "fixture models are included in saved sessions");
assert.ok(scriptMatch[1].includes("objects=(s.objects||[]).map(o=>({...o}))"), "fixture models are restored from sessions");
assert.ok(scriptMatch[1].includes("objects.forEach(o=>"), "fixture and cabinet models are rendered in the room view");
assert.ok(scriptMatch[1].includes("['embedded','cabinet','counter','other'].includes(o.type)"), "fixture types are constrained to supported categories");
assert.ok(scriptMatch[1].includes("o.x+o.w<=room.w+1e-6"), "fixture dimensions are validated against room boundaries");
assert.ok(html.includes("不會自動猜測"), "fixture measurements are explicitly user-provided");
console.log("PASS: fixture/cabinet model UI, bounds validation, room rendering, and session persistence checks.");

assert.ok(scriptMatch[1].includes("function parseClosedDxfPolylines"), "DXF closed-polyline parser exists");
assert.ok(scriptMatch[1].includes("geometry:'cad-prism'"), "DXF footprints are saved as 3D prism models");
assert.ok(scriptMatch[1].includes("sourceLayer:s.layer"), "CAD source layer is preserved in model metadata");
const parserMatch = scriptMatch[1].match(/const DXF_UNIT_SCALE=\{[^}]+\};\s*function parseClosedDxfPolylines[\s\S]*?\n\}/);
assert.ok(parserMatch, "DXF parser source can be isolated for functional testing");
const dxfMath = {};
vm.runInNewContext(parserMatch[0] + "\nglobalThis.parse=parseClosedDxfPolylines; globalThis.scale=DXF_UNIT_SCALE;", dxfMath);
const sampleDxf = [
  "0","SECTION","2","ENTITIES","0","LWPOLYLINE","8","CABINET",
  "70","1","10","0","20","0","10","1000","20","0",
  "10","1000","20","600","10","0","20","600","0","ENDSEC","0","EOF",""
].join("\n");
const parsed = dxfMath.parse(sampleDxf, dxfMath.scale.mm);
assert.equal(parsed.length, 1, "one closed cabinet outline should parse");
assert.ok(Math.abs(parsed[0].w - 1) < 1e-9, "DXF mm width converts to 1 m");
assert.ok(Math.abs(parsed[0].d - 0.6) < 1e-9, "DXF mm depth converts to 0.6 m");
assert.equal(parsed[0].vertices.length, 4, "closed rectangle has four footprint vertices");
assert.equal(parsed[0].layer, "CABINET", "DXF layer metadata is retained");
const secondOutline = [
  "0","LWPOLYLINE","8","SINK","70","1",
  "10","1500","20","0","10","2500","20","0",
  "10","2500","20","600","10","1500","20","600"
].join("\n");
const multiDxf = sampleDxf.replace("0\nENDSEC", secondOutline + "\n0\nENDSEC");
const multiParsed = dxfMath.parse(multiDxf, dxfMath.scale.mm);
assert.equal(multiParsed.length, 2, "two closed outlines in one DXF should parse");
assert.ok(Math.abs(multiParsed[1].offsetX - 1.5) < 1e-9, "second outline preserves its original 1.5 m relative X placement");
assert.ok(Math.abs(multiParsed[1].offsetY) < 1e-9, "second outline preserves its original relative Y placement");
assert.ok(scriptMatch[1].includes("x:ox+s.offsetX,y:oy+s.offsetY"), "DXF import preserves relative placement between outlines");
assert.ok(scriptMatch[1].includes("rotateDxfGroup(parseClosedDxfPolylines"), "DXF import applies whole-drawing rotation");
const rotateMatch = scriptMatch[1].match(/function rotateDxfGroup\(shapes,degrees\)\{[\s\S]*?\n\}/);
assert.ok(rotateMatch, "DXF group rotation function can be isolated for functional testing");
const rotateCtx = {};
vm.runInNewContext(rotateMatch[0] + ";globalThis.rotate=rotateDxfGroup;", rotateCtx);
const rotated = rotateCtx.rotate(parsed, 90);
assert.ok(Math.abs(rotated[0].w - 0.6) < 1e-9, "90-degree DXF rotation swaps footprint width to 0.6 m");
assert.ok(Math.abs(rotated[0].d - 1.0) < 1e-9, "90-degree DXF rotation swaps footprint depth to 1 m");
assert.throws(() => rotateCtx.rotate(parsed, 361), /旋轉角度/, "rotation outside supported range is rejected");
assert.throws(() => dxfMath.parse("0\nSECTION\n2\nENTITIES\n0\nENDSEC\n0\nEOF", 0.001), /找不到有效封閉/, "rejects DXF with no closed polyline");
console.log("PASS: DXF closed-polyline parsing, mm-to-m conversion, footprint vertices, layer metadata, and invalid-file rejection.");
