# SoundCity — CLAUDE.md

軽音サークルのライブ企画応募・管理を効率化するWebアプリケーション。
Googleアカウントでログインし、ブラウザだけで使える。

---

## 技術スタック（実装済み）

| 要素 | 技術 |
|---|---|
| フロントエンド | React 18 + Vite 5 |
| 認証 | Supabase Auth（Google OAuth） |
| データベース | Supabase（PostgreSQL） |
| ホスティング | GitHub Pages |
| デプロイ | gh-pages パッケージ（`npm run deploy`） |
| Excel出力 | SheetJS（xlsxパッケージ） |

---

## プロジェクト構造

```
soundcity/
├── frontend/                  # Reactアプリ本体
│   ├── public/
│   │   ├── logo.jpg           # サークルロゴ
│   │   ├── GUIDE.html         # 使い方ガイド（静的HTML）
│   │   └── sw.js              # Service Worker（ネットワーク優先キャッシュ）
│   ├── src/
│   │   ├── api.js             # Supabase全クエリをここに集約
│   │   ├── lib/supabase.js    # Supabaseクライアント初期化
│   │   ├── theme.js           # テーマ定義・applyTheme()
│   │   ├── context/AppContext.jsx  # currentUser / formState / themeId グローバル状態
│   │   ├── components/        # 共通コンポーネント
│   │   │   ├── BottomNav.jsx
│   │   │   ├── PartSelector.jsx
│   │   │   ├── MemberSearchModal.jsx
│   │   │   ├── PhotoUpload.jsx
│   │   │   └── ThemeSelectModal.jsx
│   │   └── pages/             # 各画面
│   ├── .env                   # VITE_GAS_URL, VITE_LIFF_ID（未使用）
│   ├── .env.local             # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY（ビルド時に使用）
│   ├── vite.config.js         # base: '/soundcity/'
│   └── package.json
├── CLAUDE.md                  # このファイル（AI向け開発ドキュメント）
└── MANUAL.md                  # 人向け取扱説明書
```

---

## 環境変数

`.env.local` に以下を設定（ビルド時にバンドルされる）：

```
VITE_SUPABASE_URL=https://cjqgnwsxccbbxtkaiuef.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## デプロイ

```bash
cd frontend
npm run deploy   # vite build && gh-pages -d dist
```

公開URL: `https://soundcity039-source.github.io/soundcity`

GitHub Pages の反映には2〜5分かかることがある。

---

## ローカル開発

```bash
cd frontend
npm run dev          # localhost のみ
npm run dev -- --host  # スマホ等からもアクセス可（同一Wi-Fi）
```

- `http://localhost:5173/soundcity/` でアクセス
- `import.meta.env.DEV` が true の場合、Google OAuth をスキップしてモックユーザー（幹部権限あり）で自動ログイン
- DEVバナー（黄色）が画面上部に表示される。本番ビルドには含まれない

---

## Supabaseテーブル設計

### members
| カラム | 型 | 説明 |
|---|---|---|
| member_id | uuid (PK) | 自動生成 |
| user_id | uuid | Supabase Auth の user.id |
| full_name | text | 「苗字 名前」形式（スペース区切り） |
| grade | int | 学年（1〜4） |
| gender | text | 男・女・その他 |
| main_part | text | カンマ区切り（例: "Gt,Ba"） |
| photo_url | text | Supabase Storage の公開URL |
| fav_bands | text | 自由入力 |
| want_parts | text | カンマ区切り |
| is_active | bool | 在籍フラグ（デフォルト true） |
| is_admin | bool | 幹部フラグ（デフォルト false） |
| role | text | 役職名（任意） |
| registered_at | timestamptz | 登録日時 |

