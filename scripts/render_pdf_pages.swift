import AppKit
import Foundation
import PDFKit

func fail(_ message: String) -> Never {
    fputs(message + "\n", stderr)
    exit(1)
}

let rawArgs = Array(CommandLine.arguments.dropFirst())
guard rawArgs.count >= 2 else {
    fail("Usage: swift scripts/render_pdf_pages.swift INPUT.pdf OUTPUT_DIR [--scale 2.0] [--pages 1,2,5-8]")
}

let inputPath = rawArgs[0]
let outputDir = rawArgs[1]
var scale: CGFloat = 2.0
var pageSpec: String?
var index = 2

while index < rawArgs.count {
    switch rawArgs[index] {
    case "--scale":
        guard index + 1 < rawArgs.count, let parsedScale = Double(rawArgs[index + 1]), parsedScale > 0 else {
            fail("Missing or invalid value for --scale")
        }
        scale = CGFloat(parsedScale)
        index += 2
    case "--pages":
        guard index + 1 < rawArgs.count else {
            fail("Missing value for --pages")
        }
        pageSpec = rawArgs[index + 1]
        index += 2
    default:
        fail("Unknown argument: \(rawArgs[index])")
    }
}

func parsePages(_ spec: String?, pageCount: Int) -> [Int] {
    guard let spec, !spec.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
        return Array(1...pageCount)
    }

    var pages = Set<Int>()
    for rawPart in spec.split(separator: ",") {
        let part = rawPart.trimmingCharacters(in: .whitespacesAndNewlines)
        if part.contains("-") {
            let bounds = part.split(separator: "-", maxSplits: 1).compactMap { Int($0.trimmingCharacters(in: .whitespacesAndNewlines)) }
            guard bounds.count == 2 else { continue }
            let lower = max(1, min(bounds[0], bounds[1]))
            let upper = min(pageCount, max(bounds[0], bounds[1]))
            if lower <= upper {
                for page in lower...upper { pages.insert(page) }
            }
        } else if let page = Int(part), page >= 1, page <= pageCount {
            pages.insert(page)
        }
    }
    return pages.sorted()
}

guard let document = PDFDocument(url: URL(fileURLWithPath: inputPath)) else {
    fail("Cannot open PDF: \(inputPath)")
}

try? FileManager.default.createDirectory(
    at: URL(fileURLWithPath: outputDir),
    withIntermediateDirectories: true
)

let pageCount = document.pageCount
let pages = parsePages(pageSpec, pageCount: pageCount)
guard !pages.isEmpty else {
    fail("No valid pages selected")
}

for (renderedIndex, oneBasedPage) in pages.enumerated() {
    guard let page = document.page(at: oneBasedPage - 1) else {
        continue
    }

    let bounds = page.bounds(for: .mediaBox)
    let width = max(1, Int(bounds.width * scale))
    let height = max(1, Int(bounds.height * scale))
    let image = NSImage(size: NSSize(width: width, height: height))

    image.lockFocus()
    guard let context = NSGraphicsContext.current?.cgContext else {
        fail("Cannot create graphics context")
    }
    NSColor.white.setFill()
    context.fill(CGRect(x: 0, y: 0, width: width, height: height))
    context.saveGState()
    context.scaleBy(x: scale, y: scale)
    page.draw(with: .mediaBox, to: context)
    context.restoreGState()
    image.unlockFocus()

    guard let tiff = image.tiffRepresentation,
          let bitmap = NSBitmapImageRep(data: tiff),
          let png = bitmap.representation(using: .png, properties: [:]) else {
        fail("Cannot encode page \(oneBasedPage)")
    }

    let filename = String(format: "page-%03d.png", oneBasedPage)
    let outputURL = URL(fileURLWithPath: outputDir).appendingPathComponent(filename)
    try png.write(to: outputURL)

    if renderedIndex == 0 || renderedIndex + 1 == pages.count || (renderedIndex + 1) % 25 == 0 {
        fputs("Rendered page \(renderedIndex + 1)/\(pages.count)\n", stderr)
    }
}
