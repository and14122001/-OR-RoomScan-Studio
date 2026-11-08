# iPhone RoomPlan 真機掃描 MVP

## 目標
iPhone 17 Pro Max：一次掃描 → RoomPlan 原始 JSON + USDZ → 分享 USDZ。
本版本**尚未**完成 ARKit Mesh/RGB 同步擷取、彩色貼圖、CAD、Quest 3；不得稱為雙模型驗收。

## 檔案
`ORRoomScanApp.swift` 是 SwiftUI App 入口與 RoomPlan 掃描原型。尚無經 Xcode 編譯的 .xcodeproj 或 IPA。

## Xcode 建置步驟（需要可用的 macOS/Xcode 建置環境）
1. 建立 iOS App / SwiftUI / Swift 專案，部署目標 iOS 17+，加入 `ORRoomScanApp.swift`，移除範本自動產生的第二個 `@main`。
2. 在 Target 的 Info 加入 `NSCameraUsageDescription`：`用於掃描房間幾何與建立 3D 模型`。
3. 使用實際支援 LiDAR/RoomPlan 的 iPhone、設定簽署，Build & Run；模擬器無法驗證 LiDAR。
4. 開始掃描 → 緩慢環繞房間 → 完成掃描 → 檢查狀態 → 分享 USDZ。
5. 在 App 的 Documents/ORScans/<UUID>/ 檢查 `roomplan-raw.json` 與 `room.usdz`。
6. 退出並重新開啟 App 後，確認資料仍在（UI 列出歷史掃描尚未實作，可透過檔案容器驗證）。

## 驗收證據
記錄裝置/iOS 版本、Xcode 版本、編譯紀錄、開始/結束時間、輸出檔案大小、USDZ 是否能開啟、錯誤訊息及房間實測尺寸。

## 已知阻塞與限制
- 本檔案尚未在 Xcode 編譯，Swift API、MainActor delegate 行為、權限與簽署需真機驗證。
- `RoomCaptureView` 的原始資料只包含 RoomPlan 擷取結果，不等於獨立保存完整 RGB、Depth、ARKit Mesh。
- 目前未建立可直接安裝的 IPA；不可宣稱已完成 iPhone 真機掃描。
- 本階段保留 Quest 3 原有程式碼、工作流程與排程，不修改。
- 現場醫療資料不得未經授權上傳公開儲存庫。

## 後續
G1: 完成 Xcode 編譯與真機輸出。
G2: 增加歷史掃描清單、原始資料回讀、重新建模。
G3: 同一 ARSession 加入 ARKit Mesh、RGB/相機姿態同步記錄，逐一驗證 ARConfiguration 功能相容性。

官方參考：
- https://developer.apple.com/documentation/roomplan/roomcaptureview
- https://developer.apple.com/documentation/roomplan/roomcaptureviewdelegate
- https://developer.apple.com/videos/play/wwdc2023/10192/
