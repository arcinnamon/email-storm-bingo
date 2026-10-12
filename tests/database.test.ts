// @vitest-environment node
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const phrases = Array.from({ length: 30 }, (_, index) => `Phrase ${index + 1}`);
let db: PGlite;

beforeAll(async () => {
  db = new PGlite();
  await db.exec("create role anon; create role authenticated; create role service_role bypassrls;");
  await db.exec(await readFile("supabase/migrations/202610120001_persistence.sql", "utf8"));
}, 30_000);
afterAll(async () => { await db?.close(); });

describe("database persistence", () => {
  it("initializes once, persists updates, and refuses stale writes and reseeding", async () => {
    expect((await db.query("select public.seed_bingo_config($1::text[]) as seeded", [phrases])).rows)
      .toEqual([{ seeded: true }]);
    const updated = phrases.map((phrase) => `Updated ${phrase}`);
    const result = await db.query<{ version: number; phrases: string[]; updated_at: Date }>(
      "select * from public.update_bingo_config($1, $2::text[])", [1, updated],
    );
    expect(result.rows[0]).toMatchObject({ version: 2, phrases: updated });
    expect(result.rows[0].updated_at).toBeInstanceOf(Date);
    expect((await db.query("select * from public.update_bingo_config($1, $2::text[])", [1, phrases])).rows)
      .toEqual([]);
    expect((await db.query("select public.seed_bingo_config($1::text[]) as seeded", [phrases])).rows)
      .toEqual([{ seeded: false }]);
    expect((await db.query("select version, phrases from public.bingo_config")).rows)
      .toEqual([{ version: 2, phrases: updated }]);
  });

  it("allows only one writer to consume a configuration version", async () => {
    const results = await Promise.all([
      db.query("select * from public.update_bingo_config($1, $2::text[])", [2, phrases]),
      db.query("select * from public.update_bingo_config($1, $2::text[])", [2, phrases]),
    ]);
    expect(results.map((result) => result.rows.length).sort()).toEqual([0, 1]);
    expect((await db.query("select version from public.bingo_config")).rows).toEqual([{ version: 3 }]);
  });

  it("enforces a singleton and rejects invalid persisted phrases", async () => {
    await expect(db.query("insert into public.bingo_config (id, phrases) values (2, $1)", [phrases]))
      .rejects.toThrow();
    for (const invalid of [phrases.slice(0, 23), [...phrases, phrases[0]], [...phrases, "free space"], [...phrases, "x".repeat(101)], [...phrases, null], [...phrases, ""]]) {
      await expect(db.query("select * from public.update_bingo_config(3, $1::text[])", [invalid]))
        .rejects.toThrow();
    }
    expect((await db.query("select version from public.bingo_config")).rows).toEqual([{ version: 3 }]);
  });

  it.each(["anon", "authenticated"])("denies %s access to both tables and mutation functions", async (role) => {
    for (const table of ["bingo_config", "login_attempts"]) {
      const { rows } = await db.query<{ allowed: boolean }>(
        "select has_table_privilege($1, $2, 'SELECT,INSERT,UPDATE,DELETE') as allowed", [role, `public.${table}`],
      );
      expect(rows).toEqual([{ allowed: false }]);
    }
    for (const signature of ["public.update_bingo_config(integer,text[])", "public.seed_bingo_config(text[])", "public.purge_expired_login_attempts()"] ) {
      expect((await db.query("select has_function_privilege($1, $2, 'EXECUTE') as allowed", [role, signature])).rows)
        .toEqual([{ allowed: false }]);
    }
    expect((await db.query("select relrowsecurity from pg_class where oid in ('public.bingo_config'::regclass, 'public.login_attempts'::regclass)")).rows)
      .toEqual([{ relrowsecurity: true }, { relrowsecurity: true }]);
  });

  it("permits server-role reads and RPC writes", async () => {
    await db.exec("set role service_role");
    try {
      expect((await db.query("select version from public.bingo_config")).rows).toEqual([{ version: 3 }]);
      expect((await db.query("select * from public.update_bingo_config(3, $1::text[])", [phrases])).rows)
        .toHaveLength(1);
    } finally { await db.exec("reset role"); }
  });

  it("bounds failed-attempt counters and removes expired client hashes", async () => {
    const hash = "a".repeat(64);
    await db.query("insert into public.login_attempts (client_hash, failures, expires_at) values ($1, 5, now() - interval '1 minute')", [hash]);
    await expect(db.query("update public.login_attempts set failures = 6 where client_hash = $1", [hash])).rejects.toThrow();
    await expect(db.query("insert into public.login_attempts (client_hash, failures, expires_at) values ('192.0.2.1', 1, now())")).rejects.toThrow();
    await db.query("insert into public.login_attempts (client_hash, failures, expires_at) values ($1, 1, now() + interval '15 minutes')", ["b".repeat(64)]);
    await db.query("select public.purge_expired_login_attempts()");
    expect((await db.query("select client_hash from public.login_attempts")).rows).toEqual([{ client_hash: "b".repeat(64) }]);
  });
});