### lives
| カラム | 型 | 説明 |
|---|---|---|
| live_id | uuid (PK) | |
| live_name | text | ライブ名 |
| date1 | date | 開催日1 |
| date2 | date | 開催日2（1日開催なら null） |
| deadline | timestamptz | 応募締切 |
| fee_mode | text | 'flat' or 'tiered' |
| fee_flat | int | 一律金額 |
| fee_1plan / fee_2plan / fee_3plan | int | 段階制金額 |
| status | text | 'open' / 'closed' / 'done' |
| is_timetable_confirmed | bool | タイムテーブル確定フラグ |
| max_cast_plans | int | 1人が出演できる企画数の上限（null=無制限） |
| max_leader_plans | int | 1人が代表者として応募できる企画数の上限（null=無制限） |

> ⚠️ DB migration が必要:
> ```sql
> ALTER TABLE lives ADD COLUMN IF NOT EXISTS max_cast_plans int;
> ALTER TABLE lives ADD COLUMN IF NOT EXISTS max_leader_plans int;
> ```

### plans
| カラム | 型 | 説明 |
|---|---|---|
| plan_id | uuid (PK) | |
| live_id | uuid (FK → lives) | |
| band_name | text | |
| song_count | int | |
| leader_id | uuid (FK → members) | 応募者のmember_id |
| applied_at | timestamptz | |
| mic_note | text | マイク位置・本数メモ |
| sound_note | text | 音響要望メモ |
| se_note | text | SE・曲目メモ（改行区切り） |
| light_note | text | 照明メモ |

### casts
| カラム | 型 | 説明 |
|---|---|---|
| cast_id | uuid (PK) | |
| plan_id | uuid (FK → plans) | |
| part | text | パート名 |
| member_id | uuid (FK → members, nullable) | 未定の場合 null |

### timetable
| カラム | 型 | 説明 |
|---|---|---|
| live_id | uuid | |
| day | int | 1 or 2 |
| order | int | 出演順 |
| plan_id | uuid (FK → plans) | |

### templates / template_casts
plans / casts と同構造。creator_id（member_id）を持つ。
テンプレートはメンバー情報のみ保持（バンド名は保持しない）。
同じ band_name + creator_id の組み合わせで保存するとき既存を上書き（重複防止）。

### room_reservations
| カラム | 型 | 説明 |
|---|---|---|
| reservation_id | uuid (PK) | |
| date | date | 予約日 |
| slot | text | '1-2限' / '3-4限' / '5-6限' |
| member_id | uuid (FK → members) | |
| member_name | text | 表示用 |
| usage_type | text | '個人' or 'バンド' |
| plan_name | text | バンド使用時の企画名 |
| plan_id | uuid (FK → plans, nullable) | バンド使用時に企画と紐づけ |
| UNIQUE(date, slot) | | 重複予約防止 |

> ⚠️ DB migration が必要:
> ```sql
> ALTER TABLE room_reservations ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES plans(plan_id);
> ```

### calendar_events
| カラム | 型 | 説明 |
|---|---|---|
| event_id | uuid (PK) | |
| type | text | 'live' / 'camp' / 'other' |
| title | text | イベント名 |
| date_start | date | 開始日 |
| date_end | date | 終了日（任意） |
| note | text | メモ（任意） |

RLSポリシー:
- `select_all`: 全認証ユーザーが読み取り可
- `admin_write`: is_admin=true のメンバーのみ書き込み可

### live_videos
| カラム | 型 | 説明 |
|---|---|---|
| video_id | uuid (PK) | |
| live_name | text | ライブ名 |
| day | int | 1 or 2 |
| plan_name | text | 企画名 |
| youtube_url | text | YouTube URL |
| display_order | int | 表示順 |
| created_at | timestamptz | |

---

## 画面一覧

