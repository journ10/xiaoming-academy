import AppKit
import Foundation
import Vision

struct OCRLine: Encodable {
    let text: String
    let confidence: Float
    let bbox: [Double]
}

struct OCRPage: Encodable {
    let image: String
    let text: String
    let minConfidence: Float
    let avgConfidence: Float
    let lines: [OCRLine]
}

func fail(_ message: String) -> Never {
    fputs(message + "\n", stderr)
    exit(1)
}

let rawArgs = Array(CommandLine.arguments.dropFirst())
guard !rawArgs.isEmpty else {
    fail("Usage: swift scripts/ocr_image_vision.swift [--output OUTPUT.jsonl] [--input-dir DIR] IMAGE [IMAGE ...]")
}

var outputPath: String?
var imagePaths: [String] = []
var index = 0
while index < rawArgs.count {
    if rawArgs[index] == "--output" {
        guard index + 1 < rawArgs.count else {
            fail("Missing value for --output")
        }
        outputPath = rawArgs[index + 1]
        index += 2
    } else if rawArgs[index] == "--input-dir" {
        guard index + 1 < rawArgs.count else {
            fail("Missing value for --input-dir")
        }
        let dir = URL(fileURLWithPath: rawArgs[index + 1])
        let files = (try? FileManager.default.contentsOfDirectory(
            at: dir,
            includingPropertiesForKeys: nil
        )) ?? []
        imagePaths.append(contentsOf: files
            .filter { $0.pathExtension.lowercased() == "png" }
            .map(\.path)
            .sorted())
        index += 2
    } else {
        imagePaths.append(rawArgs[index])
        index += 1
    }
}

guard !imagePaths.isEmpty else {
    fail("No image paths supplied")
}

let outputHandle: FileHandle
if let outputPath {
    FileManager.default.createFile(atPath: outputPath, contents: nil)
    guard let handle = try? FileHandle(forWritingTo: URL(fileURLWithPath: outputPath)) else {
        fail("Cannot write output: \(outputPath)")
    }
    outputHandle = handle
} else {
    outputHandle = FileHandle.standardOutput
}

let encoder = JSONEncoder()
encoder.outputFormatting = [.withoutEscapingSlashes]

for (imageIndex, path) in imagePaths.enumerated() {
    let url = URL(fileURLWithPath: path)
    guard let image = NSImage(contentsOf: url) else {
        fail("Cannot read image: \(path)")
    }
    guard let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
        fail("Cannot create CGImage: \(path)")
    }

    func makeRequest(useExplicitLanguages: Bool) throws -> VNRecognizeTextRequest {
        let request = VNRecognizeTextRequest()
        request.recognitionLevel = .accurate
        request.usesLanguageCorrection = true
        if useExplicitLanguages {
            let preferredLanguages = ["zh-Hans", "en-US"]
            let supportedLanguages = try VNRecognizeTextRequest.supportedRecognitionLanguages(
                for: request.recognitionLevel,
                revision: request.revision
            )
            let recognitionLanguages = preferredLanguages.filter { supportedLanguages.contains($0) }
            if !recognitionLanguages.isEmpty {
                request.recognitionLanguages = recognitionLanguages
            }
        }
        request.minimumTextHeight = 0.006
        return request
    }

    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    var request: VNRecognizeTextRequest
    do {
        request = try makeRequest(useExplicitLanguages: true)
        do {
            try handler.perform([request])
        } catch {
            request = try makeRequest(useExplicitLanguages: false)
            try handler.perform([request])
        }
    } catch {
        fail("Vision OCR failed for \(path): \(error)")
    }

    let observations = (request.results ?? [])
        .compactMap { observation -> (String, Float, CGRect)? in
            guard let candidate = observation.topCandidates(1).first else {
                return nil
            }
            let text = candidate.string.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !text.isEmpty else {
                return nil
            }
            return (text, candidate.confidence, observation.boundingBox)
        }
        .sorted { left, right in
            let yDelta = abs(left.2.midY - right.2.midY)
            if yDelta > 0.01 {
                return left.2.midY > right.2.midY
            }
            return left.2.minX < right.2.minX
        }

    let lines = observations.map { text, confidence, box in
        OCRLine(
            text: text,
            confidence: confidence,
            bbox: [
                Double(box.minX),
                Double(box.minY),
                Double(box.width),
                Double(box.height),
            ]
        )
    }
    let confidences = lines.map(\.confidence)
    let minConfidence = confidences.min() ?? 0
    let avgConfidence = confidences.isEmpty
        ? 0
        : confidences.reduce(0, +) / Float(confidences.count)
    let page = OCRPage(
        image: path,
        text: lines.map(\.text).joined(separator: "\n"),
        minConfidence: minConfidence,
        avgConfidence: avgConfidence,
        lines: lines
    )
    let data = try encoder.encode(page)
    outputHandle.write(data)
    outputHandle.write("\n".data(using: .utf8)!)
    if outputPath != nil && (imageIndex == 0 || imageIndex + 1 == imagePaths.count || (imageIndex + 1) % 10 == 0) {
        fputs("OCR image \(imageIndex + 1)/\(imagePaths.count)\n", stderr)
    }
}

if outputPath != nil {
    try? outputHandle.close()
}
