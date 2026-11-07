import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { JobStatusStack, jobStatusRows, type JobStatusInput } from "./JobStatusStack";
import { JobCard } from "./JobCard";

function readCssFile(relativePath: string): string {
  const proc = (globalThis as {
    process?: {
      getBuiltinModule?: (id: string) => {
        readFileSync: (path: URL, encoding: string) => string;
      };
    };
  }).process;
  const fsMod = proc?.getBuiltinModule?.("node:fs");
  if (!fsMod) throw new Error("node:fs unavailable in test runner");
  return fsMod.readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

function input(over: Partial<JobStatusInput> = {}): JobStatusInput {
  return {
    name: "Farmer",
    idle: false,
    count: 3,
    sites: [["Farm 2,3", 2], ["Farm 4,1", 1]],
    postCount: 4,
    kingdomIdle: 0,
    ...over,
  };
}

function row(rows: ReturnType<typeof jobStatusRows>, kind: string) {
  return rows.find((r) => r.kind === kind)!;
}

describe("jobStatusRows", () => {
  it("returns job, post, idle in order", () => {
    expect(jobStatusRows(input()).map((r) => r.kind)).toEqual(["job", "post", "idle"]);
    expect(jobStatusRows(input({ idle: true, name: "Idle" })).map((r) => r.kind)).toEqual(["job", "post", "idle"]);
  });

  it("job row names the trade and hand count", () => {
    expect(row(jobStatusRows(input()), "job")).toMatchObject({ value: "Farmer · 3 hands", tone: "busy" });
    expect(row(jobStatusRows(input({ count: 1 })), "job").value).toBe("Farmer · 1 hand");
    expect(row(jobStatusRows(input({ idle: true, name: "Idle", count: 2 })), "job")).toMatchObject({
      value: "No trade yet · 2 hands",
      tone: "none",
    });
  });

  it("post row lists walk-to sites like the card line", () => {
    expect(row(jobStatusRows(input()), "post")).toMatchObject({ value: "Farm 2,3 ×2 · Farm 4,1", tone: "calm" });
    expect(row(jobStatusRows(input({ sites: [] })), "post")).toMatchObject({ value: "—", tone: "none" });
  });

  it("post row on the Idle card counts posts in the picker", () => {
    const idle = input({ idle: true, name: "Idle", sites: [] });
    expect(row(jobStatusRows(idle), "post")).toMatchObject({ value: "None · 4 posts to pick", tone: "warn" });
    expect(row(jobStatusRows({ ...idle, postCount: 1 }), "post").value).toBe("None · 1 post to pick");
    expect(row(jobStatusRows({ ...idle, postCount: 0 }), "post")).toMatchObject({ tone: "none" });
  });

  it("idle row shows waiting hands or kingdom spare hands", () => {
    expect(row(jobStatusRows(input({ idle: true, name: "Idle", count: 2 })), "idle")).toMatchObject({
      value: "2 hands waiting for work",
      tone: "warn",
    });
    expect(row(jobStatusRows(input({ kingdomIdle: 2 })), "idle")).toMatchObject({
      value: "None here · 2 hands idle in kingdom",
      tone: "warn",
    });
    expect(row(jobStatusRows(input()), "idle")).toMatchObject({ value: "None · every hand posted", tone: "calm" });
  });

  it("does not mutate its input", () => {
    const i = input();
    const snap = JSON.stringify(i);
    jobStatusRows(i);
    expect(JSON.stringify(i)).toBe(snap);
  });
});

describe("JobStatusStack", () => {
  it("renders a labelled dl with tone classes", () => {
    const html = renderToStaticMarkup(<JobStatusStack {...input()} />);
    expect(html).toContain('class="sc-jobstat"');
    expect(html).toContain('aria-label="Farmer living status"');
    expect(html).toContain("sc-jobstat-row is-job tone-busy");
    expect(html).toContain("sc-jobstat-row is-post tone-calm");
    expect(html).toContain("sc-jobstat-row is-idle tone-calm");
    expect(html).toContain('aria-hidden="true"');
  });
});

describe("JobCard with status stack", () => {
  const act = () => {};
  const farm = { id: "b1", typeId: "farm", realmId: "player", x: 2, y: 3, completesAtTick: null } as never;

  it("keeps the Post picker and Idle button and adds the stack", () => {
    const html = renderToStaticMarkup(
      <JobCard
        name="Farmer"
        idle={false}
        workers={[{ id: "c1", realmId: "player", job: "farmer", tile: { x: 2, y: 3 } }] as never}
        buildings={[farm]}
        posts={[farm]}
        act={act}
        kingdomIdle={1}
      />
    );
    expect(html).toContain("sc-jobstat");
    expect(html).toContain("Post at…");
    expect(html).toContain(">Idle</button>");
    expect(html).toContain("1 hand idle in kingdom");
  });

  it("Idle card keeps Idle button disabled", () => {
    const html = renderToStaticMarkup(
      <JobCard
        name="Idle"
        idle
        workers={[{ id: "c2", realmId: "player", job: "unassigned", tile: null }] as never}
        buildings={[farm]}
        posts={[farm]}
        act={act}
      />
    );
    expect(html).toMatch(/disabled=""[^>]*>Idle<\/button>/);
    expect(html).toContain("1 hand waiting for work");
    expect(html).toContain("None · 1 post to pick");
  });
});

describe("job-status-stack.css", () => {
  it("defines the stack, tones and reduced motion", () => {
    const css = readCssFile("./job-status-stack.css");
    expect(css).toContain(".sc-jobstat-row");
    for (const t of ["busy", "warn", "calm", "none"]) expect(css).toContain(`.tone-${t}`);
    expect(css).toContain("prefers-reduced-motion");
  });
});
