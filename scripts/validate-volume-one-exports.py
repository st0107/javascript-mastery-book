"""Check final Volume One exports against current sources (no third-party EPUB tools).

Run from any directory: python scripts/validate-volume-one-exports.py
Use --epub-only to omit the optional pypdf-based PDF checks. This complements,
and does not replace, EPUBCheck or visual review of the rendered books.
Combined validation requires a recorded build of both formats together.
"""

import argparse
import hashlib
import json
import posixpath
import re
import struct
import sys
import zipfile
import zlib
from pathlib import Path
from urllib.parse import unquote, urlsplit
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "build/volume-1"
NS = {"x": "http://www.w3.org/1999/xhtml", "o": "http://www.idpf.org/2007/opf",
      "c": "urn:oasis:names:tc:opendocument:xmlns:container"}
SECTIONS = ["01-introduction", "02-theory", "03-internal-working",
            "04-production-examples", "05-interview-perspective",
            "06-exercises-coding-challenges", "07-mcqs", "08-revision-summary",
            "09-edge-cases-debugging", "10-performance-security", "11-professional-field-guide"]


def require(condition, message):
    if not condition:
        raise ValueError(message)


def source_files():
    files = ["docs/volume-1/README.md", "docs/volume-1/preface.md"]
    files += [f"docs/volume-1/chapter-{chapter:02}/{section}.md"
              for chapter in range(1, 12) for section in SECTIONS]
    return files + ["docs/volume-1/chapter-01-execution-model.md"]


def document_name(source):
    return source.removeprefix("docs/volume-1/").removesuffix(".md").replace("/", "-") + ".xhtml"


def check_png(data, name):
    require(data[:8] == b"\x89PNG\r\n\x1a\n", f"Invalid PNG signature: {name}")
    offset, chunks = 8, []
    while offset < len(data):
        require(offset + 12 <= len(data), f"Truncated PNG chunk: {name}")
        size = struct.unpack_from(">I", data, offset)[0]
        kind = data[offset + 4:offset + 8]
        payload = data[offset + 8:offset + 8 + size]
        require(offset + size + 12 <= len(data), f"Truncated PNG data: {name}")
        checksum = struct.unpack_from(">I", data, offset + 8 + size)[0]
        require(zlib.crc32(kind + payload) & 0xffffffff == checksum, f"PNG CRC mismatch: {name}")
        chunks.append(kind)
        if kind == b"IHDR":
            width, height = struct.unpack_from(">II", payload)
            require(width > 100 and height > 50, f"Empty/tiny diagram: {name}")
        offset += size + 12
    require(chunks[0] == b"IHDR" and chunks[-1] == b"IEND" and b"IDAT" in chunks,
            f"Incomplete PNG: {name}")


