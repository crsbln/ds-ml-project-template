# Proje Eleştirisi: Kickstarter Başarı Tahmini

> Bu dosya, [CRITIQUE.md](../reviews/CRITIQUE.md) dosyasının Türkçe çevirisidir. Kod, sütun adları ve teknik terimler orijinalindeki gibi bırakıldı.

- **İnceleyen:** bağımsız kıdemli veri bilimi incelemesi
- **Tarih:** 2026-10-19
- **Kapsam (incelenen dosyalar):** `01_assignment.md`, `04_kickstarter_eda_and_modeling.ipynb` (76 hücrenin tamamı, kod ve kayıtlı çıktılar), `kickstarter_success_presentation.pdf` (12 slayt, metin `pdftotext` ile çıkarıldı), `SUMMARY.md`, `README.md`, `pyproject.toml`, `.gitignore`, Git'in takip ettiği dosya listesi (`git ls-files`) ve `models/kickstarter_success_model.joblib`. `03_eda-and-modeling.ipynb` (kursun örnek notebook'u) ve `OZET.md` (özetin Türkçe kopyası) incelenmedi.
- **Yöntem:** Notebook'taki temizlik ve özellik adımlarını, repo dışında salt okunur scriptlerle yeniden yazdım. Bunları projenin `.venv` ortamıyla (scikit-learn 1.9.0, pandas 3.0.3) `data/ks-projects-201801.csv` üzerinde çalıştırdım. Kaydedilmiş modeli yükleyip tam olarak aynı test bölmesini (`random_state=42`) yeniden puanladım. Ek kontrollerim:
  - proje adlarında kalan veri sızıntısı,
  - hedef tanımının toplanan paraya göre doğruluğu,
  - zamana göre ayrılmış bir test (2016 öncesi başlayan projelerle eğitip 2016 ve sonrasıyla test etmek),
  - cross validation skorlarının katmanlar arası değişkenliği,
  - kaydedilmiş modelin kalibrasyon tablosu,
  - karşılaştırma için ağırlıklandırmasız bir model,
  - kampanya süresinin hedef tutarına göre katmanlara ayrılmış ve düzeltilmiş analizi.

  Bu dosya dışında repoda hiçbir dosya oluşturulmadı veya değiştirilmedi. Notebook yeniden çalıştırılmadı.

## Yönetici özeti

Bu, iyi yapılandırılmış, dürüst ve büyük ölçüde doğru bir proje. Projenin güçlü yanları:
- Hedef değişken mantıklı.
- Bariz sızıntı sütunları çıkarılmış.
- Proje adlarındaki gizli "(Canceled)" sızıntısı bulunup düzeltilmiş. Düzeltmenin çalıştığını doğruladım.
- Pipeline, ön işlemeyi cross validation'ın içinde tutuyor.
- Test seti sadece bir kez kullanılmış.

Ana test sonuçlarını birebir yeniden ürettim: F1 0,624, ROC-AUC 0,762 ve "fonlanması zor" uyarılarının %83,6'sı doğru. Modelin sıralama kalitesi zamana göre ayrılmış testte de korunuyor (AUC 0,764).

Sorunlar çoğunlukla skorların ne için kullanıldığında ve nasıl anlatıldığında:
1. `class_weight="balanced"` doğruluğa hiçbir katkı yapmıyor, ama her skoru yaklaşık 11 yüzde puan şişiriyor. "Launch Check" slaytı "69 / 100" gösteriyor. Oysa benzer projelerin yalnızca yaklaşık %51–56'sı fonlanıyor.
2. "Kampanyayı kısa tut" önerisi hedef tutarıyla karışıyor (confounded) ve verinin desteklediği şey bu değil. 31–44 günlük kampanyalar en az kısa kampanyalar kadar başarılı. Asıl sinyal şu: "30 günlük varsayılandan ve 60 günden kaçın."
3. F1'e göre ayarlanmış tek bir eşik, projelerin %56'sına "umut verici" diyor. Oysa sadece %36'sı fonlanıyor. Başarı şansını öğrenmek isteyen bir proje sahibi için bu kötü bir çalışma noktası.

Model sonuçları, mütevazı güce sahip adil bir sıralama olarak okunmalı. Skorlar ve kampanya süresiyle ilgili slayt iddiaları, paydaşlara gösterilmeden önce düzeltilmeli.

## Bulgular

Hiçbir bulgu Kritik olarak derecelendirilmedi. Raporlanan test metriklerini geçersiz kılan bir şey bulmadım. 4 Major, 8 Minor ve 5 Nit bulgu var.

*(Çevirmen notu: Aşağıdaki listede aslında 7 Minor bulgu bulunuyor. Toplam bulgu sayısı 16.)*

### [Major] "Başarı skoru" sınıf ağırlıklandırması yüzünden şişirilmiş; Launch Check slaytı şansı olduğundan yüksek gösteriyor

