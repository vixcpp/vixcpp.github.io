<script setup>
import { computed } from "vue";

const props = defineProps({
  sortedVersions: { type: Array, default: () => [] },
  pkgLatest: { type: String, default: "" },
  shortSha: { type: Function, required: true },
  selectedVersion: { type: String, default: "" },
});

const emit = defineEmits(["update:selectedVersion"]);

function pick(v) {
  emit("update:selectedVersion", v);
}

function fmtDate(s) {
  if (!s) return "-";
  // Keep it simple and stable: show YYYY-MM-DD HH:MM
  try {
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return String(s);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
  } catch {
    return String(s);
  }
}

function statusLabel(v) {
  const st = String(v?.status || "").toLowerCase();
  if (!st) return "";
  if (st === "published") return "published";
  if (st === "draft") return "draft";
  if (st === "yanked") return "yanked";
  return st;
}

const rows = computed(() => {
  const list = Array.isArray(props.sortedVersions) ? props.sortedVersions : [];
  return list.map((v) => ({
    version: v.version || "",
    tag: v.tag || "-",
    commit: v.commit || "",
    short: props.shortSha(v.commit || "") || "-",
    notes: v.notes || "",
    publishedAt: v.publishedAt || "",
    publishedFmt: fmtDate(v.publishedAt),
    status: statusLabel(v),
    isLatest: v.version === props.pkgLatest,
    isSelected: v.version === props.selectedVersion,
  }));
});
</script>

<template>
  <div class="versions">
    <div class="panel">
      <div class="head">
        <div class="title">Versions</div>

        <div class="hint">
          Click a version to browse files and docs for that release.
        </div>
      </div>

      <div class="table" role="table" aria-label="Package versions">
        <div class="row head" role="row">
          <div class="c1" role="columnheader">Version</div>
          <div class="c2" role="columnheader">Tag</div>
          <div class="c3" role="columnheader">Commit</div>
          <div class="c4" role="columnheader">Notes</div>
          <div class="c5" role="columnheader">Published</div>
        </div>

        <button
          v-for="r in rows"
          :key="r.version"
          class="row btn"
          type="button"
          role="row"
          :class="{ active: r.isSelected }"
          @click="pick(r.version)"
        >
          <div class="c1" role="cell">
            <span class="ver">{{ r.version }}</span>

            <span class="pill latest" v-if="r.isLatest">latest</span>
            <span class="pill status" v-if="r.status && !r.isLatest">{{ r.status }}</span>
            <span class="pill selected" v-if="r.isSelected">selected</span>
          </div>

          <div class="c2" role="cell">
            <code class="mono">{{ r.tag }}</code>
          </div>

          <div class="c3" role="cell">
            <code class="mono">{{ r.short }}</code>
          </div>

          <div class="c4" role="cell">
            <span class="notes" :title="r.notes">{{ r.notes }}</span>
          </div>

          <div class="c5" role="cell">
            <span class="date" :title="r.publishedAt || ''">{{ r.publishedFmt }}</span>
          </div>
        </button>

        <div class="empty" v-if="!rows.length">
          No versions available.
        </div>
      </div>

      <div class="footer">
        <div class="soft">
          Install command updates when you switch version.
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.versions{
  --max: 1180px;
  --pad: 24px;
  max-width: var(--max);
  margin: 0 auto;
  padding: 18px var(--pad) 40px;
}

.panel{
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,.10);
  background: rgba(0,0,0,.18);
  overflow:hidden;
}

.head{
  padding: 12px 12px;
  background: rgba(255,255,255,.03);
  border-bottom: 1px solid rgba(255,255,255,.08);
  display:flex;
  align-items:baseline;
  justify-content:space-between;
  gap: 14px;
  flex-wrap: wrap;
}
.title{
  font-size: 14px;
  font-weight: 950;
  color: rgba(255,255,255,.92);
}
.hint{
  color: rgba(255,255,255,.62);
  font-weight: 850;
  font-size: 12.5px;
}

.table{ width: 100%; }

.row{
  display:grid;
  grid-template-columns: 180px 140px 120px 1fr 180px;
  gap: 12px;
  align-items:center;
  padding: 12px 12px;
  border-top: 1px solid rgba(255,255,255,.06);
}

.row.head{
  border-top: 0;
  background: rgba(255,255,255,.02);
  color: rgba(255,255,255,.62);
  font-weight: 950;
  font-size: 12px;
}

.row.btn{
  width:100%;
  text-align:left;
  border:0;
  background:transparent;
  cursor:pointer;
}
.row.btn:hover{
  background: rgba(255,255,255,.04);
}
.row.btn.active{
  background: rgba(140,200,255,.08);
  border-top-color: rgba(140,200,255,.18);
}

.c1,.c2,.c3,.c4,.c5{ min-width:0; }

.ver{
  font-weight: 950;
  color: rgba(255,255,255,.92);
  font-size: 13.5px;
}

.pill{
  display:inline-flex;
  align-items:center;
  gap: 6px;
  margin-left: 8px;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 950;
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(255,255,255,.04);
  color: rgba(255,255,255,.76);
}
.pill.latest{
  border-color: rgba(140,200,255,.35);
  background: rgba(140,200,255,.10);
  color: rgba(255,255,255,.92);
}
.pill.selected{
  border-color: rgba(120,255,180,.28);
  background: rgba(120,255,180,.10);
  color: rgba(255,255,255,.92);
}
.pill.status{
  border-color: rgba(255,208,0,.22);
  background: rgba(255,208,0,.08);
}

.mono{
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-weight: 900;
  color: rgba(210,235,255,.90);
  background: rgba(0,0,0,.20);
  border: 1px solid rgba(255,255,255,.10);
  padding: 6px 8px;
  border-radius: 10px;
  display:inline-block;
  max-width: 100%;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}

.notes{
  color: rgba(255,255,255,.74);
  font-weight: 800;
  font-size: 13px;
  line-height: 1.45;
  display:block;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
}

.date{
  color: rgba(255,255,255,.68);
  font-weight: 850;
  font-size: 12.5px;
  display:block;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  text-align:right;
}

.empty{
  padding: 14px 12px;
  color: rgba(255,255,255,.62);
  font-weight: 850;
  font-size: 13px;
}

.footer{
  padding: 12px 12px;
  border-top: 1px solid rgba(255,255,255,.08);
  background: rgba(0,0,0,.10);
}
.soft{
  color: rgba(255,255,255,.56);
  font-weight: 850;
  font-size: 12.5px;
}

@media (max-width: 980px){
  .row{ grid-template-columns: 160px 120px 110px 1fr 140px; }
}
@media (max-width: 720px){
  .row{ grid-template-columns: 1fr 120px; }
  .c2,.c3,.c5{ display:none; }
  .date{ text-align:left; }
}
</style>
