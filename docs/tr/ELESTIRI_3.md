# Proje Eleştirisi (3. Tur): Kickstarter Başarı Tahmini

> İngilizce sürüm: [CRITIQUE_3.md](../reviews/CRITIQUE_3.md). Teknik terimler (ROC-AUC, F1, threshold, early stopping gibi) kodda ve slaytlarda geçtiği için İngilizce bırakıldı.

- **İnceleyen:** bağımsız kıdemli veri bilimi incelemesi
- **Tarih:** 2026-10-21
- **Kapsam:** `a87f660` commit'i (çalışma alanı temizdi, inceleme sırasında commit edilmemiş değişiklik yoktu). `04_kickstarter_eda_and_modeling.ipynb` (102 hücre, çalıştırma sırası 1–45, tüm çıktılar okundu), `kickstarter_success_presentation.pdf` (24 sayfa, metin `pdftotext` ile çıkarıldı, grafik slaytları görüntü olarak incelendi), `slides/` içindeki slayt kaynakları ve konuşmacı notları, `slides/build_pdf.py`, `README.md`, `SUMMARY.md`, `OZET.md` (kısmi kontrol), `01_assignment.md`, `models/kickstarter_success_model.joblib`, `CRITIQUE_2.md`.
- **Yöntem:** Temizleme ve feature adımlarını depo dışında, yalnızca okuyan script'lerle yeniden kurdum. Kaydedilmiş modeli yükleyip aynı test bölmesini (`random_state=42`) yeniden puanladım. Ek kontroller: tam kampanya süresine göre kalibrasyon; yuvarlak süre düşüşlerinin her hedef aralığı içinde geçerli olup olmadığı; aynı oran (same share) eşiğinin test yerine eğitim verisiyle hesaplanması; isimlerde kalan iptal kelimeleri; modeldeki boosting adımı (iterasyon) sayısı. Bu dosya ve İngilizcesi dışında depoda hiçbir dosya değiştirilmedi.

## Karar

Proje iyi durumda. Ana sonuçları birebir yeniden ürettim (test ROC-AUC 0,7535, F1 0,619, Brier 0,189, eşik 0,299). 24 slayttaki kontrol ettiğim her sayı bir notebook çıktısıyla uyuşuyor. CRITIQUE_2'deki on bulgunun hepsi ele alınmış. **Critical veya Major bir sorun bulmadım.** **3 Minor bulgu** var, hepsi slaytlarda verinin söylediğinden biraz daha güçlü ifadelerle ilgili. Ayrıca **3 Nit** (küçük ayrıntı) var. Her Minor bulgu birkaç dakikada düzelir ve Cuma'dan önce düzeltmeye değer, çünkü sorular sırasında bir değerlendirici bunları sorabilir.

## CRITIQUE_2'den açık kalanlar

Bu incelemenin görev tanımında bu bulguların henüz düzeltilmediği yazıyordu. Bu bilgi eski: `a87f660` commit'i hepsini ele almış. Güncel dosyalara göre durum:

