import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

const result = await build({
  absWorkingDir: fileURLToPath(new URL("../", import.meta.url)),
  entryPoints: ["src/features/schedules/demo/generalScheduleDemo.ts"],
  bundle: true, write: false, platform: "node", format: "esm",
});
const demo = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);

test("initial example counts unique professionals and rooms, not rows", () => {
  const blocks = demo.filterDemoSchedule(demo.DEMO_DATE, "central");
  assert.deepEqual(demo.summarizeDemoSchedule(blocks), { psychologists: 4, offices: 3, blocks: 5 });
  assert.deepEqual(blocks.map((block) => block.start), ["08:00", "09:00", "10:00", "14:00", "15:00"]);
});

test("psychologist filter preserves multiple blocks and different rooms", () => {
  const blocks = demo.filterDemoSchedule(demo.DEMO_DATE, "central", "ana");
  assert.equal(blocks.length, 2);
  assert.deepEqual(new Set(blocks.map((block) => block.office)), new Set(["Consultorio 101", "Consultorio 103"]));
  assert.equal(demo.summarizeDemoSchedule(blocks).psychologists, 1);
});

test("date, location and psychologist filters apply together", () => {
  const blocks = demo.filterDemoSchedule("2026-10-20", "norte", "ana");
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].office, "Consultorio 201");
  assert.equal(demo.filterDemoSchedule("2026-10-20", "central", "ana").length, 0);
  assert.equal(demo.filterDemoSchedule("2026-10-21", "central").length, 0);
  assert.equal(demo.filterDemoSchedule("", "central").length, 0);
});

test("fixtures have unique identifiers, valid relationships and no overlapping room or professional blocks", () => {
  assert.equal(new Set(demo.DEMO_BLOCKS.map((block) => block.id)).size, demo.DEMO_BLOCKS.length);
  for (const block of demo.DEMO_BLOCKS) {
    assert.ok(demo.DEMO_LOCATIONS.some((item) => item.id === block.locationId));
    assert.ok(demo.DEMO_PSYCHOLOGISTS.some((item) => item.id === block.psychologistId));
    assert.ok(block.start < block.end);
    for (const other of demo.DEMO_BLOCKS) {
      if (other.id === block.id || other.date !== block.date) continue;
      const sharedResource = other.psychologistId === block.psychologistId ||
        (other.locationId === block.locationId && other.office === block.office);
      if (sharedResource) assert.ok(block.end <= other.start || other.end <= block.start);
    }
  }
});
