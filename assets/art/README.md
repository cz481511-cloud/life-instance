# 美術素材清單（MVP 試作）

生成工具：Higgsfield MCP · 模型 `gpt_image_2`（medium，1k）· 2026-11-08
風格：16-bit 復古像素風（SNES 風）

| 資料夾 | 檔案 | 用途 | 備註 |
|---|---|---|---|
| backgrounds | bg_taipei_street_day.png | 台北白天街景（送單場景） | 16:9 |
| backgrounds | bg_taipei_street_rain_night.png | 台北雨夜街景（雨天/宵夜） | 16:9 |
| backgrounds | bg_home_room.png | 主角租屋雅房（早上/晚上結算） | 16:9 |
| portraits | player_male.png | 主角立繪（男） | 淺灰底 |
| portraits | player_female.png | 主角立繪（女） | 淺灰底 |
| portraits | npc_nurse.png | 愛情線：夜班護理師 | 已將圖中真實店名改為「胖老爺 美式炸雞」與「幸福醫院」 |
| portraits | npc_crash_person.png | 愛情線：車禍的那個人 | 淺灰底 |
| characters | rider_scooter_side.png | 外送員騎車側面精靈圖 | 白底，需去背 |
| icons | icon_sheet.png | 4×4 圖示表：珍奶、炸雞、便當、硬幣、鈔票、愛心、體力、心情、星評、扳手、雨、晴、手機、定位、醫院、機車 | 白底，需切割與去背 |

## 尚未製作
- portraits：手搖飲店員、同行外送員（v1.0 愛情線）
- backgrounds：手搖飲店、醫院、客人門口/大樓管理室
- ui：外送 App 介面框、對話框
- effects：雨滴、車禍閃光等（可改用程式繪製）
- items：裝備（雨衣、保溫袋）

## 後續處理
- 白底素材可在遊戲內用 Canvas 去除白色背景，或之後再用 Higgsfield `remove_background`
- 遊戲中顯示時建議 CSS `image-rendering: pixelated`