- **Nerede:** Notebook, "Save the Model and Predict a New Project" bölümü (hücre 74–75); slayt 10 "Launch Check"; slayt 11 "Future work"; SUMMARY §7 "Limits"
- **Durum:** DOĞRULANDI
- **Sorun:** Model `class_weight="balanced"` kullanıyor ve bu, tahmin edilen skorları yukarı itiyor. Slayt, bir masa oyununa "69 / 100 · Promising" skoru verildiğini gösteriyor. Notebook skorların kalibre edilmediğini doğru şekilde belirtiyor, ama paydaş slaytı bu sayıyı hiçbir uyarı olmadan gösteriyor. İzleyicilerin çoğu "69 / 100" ifadesini "%69 şans" olarak okuyacaktır.
- **Neden önemli:** Bir proje sahibi, şansının verinin gösterdiğinden çok daha iyi olduğunu düşünür. Üstelik sınıf ağırlıklandırması hiçbir kazanç sağlamıyor: Ağırlıklandırmasız bir model aynı sıralama kalitesine sahip ve zaten iyi kalibre edilmiş durumda.
- **Kanıt:** Kaydedilmiş modeli 74.459 test projesi üzerinde yeniden puanladım:
  - Ortalama tahmin edilen skor 0,471, ama gerçek başarı oranı 0,360.
  - 0,64–0,74 arasında skor alan projelerin gerçekte %55,8'i fonlanmış (n = 10.437). 0,6–0,7 aralığında gerçek oran 0,511.
  - Eğitim verisinde, hedefi 7.500–15.000 $ olan gerçek masa oyunlarının %50,6'sı fonlanmış (n = 3.420).
  - Kalibrasyon tablosu (ortalama skor → gerçek oran): 0,25 → 0,16, 0,45 → 0,31, 0,65 → 0,51, 0,75 → 0,63.
  - Brier skoru: Kaydedilmiş modelde 0,200. Aynı hiperparametrelerle ama `class_weight` olmadan: Brier 0,186, aynı AUC (0,761) ve aynı en iyi F1 (0,625, eşik ≈ 0,31). Kalibrasyon aralıkları da tutarlı: 0,25 → 0,25, 0,45 → 0,46, 0,65 → 0,65.
- **Nasıl düzeltilir:**
  1. `class_weight="balanced"` ayarını kaldır. Eşik ayarı varken bu ayar gereksiz, çünkü ikisi de aynı karar sınırını kaydırıyor.
  2. Evet/hayır etiketi için `TunedThresholdClassifierCV` kullanmaya devam et. Gösterilecek olasılık olarak ağırlıklandırmasız modelin `predict_proba` çıktısını kullan. Ağırlıklandırmayı tutacaksan modeli `CalibratedClassifierCV(method="isotonic", cv=5)` içine sar.
  3. Notebook'a bir kalibrasyon grafiği ve Brier skoru ekle: `CalibrationDisplay.from_predictions(y_test, proba, n_bins=10)`.
  4. Slayt 10'da kalibre edilmiş bir olasılık göster ("benzer projelerin yaklaşık %51'i fonlandı") ya da sayıyı tamamen kaldır. Slayt 11'deki kalibrasyon maddesini "Future work" listesinden çıkarıp "yapıldı" olarak işaretle.

### [Major] Tek bir F1 eşiği, hedeflenen paydaş için kötü bir çalışma noktası

- **Nerede:** Notebook, "Business Goal and Metric", "Tune the Decision Threshold" ve "Error Analysis" bölümleri; slayt 7–8; SUMMARY D6/D13
- **Durum:** Sayılar DOĞRULANDI; çerçeveleme ile ilgili nokta akıl yürütmeye dayanıyor
- **Sorun:** Paydaş, "Şansım ne, ve neyi değiştirebilirim?" diye soran bir proje sahibi. Bu soru, iyi sıralanmış ve kalibre edilmiş bir olasılık gerektiriyor. F1'e göre ayarlanmış bir evet/hayır etiketi bu soruyu cevaplamıyor. F1, true negative'leri hesaba katmaz ve azınlık sınıfının fazla tahmin edilmesini ödüllendirir. Bu yüzden ayarlanmış eşik projelerin çoğuna "umut verici" diyor.
- **Neden önemli:** "Umut verici" etiketi çok az bilgi taşıyor.
  - Test setinde projelerin %56,5'i bu etiketi alıyor. Temel oran ise %36.
  - Hedefi 1.000 $'a kadar olan projelerin %81,7'si "umut verici" etiketi alıyor, ama bunların %49,7'si fonlanıyor.
  - Notebook'un kendisi de modelin yüksek başarılı kategorilerdeki projeleri "neredeyse hiç ayırt edemediğini" söylüyor.
  - %83'lük "risk uyarısı" rakamı da bağlam gerektiriyor: Her projeye "fonlanmaz" demek bile zamanın %64'ünde doğru çıkar.
