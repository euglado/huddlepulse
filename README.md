# HuddlePulse

**Türkçe:** Discord topluluk toplantıları için önizlemeli gündem ve duraklatılabilir bölüm zamanlayıcısı. Tek bir mesaj, kontrollü ilerleme, ses erişimi olmadan.

**English:** A Discord meeting agenda with a private publication preview and pauseable segment timer. One public message, deliberate progression, no voice access.

[Türkçe kullanım](#türkçe) · [English guide](#english) · [MIT license](LICENSE) · [Security / Güvenlik](SECURITY.md) · [Contributing / Katkı](CONTRIBUTING.md)

## Türkçe

### Amaç ve özellikler

Gönüllü ekipleri, öğrenme toplulukları ve oyun toplulukları bir toplantıda konuşma bölümlerinin süresini görünür tutabilir. `/huddle` komutu bir form açar. Yönetici 2–5 bölüm girer; her biri 1–60 dakika, toplam en fazla 180 dakika olabilir. Özel önizleme onaylanmadan kanala hiçbir gündem gönderilmez. Yayımlanan kart hazır durumda bekler; zamanlayıcı **Başlat** ile başlar.

- **Duraklat / Devam** kalan süreyi korur.
- Süre dolunca kart **Sonraki** düğmesini açar; yeni bölüm kendiliğinden başlamaz. Gecikme, kaçırılan bölümlerin atlanmasına yol açmaz. Son bölümden sonra Sonraki gündemi bitirir.
- **Bitir** önce kullanıcıya özel, 60 saniyelik bir onay ister.
- **Özel durum** herkesin kendi görebildiği kısa bir durum yanıtı verir.
- Sunucuda tek etkin kart; her bot süreci tek yapılandırılmış sunucu için çalışır.
- Kartın dili komutta Türkçe/English olarak seçilebilir; seçilmezse Discord istemci dilinden belirlenir. Kontrol yanıtları tıklayan kişinin istemci dilini izler.

Bot konuşmayı dinlemez, ses kanalına katılmaz, katılımcı veya konuşma sırası kaydetmez. Bir takvim, müzik oynatıcı, toplantı kaydı veya gizli toplantı sistemi değildir. Zaman bitiminde yeni mesaj, DM, ses veya etiket bildirimi göndermez; mevcut kartı düzenler. Zamanlayıcılar işletim sistemi saati, bağlantı ve Discord API gecikmelerinden etkilenir; hassas alarm olarak kullanmayın.

### Gereksinimler

1. Windows, macOS veya Linux üzerinde **Node.js 24 LTS, en az 24.13.0 ve 25'ten küçük sürüm**, beraberindeki npm ve internet bağlantısı. [Resmî Node.js indirme sayfası](https://nodejs.org/en/download) üzerinden kurun. `node --version` ve `npm --version` komutları çalışmalı.
2. Discord hesabı, botu kurabileceğiniz bir sunucu ve o sunucuda **Sunucuyu Yönet** yetkisi.
3. Kendi Discord uygulamanız ve bot tokenınız. Ücretsiz kaynak kod tek başına botu çevrimiçi tutmaz; bilgisayar veya sunucu açık kalmalıdır. Barındırma sağlayıcısı ücretlendirebilir.

### Developer Portal kurulumu

1. [Discord Developer Portal](https://discord.com/developers/applications) → **New Application** ile örneğin HuddlePulse adlı bir uygulama oluşturun.
2. **General Information** içindeki **Application ID** değerini kopyalayın. Bu bir kimliktir; token değildir.
3. **Bot** sayfasında bot kullanıcısını oluşturun veya mevcut botu kullanın. **Reset Token** ile token alın. Tokenı şifre gibi saklayın; sohbet, issue, ekran görüntüsü veya GitHub'a göndermeyin. Açığa çıkarsa hemen Reset Token yapın.
4. **Privileged Gateway Intents** altındaki **Presence**, **Server Members** ve **Message Content** seçeneklerinin tümü kapalı kalsın. Bot yalnızca ayrıcalıksız **Guilds** intent'ini kullanır. **Interactions Endpoint URL** boş kalsın; bu bot Gateway ile çalışır.
5. **Installation** altında **Guild Install** kullanın; davet kapsamları `bot` ve `applications.commands`. Bot izinleri yalnızca **View Channels** ve **Send Messages** olsun. **Administrator**, **Manage Server**, **Manage Messages**, **Read Message History**, **Connect** veya **Speak** vermeyin. Bot için izin bit değeri `3072`'dir.
6. Discord → Kullanıcı Ayarları → Gelişmiş → **Geliştirici Modu** açın. Sunucu simgesine sağ tıklayıp **Sunucu Kimliğini Kopyala** seçin. Kanal kimliği veya davet kodu kullanmayın.
7. Kurulum yardımcısının verdiği davet bağlantısını açın, doğru sunucuyu seçin ve izinleri gözden geçirip botu ekleyin. Tek sunuculuk çalışma için her ek sunucuda ayrı uygulama/token/süreç kullanın.

### İndirme ve ilk çalıştırma

Bu depoda **Code → Download ZIP** seçin ve ZIP'i tamamen çıkarın. Ya da Git bilenler `git clone https://github.com/euglado/huddlepulse.git` kullanabilir. Kaynak kod düzenlemek gerekmez. Klasörü tokenla birlikte herkese açık paylaşıma koymayın.

**Windows:** Klasörde `setup.cmd` dosyasına çift tıklayın. Application ID, Server ID ve gizlenerek girilen bot tokenını yazın. Yardımcı, `.env` oluşturur ve kilit dosyasındaki bağımlılıkları kurar. Verilen bağlantıdan botu davet edin; ardından yardımcının beklediği tuşa basın. Yardımcı `/huddle` komutunu o sunucuya kaydeder. Sonra `start.cmd` dosyasını açın ve pencereyi açık tutun. Dosya uzantıları gizliyse Gezginde uzantıları görünür yapın.

**macOS/Linux:** Çıkarılan klasörde Terminal açıp şu komutları çalıştırın:

```sh
chmod +x setup.sh start.sh
./setup.sh
./start.sh
```

macOS'ta ZIP içinden dosyaya çift tıklamak yerine Terminal kullanın. Yardımcı Application ID, Server ID ve görünmeden girilen tokenı ister; token terminal geçmişine yazılmaz. Davet bağlantısını açıp botu ekledikten sonra Enter'a basın. `./start.sh` botu başlatır.

Yardımcı `.env` dosyasını **asla üzerine yazmaz**. Yanlış değer veya token yenileme durumunda botu durdurun; eski `.env` dosyasını güvenli özel bir yere taşıyın veya silin, sonra setup'ı tekrar çalıştırın. Bu dosyanın yedeklerini de gizli tutun. macOS/Linux'ta dosya oluşturulurken `0600` istenir; Windows'ta hesabınızın klasör erişim izinlerini kullanır. Disk şifrelemesi yapmaz.

Yardımcı dışında, etkileşimli terminalde `npm run setup`, `npm ci --ignore-scripts`, davet, `npm run register`, `npm start` sırası kullanılabilir. `register` derlemeyi de yapar. Var olan `.env` ile kurulumu tekrar etmeden sadece `npm ci --ignore-scripts` ve `npm run register` çalıştırabilirsiniz. Kayıt yalnızca bu uygulamanın `/huddle` komutunu oluşturur/günceller; diğer komutları topluca silmez.

### Yapılandırma ve kullanım

`.env` içinde yardımcının oluşturduğu üç değer bulunur: `DISCORD_TOKEN` (gizli), `DISCORD_CLIENT_ID` (Application ID), `DISCORD_GUILD_ID` (Server ID). Başka ayar, veritabanı veya dış hizmet hesabı gerekmez. Kod düzenlenmez. Sunucuda herkese açık normal metin kanalı kullanın; forum, özel mesaj, ses kanalı ve thread yayını desteklenmez. Kanalın kullanıcı erişim sınırlarını siz yönetirsiniz.

1. Sunucuyu Yönet yetkili bir kişi `/huddle language:Türkçe` çalıştırır.
2. Başlığı ve örneğin aşağıdaki gündemi girer:

```text
5 | Açılış
15 | Proje görüşmesi
5 | Sonraki adımlar
```

3. Kendi görebildiği önizlemeyi kontrol eder, **Yayımla** veya **Vazgeç** seçer. Form/önizleme, formun açılmasından itibaren 10 dakika geçerlidir. Aynı kişinin yeni formu veya bitirme onayı önceki taslağını geçersiz kılar.
4. Karttaki **Başlat** ile ilk bölüm başlar. Discord göreli bitiş zamanını gösterir; bot her saniye mesaj düzenlemez. Süre bitiş kontrolü normalde 5 saniyede bir yapılır; Discord gecikmesi eklenebilir.
5. Yönetici gerektiğinde duraklatıp devam eder. **Sonraki** ancak bölüm süresi bitince çalışır; bölümün süresini erkenden atlamak desteklenmez. Baştan vazgeçmek için **Bitir → Bitirmeyi onayla** kullanılır. Onayda yetki yeniden denetlenir.
6. Yönetici olmayan üyeler **Özel durum** kullanabilir. Bir tıklama genel kanala ek mesaj göndermez.

Başlıklarda bağlantı, etiket, Markdown biçimlendirmesi veya görünmez kontrol karakterleri kabul edilmez. Toplantı başlığı en fazla 80, bölüm başlığı 60 karakterdir; form gündem alanı en fazla 400 karakterdir. Bot mesajlarında etiketler ve bağlantı önizlemeleri ayrıca kapatılır.

### İzinler ve güvenli varsayılanlar

Bot yalnızca **Kanalı Görüntüle + Mesaj Gönder** ister. Kendi kartını güncellemek için Mesajları Yönet veya Mesaj Geçmişini Oku izni gerekmez. Yönetici kullanıcı için gereken **Sunucuyu Yönet** izni bota verilmez. Discord komut erişimini rol bazında açsanız bile bot her oluşturma, yayımlama, yönetim tıklaması ve bitirme onayında mevcut kullanıcı yetkisini tekrar denetler. Taslaklar kullanıcı/sunucu/kanala, genel kontroller ayrıca kaynak mesajına bağlıdır.

Yayımlamalar arasında 60 saniye, yönetim tıklamaları arasında 2 saniye sınırı vardır. Sunucu yazmaları aynı anda bir işlemle sınırlandırılır. En fazla 100 geçici taslak ve bir etkin oturum tutulur. Tek bir bot sürecini çalıştırın; aynı tokenı birden çok süreçte kullanmak bu sınırları ve tutarlılığı bozabilir.

### Veri, gizlilik ve sınırlar

Gündem başlıkları, bölüm süreleri, sunucu/kanal/mesaj kimlikleri ve oturum durumu RAM'de en fazla **8 saat**, form/önizlemenin sahibi olan kullanıcı kimliği en fazla **10 dakika**, bitirme onayı kimliği en fazla **60 saniye** saklanır. Süreler yayın/form açılışından itibaren işler; duraklatma 8 saatlik sınırı uzatmaz. Süresi dolmuş taslaklar normalde bir sonraki 5 saniyelik temizlikte silinir. Katılımcı listesi, oy, mesaj geçmişi, ses veya DM içeriği toplanmaz. Bot veritabanı, telemetri veya analitik hizmeti kullanmaz. Hata günlükleri token, gündem veya ham Discord hata yanıtını yazmaz. Discord ve barındırma sağlayıcısının kendi kayıtları ayrı politikalarına tabidir.

**Yeniden başlatma etkin oturumu ve taslakları kaybettirir.** Gündem Discord'da normal mesaj olarak kalır; kendi kendine silinmez. Eski kart düğmeleri özel bir açıklama döndürür. Yönetici eski kartı Discord üzerinden silebilir ve `/huddle` ile yenisini oluşturabilir. Normal bitişte veya 8 saatlik sınırda bot kartı pasifleştirmeye çalışır. Güncelleme başarısızsa süre bitişinde 30 saniyeden sık olmayan üç deneme yapar, sonra oturumu bırakır; 8 saatlik sınırda ilk başarısız denemede bırakır. Böylece başarısız ağ isteği sonsuza dek büyümez; eski kart son görünen durumunu koruyabilir. Yayın sırasında ağ yanıtı kaybolursa taslak tekrar kullanılamaz; yeniden yayınlamadan önce kanalı kontrol edin. Sonraki oluşturma için komutu yeniden çalıştırın.

Özel önizlemeler yalnızca Discord arayüzünde diğer üyelere görünmez; Discord veya bot operatörüne karşı şifreli değildir. Gizli görüşme içeriğini herkese açık kartlara koymayın. `.env` dosyasını GitHub'a yüklemeyin; depo `.env` ve varyantlarını yok sayar. Token açığa çıkarsa Reset Token yapıp yapılandırmayı yenileyin.

### Botu çalışır tutma

Botun Node.js süreci açık ve internet erişimi var oldukça çalışır. Bilgisayar uykuya girerse, terminal kapanırsa veya barındırma durursa hizmet kesilir. Test sunucusunda deneyip ardından Node.js 24 destekleyen bir makinede **tek süreç** olarak çalıştırın. Sağlayıcınızın sır yönetim ekranıyla aynı üç ortam değişkenini verebilirsiniz; bunları komut satırına yazmayın. Başlatma komutu `npm start`, ön kurulum `npm ci --ignore-scripts && npm run build` şeklindedir. Otomatik yeniden başlatma hizmeti kullanabilirsiniz, ancak her yeniden başlatma mevcut gündemi bitirir. Bu depo canlı barındırma sağlamaz ve otomatik VDS kurulumu yapmaz.

### Sorun giderme

- **Komut görünmüyor:** Botun doğru sunucuya `applications.commands` kapsamıyla eklendiğini, Server ID'yi ve `npm run register` sonucunu kontrol edin. Discord'u yenileyin; Sunucuyu Yönet yetkili hesap kullanın. Developer Portal Interactions Endpoint URL boş olmalı.
- **Privileged intent / 401 / giriş hatası:** Tokenı sohbetle paylaşmayın. Bot tokenı kullandığınızı doğrulayın; gerekirse sıfırlayın ve `.env` dosyasını yardımcıyla yenileyin. Ayrıcalıklı intent'leri açmak çözüm değildir.
- **Form açılamıyor / yayımlanamıyor:** Normal metin kanalı, kullanıcı yetkisi ve botun kanal özel izinlerini kontrol edin. Önizleme süresi dolmuş veya sunucuda başka oturum olabilir. Yayınlar arasında 60 saniye bekleyin.
- **Sonraki kapalı:** Bölüm henüz bitmedi veya duraklatıldı. Devam edin ve süreyi bekleyin. Bu kasıtlı güvenli davranıştır.
- **Düğme eski veya süre doldu:** Bot yeniden başlamış, 8 saat dolmuş veya ağ hataları nedeniyle oturum bırakılmış olabilir. Yönetici eski mesajı silip yeniden oluşturabilir. Eski karttan durum geri yüklenmez.
- **Kurulum mevcut .env nedeniyle duruyor:** Dosya üzerine yazılmaz. Güvenli yere taşıyın, sonra setup'ı yeniden çalıştırın. Sadece bağımlılık/komut kaydı için `npm ci --ignore-scripts` ve `npm run register` yeterlidir.
- **Node/TypeScript bulunamadı:** Node.js 24'ü kurup terminali yeniden açın; bot klasöründe `npm ci --ignore-scripts` çalıştırın. `start.cmd`/`start.sh` derlemeyi yapar; doğrudan `npm start` için önce `npm run build` gerekir.

### Testler, katkı ve lisans

```sh
npm ci --ignore-scripts
npm run check
npm audit --audit-level=low
bash -n setup.sh start.sh
```

`check`: Biome önerilen lint/biçim, katı TypeScript derlemesi, Node testleri ve bağımlılık lisansı/kaynak/SHA-512 ile kaynak gizli bilgi desen denetimi. Testler durum geçişleri, yetki kaybı, taslak sahipliği/süresi, yeniden başlatma, hata/yarış durumları, sınırlı bellek ve eksik yapılandırmayı kapsar. CI Ubuntu, Windows ve macOS Intel'de çalışır; iş akışı salt okunur izinli ve Actions sürümleri commit'e sabitlidir. Tarayıcı tüm gizli bilgileri bulmayı veya audit tüm açıkları bilmeyi garanti etmez.

Otomatik Discord etkileşimleri **taklittir**; gerçek tokenla canlı Discord kurulumu, token girişinin kullanıcı terminalindeki davranışı ve ekran okuyucu deneyimi otomatik testlerin kapsamında değildir. İlk kullanımdan önce özel bir test sunucusunda form, yetki kaybı, Başlat/Duraklat/Devam/Sonraki/Bitir ve yeniden başlatmayı doğrulayın. Katkı için [CONTRIBUTING.md](CONTRIBUTING.md), güvenlik için [SECURITY.md](SECURITY.md). Proje [MIT](LICENSE) lisanslıdır; garanti verilmez.

## English

### Purpose and features

HuddlePulse helps volunteer teams, study groups and gaming communities keep meeting segments visible. `/huddle` opens a form for 2–5 segments, each 1–60 minutes, at most 180 minutes total. A private preview requires explicit **Publish** before any agenda reaches the channel. The public card waits until a manager presses **Start**.

- **Pause / Resume** preserve remaining time.
- When time runs out, **Next** becomes available. The next segment never starts automatically. Long delays do not skip segments. Next after the final segment ends the agenda.
- **End** requires a private confirmation that expires in 60 seconds.
- **Private status** gives any member an ephemeral status reply.
- One active card per server; one configured server per process.
- Choose Türkçe or English in the command; otherwise the card follows the creator's Discord locale. Control replies follow the clicking member's locale.

The bot does not join voice, record audio, track attendance or manage a speaker queue. It is not a calendar, music player, meeting recording or confidential meeting system. It does not send new messages, DMs, sounds or mention alerts at deadlines; it edits the existing card. OS clock changes, network conditions and Discord delays affect timing. Do not use it as a precise alarm.

### Requirements

1. Windows, macOS or Linux, **Node.js 24 LTS, at least 24.13.0 and below 25**, npm and internet access. Install from the [official Node.js download page](https://nodejs.org/en/download). Check `node --version` and `npm --version`.
2. A Discord account and a server where you can install a bot and have **Manage Server** permission.
3. Your own Discord application and bot token. Source code does not include hosting; your computer/server must stay online. Hosting providers may charge fees.

### Discord Developer Portal

1. Open [Discord Developer Portal](https://discord.com/developers/applications), choose **New Application**, and name it, for example, HuddlePulse.
2. Copy **Application ID** from **General Information**. This is an identifier, not a token.
3. On **Bot**, create/use the application's bot user and obtain its token with **Reset Token**. Treat it like a password. Never paste it in chat, issues, screenshots or GitHub. Reset it immediately if exposed.
4. Leave **Presence**, **Server Members** and **Message Content** privileged intents **off**. Only the nonprivileged **Guilds** intent is used. Leave **Interactions Endpoint URL** empty; this implementation receives interactions over Gateway.
5. Under **Installation**, use **Guild Install** with scopes `bot` and `applications.commands`. Select only **View Channels** and **Send Messages** (permission value `3072`). Do not grant Administrator, Manage Server, Manage Messages, Read Message History, Connect or Speak to the bot.
6. In Discord Settings → Advanced, enable **Developer Mode**. Right-click your server icon and **Copy Server ID**. Do not use a channel ID or invite code.
7. Open the setup helper's invite link, select the correct server, review permissions and install. For another server, use a separate application/token/process.

### Download and installation

Use **Code → Download ZIP** in this repository and extract the entire archive. Git users can use `git clone https://github.com/euglado/huddlepulse.git`. No source editing is required. Keep the folder and credentials out of public shared storage.

**Windows:** Double-click `setup.cmd`. Enter Application ID, Server ID and the hidden bot token. Setup creates `.env` and installs locked dependencies. Open the printed invite URL, install the bot and press a key when prompted. The helper registers `/huddle` in the configured server. Then double-click `start.cmd` and keep the window open. Enable file extensions in Explorer if necessary.

**macOS/Linux:** Open Terminal in the extracted directory:

```sh
chmod +x setup.sh start.sh
./setup.sh
./start.sh
```

On macOS, use Terminal rather than double-clicking a ZIP-extracted shell file. Setup asks for both IDs and the token without echoing it or adding it to shell history. Install the bot through the printed invite link before pressing Enter. `./start.sh` starts the bot.

Setup **never overwrites `.env`**. To correct values or rotate a token, stop the bot, move the old file to a safe private location or delete it, then run setup again. Keep any backup private. On macOS/Linux creation requests mode `0600`; Windows uses your account's folder access controls. The file is plain text, not encrypted.

Alternatively, in an interactive terminal use `npm run setup`, `npm ci --ignore-scripts`, install through the invite, `npm run register`, then `npm start`. Registration also builds the source. With an existing `.env`, reinstall dependencies or register again using `npm ci --ignore-scripts` and `npm run register` without rerunning setup. Registration upserts only this application's `/huddle`; it does not bulk-delete other commands.

### Configuration and usage

The setup helper writes `DISCORD_TOKEN` (secret), `DISCORD_CLIENT_ID` (Application ID), and `DISCORD_GUILD_ID` (Server ID). No other settings, database or third-party accounts are needed. Use a regular server text channel; publishing to threads, forums, DMs or voice channels is unsupported. The server operator controls who can access that channel.

1. A member with Manage Server runs `/huddle language:English`.
2. Enter a title and an agenda such as:

```text
5 | Welcome
15 | Project discussion
5 | Next steps
```

3. Review the private preview and choose **Publish** or **Cancel**. The form/preview expires 10 minutes after opening the form. A new form or end confirmation from the same owner invalidates their previous draft.
4. Press **Start** on the public card. Discord renders a relative deadline; the bot does not edit every second. It normally checks deadlines every five seconds, plus Discord/network delays.
5. Pause and resume as needed. **Next** only works after the current segment has elapsed; early skipping is unsupported. To stop early, use **End → Confirm end**. The confirmation rechecks manager permission.
6. Members without manager permission can use **Private status**. Their click does not post a new channel message.

Titles must be plain text without links, mentions, Markdown formatting or invisible control characters. Meeting title limit: 80 characters. Segment title limit: 60 characters. The agenda form input is limited to 400 characters. Mentions and link previews are also suppressed on bot messages.

### Permissions and safe defaults

The bot needs only **View Channel + Send Messages**. Editing its own message does not require Manage Messages or Read Message History. The manager user's **Manage Server** requirement is separate; do not give that permission to the bot. Even if command access is customized in Discord, every creation, publication, manager control and end confirmation rechecks current interaction permissions. Drafts bind to user/server/channel, and public controls also bind to the original message.

Publishing has a 60-second cooldown; manager controls have a two-second cooldown. Writes are serialized, with at most 100 temporary drafts and one live agenda. Run **one process per token**; multiple processes break these local limits and consistency.

### Data, privacy and limits

Agenda titles, durations, guild/channel/message IDs and session state live in RAM for at most **eight hours** after publication. Form/preview owner IDs live for up to **ten minutes** after form opening; end confirmations for **60 seconds**. Pausing does not extend the eight-hour lifetime. Expired drafts are normally removed on the next five-second cleanup. No participant roster, votes, history, voice or DM content is collected. There is no database, telemetry or analytics service. Logs omit tokens, agenda content and raw Discord error responses. Discord and your hosting provider have their own retention policies.

**Restarting loses active sessions and previews.** Public Discord messages remain until manually deleted. Old controls return a private explanation; a manager can delete the old card and create a new one. The bot tries to disable the card at normal completion or expiry. After a segment deadline, failed timer edits are retried at most three times, at least 30 seconds apart, then the session is abandoned. At the eight-hour lifetime limit it abandons the session after the first failed edit. Stale cards can retain the last displayed state. If a publication response is lost, its draft cannot be replayed: inspect the channel before retrying and run the command again to create a new draft.

Ephemeral previews are private from other members in the Discord UI, not encrypted from Discord or the bot operator. Do not put confidential meeting content in public cards. Never upload `.env`; the repository ignores it and its variants. Reset exposed tokens and replace configuration using setup.

### Keeping the bot online

The Node.js process must stay running with network access. Sleep, terminal closure or hosting shutdown interrupts service. Test in a private server first, then deploy as a **single process** on a Node.js 24 host. A provider's secret-management UI can supply the same three environment variables; do not put tokens in command-line arguments. Prepare with `npm ci --ignore-scripts && npm run build`; start with `npm start`. A process supervisor can restart it, but every restart ends current agendas. This repository does not supply live hosting or automatically configure a VPS.

### Troubleshooting

- **Command missing:** Check `applications.commands` scope, the configured Server ID, successful `npm run register`, and manager permission. Refresh Discord. Leave the application's Interactions Endpoint URL empty.
- **Login, 401 or privileged intent error:** Check that this is a bot token; never share it. Reset it if needed and replace `.env` through setup. Enabling privileged intents is unnecessary.
- **Cannot open form/publish:** Check regular text channel type, current manager permission and bot channel overrides. The preview may be expired, another agenda may exist, or the 60-second publication cooldown may apply.
- **Next disabled:** The segment is running or paused. Resume and wait for its deadline. Early skipping is intentionally unsupported.
- **Old/expired controls:** The bot restarted, eight hours passed or repeated API failures retired the session. Delete the stale message manually and create a new agenda. State is not recovered from old cards.
- **Setup refuses existing `.env`:** Move it safely before setup. For dependency/registration refresh only, use `npm ci --ignore-scripts` and `npm run register`.
- **Node/TypeScript missing:** Install Node.js 24, reopen your terminal and run `npm ci --ignore-scripts` in the bot folder. Start helpers build automatically; direct `npm start` requires `npm run build` first.

### Tests, contribution and license

```sh
npm ci --ignore-scripts
npm run check
npm audit --audit-level=low
bash -n setup.sh start.sh
```

`check` runs Biome's recommended lint/format checks, strict TypeScript compilation, Node tests, dependency license/registry/SHA-512 checks and source credential-pattern scans. Tests cover state transitions, permission loss, draft ownership/expiry, restart, failures/races, memory bounds and missing configuration. Read-only, commit-pinned GitHub Actions runs on Ubuntu, Windows and macOS Intel. Pattern scanning cannot find every secret, and dependency audits cannot detect every vulnerability.

Automated Discord interaction tests are **mocked**. Live token/server installation, hidden token entry in your terminal and screen-reader behavior still require operator validation. Before real use, test forms, permission loss, Start/Pause/Resume/Next/End and restart in a private test server. See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md). Released under [MIT](LICENSE), without warranty.

### Official references / Resmî kaynaklar

- [Discord interactions and response deadlines](https://docs.discord.com/developers/interactions/receiving-and-responding)
- [Application commands](https://docs.discord.com/developers/interactions/application-commands)
- [Modal Label and button components](https://docs.discord.com/developers/components/reference)
- [Gateway and intents](https://docs.discord.com/developers/events/gateway)
- [Discord permissions](https://docs.discord.com/developers/topics/permissions)
- [Discord Developer Policy](https://support-dev.discord.com/hc/en-us/articles/8563934450327-Discord-Developer-Policy)