### 一般メンバー向け
| パス | ファイル | 説明 |
|---|---|---|
| `/` | App.jsx (LoginPage) | Googleログイン画面 |
| `/register` | RegisterPage.jsx | 初回登録（名前必須） |
| `/home` | HomePage.jsx | メインメニュー（8項目・説明文付きカードグリッド） |
| `/live` | LiveMenuPage.jsx | ライブメニュー（応募 / 応募一覧） |
| `/live-select` | LiveSelectPage.jsx | 応募するライブ選択（上限表示あり・締切/本番日チェックあり） |
| `/apply/a` | ApplyPageA.jsx | バンド名・曲数入力 |
| `/apply/b` | ApplyPageB.jsx | パート・メンバー選択（出演上限チェック・自分自身が含まれているかチェックあり） |
| `/apply/confirm` | ApplyConfirmPage.jsx | 応募内容確認・送信（editing_leader_id / return_path 対応） |
| `/applications` | ApplicationListPage.jsx | 自分の応募一覧 |
| `/members` | MemberListPage.jsx | メンバー一覧 |
| `/members/:id` | MemberDetailPage.jsx | メンバー詳細 |
| `/profile/edit` | ProfileEditPage.jsx | プロフィール編集 |
| `/templates` | TemplateListPage.jsx | テンプレート一覧（出演上限チェックあり） |
| `/room-reservation` | RoomReservationPage.jsx | 練習室予約（月別スワイプカレンダー） |
| `/live-videos` | LiveVideosPage.jsx | 過去ライブ動画（3階層） |
| `/contact` | ContactPage.jsx | 運営へ連絡 |
| `/calendar` | CalendarPage.jsx | サークルカレンダー（月別スワイプ） |

### 幹部向け（AdminGuard で保護）
| パス | ファイル | 説明 |
|---|---|---|
| `/admin` | AdminHomePage.jsx | 管理メニュー |
| `/admin/lives` | LiveManagePage.jsx | ライブ作成・編集（上限設定あり・締切日ベースのステータス表示） |
| `/admin/timetable` | TimetablePage.jsx | タイムテーブル編集 |
| `/admin/fees` | FeesPage.jsx | 出演費管理 |
| `/admin/members` | MemberManagePage.jsx | メンバー管理 |
| `/admin/live-videos` | LiveVideosManagePage.jsx | 動画管理 |
| `/admin/applications` | AllApplicationsPage.jsx | 全応募一覧（編集・削除あり） |
| `/admin/calendar` | CalendarEditPage.jsx | カレンダーイベント編集 |

---

## 認証フロー

1. `supabase.auth.signInWithOAuth({ provider: 'google' })` でGoogleログイン
2. コールバック後 `supabase.auth.getSession()` でセッション取得
3. `members` テーブルを `user_id = auth.user.id` で検索
4. レコードあり → `currentUser` にセット → `/home` へ
5. レコードなし → `/register` へ（初回登録）
6. `is_active = false` → アクセス不可画面を表示

**ローカル開発時**: `import.meta.env.DEV` が true の場合、Supabase Auth をスキップして `DEV_MOCK_USER`（幹部権限あり）を直接 setCurrentUser する。

LINEブラウザ対策: `navigator.userAgent` に `Line/` が含まれる場合、`?openExternalBrowser=1` を付けてリダイレクト（外部ブラウザで開く）

---

## 主な実装パターン

### パートのデータ形式
DBには `"Gt,Ba,Key"` のようなカンマ区切り文字列で保存。
フロントでは `split(',')` / `join(',')` で配列↔文字列を変換。

### 氏名の扱い
入力フォームでは苗字・名前を別フィールドで受け取り、
DB保存時に `"苗字 名前"` としてスペース結合。
プロフィール編集時は `splitFullName()` 関数で分割（全角スペースにも対応）。

### ライブ動画の3階層ナビゲーション
ルーターを使わず `view` / `selLive` / `selDay` のstate管理で実現。
`view: 'lives' | 'days' | 'plans'` で表示を切り替える。

### 月別カレンダーのスワイプUI（CalendarPage / RoomReservationPage）
3パネル構成の無限スライダー：
- `panels` state（配列3要素）で前・現在・次月を保持
- `sliderRef` → `transform: translateX(-100%)` が中央パネルを示す
- スワイプ終了後 `animateTo()` でアニメーション → `onTransitionEnd` → パネルを回転（`rotatePrev` / `rotateNext`）
- `needsReset` ref + `useLayoutEffect` で描画前に transform をリセット（フリッカー防止）
- スナップバック（dx < 50px）時は `animateTo()` を経由せず直接 style を設定（`isAnimating` スタック防止）