- **Kanıt:** Kaydedilmiş modelin test setindeki sonuçları: TN 27.111, FP 20.557, FN 5.303, TP 21.488. Negatif öngörü değeri ("fonlanması zor" dediğinde ne sıklıkla haklı olduğu) %83,6. Temel oran ise %64,0.
- **Nasıl düzeltilir:**
  - Ana çıktıyı kalibre edilmiş olasılık yap. Ana metrikler ROC-AUC, Brier skoru ya da log loss olsun. F1'i etiket için ikincil bir metrik olarak tut.
  - Bir etiket gerekiyorsa eşiği, her hata türünün proje sahibine maliyetine göre belirle. Alternatif olarak, kalibre edilmiş olasılıklardan türetilen üç aralık kullan ("düşük / orta / yüksek şans").
  - %83'ü kullanırken yanına temel oranı da yaz: "%83, her seferinde başarısızlık tahmin edilseydi %64".

### [Major] "Kampanyayı kısa tut" önerisi hedef tutarıyla karışıyor ve veri tarafından desteklenmiyor

- **Nerede:** Notebook, "Campaign Duration" ve "Feature Importance" bölümlerinin yorumları; slayt 6 "Longer campaigns don't help"; slayt 9, 2. öneri; SUMMARY §7 öneriler
- **Durum:** DOĞRULANDI
- **Sorun:** Kısa kampanyalar çoğunlukla küçük hedefli projelere ait. Ortanca hedef 1–14 gün için 1.200 $, 15–29 gün için 3.500 $, 60 gün için 9.750 $. Bu yüzden ham çubuk grafik, süre etkisini hedef etkisiyle karıştırıyor. Notebook bir korelasyon uyarısı ekliyor, ama slayt 9 süreyi hâlâ "kontrol edebileceğin bir karar" olarak sunuyor ve "Kampanyayı kısa tut" diyor. Özellik önemi bölümü de "kontrol edebildikleri en etkili üç karar…" cümlesiyle bitiyor. Bu, permutation importance'tan nedensellik çıkaran bir ifade.
- **Neden önemli:** Öneri kısmen yanlış. Her hedef aralığında, 31–44 günlük kampanyalar en az 30 günden kısa kampanyalar kadar başarılı. Tutarlı örüntü şu: Tam olarak 30 günlük varsayılan süre ve 60 gün kötü sonuç veriyor. Hedefi 30.000 $ olan ve kampanyasını 20 güne kısaltan bir proje sahibi, kanıtlara ters bir şey yapmış olur.
- **Kanıt:** Hedef aralığına (satırlar) ve süreye (sütunlar) göre başarı oranı:

  | Hedef | <30 gün | 30 gün | 31–44 gün | 45–59 gün |
  |---|---|---|---|---|
  | ≤1k | 0,591 | 0,428 | 0,569 | 0,463 |
  | 1k–5k | 0,524 | 0,380 | 0,537 | 0,389 |
  | 5k–25k | 0,402 | 0,293 | 0,431 | 0,294 |
  | >25k | 0,201 | 0,139 | 0,261 | 0,151 |

  Hedefi 25.000–50.000 $ olan projelerde tek tek süreler: 20 gün %9,6, 30 gün %18,1, 45 gün %20,7.

  Log hedef, ana kategori ve başlangıç yılına göre düzeltilmiş bir logistic regression, 30 günü referans alarak şu katsayıları veriyor: <30 gün +0,51, 31–44 gün +0,58, 45–59 gün −0,04, 60 gün −0,68.
- **Nasıl düzeltilir:**
  - Öneriyi şöyle bir ifadeyle değiştir: "30 günlük varsayılanı olduğu gibi kabul etme ve çok uzun (60 günlük) kampanyalardan kaçın. Varsayılandan farklı, yaklaşık altı haftaya kadar bir süre seçen projeler en iyi sonucu aldı. Bu bir korelasyon, muhtemelen daha dikkatli bir planlamanın işareti."
  - Yukarıdaki katmanlı tabloyu ya da bir partial dependence grafiğini (`PartialDependenceDisplay`) notebook'a ekle.
  - "Kontrol edebildikleri kararlar" ifadesini "başarıyla en çok ilişkili faktörler" olarak değiştir.
  - Hedefi düşürmenin başarı şansını artırdığını ama toplanan parayı da azalttığını açıkça belirt.

### [Major] Sadece rastgele bölme kullanılmış: "Yeni projelere güvenilir şekilde genelleşiyor" iddiası test edilmemiş ve `launch_year` dışa aktarılıyor (extrapolation)

