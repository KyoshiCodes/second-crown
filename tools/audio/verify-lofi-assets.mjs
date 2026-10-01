import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const audioDir = join(root, "packages", "app", "public", "audio");
const distDir = join(root, "packages", "app", "dist", "audio");

const expected = new Map([
  ["03 HoliznaCC0 - Something In the Air.ogg","ca51d15a82cfa028f24df3d44d7b0c97db052312dc7b8b992c571f82faf21fbf"],
  ["04 HoliznaCC0 - Small Towns Smaller Lives.ogg","a2e2e90ff40912dda0337659fce1beb61a212332d2897313435ea2b4ae8af741"],
  ["05 HoliznaCC0 - Mundane.ogg","4b0a19608f15fd910e52678dd502cade1274a2bbb2956dc1d5cebf413001b6cc"],
  ["06 HoliznaCC0 - Glad To Be Stuck Inside.mp3.ogg","21cadc427d0b4b228a7e397daef2908119365d36fac56776d5b4df909feb213e"],
  ["07 HoliznaCC0 - Vintage.mp3.ogg","23078514d575b7d910b746fd1681652fb2ecd49ac45a3711c44f33387a0f34a1"],
  ["08 HoliznaCC0 - Morning Coffee.ogg","51338730939c2daa7c44e4d2bf2c7fd0b2286c3ddb0c2221884616b39ae8c2db"],
  ["09 HoliznaCC0 - A Little Shade.ogg","9bc7fa212390ed6dfe6da4437da91656f5e20edbcb5c9f89068b04771d56ff2b"],
  ["10 HoliznaCC0 - All The Way Sad.ogg","b077794c1a0e36ffb1a7f7b9edd6e0efcf15993a0c1285ec61ad18d59a90d9e4"],
  ["11 HoliznaCC0 - Ghosts.ogg","293d42342db42e33f6413157b26318c1b41dbf361308959054c824b18263566b"],
  ["12 HoliznaCC0 - Shut up, or shut in.ogg","36a636f6a6c606e152fd3f135e8f4d630015537ea2529d776677ce8ce51ff869"],
  ["13 HoliznaCC0 - Whatever.ogg","23a5c91fc91b0e8aba73b9b1f52d646dd5ca634919450f0784953343f2e8e135"],
  ["14 HoliznaCC0 - Yesterday.ogg","d5d66f72d11eac67c8c6810ea8d72b888c02c824da9f0018947012854a04d36c"],
  ["15 HoliznaCC0 - Letting Go Of The Past.ogg","fd312dfdf5738931babc221294d697277370a1c4d64d7d55ded2a9814348c4de"],
  ["16 HoliznaCC0 - Cellar Door.ogg","315b3d12e51d6f9912efe301732547d6f923d248efd339472ce0f6f43c914c41"],
  ["17 HoliznaCC0 - You Loved Me Once.ogg","1cb8639f9d89581de5120bf1b65c1f765ec08902e86f539392b8fea281eb2ebe"],
  ["18 HoliznaCC0 - Puppy Love.ogg","a811f921b59e75b25d8daa1aa040cd427f6cdde56fdc0d1f101eec8cb0cba2a0"],
  ["19 HoliznaCC0 - Clouds.ogg","147f26e39445bddd72a493aad57acd3703d73abd49e6163ffc16e0dc34c639a9"],
  ["20 HoliznaCC0 - Busted Jazz.ogg","9ac062f516b2c207c125aa1044123d38c8ba4d050199d949350cd0938131a091"],
  ["21 HoliznaCC0 - Busted Jazz.ogg","4245dee275754cf076730d82e59cb35375beadcec44d3c6f70d5d02579ef8908"],
  ["22 HoliznaCC0 - Autumn.ogg","50559bd01acd0a49e2eea4cbef7114eac4f829f3c2cddced58f75efa5763cd3e"],
  ["23 HoliznaCC0 - Clouds.ogg","c77cc198b1010e442be34239a95827e1dc6242d8de2d6ce77e8c254ea7efa06c"],
  ["24 HoliznaCC0 - Mixed Signals.ogg","7e4a2914c53eb8553efaa3c803c83f5494b693d10cdda1e8b6f330dd0b866a29"],
  ["25 HoliznaCC0 - New Shoes.ogg","f0e6e61f5788fb86dc54417169185484d24ef771a043c5d971256cdad7e20918"],
  ["26 HoliznaCC0 - Foggy Headed.ogg","04951dcedd1b2d13b4e6182895ede0274af31baed54ec860f6111d2bf0a88a2f"],
  ["27 HoliznaCC0 - Ramen.mp3.ogg","271e563d730bc6cefd47b1d8e4e2ff7cb1340abc5cfdb5fd3ba48aec773a9ac8"],
  ["28 HoliznaCC0 - Happy, but a little off.ogg","4721abad0949840a54294b2c02884457034b0451f4f6fb28f01703ab9b139efa"],
  ["29 HoliznaCC0 - Static.ogg","f4eb4b8e537bcc24d5f2e38cfea91b4e971c61d47e685477fd3b1526d9156f7f"],
  ["30 HoliznaCC0 - Creature Comforts.ogg","5245acc1b06e8d1efb93929f0fbb99a74759f7b554c2b6577c2fe1cfbcadc3ca"],
  ["31 HoliznaCC0 - Not It (Lofi).mp3.ogg","dca77e781ef369298378de3d59df1f584ca56d0eb2120852bf6acdb1c336596d"],
  ["32 HoliznaCC0 - Plants.mp3.ogg","815803956cbab2c1d731d2d29543c4910438586dc0b3a8809c3e3859721a254f"],
  ["33 HoliznaCC0 - Seasons Change.ogg","a0802f079d2d319255a25f049c9ee498e6e229b4c1098075659ef52b78f5c788"],
]);