### 練習室予約のカレンダー
`buildCalendarCells()` で月頭の空白を埋めた7列グリッドを生成。
DB制約 `UNIQUE(date, slot)` で重複予約を防止（エラーコード `23505` でキャッチ）。
- 個人練習は現在から1週間先まで（`maxDateStr` で制限）
- バンド使用時は応募済み企画一覧（`getMyPlans`）から選択でき、`plan_id` をDBに保存

### 練習室予約のカレンダー表示（CalendarPage）
自分が出演する企画の `plan_id` を持つ予約も表示（バンドメンバー全員に反映）。
`getMyPlans` で取得した企画IDのSetを使い `.filter()` で絞り込む。

### 出演企画数の上限チェック
`getCastCountsByMember(liveId)` でライブ内のメンバーごとの出演数マップを取得。
- `LiveSelectPage`: `leaderFull` で応募ボタンをブロック、UI に進捗表示
- `ApplyPageB` → `MemberSearchModal`: `castFullMemberIds` Set を渡し、上限に達したメンバーに赤バッジ表示・選択ブロック
- `TemplateListPage`: テンプレート引用時に上限メンバーを自動除外してアラート表示

### 締切日・本番日による応募制御（LiveSelectPage）
- `isDeadlinePast(live)`: `deadline < now` の場合、カードをグレーアウト・クリック不可・「受付終了」バッジ表示
- `isLivePast(live)`: `date2 || date1 < today（日付単位）` の場合、一覧から非表示
- フロント側の表示制御のみ。DB の `status` フィールドは変更しない

### 応募時の自分自身チェック（ApplyPageB）
`handleNext()` で `formState.parts` に `currentUser.member_id` が含まれているかチェック。
- 含まれていない場合はエラーを表示して次の画面に進めない
- 編集モード（`editing_plan_id` あり）の場合はスキップ（幹部が他人の応募を編集する場合のため）

### 幹部による応募編集（AllApplicationsPage → ApplyConfirmPage）
- `handleEdit(plan)` で `setFormState` に `editing_leader_id`（元の代表者ID）と `return_path: '/admin/applications'` をセット
- `ApplyConfirmPage` で `leader_id: formState.editing_leader_id || currentUser.member_id` を使用（元の代表者を保持）
- 編集完了後は `formState.return_path || '/applications'` にリダイレクト

### ライブ管理のステータス表示（LiveManagePage）
`getDisplayStatus(live)`: DB の `status` が `'open'` でも `deadline < now` の場合は `'closed'` として表示。
バッジ表示のみフロント側で補正。DB の値は変更しない。

### テンプレートの保存・引用
- `createTemplate()` は同じ `band_name` + `creator_id` が既にあれば先に削除してから insert（重複防止）
- テンプレートはメンバー情報のみ保持（バンド名は引用時に上書きしない）
- 退部済みメンバーは引用時に自動で空欄化

### 出演費計算
`api.js getFees()` がすべての計算を行い `{ live, fees }` を返す。
`fees` の各要素は `{ member, member_id, count, fee }` の形式。

### ページ遷移時のスクロール
`ScrollToTop` コンポーネント（App.jsx 内）が `useNavigationType()` で POP（戻る）以外の遷移時のみ `window.scrollTo(0, 0)` を実行。戻るときはスクロール位置を保持。

### テーマシステム
`theme.js` で CSS カスタムプロパティを定義し `document.documentElement.style.setProperty` で適用。
`ThemeSelectModal` で各テーマカードがそのテーマ自身の配色を使ってプレビュー表示する。

### プロフィール写真の圧縮
`PhotoUpload.jsx` の `CropModal.handleConfirm()` でアップロード前に Canvas でリサイズ・圧縮する。
- 出力サイズ: **300×300 px**（円形クロップ後）
- JPEG品質: **0.75**
- Supabase Storage 無料枠（1GB）に収めるための設定。変更する場合は `OUT` 定数と `toBlob` の第3引数を修正。

---

## api.js 主要関数一覧

