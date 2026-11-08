import SwiftUI
import RoomPlan
import ARKit
import UIKit

@main
struct ORRoomScanApp: App {
    var body: some Scene {
        WindowGroup { CaptureScreen() }
    }
}

@MainActor
final class CaptureModel: NSObject, ObservableObject, RoomCaptureViewDelegate {
    @Published var status = "準備掃描"
    @Published var scanning = false
    @Published var lastExport: URL?
    @Published var lastError: String?
    @Published var savedScans: [URL] = []

    // A shared ARSession is the foundation for the next mesh/RGB milestone.
    let arSession = ARSession()
    lazy var captureView: RoomCaptureView = {
        let view = RoomCaptureView(frame: .zero, arSession: arSession)
        view.delegate = self
        return view
    }()

    override init() {
        super.init()
        refreshSavedScans()
    }

    func refreshSavedScans() {
        let base = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("ORScans", isDirectory: true)
        let folders = (try? FileManager.default.contentsOfDirectory(at: base, includingPropertiesForKeys: nil)) ?? []
        savedScans = folders.compactMap { folder in
            let url = folder.appendingPathComponent("room.usdz")
            return FileManager.default.fileExists(atPath: url.path) ? url : nil
        }.sorted { $0.path > $1.path }
    }

    func start() {
        guard RoomCaptureSession.isSupported else {
            lastError = "此裝置不支援 RoomPlan"
            return
        }
        lastError = nil
        lastExport = nil
        currentFolder = nil
        captureView.captureSession.run(configuration: RoomCaptureSession.Configuration())
        scanning = true
        status = "掃描中，請緩慢移動"
    }

    func finish() {
        guard scanning else { return }
        scanning = false
        status = "正在處理掃描資料…"
        captureView.captureSession.stop()
    }

    func captureView(shouldPresent roomDataForProcessing: CapturedRoomData, error: Error?) -> Bool {
        if let error {
            lastError = error.localizedDescription
            status = "掃描失敗"
            return false
        }
        do {
            let folder = try newScanFolder()
            let raw = try JSONEncoder().encode(roomDataForProcessing)
            try raw.write(to: folder.appendingPathComponent("roomplan-raw.json"), options: .atomic)
            status = "原始資料已保存，正在產生 3D 模型…"
            return true
        } catch {
            lastError = "原始資料保存失敗：" + error.localizedDescription
            status = "保存失敗"
            return false
        }
    }

    func captureView(didPresent processedResult: CapturedRoom, error: Error?) {
        if let error {
            lastError = error.localizedDescription
            status = "模型建立失敗"
            return
        }
        do {
            // Use the same scan folder as the raw capture, never silently overwrite.
            guard let folder = currentFolder else {
                throw NSError(domain: "ORScan", code: 1,
                              userInfo: [NSLocalizedDescriptionKey: "找不到原始資料資料夾"])
            }
            let destination = folder.appendingPathComponent("room.usdz")
            try processedResult.export(to: destination)
            let processedJSON = try JSONEncoder().encode(processedResult)
            try processedJSON.write(to: folder.appendingPathComponent("roomplan-processed.json"), options: .atomic)
            lastExport = destination
            refreshSavedScans()
            status = "掃描完成，USDZ、結構 JSON 與原始資料已保存"
        } catch {
            lastError = error.localizedDescription
            status = "匯出失敗"
        }
    }

    private var currentFolder: URL?
    private func newScanFolder() throws -> URL {
        let base = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("ORScans", isDirectory: true)
        let folder = base.appendingPathComponent(UUID().uuidString, isDirectory: true)
        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        currentFolder = folder
        return folder
    }
}

struct CaptureScreen: View {
    @StateObject private var model = CaptureModel()
    var body: some View {
        VStack(spacing: 12) {
            Text("OR RoomScan｜iPhone 掃描").font(.headline)
            CapturePreview(view: model.captureView).ignoresSafeArea(edges: .horizontal)
            Text(model.status).font(.subheadline)
            if let error = model.lastError {
                Text(error).foregroundStyle(.red).font(.caption)
            }
            if let url = model.lastExport {
                ShareLink("分享本次掃描 USDZ", item: url)
            }
            if !model.savedScans.isEmpty {
                Text("已保存掃描").font(.subheadline)
                ScrollView(.horizontal) {
                    HStack {
                        ForEach(model.savedScans, id: \.self) { url in
                            ShareLink(item: url) {
                                Label("分享 " + String(url.deletingLastPathComponent().lastPathComponent.prefix(8)), systemImage: "square.and.arrow.up")
                            }
                        }
                    }
                }
            }
            Button(model.scanning ? "完成掃描" : "開始掃描") {
                if model.scanning { model.finish() } else { model.start() }
            }
            .buttonStyle(.borderedProminent)
            .disabled(!RoomCaptureSession.isSupported)
        }
        .padding()
    }
}

struct CapturePreview: UIViewRepresentable {
    let view: RoomCaptureView
    func makeUIView(context: Context) -> RoomCaptureView { view }
    func updateUIView(_ uiView: RoomCaptureView, context: Context) {}
}