| CRITIQUE_2 bulgusu | Durum | Kanıt |
|---|---|---|
| [Major] Launch Check'teki what-if, nedensel görünen tavsiye veriyor | Çözüldü | Slayt 20 "not advice on what to change" diyor. Slayt 22 "which factors the estimate is based on (not what to change)" diyor. Notebook hücre 99–101, 29/31 gün ve Pazar what-if örneklerini gösteriyor ve neden what-if olmadığını açıklıyor. |
| [Major] Kapanış slaytı "short campaign" diyor | Çözüldü | Slayt 24: "Realistic goal, deliberate length, know your odds." |
| [Minor] %51'e "High chance" deniyor; "benzer projeler" sayısı hesaplanmamış | Çözüldü | Aralıkların adı below/about/above average oldu (hücre 73–76). Benzer projeler hesaplandı (hücre 97: 1.375 proje, %43,3) ve slayt 21'de gösteriliyor. |
| [Minor] Recall farklı etiket oranlarında karşılaştırılıyor; slaytta F1 etiketi | Çözüldü | Aynı oranda karşılaştırma (hücre 71–72, slayt 14: 53'e karşı 45, 74'e karşı 63). Slayt 17 ortalamanın altı aralığını kullanıyor (100'de 14). |
| [Minor] Test seti tekrar kullanılmış, notebook "bir kez" diyor | Çözüldü | Hücre 68 ve slayt 16'da dürüst not; karar D17 |
| [Minor] Kalibrasyon yalnızca tüm yılların ortalamasında geçerli | İfade olarak çözüldü; yeniden kalibrasyon bilerek yapılmadı | Hücre 80–82 (yıla göre en fazla yaklaşık 4 puan sapma). Slayt 14 "honest on average for past projects" diyor. |
| [Minor] Notebook ifadeleri çıktılarla uyuşmuyor | Çözüldü | Hücre 8, 31, 61, 87, 93 düzeltilmiş ve çıktılarıyla uyuşuyor |
| [Minor] SUMMARY/slayt tutarsızlıkları; düzeltme günlüğü (fix log) abartıyor | Büyük ölçüde çözüldü | Milestone adları ödevle aynı, yıl aralığı düzeltilmiş, fix log dürüst. Fix log artık eski 12 slaytlık destenin slayt numaralarını kullanıyor (aşağıda Nit). |
| [Nit] Random Forest kategorileri sıra numarası (ordinal) olarak alıyor | Kabul edildi, not eklendi | Hücre 57 ve 61 |
| [Nit] Zaman kontrolü tüm yıllarla ayarlanmış hiperparametreleri kullanıyor | Kabul edildi, not eklendi | Hücre 77, slayt 18 |

## Yeni bulgular

### [Minor] "30 ve 60 gün gibi yuvarlak sayılar en kötüsü" yalnızca küçük hedeflerde doğru

- **Nerede:** Slayt 10 başlığı ve alt notu ("Same pattern for every goal size"); slayt 19 ("Round numbers like 30 and 60 days did worst, even for the same goal"); slayt 23; slayt 10 ve 19'un konuşmacı notları; `README.md` satır 11; `SUMMARY.md` §7; notebook hücre 1 (özet)
- **Durum:** DOĞRULANDI
- **Sorun:** Slayt 10'daki grafik 1k–5k USD hedefli projeleri kullanıyor. Burada tam 30 gün (%38) ve 60 gün (%26) gerçekten en zayıf iki grup. Ama hedefi 5k USD'nin üstündeki projelerde (yaklaşık tüm projelerin yarısı) tam 30 gün ortalarda kalıyor: 1–14 gün ve 61–92 gün aynı ölçüde ya da daha kötü. Alt not ise "her hedef büyüklüğünde aynı desen" diyor; bu sıralama için doğru değil. "Yaklaşık 3–6 hafta en iyisi" ifadesi de 1k USD'ye kadar olan hedeflerde tutmuyor, orada en iyisi 1–14 gün.
- **Kanıt:** Notebook hücre 30 (hedef aralığı × süreye göre başarı oranı):

  | Hedef | 1–14 | 15–29 | 30 | 31–44 | 45–59 | 60 | 61–92 | "30"un sırası (7 grup içinde) |
  |---|---|---|---|---|---|---|---|---|
  | 1k'ya kadar | **0,593** | 0,590 | 0,428 | 0,569 | 0,463 | 0,350 | 0,485 | 6. |
  | 1k–5k | 0,457 | 0,538 | 0,380 | 0,537 | 0,389 | 0,261 | 0,404 | 6. |
  | 5k–25k | 0,280 | 0,417 | 0,293 | 0,431 | 0,294 | 0,178 | 0,279 | 4. |
  | 25k üstü | 0,073 | 0,215 | 0,139 | 0,261 | 0,151 | 0,057 | 0,077 | 4. |

  Her hedef büyüklüğünde *gerçekten* geçerli olanlar şunlar: 60 gün en zayıf grup; tam 30 gün hem 15–29 hem 31–44 günün altında; her yuvarlak süre (15, 20, …, 60) bir gün öncesinin ve sonrasının altında. Sonuncuyu dört hedef aralığının her birinde ayrı ayrı kontrol ettim; 32 durumun hepsinde geçerli. Notebook'taki hücre 31 bunu doğru anlatıyor, slaytlar ise daha güçlü bir ifade kullanıyor.
- **Neden önemli:** Bu, sunumdaki üç bulgudan biri ve sonuç slaytında da tekrarlanıyor. Teknik nota veya notebook'taki pivot tabloya bakan bir değerlendirici, "en kötüsü" ifadesinin yalnızca 5k USD'ye kadar olan hedeflerde tuttuğunu görür.
- **Nasıl düzeltilir:** Slayt 10 başlığını her hedef büyüklüğünde doğru olan bir ifadeyle değiştir, örneğin "Round numbers like 30 and 60 days trail their neighbours". Alt notu "30 days is below 15–29 and 31–44 days, and 60 days is lowest, for every goal size" yap. Aynı ifadeyi slayt 19 ve 23'te, konuşmacı notlarında, README'de ve SUMMARY/OZET §7'de kullan. İstersen en kısa aralık için "about 2–6 weeks" yaz ya da "did best" kısmını çıkar.

### [Minor] "Yaratıcı projeler ürün fikirlerini geçiyor" ifadesi, hangi kategorilerin gösterildiğine bağlı

- **Nerede:** Slayt 8 (başlık ve 15 ana kategoriden 8'inin grafiği); slayt 8'in konuşmacı notu
- **Durum:** DOĞRULANDI
- **Sorun:** Grafik, %36 ortalamanın altında kalan üç yaratıcı kategoriyi göstermiyor: Publishing (%31,4), Photography (%30,8) ve Crafts (%24,2). Crafts, "ürün fikri" örneği olarak grafikte yer alan Food (%24,9) ve Fashion'dan (%24,8) bile düşük. Ürüne yakın kategoriler olan Games (%35,8) ve Design (%35,4) ise ortalamaya yakın.
- **Kanıt:** Notebook hücre 18, `category_stats`. Slayt 9 (teknik not) "The slide shows 8 of the 15 groups" diyor, ama başlık genel bir iddia kuruyor.
- **Neden önemli:** Genel bir iddiayı desteklemek için seçilmiş bir alt küme kullanılıyor. Soru-cevapta biri "Crafts ya da Photography ne olacak?" diye sorabilir. Notebook, kategorinin kendi başına etkisi olduğunu göstermek için zaten Crafts'ı kanıt olarak kullanıyor (hücre 23). Yani slayt, projenin kendi karşı örneğini gizlemiş oluyor.
- **Nasıl düzeltilir:** Ya 15 kategorinin hepsini göster (çubuk grafiğe sığar), ya da 8'ini tutup başlığı daralt, örneğin "Performing arts and comics do best, tech and food worst". Yaratıcı/ürün karşılaştırması kalacaksa bir satır ekle: "Not all creative work: Crafts 24%, Photography 31%".

### [Minor] Sonuç slaytı "en önemlisi hedef" diyor, oysa model ve slayt 9 kategoriyi en önemli buluyor

- **Nerede:** Slayt 23 ("The goal matters most …, then the category …, then the length") ve konuşmacı notu. Karşılaştır: slayt 9 ("Permutation importance: 0.108 ± 0.002, the most important input") ve slayt 7 ("0.091 ± 0.003, second only to the category")
- **Durum:** DOĞRULANDI
- **Sorun:** Notebook'ta faktörleri sıralayan tek analiz permutation importance (hücre 91): category 0,108, log_goal 0,091, duration 0,034. Sonuç slaytı, aynı destedeki iki teknik notun tersi bir sıra veriyor. Ham farklar da net bir kazanan göstermiyor (hedef %49 → %6; kategori %62 → %20).
- **Neden önemli:** Sonuç slaytı, insanların akılda tuttuğu özet slayt. Biri sorarsa gösterilecek yedek slaytlarla çelişiyor.
- **Nasıl düzeltilir:** "The goal and the category matter most (…), then the length …" yaz ya da importance sırasını izle. Kastedilen "EDA'daki en net tek desen hedef" ise bunu açıkça söyle ("the clearest pattern is the goal"). Bu, slayt 6 ve 12'nin konuşmacı notlarıyla da uyuşur.

### [Nit] Düzeltme günlüğü eski 12 slaytlık destenin slayt numaralarını kullanıyor

- **Nerede:** `SUMMARY.md` §11 (satır 207–232) ve `OZET.md` §11 (satır 206–232); `README.md` satır 23 ve `SUMMARY.md` §8'deki dosya tabloları
- **Durum:** DOĞRULANDI
- **Sorun:** "slide 10", "slide 11", "Slide 12", "slides 7–8", "slides 6 and 9" ifadeleri eski 12 slaytlık desteye ait. Güncel 24 sayfalık PDF'de bunlar sırasıyla slayt 20, 22, 24, 14 ve 17, 10 ve 19. Dosya tablolarında CRITIQUE/ELESTIRI var, ama CRITIQUE_2/ELESTIRI_2 (ve bu tur) yok.
- **Nasıl düzeltilir:** Fix log girişine "(slide numbers of the earlier 12-slide version)" ekle ya da numaraları güncelle. Sonraki inceleme dosyalarını iki dosya tablosuna da ekle.

### [Nit] İsim temizliği serbest metindeki iptalleri ve "(Cancelled)" yazımını kaçırıyor

- **Nerede:** Notebook hücre 46–47 ("we remove every such tag"); slayt 4
- **Durum:** DOĞRULANDI; metriklere etkisinin önemsiz olduğu TAHMİN EDİLİYOR
- **Sorun:** Regex yalnızca tek "l" ile yazılmış "(canceled)" ifadesini yakalıyor. Ham verideki dört isimde "(Cancelled)" var ve bunlar silinmiyor. Bazı proje sahipleri de iptalden sonra projenin adını değiştirmiş ("Canceled", "Project cancelled", "Cancelled.", "… CANCELLED!!!"). Temizlikten sonra 126 isimde hâlâ tam kelime olarak cancel/canceled/cancelled/suspended geçiyor; bunların 117'si fonlanmamış.
- **Neden önemli:** Model yalnızca isim uzunluğunu ve kelime sayısını görüyor. Bunların önemi çok küçük (0,008 ve 0,002), bu yüzden skorlar pek değişmez. Ama notebook her etiketin silindiğini söylüyor ve bir değerlendirici bunu test edebilir.
- **Nasıl düzeltilir:** `r"\s*\((?:cancell?ed|suspended)\)"` kullan ve bir cümle ekle: "yaklaşık 120 isim, proje sahibi tarafından bir iptal mesajıyla değiştirilmiş; bu bilgi kampanya başladıktan sonra ortaya çıkıyor, ama isim feature'larının ağırlığı çok düşük". Bu satırları silmek de olur.

### [Nit] Early stopping açık, yani modelde 400 değil 231 ağaç var

- **Nerede:** Slayt 15 ("max_iter=400"); notebook hücre 63–66
- **Durum:** DOĞRULANDI
- **Sorun:** `HistGradientBoostingClassifier`, 10.000'den fazla satırda early stopping'i varsayılan olarak açar (`early_stopping="auto"`). Kaydedilmiş model `n_iter_ = 231` adımda durmuş ve her eğitimde bu iş için eğitim verisinin %10'unu ayırmış. Yani aramadaki `max_iter` değerleri yalnızca üst sınır.
- **Nasıl düzeltilir:** Tuning takeaway'ine ve slayt 15'e bir satır ekle: "max_iter=400 is an upper limit; early stopping stopped at 231 iterations (10% of the training data used internally for this)".

## Kontrol edildi, sorun yok

- **Modelin yeniden üretilmesi:** Kaydedilmiş model aynı bölmede ROC-AUC 0,7535, F1 0,6193, Brier 0,1889 veriyor. Eşik 0,2989, hiperparametreler belirtildiği gibi (scikit-learn 1.9.0).
- **Aynı oran eşiği:** Test olasılıklarıyla hesaplanıyor (hücre 71). Eğitim verisiyle hesaplanınca eşik 0,3489 çıkıyor ve aynı sonucu veriyor (precision %53,0, recall %73,6). Yani slayt 14 etkilenmiyor.
- **What-if sayıları gerçek, modelin hatası değil:** Model tam süreye göre de kalibre (test setinde örneğin 29 gün: tahmin 0,446, gerçek 0,447; 30 gün: 0,321'e karşı 0,319; 31 gün: 0,488'e karşı 0,488). 7,5k–15k USD hedefli ve 29 günlük geçmiş tabletop oyunlarının %68,5'i fonlanmış (n = 124). Bu, destedeki yorumu destekliyor: model geçmişteki proje sahibi davranışını doğru yansıtıyor, ama bu davranış çekilebilecek bir kol (lever) değil.
- **Slayt sayıları:** Slayt 2–24 notebook çıktılarıyla uyuşuyor (hedef ve kategori oranları, 1k–5k süre satırı, baseline 45/63, aynı oran 53/74, aralıklar 14/37/62, kalibrasyon kutuları, yıla göre kalibrasyon, zaman kontrolü, Launch Check rakamları 0,511/0,717/0,621/0,383 ve %43'lük grup).
- **Grafikler:** Çubuklar sıfırdan başlıyor, etiketler değerlerle uyuşuyor, renk kodları alt notlarda açıklanmış.
- **Konuşma süresi:** 16 ana slaytın konuşmacı notları yaklaşık 1.200 kelime, bu da yaklaşık 8–9 dakika eder. `01_assignment.md`'deki 10 dakikalık süreye uyuyor.
- **Leakage, bölme, CV, baseline, kalibrasyon ve zaman kontrolü:** CRITIQUE_2'dekilerin dışında yeni bir sorun yok.

## Önerilen düzeltme sırası

1. Yuvarlak süre ifadesi: slayt 10 başlığı ve alt notu, slayt 19 ve 23, konuşmacı notları, README ve SUMMARY/OZET (Minor). *Yaklaşık 15 dakika.*
2. Slayt 8: 15 kategorinin hepsini göster ya da başlığı daralt (Minor). *Yaklaşık 10 dakika.*
3. Slayt 23: "goal and category matter most" (Minor). *Yaklaşık 2 dakika.*
4. PDF'i `python3 slides/build_pdf.py` ile yeniden oluştur.
5. Nit'ler: fix log'daki slayt numaraları ve dosya tabloları, "(Cancelled)" regex'i ve bir cümle, early stopping satırı. *Yaklaşık 20 dakika; regex değişirse notebook'un yeniden çalıştırılması gerekir. Cuma'dan önce isteğe bağlı.*