| 関数 | 説明 |
|---|---|
| `getMembers(filters)` | メンバー一覧取得 |
| `getLives(filters)` | ライブ一覧取得 |
| `createLive(payload)` | ライブ作成 |
| `updateLive(payload)` | ライブ更新 |
| `getPlans(filters)` | 企画一覧取得（casts・leader・live JOIN） |
| `getMyPlans(memberId)` | 自分が代表またはキャストの企画取得 |
| `createPlan(payload)` | 企画作成（casts同時insert） |
| `updatePlan(payload)` | 企画更新（casts再作成） |
| `getCastCountsByMember(liveId)` | ライブ内メンバーごとの出演企画数マップを返す |
| `getTemplates(creatorId)` | テンプレート一覧取得 |
| `createTemplate(payload)` | テンプレート作成（重複防止あり） |
| `getRoomReservations(year, month)` | 月別練習室予約取得 |
| `createRoomReservation(payload)` | 練習室予約作成（plan_id対応） |
| `getCalendarEvents()` | カレンダーイベント全取得 |
| `createCalendarEvent(payload)` | イベント作成 |
| `updateCalendarEvent(payload)` | イベント更新（.single()不使用・data[0]で取得） |
| `getFees(liveId)` | 出演費計算 |

---

## セキュリティ設定

### RLS（行レベルセキュリティ）
全テーブルに RLS が有効。ポリシーの概要：

| テーブル | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| members | 全認証ユーザー | 自分のuser_idのみ | 本人 or is_admin | is_admin |
| lives / timetable | 全認証ユーザー | is_admin | is_admin | is_admin |
| plans | 全認証ユーザー | leader本人 | leader本人 or is_admin | leader本人 or is_admin |
| casts | 全認証ユーザー | planのleader or is_admin | planのleader or is_admin | planのleader or is_admin |
| templates / template_casts | 全認証ユーザー | creator本人 or is_admin | creator本人 or is_admin | creator本人 or is_admin |
| room_reservations | 全認証ユーザー | member本人 | — | member本人 or is_admin |
| calendar_events | 全認証ユーザー | is_admin | is_admin | is_admin |
| fee_collections | is_admin | is_admin | is_admin | is_admin |
| live_videos | 全認証ユーザー | is_admin | is_admin | is_admin |

`is_admin` チェックは `is_admin()` 関数（members テーブルへのサブクエリ）で実装済み。

`members_update_own` ポリシーは `with_check` で `is_admin` / `is_active` の自己昇格を防止している。

### 対応済みのセキュリティ対策
- **fee_collections の `allow all` ポリシー削除済み**（2025年4月）: 誰でも読み書きできた問題を修正
- **写真圧縮**: 300×300 / JPEG 0.75 でストレージ節約
- **RLS 全テーブル有効・roles は `authenticated` のみ**（anon ロールは対象外）

### 未対応・今後の課題
- **新規登録の承認制**: 現在は誰でも `/register` から登録できる。対策として `RegisterPage.jsx` で `is_active: false` をデフォルトにして幹部承認制にすることを検討中

---

## 注意事項・既知の制限

- 幹部フラグ（is_admin）の付与・剥奪は `/admin/members`（管理画面）から可能。
  管理画面が使えない初回のみ Supabase ダッシュボードから手動設定が必要
  （Table Editor > members > is_admin = true）
- 写真アップロードは `PhotoUpload.jsx` 経由で Supabase Storage（avatars バケット）に保存
- **Supabase 無料枠は1週間アクセスがないとプロジェクトが自動停止する**。
  停止時は Supabase ダッシュボードで「Restore」ボタンを押して復旧する
- タイムテーブル確定通知機能は未実装（フラグのみ）
- LINE Messaging API 通知機能は未実装
- `.env.local` の Supabase キーはビルド時にバンドルされる（anon key なので許容。RLS で保護済み）
- `updateCalendarEvent` は `.single()` を使わず `data[0]` で取得（RLS の SELECT 制限回避）
- `createLive` / `updateLive` は `.single()` を使用中（エラー時は `.maybeSingle()` に変更を検討）
