#!/usr/bin/env node
/**
 * generate-sitemap.js
 *
 * Scan setiap folder [mata kuliah] di sebelah index.html ini, cari semua
 * file .html di dalamnya (mis. "first week.html", "second week.html"),
 * lalu tulis ulang data SHELVES di index.html supaya rak buku terisi
 * otomatis sesuai isi folder yang sebenarnya.
 *
 * Cara pakai: taruh file ini sejajar dengan index.html, lalu jalankan:
 *   node generate-sitemap.js
 */

const fs = require("fs");
const path = require("path");

const ROOT_DIR = __dirname;
const INDEX_PATH = path.join(ROOT_DIR, "index.html");
const SHELVES_MARKER = "const SHELVES = ";
const MATERIALS_MARKER = "const ORIGINAL_MATERIALS = ";
const MATERI_FOLDER_NAME = "Materi";

// Folder yang dilewati saat scan. Edit sesuai kebutuhan.
const EXCLUDE_DIRS = new Set(["node_modules", ".git", ".github", "dist", "build", MATERI_FOLDER_NAME]);

// Warna punggung buku, diambil dari palet HAPPY PRISM, dipakai bergiliran.
const BOOK_COLORS = [
    "#3CB4E6", "#32B18E", "#F05696", "#FF8040",
    "#FFD730", "#B89C57", "#9C208C", "#001F4F"
];

function main() {
    if (!fs.existsSync(INDEX_PATH)) {
        console.error(`❌ index.html tidak ditemukan di: ${INDEX_PATH}`);
        process.exit(1);
    }

    let source = fs.readFileSync(INDEX_PATH, "utf8");

    const shelves = scanShelves(ROOT_DIR);
    source = replaceArrayBlock(source, SHELVES_MARKER, serializeShelves(shelves));

    const materialGroups = scanOriginalMaterials(ROOT_DIR);
    source = replaceArrayBlock(source, MATERIALS_MARKER, serializeMaterials(materialGroups));

    fs.writeFileSync(INDEX_PATH, source, "utf8");

    const totalBooks = shelves.reduce((sum, s) => sum + s.books.length, 0);
    const totalFiles = materialGroups.reduce((sum, g) => sum + g.files.length, 0);

    console.log(`✅ index.html diperbarui.`);
    console.log(`   Rak (mata kuliah)      : ${shelves.length}`);
    console.log(`   Buku (file .html)      : ${totalBooks}`);
    console.log(`   Grup materi original   : ${materialGroups.length}`);
    console.log(`   File materi original   : ${totalFiles}`);
}

function replaceArrayBlock(source, marker, newArrayText) {
    const block = findArrayBlock(source, marker);
    return source.slice(0, block.arrStart) + newArrayText + source.slice(block.arrEnd);
}

/* ---------- Scan folder ---------- */

function scanShelves(rootDir) {
    const entries = fs.readdirSync(rootDir, { withFileTypes: true });
    const shelves = [];
    let colorCursor = 0;

    for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (entry.name.startsWith(".") || EXCLUDE_DIRS.has(entry.name)) continue;

        const shelfDir = path.join(rootDir, entry.name);
        const files = fs
            .readdirSync(shelfDir, { withFileTypes: true })
            .filter((f) => f.isFile() && f.name.toLowerCase().endsWith(".html"));

        if (files.length === 0) continue; // folder tanpa file .html dilewati

        const books = files.map((f) => {
            const absPath = path.join(shelfDir, f.name);
            const title = extractTitle(absPath) || titleCaseFromFile(f.name);
            const color = BOOK_COLORS[colorCursor++ % BOOK_COLORS.length];

            return {
                title,
                url: `${entry.name}/${f.name}`,
                color,
                _sortKey: f.name
            };
        });

        books.sort((a, b) => naturalCompare(normalizeOrdinals(a._sortKey), normalizeOrdinals(b._sortKey)));
        books.forEach((b) => delete b._sortKey);

        shelves.push({ title: entry.name, books });
    }

    shelves.sort((a, b) => a.title.localeCompare(b.title, "id"));
    return shelves;
}

/* ---------- Scan folder Materi/ (materi original, campur jenis file) ---------- */

function scanOriginalMaterials(rootDir) {
    const materiDir = path.join(rootDir, MATERI_FOLDER_NAME);
    if (!fs.existsSync(materiDir) || !fs.statSync(materiDir).isDirectory()) {
        return [];
    }

    const groups = [];
    const courseEntries = fs.readdirSync(materiDir, { withFileTypes: true });

    for (const course of courseEntries) {
        if (!course.isDirectory()) continue;
        if (course.name.startsWith(".")) continue;

        const courseDir = path.join(materiDir, course.name);
        const files = fs
            .readdirSync(courseDir, { withFileTypes: true })
            .filter((f) => f.isFile() && !f.name.startsWith("."));

        if (files.length === 0) continue;

        const items = files.map((f) => ({
            name: f.name,
            url: `${MATERI_FOLDER_NAME}/${course.name}/${f.name}`,
            ext: path.extname(f.name).replace(".", "").toLowerCase(),
            _sortKey: f.name
        }));

        items.sort((a, b) => naturalCompare(normalizeOrdinals(a._sortKey), normalizeOrdinals(b._sortKey)));
        items.forEach((it) => delete it._sortKey);

        groups.push({ title: course.name, files: items });
    }

    groups.sort((a, b) => a.title.localeCompare(b.title, "id"));
    return groups;
}

