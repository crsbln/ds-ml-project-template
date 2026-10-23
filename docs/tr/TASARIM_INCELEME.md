# Tasarım İncelemesi: Kickstarter Success Prediction sunumu

İncelenen: `kickstarter_success_presentation.pdf` (24 sayfa, 1920×1080: 16 ana slayt + 8 teknik not). Kaynaklar `slides/slides/*.html` içinde, sıra `slides/deck.json` içinde, ortak CSS `slides/build_pdf.py` içinde. İnceleme güncel sürüme dayanıyor (commit 3927263; bu commit s. 8, 10, 11, 15, 19 ve 23'ü değiştirdi). Her sayfa PNG'ye çevrilip tek tek incelendi. Kontrast oranları kaynaktaki renk kodlarından hesaplandı.

Aşağıdaki sayfa numaraları PDF sayfa numaralarıdır. Ana slaytlar: 1, 2, 3, 4, 6, 8, 10, 12, 13, 14, 17, 19, 20, 22, 23, 24. Teknik notlar (TN): 5, 7, 9, 11, 15, 16, 18, 21.

## 1. Karar

Sunum temiz, sakin ve tutarlı. Renk paleti net: lacivert #16233B, krem #F7F5EF, mavi #2B5C9E, pas turuncusu #B5481A, kehribar #F2A65A. Yazı tipi eşleşmesi iyi (başlıklarda Domine, metinde DM Sans). Bar grafikler sıfırdan başlıyor ve değerler doğrudan barların yanında yazıyor. Başlıkların çoğu bir konu adı değil, bir sonuç söylüyor.

Zayıf noktalar görünüşten çok sunuş sırasında ortaya çıkıyor:
- 8 teknik not ana slaytların arasında duruyor, sunum sırasında bunları atlamak zorundasın.
- "Kötü" anlamına gelen renk, sınırlar slaytında ters dönüyor.
- Birkaç orta slayt (ana hat, ML süreci, model tablosu, sonuç) 10 dakikalık bir konuşma için fazla yazılı. Konuşmacı notların zaten yaklaşık 10,5 dakika tutuyor.

**Puanlar:** görsel tasarım **8/10**, içeriğin anlaşılırlığı **7/10**.

**En büyük etkiyi yapacak 3 değişiklik**
1. **8 teknik notu "Thank you" slaytından sonraya, bir ek (appendix) bölümüne taşı** (`deck.json` sırasını değiştir). Böylece konuşma, hiç sayfa atlamadan ilerleyen 16 sayfa olur.
2. **17. sayfadaki renk anlamını düzelt.** "14 / 100" (uyarı) pas turuncusu #B5481A, "62 / 100" (ortalamanın üstü) mavi #2B5C9E olsun. Tüm sunumda tek kural uygula: pas turuncusu = başlığın uyardığı şey.
3. **Yaklaşık 1,5 dakikalık metni kes.** Ana hattı (s. 2) kısa bir gündeme çevir, ML süreci slaytını (s. 13) sadeleştir, model slaytına (s. 14) tablo yerine sonucu söyleyen bir başlık koy.

## 2. Sunumun geneliyle ilgili bulgular

| # | Önem | Sorun | Çözüm |
|---|---|---|---|
| D1 | Yüksek | Teknik notlar araya karışmış (s. 5, 7, 9, 11, 15, 16, 18, 21). Canlı sunumda 8 sayfa atlaman gerekiyor. Tek bir yanlış tıklama, seyircinin önüne 250 kelimelik bir sayfa getirir ve akışı bozar. 2. sayfa bile "konuşmada bunları atlıyoruz" diyor. | `deck.json` içinde TN'leri `thanks`'ten sonraya koy ("Appendix" bölümü). 4. sayfadaki alt satırı "details on the next page" yerine "details in the appendix" yap. 2. sayfadaki teal not: "Technical notes are in the appendix". |
| D2 | Yüksek | Turuncunun tek bir anlamı yok. S. 8'de dipnot "turuncu = %36 ortalamanın altı" diyor. S. 10'da turuncu 30 ve 60 günü işaretliyor, oysa %38 ortalamanın *üstünde*. S. 6'da sadece >$100k barı turuncu, oysa %14–35 de ortalamanın altında. S. 17'de anlam tamamen tersine dönüyor: uyarı (14/100) mavi, iyi sonuç (62/100) turuncu. S. 20'de "Above average" rozeti kehribar renginde. | Tek kural belirle: **pas turuncusu #B5481A = başlığın uyardığı şey, mavi #2B5C9E = geri kalanlar, gri #9AA5B4 = ortalama.** S. 6, 8 ve 10 zaten bu kurala uyuyor. S. 8'deki "turuncu = ortalamanın altı" açıklamasını kaldır, gri ortalama barı bunu zaten anlatıyor. S. 17'de iki rengin yerini değiştir. |
| D3 | Orta | Zamanlama: ana slaytların konuşmacı notları toplam yaklaşık 1.520 kelime. Dakikada 140 kelimeyle bu yaklaşık 10,8 dakika; slot ise 10 dakika ve 16 slayt var. Geçişler ya da heyecanlı bir başlangıç için hiç pay kalmıyor. | Yaklaşık 200 kelime kes. Ana hat notunu (s. 2, 105 kelime) 2 cümleye indir. "How to make it better" slaytını (s. 22) sonuçla birleştir ya da tek cümleyle söyle. S. 13'ün notunu kısalt. |
| D4 | Orta | Ana hat (s. 2) ve sonuç (s. 23) aynı 5 adımı aynı sayılarla tekrar ediyor. Ana hat, hikâye başlamadan bütün bulguları söylüyor; adım hapları (step pills) yapıyı zaten gösteriyor. | S. 2'yi hafif bir gündem yap: 5 adım adı ve her birine 4–6 kelimelik bir merak cümlesi (ör. "3 · Baseline: a simple rule to beat"), en az 32px. Sayıları s. 23'e sakla. |
| D5 | Düşük | Sol kenar boşluğu değişiyor: s. 2, 4, 13, 23'te 112px, diğer her yerde 128px. Üst etiket ve başlık, s. 13'ten 14'e ve s. 4'ten 6'ya geçerken 16px kayıyor. | Outline, approach, ml-story ve conclusion slaytlarında `padding-left:128px` (sağda da 128px) kullan. |
| D6 | Düşük | Aktif olmayan adım hapları: #8A94A3 rengi #F7F5EF üzerinde **2,8:1**, 19px. Bu, WCAG AA eşiğinin (4,5:1) altında; salonun arkasından okunmaz. | `build_pdf.py` içinde `.steps span` için `color:#5F6B7A` (yaklaşık 5,0:1) ve `font-size:22px`. Aktif hap koyu dolgulu kalsın. |
| D7 | Düşük | Üç bar grafik farklı ölçülerde: bar yüksekliği 46 / 38 / 48px, ölçek yüzde puan başına 24 / 18 / 16px (s. 6, 8, 10). Her grafik kendi içinde dürüst (sıfırdan başlıyor, orantılı), ama %50 her slaytta farklı uzunlukta görünüyor. | Tek ölçek kullan: ör. %1 = 18px, bar yüksekliği 44px, barlar üç slaytta da aynı x noktasından başlasın. |
| D8 | Düşük | Bölüm arka planları (#F7F5EF krem ve s. 12–17'deki #EEF2F6 gri) projeksiyonda neredeyse aynı görünür. 5. adım koyu (s. 19) ve krem (s. 20, 22) arasında gidip geliyor. Zararsız, ama bölümleri bununla ayırdığını varsayma. | Olduğu gibi bırak ya da tüm açık renkli ana slaytlarda krem kullan. |
| D9 | Düşük | PDF bazı işaretler (ör. "→") için ArialMT ve Lucida Grande'yi yedek yazı tipi olarak gömüyor. S. 12'de 144 dpi'da baktım: ok işareti düzgün görünüyor. Asıl sorun satır kırılması: "→" ilk satırın sonunda kalıyor, "“funded”" ikinci satırda yalnız kalıyor. | S. 12'de kuralı bilinçli iki satıra böl: "Goal under $5,500" / "→ “funded”" (okun önüne `<br>` koy). |

## 3. Slayt slayt bulgular

| Sayfa | Önem | Sorun | Somut çözüm |
|---|---|---|---|
| 1 Kapak | yok | Güçlü: büyük Domine soru başlığı, kehribar üst etiket, net hiyerarşi. | İsteğe bağlı: "October 2026" yerine "23 October 2026". |
| 2 Ana hat | Orta (D4) | 22–24px'te 138 kelime. Kartların alt %40'ı boş ve bulgular önceden söyleniyor. | Gündem versiyonu (bkz. D4). Teal notu düzelt (D1). |
| 3 Problem | yok | En iyi slayt: tek dev sayı (320px pas turuncusu), tek cümle, kalın "before". | Koru. |
| 4 Veri | Orta | Üç kartta 138 kelime. Paralel kart başlıkları sebepsiz yere üç farklı renkte (pas, mavi, kehribar). "Details on the next page" ifadesi TN'lerin arada olduğunu varsayıyor. | Kart başına iki satır, en az 30px. Başlıklarda tek renk (beyaz kartta #2B5C9E, lacivert kartta #F2A65A). Alt satır D1'e göre değişsin. |
| 6 Hedef tutarı | Düşük | Net ve dürüst. S. 8'deki gibi bir ortalama çizgisi yok. | %36 hizasına ince kesikli bir çizgi ekle, etiketi "average 36%" (#9AA5B4). Seyirci "kötünün" nerede başladığını görsün. |
| 8 Kategori | Düşük | İyi: sıralı, değerler doğrudan yazılı, gri ortalama barı var ve başlık sonucu söylüyor. Yeni başlık iki satıra kırılıyor, ikinci satırda tek bir kelime ("worst") kalıyor ve bu grafiği aşağı itiyor. Renk açıklaması hâlâ kimsenin okumadığı 24px gri dipnotta. | Başlığı tek satıra sığdır: ör. "Dance and theater do best, technology worst" (ya da `font-size:64px`). Açıklamayı dipnottan kaldır (gri ortalama barı zaten anlatıyor) ya da gri barın yanına küçük "above / below average" etiketleri koy. |
| 10 Süre | Orta | Yeni başlık ("…trail their neighbours") artık grafikle uyumlu. İki sorun kalıyor. Başlık iki satıra kırılıyor ve ikinci satırda tek bir kelime ("neighbours") kalıyor. Önemli koşul ("goals of $1k–5k") hâlâ dipnotta saklı; dipnot da 24px'te 2 satıra ve yaklaşık 40 kelimeye çıktı, canlı sunumda kimse okumaz. | Tek satıra sığan bir başlık: "30 and 60 days trail their neighbours". Başlığın altına 28px bir alt satır ekle: "Projects with goals of $1k–5k". Dipnotu "Same pattern for every goal size · a correlation" diye kısalt, ayrıntıyı TN s. 11'e bırak. |
| 12 Baseline | Düşük | Üç istatistik kartında metin sütunu hizalı değil ("45" satırı, "63" ve "no" satırlarından yaklaşık 15px solda başlıyor). Büyük mavi serif "no" bir istatistik gibi duruyor. Ayrıca D9'daki satır kırılması. | Sayıya `flex:none;width:120px` ver. "no" yerine küçük gri bir "✕" ya da düz metin "No chance estimate" koy. |
| 13 ML süreci | Orta | En kalabalık ana slayt: 22–25px'te 163 kelime, jargon da var ("cross validation", "cut-off", "time check"). 10 dakikalık sunumda bu slayta yaklaşık 35 saniye düşüyor. | 4 kart başlığını koru, her birine kısa tek satır yaz (en az 30px): "Try: 3 models, Gradient Boosting wins" / "Tune: almost no gain" / "Decide: a chance, not yes/no" / "Test: 74,459 unseen projects". Gerisini TN s. 15'e taşı. |
| 14 Model | Orta | "Then, a model that beats the rule" başlığı bir konu adı. Tablo, seyirciyi sütunları okuyup karşılaştırmaya zorluyor. Alttaki paragraf iki mesajı karıştırıyor (rastgele tahmin + kalibrasyon). "Rule: goal under $5,500" sütun başlığı iki satıra kırılıyor. | Başlık: "Our model finds 74 of 100 funded projects; the rule finds 63". Sütun başlığı "Simple rule". İsteğe bağlı: tablo yerine iki çift yatay bar (45'e karşı 53, 63'e karşı 74). Altta tek cümle kalsın: "Chances are honest on average: about 35% means funded about 35% of the time." |
| 17 Sınırlar | Yüksek (D2) | Renk ters: kötü sayı (14/100) mavi, iyi sayı (62/100) pas turuncusu. S. 8 ve 10'un tam tersi. | "14 / 100" → `color:#B5481A`; "62 / 100" → `color:#2B5C9E`. |
| 19 Öneriler | Düşük | Güçlü koyu slayt, numaralı, kehribar rakamlar. 2. maddenin yeni metni artık s. 10 ile uyumlu. Ama sıra (hedef, süre, kategori) hâlâ bulguların ve sonucun sırasından (hedef, kategori, süre) farklı. | 2. ve 3. maddelerin yerini değiştir, böylece bulguların sırasını izlesinler. |
| 20 Launch Check | Düşük | Girdi→sonuç maketi iyi, sayı güçlü. "Above average" rozeti kehribar renginde; bu renk ailesi açık slaytlarda "uyarı" anlamına geliyor. | Rozet `background:#9CC0F0; color:#16233B` (lacivert üzerinde açık mavi olumlu okunur) ya da beyaz çerçeveli bir rozet. |
| 22 Sonraki adımlar | Düşük | Dört düzenli kart, her biri yaklaşık %45 boş. Aldığı süreye göre az bilgi veriyor. | S. 23'e tek satır olarak ekle ya da kartları ikiye indir; kazanılan zamanı s. 14'e ver. |
| 23 Sonuç | Düşük | Tek sayfalık özet iyi, son satır vurgulu. 28px'te 146 kelime, kapanış slaytı için ancak ana hat hafifletilirse uygun (D4). Sol boşluk 112px (D5). | İçeriği koru, boşluğu düzelt. Sadece 5 önemli sayıyı kalın yaz, "goal / category / length" kelimelerini değil. |
| 24 Teşekkürler | Düşük | "Notebook on GitHub" yazıyor ama bağlantı yok ve repo gizli (private). Seyirci bununla bir şey yapamaz. | Repoyu açarsan URL ya da QR kod ekle; açmazsan "Notebook available on request" yaz. |
| TN 5–21 | Düşük | Çok tutarlı 2×2 şablon: teal şerit, net etiketler, kaynak satırı. Okuma materyali olarak iyi. 23px metin, 19px kaynak ve sayfa başına yaklaşık 220–260 kelimeyle projeksiyon için uygun değil; ama ek bölümüne taşındıktan sonra bu sorun olmaz. S. 5 ve 15'te kaynak satırı iki satıra taşıyor. | D1'den sonra değişiklik gerekmez. İstersen iki uzun kaynak satırını kısalt. |

## 4. Zaten iyi olanlar

- Tek ve tutarlı bir görsel sistem: ölçülü palet, Domine başlık ve DM Sans metin, geniş kenar boşlukları, üst etiket, başlık ve alt satırın hep aynı yerde olması.
- Grafikler iyi uygulamaya uyuyor: yatay barlar, sıfırdan başlayan eksen, orantılı uzunluklar, doğrudan yazılmış değerler, ızgara çizgisi ya da 3D yok, anlamlı yerde sıralı, önemli bar vurgulu.
- Başlıkların çoğu ana mesajı söylüyor ("Smaller goals succeed far more often", "A risk check, not a crystal ball").
- Teknik olmayan dinleyici için sade dil: ham precision ve recall yerine "of 100 projects it calls funded, 45 really were".
- Adım hapları, hikâyenin neresinde olunduğunu açıkça gösteriyor.
- Kontrast neredeyse her yerde iyi: krem üzerinde #4A5568 metin 6,9:1, krem üzerinde pas turuncusu 4,9:1, lacivert üzerinde kehribar 7,8:1. Mavi ve turuncu, renk körlüğüne karşı güvenli bir çift.
- Güçlü problem slaytı (s. 3) ve ürün maketi (s. 20), konuşmaya net bir başlangıç ve bir karşılık veriyor.

## 5. Hızlı düzeltme listesi (etki ÷ emek, en yüksekten başlayarak)

1. [ ] S. 17: renkleri değiştir: "14 / 100" #B5481A, "62 / 100" #2B5C9E (2 renk kodu).
2. [ ] `deck.json`: 8 `tn-*` slaytı `thanks`'ten sonraya taşı. S. 4 alt satırını ve s. 2 teal notunu güncelle. PDF'yi yeniden üret.
3. [ ] S. 8 ve 10: başlıklar tek satıra sığsın (yalnız kalan kelime olmasın). S. 10'da "Projects with goals of $1k–5k" ifadesini alt satıra taşı, dipnotu kısalt.
4. [ ] S. 14: sonuç başlığı "Our model finds 74 of 100 funded projects; the rule finds 63". Sütun başlığı "Simple rule".
5. [ ] `build_pdf.py`: `.steps span` rengi #5F6B7A, 22px.
6. [ ] Outline, approach, ml-story ve conclusion slaytlarında sol boşluğu 128px yap.
7. [ ] S. 2: ana hattı kısa bir gündeme çevir. Konuşmacı notlarından yaklaşık 200 kelime kes (hedef 9 dakika).
8. [ ] S. 13: kart başına tek satır, en az 30px.
9. [ ] S. 24: gerçek bağlantı ekle ya da "available on request" yaz.
10. [ ] S. 12: kart hizasını düzelt, "no" yerine başka bir şey koy, satır kırılmasını düzelt.
11. [ ] S. 6: %36 kesikli ortalama çizgisi ekle. S. 19: 2. ve 3. maddelerin yerini değiştir.
12. [ ] PDF'den, sunucu görünümünde, kronometreyle bir kez prova yap.

*Kontrol edilemeyenler:* gerçek projektörde ya da salon ekranında nasıl göründüğü; sunucu görünümünün (presenter view) davranışı; renklerin gerçek bir renk körlüğü simülasyonunda nasıl göründüğü (sadece renk çiftine bakarak değerlendirildi); sayfaların çoğundaki ince ayrıntılar (60 dpi'da incelendi, sadece s. 12 144 dpi'da kontrol edildi).