- **Nerede:** Notebook, "Train-Test Split" bölümü, "Final Model and Test Evaluation" yorumu, "Save the Model" örneği (`launch_year = 2017`); slayt 7; SUMMARY D8
- **Durum:** DOĞRULANDI
- **Sorun:** Notebook başarı oranlarının zamanla çok değiştiğini gösteriyor (2011'de %46, 2015'te %28, 2017'de %37), ama veriyi rastgele bölüyor. Ürün gelecekteki kampanyaları puanlayacağı için dürüst test, zamana göre ayrılmış bir test setidir. Ayrıca `launch_year` bir özellik olarak kullanılıyor. Ağaçlar 2017'den sonraki her yılı tam olarak 2017 gibi değerlendiriyor, yani model güncel temel oranı bilemiyor.
- **Neden önemli:** Sıralama zaman içinde korunuyor, ama slaytlarda verilen çalışma noktası korunmuyor. Recall %80'den yaklaşık %70'e düşüyor. Dolayısıyla slayttaki "başarılı projelerin %80'ini buluyor" ifadesi yeni projeler için geçerli olmaz.
- **Kanıt:** Aynı hiperparametreler, eşik 0,439, 2016 öncesi başlayan projelerle eğitilip 2016–2018 projeleriyle test edildi (n = 106.282): AUC 0,764, F1 0,611, precision 0,546, recall 0,695. Aynı büyüklükte rastgele bir bölme ise şunu veriyor: AUC 0,761, F1 0,627, precision 0,513, recall 0,805. Kaydedilmiş modelle örnek proje, hem `launch_year = 2017` hem de `launch_year = 2026` için 0,694 skoru alıyor.
- **Nasıl düzeltilir:**
  - Zamana göre ayrılmış bir test ekle (örneğin ≤2015 ile eğit, 2016 ile doğrula, 2017 ile test et) ve sonucunu rastgele bölmenin yanında raporla.
  - Eşiği ve ideal olarak kalibrasyonu en yeni dönemde ayarla.
  - Ya `launch_year` özelliğini kaldır (benim testimde AUC sadece 0,764'ten 0,758'e düştü), ya da modelin 2017 koşullarını varsaydığını açıkça belirt.
  - "Yeni projelere güvenilir şekilde genelleşiyor" ifadesini yumuşat: "Rastgele bölmeler arasında tutarlı. Sonraki yıllarda sıralama korunuyor ama recall yaklaşık %70'e düşüyor."

### [Minor] İkinci bir ad sızıntısı, "(Suspended)", temizlenmemiş

- **Nerede:** Notebook, "Clean Project Names" bölümü; SUMMARY §6
- **Durum:** DOĞRULANDI
- **Sorun:** Kickstarter, askıya alınan projelerin adına da " (Suspended)" ekliyor. 1.046 projenin adında bu ek var ve hepsi askıya alınmış projeler (etiket 0). Bu ek hâlâ `name_length` (+12 karakter) ve `name_words` (+1) özelliklerine yansıyor.
- **Neden önemli:** Küçük bir sızıntı (satırların %0,3'ü), ama yazarın "(Canceled)" için haklı olarak kaldırdığıyla aynı türden. "(Canceled)" temizliğinin geride bir iz bırakıp bırakmadığını da kontrol ettim, bırakmıyor. Görünüşe göre Kickstarter bu eki sadece sığdığında ekliyor, bu yüzden ekli adlar kısa, eksiz iptal edilmiş adlar uzun. Temizlikten sonra ortalama ad uzunluğu iptal edilen projelerde 33,6, başarısız projelerde 32,8. Yani o düzeltme sağlam.
- **Kanıt:** "(Canceled)" içeren 23.088 adın 23.085'i iptal edilmiş, 3'ü askıya alınmış projelere ait. "(Suspended)" içeren 1.046 adın tamamı askıya alınmış projelere ait. Başka hiçbir ek tek bir duruma özgü değil: "(Relaunch)", "(Short Film)" ve benzeri ekler her sonuçta görülüyor.
- **Nasıl düzeltilir:** `kickstarter["name"].str.replace(r"\s*\((Canceled|Suspended)\)\s*$", "", regex=True).str.strip()` kullan ve açıklama metnini her iki eki de anacak şekilde güncelle.

### [Minor] Cross validation skorları test skorlarıyla karıştırılmış; ayar kazançları gürültü sınırları içinde

- **Nerede:** Notebook, "Compare Models with Cross Validation" (hücre 52'deki tablo), "Hyperparameter Tuning" yorumu, "Tune the Decision Threshold" tablosu
- **Durum:** DOĞRULANDI
- **Sorun:**
  - Karşılaştırma tablosu, baseline'ın **test seti** skorunu **örneklem üzerindeki CV** skorlarının yanına bir satır olarak ekliyor. Hücre 59'daki adım tablosu da bu skoru "CV F1" sütunu altında listeliyor.
  - Katmanlar arası standart sapmalar raporlanmamış.
  - Ayar kazancı (0,611 → 0,613) bir katman standart sapmasından küçük, ama yorum bunu açıklamaya çalışıyor ("modelin gürültü yerine genel kalıpları öğrenmesine yardımcı oluyor").
  - Eşik, hiperparametreleri seçen katmanlarla ayarlandığı için 0,620'lik CV F1 biraz iyimser. Bağımsız doğrulama seti 0,616 veriyor.
- **Neden önemli:** Okuyucular hangi farkların gerçek olduğunu ayırt edemiyor. Ayar adımı olduğundan daha faydalı görünüyor.
- **Kanıt:** Aynı 50 bin örneklem üzerinde 5 katmanlı CV'yi yeniden çalıştırdım: varsayılan gradient boosting F1 0,611 ± 0,004 (AUC 0,750 ± 0,004), ayarlanmış F1 0,613 ± 0,006 (AUC 0,752 ± 0,005), logistic regression F1 0,591 ± 0,004.
- **Nasıl düzeltilir:** Katmanlar arası ortalama ± standart sapmayı raporla. Baseline kuralını aynı CV ile puanla (tek satırlık bir fonksiyon), ya da "test" etiketli ayrı bir tabloya koy. Sütunun adını "F1 (kaynak)" olarak değiştir. "Ayar anlamlı bir fark yaratmadı" de ve seçilen ayarlarla ilgili yorumu kaldır.

### [Minor] Hata analizi ve özellik önemi, kaydedilen modelden farklı bir modeli anlatıyor

- **Nerede:** Notebook, "Error Analysis" ve "Feature Importance" bölümleri
- **Durum:** Kurulum DOĞRULANDI; etkinin küçük olduğu TAHMİN EDİLİYOR (SUSPECTED)
- **Sorun:** Hata analizi ve permutation importance, 50 bin örneklemle eğitilmiş ve eşiği 0,431 olan `tuned_model` modelini kullanıyor. Kaydedilen model ise 298 bin projeyle eğitilmiş ve eşiği 0,439. Ayrıca:
  - Permutation importance, sabit bir eşikte F1'deki değişim olarak ölçülüyor. Bu gürültülü bir ölçüm.
  - Birbiriyle ilişkili özellikler arasında önemi bölüştürüyor (`category`/`main_category`, `name_length`/`name_words`).
  - Etkinin yönü hakkında hiçbir şey söylemiyor.
- **Neden önemli:** Önem sıralaması büyük olasılıkla doğru, ama olduğundan daha kesin raporlanıyor. Okuyucular önemi "neyi değiştirmeliyim" ile de karıştırabilir (kampanya süresiyle ilgili Major bulguya bak).
- **Nasıl düzeltilir:**
  - Final yapılandırmanın eğitim seti üzerindeki çapraz doğrulanmış out-of-fold tahminlerini (`cross_val_predict`) kullan. Ya da örneklem modelini tut, ama bunun bir vekil (stand-in) olduğunu açıkça belirt.
  - Permutation importance'ı `scoring="roc_auc"` ya da `neg_log_loss` ile hesapla ve `importances_std` değerini raporla.
  - İlişkili özellikleri grupla (ya da `category`'nin zaten içerdiği `main_category`'yi çıkar) ve etkinin yönünü partial dependence grafikleriyle göster.

### [Minor] Açıklamalardaki bazı sayıların arkasında kod yok; küçük tutarsızlıklar

- **Nerede:** Notebook, hücre 17, 20 ve 33 (yorumlar), hücre 59/72, özet hücresi 1; SUMMARY §3/§6
- **Durum:** DOĞRULANDI
- **Sorun:**
  - Kategoriye göre ortanca hedefler ("Technology 20k, Dance/Theater yaklaşık 3,3k, Crafts yaklaşık 2,3k"), kategori büyüklükleri ("Dance yaklaşık 3.700, Technology yaklaşık 32.000") ve aylık oranlar ("Temmuz %32, Mart %38") açıklamalarda geçiyor, ama hiçbir hücre bunları yazdırmıyor. Yeniden hesapladım, doğrular: 20.000 / 3.300 / 3.292 / 2.328 $; 3.749 ve 32.189 proje; %32,4 ve %38,3.
  - Hücre 59, final modelin eşiğini 0,43 olarak belirtiyor, ama kaydedilen model 0,439 kullanıyor.
  - Veri "2009–2017" olarak tanımlanıyor, ama 2018'deki 2 proje modelleme verisinde kalıyor.
  - SUMMARY "üç veri hatası" diyor, ama §6'daki tablo dört satır listeliyor.
  - SUMMARY'deki milestone adları (örneğin "Milestone 1 – Baseline", "Milestone 2 – Slide draft") ödevdeki milestone'lardan farklı (M1 EDA, M2 baseline, M3 hata analizi).
- **Neden önemli:** Tekrar üretilebilir bir notebook'ta metindeki her sayı bir çıktıdan gelmeli. Tutarsızlıklar okuyucunun güvenini azaltır.
- **Nasıl düzeltilir:** Küçük bir tablo hücresi ekle, örneğin `kickstarter.groupby("main_category").agg(rate=("success", "mean"), n=("success", "size"), median_goal=("usd_goal_real", "median"))`, ve aylık oranları yazdır. Eşik ifadesini, yıl aralığını ve milestone adlarını tutarlı hale getir.

*(Çevirmen notu: Ödevdeki milestone'lar M0 Data Ingestion, M1 EDA, M2 Baseline, M3 Error analysis, M4 Final'dir. Bu madde doğrudur: SUMMARY'deki adlar ödevle uyumlu değildi.)*

### [Minor] Slayt 7'deki "+19% better" ve "83% reliable" ifadeleri yanlış anlaşılabilir

- **Nerede:** Slayt 7 "Our model beats a simple rule of thumb"; slayt 8 "Limits"; SUMMARY §7
- **Durum:** DOĞRULANDI
- **Sorun:** "+19% better", F1'deki göreli bir iyileşme (0,624 / 0,524). Teknik olmayan bir kitle bunu "%19 daha fazla proje fonlanıyor" ya da "19 puan daha doğru" olarak okur. "83% reliable" ifadesinin yanında da temel oran yok (çalışma noktasıyla ilgili Major bulguya bak).
- **Neden önemli:** İnsanların sunumdan aklında kalacak iki sayı bunlar.
- **Nasıl düzeltilir:** Bunların yerine somut sayılar kullan, örneğin: "Umut verici dediği her 100 projeden 51'i fonlanıyor (basit kural: 45, rastgele seçim: 36)" ve "Uyardığında 100 seferin 84'ünde haklı çıkıyor (her seferinde 'başarısız' tahmin etmek: 64)."

### [Minor] Hedef değişkendeki ve hedef tutarındaki uç durumlar tartışılmamış

- **Nerede:** Notebook, "Target Decision" ve "Success Rate by Funding Goal" bölümleri; SUMMARY D4
- **Durum:** DOĞRULANDI
- **Sorun:**
  - 698 iptal edilmiş proje, hedefleri kadar ya da daha fazla bağış toplamış. Bunlar hedefe ulaşmalarına rağmen iptal edilmiş (genelde yeniden başlatmak için) ve "fonlanmadı" olarak etiketlenmiş.
  - 1.143 projenin hedefi 10 $ ya da daha az (%62,6'sı fonlanmış), 38 projenin hedefi 1 $'ın altında. Bunlar test ya da şaka projeleri ve "<1k: %49" başlığını olduğundan iyi gösteriyor.
  - Aynı fikrin yeniden başlatılmış halleri hem eğitim hem test setinde yer alabilir. Bunu kontrol ettim: Test setindeki adların sadece %2,2'si eğitim setinde de geçiyor ve adlar metin özelliği olarak kullanılmıyor. Yani etkisi önemsiz.
- **Neden önemli:** Etkisi sınırlı, ama "gerçekçi bir hedef belirle" mesajı kısmen anlamsız derecede küçük hedeflere dayanıyor.
- **Nasıl düzeltilir:** Bu durumları hedef değişken bölümünde belirt. Yaklaşık 100 $'ın altındaki hedefleri çıkarmayı düşün, ya da bunlar olmadan da başlık sonucunun değişmediğini kontrol et. Yeniden başlatılan projeler hakkında bir cümle ekle.

### [Minor] Repo ve README bu projeyi anlatmıyor; bağımlılıklar eksik

- **Nerede:** `README.md`, `pyproject.toml`, `models/`
- **Durum:** DOĞRULANDI
- **Sorun:**
  - `README.md` hâlâ kurs şablonu: Kahve örneğini anlatıyor ve okuyuculara `03_eda-and-modeling.ipynb` dosyasını açmalarını söylüyor.
  - `pyproject.toml` şablonun adını koruyor, kullanılmayan `plotly` paketini listeliyor ve doğrudan import edilen paketleri (`pandas`, `numpy`, `matplotlib`, `joblib`) ya da SUMMARY'de araç olarak geçen `ruff` paketini tanımlamıyor.
  - Commit edilmiş `.joblib` modeli (2,1 MB) sadece aynı scikit-learn sürümüyle (1.9.0) güvenilir şekilde yüklenebiliyor ve bu sürüm hiçbir yerde belirtilmiyor.
  - Notebook `data/...` dosyasını göreli bir yolla okuyor, yani sadece çalışma dizini repo kökü olduğunda çalışıyor.
- **Neden önemli:** GitHub'daki bir ziyaretçi, kahve hakkında bir README ile karşılaşıyor. Tekrar üretilebilirlik, sadece dolaylı olarak kurulan bağımlılıklara bağlı.
- **Nasıl düzeltilir:**
  - README'yi yeniden yaz: projenin sorusu, verinin nasıl indirileceği, nasıl çalıştırılacağı, sonuçlar ve notebook, slaytlar ile SUMMARY'ye bağlantılar.
  - `uv add pandas numpy matplotlib joblib`, `uv remove plotly` ve `uv add --dev ruff` komutlarını çalıştır ve projenin adını değiştir.
  - Kaydedilmiş modelin yanına scikit-learn sürümünü not et.
  - İsteğe bağlı: Daha sağlam yollar kullan, örneğin `DATA_DIR = Path("data")` sabiti ve dosya yoksa açık bir hata mesajı.

### [Nit] PEP 8 satır uzunluğu; ruff iddiası kontrol edilenden fazlasını söylüyor

- **Nerede:** Notebook kod hücreleri; SUMMARY §3 ve §4 ("style checked with ruff (PEP 8)")
- **Durum:** DOĞRULANDI
- **Sorun:** 46 kod satırı 79 karakterden, 18'i 88 karakterden uzun (en uzunu 98). Ruff'ın varsayılan kural seti E501'i (satır uzunluğu) içermiyor, yani varsayılan bir `ruff check` bunu kontrol etmiyor.
- **Nasıl düzeltilir:** `ruff check --select E,W,F,I --line-length 88 04_kickstarter_eda_and_modeling.ipynb` ve `ruff format` komutlarını çalıştır ve uzun `sns.barplot(...)` çağrılarını satırlara böl.

*(Çevirmen notu: Proje sırasında ruff, E501 dahil olmak üzere `--select E,F,W,I --line-length 100` ayarıyla çalıştırılmıştı. Yani satır uzunluğu kontrol edildi, ama sınır PEP 8'in önerdiği 79 değil 100 karakterdi. Bulgunun özü, yani sınırın PEP 8'den gevşek olması, geçerli.)*

### [Nit] Hedef aralığı etiketleri sınır değerinde kayık

- **Nerede:** Notebook, "Success Rate by Funding Goal" bölümü; slayt 4
- **Durum:** DOĞRULANDI
- **Sorun:** `pd.cut` sağdan kapalı aralıklar kullanıyor. Bu yüzden "<1k" aslında "≤1k" anlamına geliyor ve hedefi tam olarak 1.000 $ olan 12.959 projeyi de içeriyor. Sayılar neredeyse hiç değişmiyor (kesin <1k için %50,5, mevcut halde %49,4).
- **Nasıl düzeltilir:** `right=False` kullan, ya da etiketleri "≤1k" gibi yaz.

### [Nit] Gradient boosting, yoğun one-hot sütunlarla ve ağaçlar için gereksiz ölçeklemeyle kullanılmış

- **Nerede:** Notebook, "Preprocessing Pipeline" ve "Compare Models with Cross Validation" bölümleri
- **Durum:** Kurulum DOĞRULANDI
- **Sorun:** 204 yoğun one-hot sütun `HistGradientBoostingClassifier`'a veriliyor. Sayısal sütunlar da ölçekleniyor, oysa ağaçların buna ihtiyacı yok. Modelin yerleşik kategorik desteği daha basit, daha hızlı ve kategorileri daha verimli böler.
- **Nasıl düzeltilir:** Ağaç modelleri için `OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)` ile `HistGradientBoostingClassifier(categorical_features="from_dtype")` (ya da bir boolean maske) kullan ve sayısal sütunları olduğu gibi geçir. Ölçeklemeyi logistic regression için tut.

### [Nit] 'N,0"' satırları sadece hatalı bir ülke kodu değil, bozuk kayıtlar

- **Nerede:** Notebook, "Success Rate by Country" bölümü; SUMMARY D12
- **Durum:** DOĞRULANDI
- **Sorun:** `usd pledged` değeri eksik olan 3.797 satırın tamamı, tam olarak 'N,0"' satırları. Bunların 3.562'si "undefined". Filtrelemeden sonra kalan 234 satırın %50'si fonlanmış (genel oran %36). Bu, verinin farklı bir yoldan toplandığını düşündürüyor. Ülkeyi para biriminden tahmin etmek yine de geçerli: Bu veride EUR dışındaki her para birimi tam olarak bir ülkeye karşılık geliyor.
- **Nasıl düzeltilir:** Bu örüntüyü açıklayan bir cümle ekle. Düzeltmenin kendisi doğru.

### [Nit] Model seçimi için 50 bin örneklem kullanmak muhtemelen gereksiz

- **Nerede:** Notebook, "Compare Models with Cross Validation" bölümü; SUMMARY D10
- **Durum:** TAHMİN EDİLİYOR (SUSPECTED)
- **Sorun:** Gradient boosting 298 bin satırla bir eğitimde bir dakikanın çok altında eğitiliyor, ve final `TunedThresholdClassifierCV` zaten tüm eğitim setiyle eğitiliyor. `min_samples_leaf=100` gibi hiperparametreler, uygulandıkları veri setinden 6 kat küçük bir veri setinde seçilmiş.
- **Nasıl düzeltilir:** Ayarı tüm eğitim setinde (ya da en az 150 bin satırla) `HalvingRandomSearchCV` ile yap. İstersen örneklemi sadece yavaş olan Random Forest için tut.

## İyi yapılanlar

- Adı konmuş bir paydaşa sahip, net ve test edilebilir bir soru. Hedef tanımı (iptal ve askıya alınanlar = fonlanmadı; live ve undefined çıkarıldı) bir tabloyla gerekçelendirilmiş.
- Sızıntı sütunlarının sistemli şekilde çıkarılması ve birçok kişinin gözden kaçırdığı, adlardaki "(Canceled)" sızıntısının fark edilmesi. Temizliğin uzunlukta iz bırakmadığını doğruladım.
- Doğru temizlik adımları: 1970 tarihleri ve 'N,0"' ülkeleri sağlam bir akıl yürütmeyle düzeltilmiş. Para biriminden ülkeye eşleştirmenin geçerli olduğu doğrulandı.
- Genel olarak iyi doğrulama pratiği:
  - stratified bir test seti,
  - tüm dönüştürücülerin bir `Pipeline` içinde olması,
  - stratified CV,
  - hata analizi için ayrı bir doğrulama seti,
  - sadece bir kez kullanılan bir test seti.

  Notebook baştan sona sırayla çalışmış (çalıştırma numaraları 1–32). Test metriklerini kaydedilmiş modelden birebir yeniden ürettim.
- Anlamlı ve açıklanmış bir baseline (sadece eğitim setinden öğrenilen hedef ortancası kuralı) ve accuracy'nin neden başarısız olduğunu göstermek için önemsiz "her zaman başarısız" kuralı.
- Zayıflıklar konusunda dürüst, gruplara göre yapılmış bir hata analizi ("bu kategorilerde … neredeyse hiç ayırt edemiyor", küçük hedeflerde aşırı iyimserlik) ve süre grafiğindeki korelasyon uyarısı.
- Olasılıkların kalibre edilmediği notebook'ta ve SUMMARY'de belirtilmiş, sınırlar bir slaytta açıklanmış.
- Tüm importları en üstte olan temiz ve okunabilir kod, ayrıca karar kaydı (D1–D15) içeren sade dilli bir SUMMARY. Karar kaydı mükemmel bir uygulama.

## Önerilen düzeltme sırası

1. **Slaytlarda olasılıkları kalibre et ya da ham skorları göstermeyi bırak** (Major: şişirilmiş skor). `class_weight`'i kaldır, modeli yeniden eğit, bir kalibrasyon grafiği ve Brier skoru ekle, slayt 7, 8, 10 ve 11'i güncelle. *Yaklaşık 1–2 saat, tam yeniden eğitim dahil.*
2. **Kampanya süresi önerisini yeniden yaz** (Major: karışan öneri). Hedefe göre katmanlı tabloyu ya da partial dependence grafiğini ekle; slayt 6 ve 9'u, notebook yorumlarını ve SUMMARY'yi güncelle. *Yaklaşık 1 saat.*
3. **Çalışma noktasını ve metrik ifadelerini yeniden düşün** (Major: F1 çalışma noktası; Minor: slayt 7 ifadeleri). Kalibre edilmiş olasılık aralıkları kullan; %83 rakamının ve "+%19"un yanına temel oranı yaz. *Yaklaşık 1 saat.*
4. **Zamana göre ayrılmış bir test ekle ve genelleme iddiasını yumuşat** (Major: rastgele bölme). `launch_year` ile ne yapılacağına karar ver. *Yaklaşık 1 saat.*
5. **"(Suspended)" ekini kaldır** ve yeniden çalıştır (Minor). *Yaklaşık 10 dakika, artı yeniden çalıştırma süresi.*
6. **CV standart sapmalarını raporla, CV ve test tablolarını ayır; eşik, yıl ve milestone ifadelerini düzelt** (Minor: skorların karşılaştırılabilirliği; Minor: desteklenmeyen sayılar). *Yaklaşık 30–45 dakika.*
7. **AUC ya da log loss ile özellik önemi, gruplanmış özellikler ve partial dependence grafikleri** (Minor). *Yaklaşık 45 dakika.*
8. **README, `pyproject.toml` ve ruff satır uzunluğu** (Minor: repo; Nit: PEP 8). *Yaklaşık 30 dakika.*
9. Kalan küçük maddeler (aralık etiketleri, yerleşik kategorik destek, 'N,0"' notu, tüm veriyle ayar yapma). *Yaklaşık 1 saat, isteğe bağlı.*

## Yazara sorular

1. Ana paydaş proje sahibi mi (bir olasılık ve öneri istiyor), yoksa platform mu (riskli projeleri incelemek için işaretlemek istiyor)? Doğru metrik ve eşik buna bağlı.
2. `class_weight="balanced"` ayarını neden eşik ayarıyla birlikte kullandın? Ağırlıklandırmasız bir modelle karşılaştırdın mı?
3. Hedefine ulaşmış iptal edilen projeler (698) gerçekten "fonlanmadı" olarak mı sayılmalı? İptal edilen projeleri tamamen çıkarmayı ya da iptal edilip yeniden başlatılan proje çiftlerini ayrı ele almayı düşündün mü?
4. Launch Check'in proje sahiplerine bir sayı göstermesi gerçekten amaçlanıyor mu? Öyleyse, "69 / 100" yerine kalibre edilmiş oranlara bağlı aralıklar ("düşük / orta / yüksek") daha anlaşılır olmaz mı?
5. 50 bin örneklem çalışma süresi için gerekli miydi, yoksa ayar tüm eğitim setinde yapılabilir miydi?