/* ---------- Helper ---------- */

function decodeBasicEntities(str) {
    return str
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#0?39;|&apos;/g, "'");
}

function extractTitle(absPath) {
    try {
        const html = fs.readFileSync(absPath, "utf8");
        const m = html.match(/<title>([\s\S]*?)<\/title>/i);
        if (m && m[1].trim()) return decodeBasicEntities(m[1].trim());
    } catch (e) {
        // abaikan, pakai fallback nama file
    }
    return null;
}

function titleCaseFromFile(filename) {
    const base = filename.replace(/\.html?$/i, "");
    return base
        .replace(/[-_]+/g, " ")
        .trim()
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

// Kata urutan umum, diubah ke angka supaya bisa diurutkan bersama "week 10" dst.
const ORDINAL_WORDS = {
    first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7,
    eighth: 8, ninth: 9, tenth: 10, eleventh: 11, twelfth: 12, thirteenth: 13,
    fourteenth: 14, fifteenth: 15, sixteenth: 16, seventeenth: 17, eighteenth: 18,
    nineteenth: 19, twentieth: 20,
    pertama: 1, kedua: 2, ketiga: 3, keempat: 4, kelima: 5, keenam: 6, ketujuh: 7,
    kedelapan: 8, kesembilan: 9, kesepuluh: 10, kesebelas: 11, "kedua belas": 12
};

function normalizeOrdinals(str) {
    return str.replace(/[a-zA-Z]+/g, (word) => {
        const key = word.toLowerCase();
        return Object.prototype.hasOwnProperty.call(ORDINAL_WORDS, key)
            ? String(ORDINAL_WORDS[key])
            : word;
    });
}

// Urutan alami: "week 2" tampil sebelum "week 10"
function naturalCompare(a, b) {
    const re = /(\d+)|(\D+)/g;
    const ax = a.match(re) || [];
    const bx = b.match(re) || [];
    const len = Math.max(ax.length, bx.length);

    for (let i = 0; i < len; i++) {
        const av = ax[i] ?? "";
        const bv = bx[i] ?? "";
        const an = Number(av);
        const bn = Number(bv);

        if (av !== "" && bv !== "" && !Number.isNaN(an) && !Number.isNaN(bn)) {
            if (an !== bn) return an - bn;
        } else {
            const c = av.localeCompare(bv, "id");
            if (c !== 0) return c;
        }
    }

    return 0;
}

/* ---------- Parse & serialize array block ---------- */

function findArrayBlock(source, marker) {
    const markerIdx = source.indexOf(marker);
    if (markerIdx === -1) {
        throw new Error(`Tidak menemukan "${marker}" di index.html`);
    }

    const arrStart = source.indexOf("[", markerIdx);
    let depth = 0;
    let inString = false;
    let stringChar = "";
    let i = arrStart;

    for (; i < source.length; i++) {
        const ch = source[i];
        const prev = source[i - 1];

        if (inString) {
            if (ch === stringChar && prev !== "\\") inString = false;
            continue;
        }

        if (ch === '"' || ch === "'" || ch === "`") {
            inString = true;
            stringChar = ch;
            continue;
        }

        if (ch === "[") depth++;
        else if (ch === "]") {
            depth--;
            if (depth === 0) {
                i++;
                break;
            }
        }
    }

    return { arrStart, arrEnd: i, text: source.slice(arrStart, i) };
}

function serializeShelves(shelves) {
    const shelfStrs = shelves.map((shelf) => {
        const bookStrs = shelf.books.map((b) => {
            return [
                "              {",
                `                  title: ${JSON.stringify(b.title)},`,
                `                  url: ${JSON.stringify(b.url)},`,
                `                  color: ${JSON.stringify(b.color)}`,
                "              }"
            ].join("\n");
        });

        return [
            "      {",
            `          title: ${JSON.stringify(shelf.title)},`,
            "          books: [",
            bookStrs.join(",\n"),
            "          ]",
            "      }"
        ].join("\n");
    });

    return "[\n" + shelfStrs.join(",\n") + "\n  ]";
}

function serializeMaterials(groups) {
    const groupStrs = groups.map((group) => {
        const fileStrs = group.files.map((f) => {
            return [
                "              {",
                `                  name: ${JSON.stringify(f.name)},`,
                `                  url: ${JSON.stringify(f.url)},`,
                `                  ext: ${JSON.stringify(f.ext)}`,
                "              }"
            ].join("\n");
        });

        return [
            "      {",
            `          title: ${JSON.stringify(group.title)},`,
            "          files: [",
            fileStrs.join(",\n"),
            "          ]",
            "      }"
        ].join("\n");
    });

    return "[\n" + groupStrs.join(",\n") + "\n  ]";
}

main();
