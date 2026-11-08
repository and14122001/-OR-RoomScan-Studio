# MSI GE73 (Windows 11) → iPhone 17 Pro Max 真機驗收

## 狀態
- GitHub 開發分支：`feature/ios-roomplan-device-mvp`
- 編譯：尚未觸發；不能宣稱 IPA 已生成。
- iPhone 真機掃描：尚未執行。
- GitHub Actions 工作流程只支援 `workflow_dispatch` 手動啟動，無 push/cron 自動觸發。

## A. 雲端編譯（只在使用者決定時啟動）
1. 在 GitHub 先將本分支 workflow 以 PR 合併至預設分支（或使用 GitHub CLI 明確指定 ref；GitHub Actions UI 可能只顯示預設分支上的 workflow）。
2. Actions → OR RoomScan iPhone unsigned IPA → Run workflow，選擇目標 ref。
3. 確認編譯成功，下載 `ORRoomScan-iPhone-build` Artifact。
4. 解壓 ZIP，確認 `ORRoomScan-unsigned.ipa`，並保留 build log。
5. 如編譯失敗，先提供錯誤日誌；不要反覆執行消耗額度。

## B. MSI GE73 安裝環境
1. Windows 11 更新；使用可傳輸資料的 USB 線連接 iPhone。
2. 安裝 Apple Devices（Microsoft Store），確保手機可被 Windows 辨識，iPhone 上按「信任這部電腦」。
3. 安裝官方 Sideloadly： https://sideloadly.io/ 。
4. 開啟 Sideloadly，選擇 iPhone 與下載的 unsigned IPA，依工具提示使用個人 Apple ID 簽署安裝。不要把 Apple ID 密碼、2FA 驗證碼放進 GitHub Secrets 或對話。
5. iPhone 如提示開發者模式：設定 → 隱私權與安全性 → 開發者模式；重新啟動後依提示啟用。
6. iPhone 如提示信任開發者：設定 → 一般 → VPN 與裝置管理，確認對應開發者。
7. 免費簽署可能約 7 天到期，需要重新簽署。

## C. 真機掃描驗收
1. 選擇非醫療、沒有敏感資訊的室內房間；先測試約 3 × 4 m。
2. 開啟 ORRoomScan，允許相機權限。
3. 開始掃描；慢速繞行，確認牆、門、家具輪廓。
4. 完成掃描；等待處理結果。
5. 檢查 `room.usdz`、`roomplan-raw.json`、`roomplan-processed.json` 是否生成。
6. 分享 USDZ 並以支援的 3D 檢視器開啟，確認比例、位置與輪廓。
7. 關閉 App 再開啟，檢查檔案是否仍在；目前尚無 App 內歷史掃描清單。
8. 記錄 iPhone 型號、iOS 版本、房間尺寸、檔案大小、錯誤截圖與編譯 commit SHA。

## D. 必須先處理的阻塞
- 現有 Swift 原型尚未經 Xcode 真正編譯；若出現 API/並行隔離錯誤，先修復再重跑。
- 目前只有 RoomPlan 原始資料與結構模型，不是完整彩色 LiDAR Mesh + RGB。
- 若需保留 JSON，後續增加 App 內「匯出整個掃描資料夾」或檔案瀏覽功能。
- 未取得真機證據前，G1 一律標示「未通過」。

## 安全規則
不修改 Quest 3 原有工作流程、不自動執行 CI、不上傳手術室敏感影像、不把 unsigned IPA 當成已可直接安裝的簽署檔。