const forbidden = ["lofi-a.ogg", "lofi-b.ogg"];
const unchanged = ["easter.ogg", "halloween.ogg", "midwinter.ogg"];
const failures = [];

function git(...args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}
function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}
function relAudio(name) {
  return "packages/app/public/audio/" + name;
}

const lfsFiles = git("lfs", "ls-files", "--name-only").split(/\r?\n/).filter(Boolean);

for (const [name, expectedHash] of expected) {
  const path = join(audioDir, name);
  const rel = relAudio(name);
  if (!existsSync(path)) { failures.push("missing approved asset: " + name); continue; }
  const attrs = git("check-attr", "filter", "--", rel);
  if (!attrs.endsWith("filter: lfs")) failures.push("not marked Git LFS: " + name);
  if (!lfsFiles.includes(rel)) failures.push("not present in Git LFS index: " + name);
  const header = readFileSync(path, { encoding: "utf8", flag: "r" }).slice(0, 64);
  if (header.startsWith("version https://git-lfs.github.com/spec/v1")) failures.push("LFS pointer was not materialized: " + name);
  const actualHash = sha256(path);
  if (actualHash !== expectedHash) failures.push("SHA-256 mismatch for " + name + ": expected " + expectedHash + ", got " + actualHash);
  const distPath = join(distDir, name);
  if (!existsSync(distPath)) failures.push("missing approved asset from production output: " + name);
  else if (sha256(distPath) !== expectedHash) failures.push("production SHA-256 mismatch for " + name);
}

for (const name of unchanged) {
  const rel = relAudio(name);
  const attrs = git("check-attr", "filter", "--", rel);
  if (attrs.endsWith("filter: lfs")) failures.push("holiday asset unexpectedly marked Git LFS: " + name);
}
for (const name of forbidden) {
  if (existsSync(join(audioDir, name))) failures.push("forbidden source asset exists: " + name);
  if (existsSync(join(distDir, name))) failures.push("forbidden production asset exists: " + name);
}

if (failures.length) {
  console.error("LOFI AUDIO VERIFICATION FAILED");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}
console.log("LOFI AUDIO VERIFICATION PASSED: " + expected.size + "/" + expected.size + " approved assets, SHA-256 verified, LFS policy verified, holiday assets unchanged, exclusions absent.");