def check_epub(epub):
    sources = source_files()
    manifest = json.loads((BUILD / "manifest.json").read_text(encoding="utf-8"))
    require(manifest["documents"] == sources, "Build manifest source coverage/order differs")
    digest = hashlib.sha256()
    for source in sources:
        digest.update(source.encode("utf-8"))
        digest.update((ROOT / source).read_bytes())
    require(digest.hexdigest() == manifest["sourceHash"], "Sources changed after export; rebuild Volume One")
    require(manifest["diagrams"] == 24, "Build manifest diagram count differs")
    documents = [document_name(source) for source in sources]
    images = [f"images/diagram-{index}.png" for index in range(1, 25)]
    resources = ["cover.xhtml", "nav.xhtml", "book.css"] + documents + images
    code_count = link_count = 0
    with zipfile.ZipFile(epub) as archive:
        infos = archive.infolist()
        names = archive.namelist()
        require(len(names) == len(set(names)), "Duplicate EPUB ZIP entries")
        require(infos[0].filename == "mimetype" and infos[0].header_offset == 0
                and infos[0].compress_type == zipfile.ZIP_STORED and not infos[0].extra,
                "EPUB mimetype must be first, uncompressed, without extra fields")
        require(archive.read("mimetype") == b"application/epub+zip", "Invalid EPUB mimetype")
        require(archive.testzip() is None, "Corrupt EPUB ZIP member")
        expected = {"mimetype", "META-INF/container.xml", "EPUB/package.opf"}
        expected.update("EPUB/" + name for name in resources)
        require(set(names) == expected, "Unexpected/missing EPUB resources, including possible other-volume content")
        container = ET.fromstring(archive.read("META-INF/container.xml"))
        rootfiles = container.findall("c:rootfiles/c:rootfile", NS)
        require(len(rootfiles) == 1 and rootfiles[0].get("full-path") == "EPUB/package.opf",
                "Invalid EPUB package location")
        package = ET.fromstring(archive.read("EPUB/package.opf"))
        require(package.get("version") == "3.0", "Expected EPUB 3 package")
        items = package.findall("o:manifest/o:item", NS)
        by_id = {item.get("id"): item for item in items}
        require(len(by_id) == len(items), "Duplicate package manifest IDs")
        require([item.get("href") for item in items] == resources, "Package manifest coverage/order differs")
        for item in items:
            suffix = Path(item.get("href")).suffix
            expected_type = {".xhtml": "application/xhtml+xml", ".css": "text/css", ".png": "image/png"}[suffix]
            require(item.get("media-type") == expected_type, "Incorrect manifest media type")
        require([item.get("href") for item in items if "nav" in item.get("properties", "").split()] == ["nav.xhtml"],
                "Missing or duplicate EPUB navigation resource")
        spine = [by_id[item.get("idref")].get("href") for item in package.findall("o:spine/o:itemref", NS)]
        require(spine == ["cover.xhtml", "nav.xhtml"] + documents, "Spine source coverage/order differs")
        trees, identifiers = {}, {}
        for name in resources:
            data = archive.read("EPUB/" + name)
            require(data == (BUILD / name).read_bytes(), f"EPUB differs from latest build resource: {name}")
            if name.endswith(".png"):
                check_png(data, name)
            if name.endswith(".xhtml"):
                tree = ET.fromstring(data)
                require(tree.tag == "{" + NS["x"] + "}html", f"Non-XHTML root: {name}")
                ids = [node.get("id") for node in tree.iter() if node.get("id")]
                require(len(ids) == len(set(ids)), f"Duplicate XHTML IDs: {name}")
                require(not tree.findall(".//x:script", NS), f"Unexpected executable script: {name}")
                require(not tree.findall(".//x:code[@class='language-mermaid']", NS), f"Unrendered Mermaid: {name}")
                require(all(node.tag.startswith("{" + NS["x"] + "}") for node in tree.iter()),
                        f"Unresolved custom/MDX element: {name}")
                trees[name], identifiers[name] = tree, set(ids)
        nav_links = [node.get("href") for node in trees["nav.xhtml"].findall(".//x:nav//x:a", NS)]
        require(nav_links == [name + "#" + name.removesuffix(".xhtml") for name in documents],
                "Navigation does not cover every source in reading order")
        image_refs = []
        for name, tree in trees.items():
            for node in tree.iter():
                for attribute in ("href", "src"):
                    value = node.get(attribute)
                    if value is None:
                        continue
                    url = urlsplit(value)
                    if url.scheme:
                        require(url.scheme in ("https", "http", "mailto") and attribute != "src",
                                f"Unexpected external resource: {name}: {value}")
                        continue
                    require(not url.netloc and not url.path.startswith("/"), f"Nonportable link: {name}: {value}")
                    target = posixpath.normpath(posixpath.join(posixpath.dirname(name), unquote(url.path))) if url.path else name
                    require(target in resources, f"Broken internal resource: {name}: {value}")
                    if url.fragment:
                        require(unquote(url.fragment) in identifiers.get(target, set()), f"Broken fragment: {name}: {value}")
                    if attribute == "src":
                        image_refs.append(target)
                    link_count += 1
        require(sorted(image_refs) == sorted(images), "Each of 24 diagrams must appear exactly once")
        for source, name in zip(sources, documents):
            text = (ROOT / source).read_text(encoding="utf-8")
            blocks = re.findall(r"^```([^\r\n]*)\r?\n([\s\S]*?)^```\s*$", text, re.MULTILINE)
            expected_blocks = [(language.strip(), body.rstrip("\n")) for language, body in blocks if language.strip() != "mermaid"]
            actual_blocks = [(node.get("class", "").removeprefix("language-"), "".join(node.itertext()).rstrip("\n"))
                             for node in trees[name].findall(".//x:pre/x:code", NS)]
            require(actual_blocks == expected_blocks, f"Code fences differ from current source: {source}")
            code_count += len(actual_blocks)
            heading = trees[name].find(".//x:main/x:h1", NS)
            require(heading is not None and heading.get("id") == name.removesuffix(".xhtml"), f"Missing source title/anchor: {source}")
    print(f"EPUB passed: {len(sources)} source documents, {len(spine)} spine entries, {code_count} exact code blocks, "
          f"24 valid diagrams, {link_count} local resource/fragment references; source hash matches.")
    return manifest


def check_pdf(pdf):
    try:
        from pypdf import PdfReader
    except ImportError as error:
        raise ValueError("PDF checks need pypdf; install it or use --epub-only") from error
    reader = PdfReader(pdf)
    require(not reader.is_encrypted and len(reader.pages) > 0, "Empty or encrypted PDF")
    require("Volume I" in reader.metadata.title, "PDF has incorrect volume title")
    require(bool(reader.outline), "PDF is missing navigation bookmarks")
    for name, destination in reader.named_destinations.items():
        page = reader.get_destination_page_number(destination)
        require(page is not None and 0 <= page < len(reader.pages), f"Broken PDF destination: {name}")
    require(all(page.mediabox.width > 0 and page.mediabox.height > 0 for page in reader.pages), "Invalid PDF page dimensions")
    require(reader.trailer["/Root"].get("/StructTreeRoot") is not None, "PDF is missing tagged structure")
    print(f"PDF passed: {len(reader.pages)} pages, {len(reader.named_destinations)} valid named destinations, bookmarks and tagged structure.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--epub-only", action="store_true")
    parser.add_argument("--epub", type=Path, default=ROOT / "epub/javascript-mastery-volume-1.epub")
    parser.add_argument("--pdf", type=Path, default=ROOT / "pdf/javascript-mastery-volume-1.pdf")
    args = parser.parse_args()
    manifest = check_epub(args.epub)
    if not args.epub_only:
        require(manifest.get("format") == "all",
                "Combined verification requires a fresh build of both formats: npm run volume1:build")
        check_pdf(args.pdf)


if __name__ == "__main__":
    try:
        main()
    except (ValueError, OSError, KeyError, ET.ParseError, zipfile.BadZipFile) as error:
        print(f"Export validation failed: {error}", file=sys.stderr)
        sys.exit(1)
