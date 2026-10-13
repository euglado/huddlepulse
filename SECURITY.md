# Security / Güvenlik

Do not post bot tokens, `.env`, private meeting content or unredacted Discord screenshots in issues. Use GitHub's **Security → Report a vulnerability** if private reporting is available. Otherwise ask for a private contact without disclosing exploit details. No response time is guaranteed. Reset an exposed token immediately in Discord Developer Portal, replace the local `.env` safely, and restart the bot.

Issue'larda bot tokenı, `.env`, özel toplantı içeriği veya sansürlenmemiş Discord ekran görüntüsü paylaşmayın. Kullanılabiliyorsa GitHub **Security → Report a vulnerability** özel bildirimini kullanın. Yoksa açığın ayrıntılarını vermeden özel iletişim yolu isteyin. Yanıt süresi garantisi yoktur. Açığa çıkan tokenı Developer Portal'dan hemen sıfırlayın, yerel `.env` dosyasını güvenle yenileyin ve botu yeniden başlatın.

Manager permissions are checked from each interaction, not remembered from creation. Discord role/permission propagation may take time. The operator and Discord can access public agenda content; ephemeral previews are not encrypted from Discord or the operator. This bot is not a confidential meeting system, attendance log, emergency alarm or precise scheduling service. The credential-pattern scan and dependency audit have limited coverage.

Yönetici yetkisi her etkileşimden yeniden okunur; oluşturma anındaki yetki saklanmaz. Discord rol/izin değişikliklerinin yayılması zaman alabilir. Operatör ve Discord herkese açık gündemi görebilir; özel önizlemeler Discord veya operatörden şifrelenmez. Bu bot gizli toplantı sistemi, katılım kaydı, acil durum alarmı veya hassas zamanlama hizmeti değildir. Gizli bilgi desen taramasının ve bağımlılık denetiminin kapsamı sınırlıdır.
