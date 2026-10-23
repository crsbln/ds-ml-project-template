> Bu dosya [CRITIQUE_2.md](../reviews/CRITIQUE_2.md) dosyasının Türkçe çevirisidir.

# Proje Eleştirisi (2. Tur): Kickstarter Başarı Tahmini

- **Değerlendiren:** bağımsız kıdemli veri bilimi değerlendirmesi
- **Tarih:** 2026-10-19
- **Kapsam (incelenen dosyalar):** `01_assignment.md`, `04_kickstarter_eda_and_modeling.ipynb` (kayıtlı çıktılarıyla birlikte 87 hücrenin tamamı; çalıştırma sayıları sırayla 1–38), `kickstarter_success_presentation.pdf` (12 slayt, metin `pdftotext` ile çıkarıldı), `SUMMARY.md` (11. bölümdeki düzeltme kaydı dahil), `README.md`, `pyproject.toml`, `uv.lock` (yalnızca proje adı), `.gitignore`, Git'te takip edilen dosya listesi (`git ls-files`), son commit (`git show --stat HEAD`), `models/kickstarter_success_model.joblib` ve ilk tur değerlendirmesi `CRITIQUE.md`. İncelenmeyenler: `03_eda-and-modeling.ipynb`, `OZET.md`, `ELESTIRI.md`.
- **Yöntem:** Notebook'taki temizleme ve feature adımlarını, deponun dışındaki geçici bir klasörde salt okunur script'lerle yeniden yazdım ve projenin `.venv` ortamıyla (Python 3.13, pandas 3, scikit-learn 1.9.0) `data/ks-projects-201801.csv` üzerinde çalıştırdım. Kayıtlı modeli yükleyip aynı test bölmesini (`random_state=42`) yeniden puanladım. Ek kontroller: 10 aralıklı bir kalibrasyon tablosu; başlangıç yılına ve alt gruplara göre kalibrasyon; modelin baseline ile aynı etiket payında precision ve recall değerleri; "düşük" bandın isabet oranı; 10. slayttaki Launch Check örneği için "ya şöyle olsaydı" (what-if) tahminleri (süre, hedef, hafta günü ve isim uzunluğu değiştirilerek); sürenin günlük aralıklarla partial dependence değerleri; her bir tam kampanya süresi için başarı oranları; yeni etiket temizliğinden sonra isimlerde kalan leakage; `N,0"` kayıtlarının istatistikleri; kategoriler ordinal yerine one-hot kodlanmış bir Random Forest (100 bin satırlık eğitim örneğinde 3-fold CV); ve `ruff check --no-cache`. Küçük Random Forest kontrolü dışında hiçbir model yeniden eğitilmedi. Bu dosya ve İngilizce aslı dışında depoda hiçbir dosya oluşturulmadı veya değiştirilmedi.

## Yönetici özeti

Revizyon önemli ve gerçek bir iyileşme. Model artık iyi kalibre edilmiş olasılıklar üretiyor (test ROC-AUC 0.754, Brier skoru 0.189 ve neredeyse kusursuz bir 10 aralıklı kalibrasyon tablosunu yeniden ürettim). Zamana dayalı kontrol eklenmiş, leakage düzeltmeleri çalışıyor ve ilk turdaki bulguların neredeyse tamamı çözülmüş: 16 bulgudan 13'ü çözülmüş, 3'ü kısmen çözülmüş, çözülmemiş bulgu yok. Notebook'taki metriklere ve kalibrasyona 2009–2017 verisi için güvenilebilir. Kalan asıl risk, paydaşlara yönelik materyalde. "Launch Check" veri ürünü yaratıcıları "farklı bir hedef veya süre denemeye" davet ediyor. Ancak slaydın kendi örneğinde kampanya 30 yerine 29 gün olursa model %51'den %72'ye çıkıyor; kampanya pazartesi yerine pazar başlarsa %51'den %38'e düşüyor. Bunlar yaratıcının davranışıyla ilgili ilişkiler (korelasyon), değiştirilebilir kollar değil. Yani tanıtıldığı haliyle ürün, verinin desteklemediği, kendinden emin ve nedensel görünen tavsiyeler verir. Kapanış slaydı da hâlâ "kısa kampanya" diyor; ilk değerlendirme bu tavsiyenin yanlış olduğunu göstermişti. Notebook ve slaytlardaki birkaç küçük ifade de çıktılarla uyuşmuyor. Bunları sunumdan önce düzeltin; modelin kendisini değiştirmeye gerek yok.

## İlk tur bulgularının durumu

`CRITIQUE.md` "4 Major, 8 Minor ve 5 Nit" bulgu içerdiğini söylüyor, ancak yalnızca 7 Minor bulgu listeliyor; yani toplam 16 bulgu var. `SUMMARY.md` §11 bunları doğru sayıyor.

| Bulgu (CRITIQUE.md'deki başlığıyla) | O zamanki önem derecesi | Şimdiki durum | Gerekçe |
|---|---|---|---|
| Sınıf ağırlıklandırması "başarı skorunu" şişiriyor; Launch Check slaydı şansları abartıyor | Major | ÇÖZÜLDÜ | `class_weight` kaldırılmış; ortalama tahminin 0.360, gerçek oranın 0.360 olduğunu ve aralıkların kalibre olduğunu (0.35 → 0.35, 0.65 → 0.65) doğruladım; kalibrasyon grafiği ve Brier skoru eklenmiş; 10. slayt "about 51%" gösteriyor. (Bant ifadesi yeni ve daha küçük bir sorun, aşağıdaki Minor bulguya bakın.) |
| Tek bir eşikte F1, belirtilen paydaş için zayıf bir çalışma noktası | Major | KISMEN ÇÖZÜLDÜ | Olasılık ve şans bantları artık ana çıktı ve temel oranlar (base rate) gösteriliyor. Ancak 7–8. slaytlar hâlâ Launch Check ürününün göstermediği F1 etiketini ("promising", "unlikely") sunuyor ve 7. slayt recall değerlerini farklı etiket paylarında karşılaştırıyor (aşağıdaki Minor bulguya bakın). |
| "Kampanyayı kısa tut" önerisi hedef büyüklüğüyle karışık (confounded) ve veriyle desteklenmiyor | Major | KISMEN ÇÖZÜLDÜ | Hedefe göre katmanlı tablo, partial dependence ve yeniden yazılan 6. ve 9. slaytlar iyi. Ancak kapanış slaydı 12 hâlâ "Small goal, short campaign" diyor ve Launch Check, modelin yapay örüntülerle yanıtladığı süre değişikliklerini denemeye davet ediyor (aşağıdaki Major bulguya bakın). |
| Yalnızca rastgele bölme: "yeni projelere güvenilir şekilde genellenir" iddiası test edilmemiş ve `launch_year` dışarıya doğru uzatılıyor (extrapolation) | Major | ÇÖZÜLDÜ | Zamana dayalı bir hold-out eklenmiş (2016 öncesiyle eğitim, 2016 ve sonrasıyla test: AUC 0.757, recall 0.749), `launch_year` çıkarılmış, iddia yumuşatılmış ve yeniden eğitim önerilmiş. |
| İkinci bir isim leakage'ı, "(Suspended)", temizlenmemiş | Minor | ÇÖZÜLDÜ | Büyük/küçük harfe duyarsız regex 24,135 etiketin tamamını kaldırıyor (hepsi etiket 0); geride kesik veya yarım etiket bulamadım. |
| Cross validation skorları test skorlarıyla karışmış; tuning kazanımları gürültü sınırları içinde | Minor | ÇÖZÜLDÜ | Baseline aynı CV fold'larıyla puanlanmış, ortalama ± standart sapma raporlanmış, ayrı bir test tablosu var, tuning "anlamlı bir fark yok" diye açıklanmış. |
| Hata analizi ve feature importance, yayınlanan modelden farklı bir modeli anlatıyor | Minor | ÇÖZÜLDÜ | Hata analizi, permutation importance (ROC-AUC ile, standart sapmalarıyla) ve partial dependence artık `final_model` kullanıyor; `main_category` çıkarılmış. |
| Markdown'daki bazı sayıların arkasında kod yok; küçük tutarsızlıklar | Minor | KISMEN ÇÖZÜLDÜ | Kategori ve ay tabloları artık yazdırılıyor ve eşik ifadesi uyumlu hale getirilmiş. Ancak yeni dayanaksız veya yanlış ifadeler eklenmiş ("tabletop %51 uyuşuyor", "hepsi genel 0.754'ün altında"), SUMMARY'deki milestone adları hâlâ ödevden farklı ve 4. slayt hâlâ "2009–2017" diyor. |
| 7. slayttaki "+19% better" ve "83% reliable" yanlış anlaşılabilir | Minor | ÇÖZÜLDÜ | Slaytlar artık temel oranlarla birlikte 100 üzerinden sayılar kullanıyor ("50'ye 45'e 36", "84'e 64"). |
| Hedef değişkendeki ve funding goal'daki uç durumlar tartışılmamış | Minor | ÇÖZÜLDÜ | Hedefine ulaşıp iptal edilen 698 proje, çok küçük hedefler (onlar olmadan %49.2'ye karşı %49.4) ve yeniden başlatılan projeler kodla birlikte belgelenmiş. |
| Depo ve README bu projeyi anlatmıyor; bağımlılıklar eksik | Minor | ÇÖZÜLDÜ | Yeni proje README'si yazılmış, `pyproject.toml` yeniden adlandırılıp düzeltilmiş (`plotly` artık `uv.lock`'ta yok), scikit-learn sürümü yazdırılıyor ve not edilmiş, veri yolu için açık hata mesajı veren bir kontrol eklenmiş. |
| PEP 8 satır uzunluğu; ruff iddiası kontrol edileni abartıyor | Nit | ÇÖZÜLDÜ | `ruff check --select E,F,W,I --line-length 88` ve `ruff format --check` geçiyor; SUMMARY 88 karakter kuralını açıkça belirtiyor. |
| Hedef aralığı (bin) etiketleri sınır değerde kayık | Nit | ÇÖZÜLDÜ | Etiketler artık "up to 1k" ve sağdan kapalı aralıklar için bir yorum satırı var. |
| Yoğun one-hot sütunlarıyla gradient boosting ve ağaçlar için ölçekleme | Nit | ÇÖZÜLDÜ | `HistGradientBoostingClassifier` içinde yerleşik (native) kategorik destek kullanılıyor, ağaçlarda sayısal sütunlar olduğu gibi geçiriliyor. (Random Forest artık ordinal kodlar alıyor, aşağıdaki Nit bulguya bakın.) |
| 'N,0"' satırları yalnızca hatalı ülke kodu değil, bozuk kayıtlar | Nit | ÇÖZÜLDÜ | Notebook'ta açıklanmış; 3,797 ham satırın eksik `usd pledged` olan 3,797 satırla aynı olduğunu, 3,562'sinin undefined olduğunu, 234'ünün tutulduğunu ve bunların %44.9'unun fonlandığını doğruladım ("45%" doğru). |
| Model seçimi için 50 bin satırlık örneklem muhtemelen gereksiz | Nit | ÇÖZÜLDÜ | Karşılaştırma ve tuning artık eğitim setinin tamamında (297,834 proje) yapılıyor. |

**Toplam:** 13 ÇÖZÜLDÜ, 3 KISMEN ÇÖZÜLDÜ, 0 ÇÖZÜLMEDİ.

## Yeni ve kalan bulgular

Hiçbir bulgu Critical (kritik) olarak derecelendirilmedi: raporlanan test metriklerini geçersiz kılan bir şey bulmadım. **2 Major, 6 Minor ve 2 Nit** bulgu var (toplam 10).

Önem dereceleri:
- **Critical (kritik):** sonuçları geçersiz kılar veya paydaşları ciddi şekilde yanıltır
- **Major (büyük):** sonuçları, çıkarımları veya güvenilirliği önemli ölçüde etkiler
- **Minor (küçük):** düzeltmeye değer, etkisi sınırlı
- **Nit (ayrıntı):** stil veya cila

### [Major] Launch Check'in "ya şöyle olsaydı" özelliği korelasyonları kendinden emin ve yanıltıcı tavsiyelere dönüştürüyor

- **Nerede:** 10. slayt "Launch Check" ("Try a different goal or length to see how it changes"); 11. slayt "Explain each prediction: show creators which of their choices raise or lower their chance"; notebook "Feature Importance and Direction" ve "Save the Model and Score a New Project" bölümleri; 6. slayt
- **Durum:** DOĞRULANDI (VERIFIED)
- **Sorun:** Veri ürünü, yaratıcıları girdilerini değiştirip şansın nasıl hareket ettiğini izlemeye davet ediyor. Model, fonlanmayı neyin sağladığını değil, *yaratıcının nasıl davrandığını* anlatan feature'larla güçlü ilişkiler öğrenmiş. En açık örnek: süresi yuvarlak sayı olan kampanyalar (15, 20, 25, 30, 35, 40, 45, 60 gün) komşu sürelere göre çok daha az fonlanıyor. Bu büyük olasılıkla daha az dikkatli bir planlamanın (veya belirli bir bitiş tarihi yerine "N gün" seçmenin) işareti, bir neden değil. 30 günü 29'a indirmek bir kampanyanın başarı şansını 21 puan artırmaz, ama araç bunu söyler.
- **Neden önemli:** Bu, tahminlerin nasıl kullanılacağını gösteren tek slayt. Tanıtıldığı haliyle gerçek bir yaratıcıya kesin görünen sayılarla kampanyasını bir gün kısaltmasını, pazartesi başlamasını veya isme kelime eklemesini söyler. Bu, notebook'un kendisinin uyardığı nedensel yanlış okumanın ta kendisi ("not proof that changing them causes success").
- **Kanıt:** Kayıtlı model, 10. slayttaki örnek (Tabletop Games, US, 10,000 USD, mart ayında bir salı, 6 kelimelik isim):

  | Değişiklik | Tahmin edilen şans |
  |---|---|
  | slayttaki gibi (30 gün) | %51 |
  | 29 gün / 31 gün | %72 / %62 |
  | 35 / 40 / 45 gün | %59 / %52 / %42 |
  | 60 gün | %28 |
  | bunun yerine pazar günü başlatılırsa (weekday 6) | %38 |
  | 6 yerine 2 kelimelik isim | %43 |

  Tam süreye göre ham başarı oranı (372,293 projenin tamamı): 14 g %50.6, **15 g %41.8**, 16 g %57.3; 19 g %55.2, **20 g %40.6**, 21 g %54.1; 24 g %53.5, **25 g %44.2**, 26 g %52.1; 29 g %45.9, **30 g %31.9**, 31 g %49.5; 34 g %49.1, **35 g %39.0**, 36 g %48.0; 39 g %43.4, **40 g %33.5**, 41 g %44.9; 44 g %41.5, **45 g %28.7**, 46 g %43.7. Günlük aralıklarla hesaplanan partial dependence de 15, 20, 25, 30, 35, 40, 45 ve 60. günlerde aynı düşüşleri gösteriyor; notebook'taki çıkarım yalnızca 30 ve 60'tan bahsediyor. Hafta gününün ortalama etkisi küçük (ham oranlar %33–38), ama etkileşimler yüzünden bu tek tahmini 13 puan oynatıyor.
- **Nasıl düzeltilir:**
  1. 10. slayttan "Try a different goal or length to see how it changes" cümlesini kaldırın ve 11. slayttaki "Explain each prediction" maddesini "tahminin hangi faktörlere dayandığını gösterin (neyin değiştirileceğini değil)" şeklinde yeniden yazın.
  2. Notebook'a tam süre tablosunu ekleyin (veya partial dependence grafiğini yakınlaştırın) ve örüntüyü dürüstçe anlatın: "yuvarlak sayılı süreler komşularından daha kötü sonuç veriyor; bu, sürenin kendisinden çok yaratıcı davranışına işaret ediyor". 6. slaydı ("the 30-day default") buna göre güncelleyin; yaratıcıların %45'i tam olarak 30 gün seçiyor, ama "varsayılanı koruyorlar" bir varsayım.
  3. Bir what-if özelliği ileride yapılırsa, onu yalnızca hedefle sınırlayın (makul bir mekanizması olan tek girdi; eğrinin dalgalanmaması için bir monotonluk kısıtı, `monotonic_cst`, ekleyin) ve açık bir "ilişki, etki değil" uyarısıyla sunun. Süre için ya kaba aralıklar ("3 haftadan kısa / 3–6 hafta / 6 haftadan uzun") ve kol olarak sunulmayan ayrı bir `is_round_length` bayrağı kullanın ya da süreyi what-if'in dışında bırakın.

### [Major] Kapanış slaydı hâlâ "kısa kampanya" öneriyor

- **Nerede:** 12. slayt "Thank you" ("Small goal, short campaign, know your odds.")
- **Durum:** DOĞRULANDI (VERIFIED)
- **Sorun:** Revizyonda 6. ve 9. slaytlar yeniden yazılarak yaklaşık üç ila altı haftalık kampanyaların en iyi sonucu verdiği ve 1k USD üstü hedeflerde çok kısa kampanyaların daha kötü olduğu söylenmiş. Son slaytta ise eski slogan duruyor.
- **Neden önemli:** Kapanış cümlesi, dinleyicinin aklında kalan şeydir; destenin kendi önerisiyle ve veriyle çelişiyor (25k USD üstü hedeflerde 1–14 gün: %7.3 fonlanma, 31–44 gün: %26.1). `SUMMARY.md` §11 bu bulgunun tamamen giderildiğini söylüyor. Düzeltmek bir dakika sürer, ama mesaja etkisi önemli.
- **Kanıt:** 12. slaydın `pdftotext` çıktısı; notebook'taki "Campaign Duration" pivot tablosu.
- **Nasıl düzeltilir:** Örneğin "Realistic goal, deliberate length, know your odds." ile değiştirin. PDF'yi yeniden dışa aktarın ve §11'deki düzeltme kaydını güncelleyin.

### [Minor] %51 için "High chance" karışık bir mesaj veriyor; "benzer projeler" sayısı hesaplanmamış

- **Nerede:** 10. slayt; 8. slayt ("62 / 100"); notebook "Are the Probabilities Trustworthy?" ve "Save the Model and Score a New Project" bölümleri; SUMMARY §7
- **Durum:** DOĞRULANDI (VERIFIED)
- **Sorun:**
  - Bantlar %25 ve %50'de sabit, bu yüzden yazı-tura gibi bir proje "High chance" olarak adlandırılıyor. 10. slayt "about 51% · High chance · About half of similar past projects were funded" gösteriyor: etiket ile cümle birbirini tutmuyor. Örnek tam bant sınırında duruyor; bir gün veya birkaç dolar etiketi değiştirebilir.
  - "Real tabletop games with similar goals in the data were funded about 51% of the time, which matches" cümlesinin arkasında kod yok (CRITIQUE.md'den alınmış). Süreyi de hesaba katmıyor: 7.5k–15k USD hedefli ve 30 günlük tabletop oyunlarının %43.3'ü fonlanmış (n = 1,375; test setinde %44.5, n = 292).
- **Neden önemli:** Revizyonun amacı dürüst, kalibre edilmiş şanslardı. "High" aşırı güvene davet ediyor ve kontrol edilmemiş bir "uyuşuyor" iddiası kalibrasyon hikâyesini zayıflatıyor.
- **Nasıl düzeltilir:** Bantları temel orana göre adlandırın ("ortalamanın altında / ortalama civarı / ortalamanın üstünde" veya "yaklaşık 7'de 1 / 3'te 1 / 5'te 3") ya da yalnızca sayıyı gösterin. "Benzer projeler" sayısını notebook'ta açık bir tanımla hesaplayın, örneğin `k.query("category == 'Tabletop Games' and 7500 <= usd_goal_real <= 15000 and duration_days == 30")["success"].mean()`, ve bu değeri kullanın.

### [Minor] 7–8. slaytlar ürünün kullanmadığı F1 etiketini raporluyor; recall karşılaştırması eşit koşullarda değil

- **Nerede:** 7. slayt "Our model beats a simple rule of thumb"; 8. slayt "84 / 100"; notebook "Final Model and Test Evaluation", "Error Analysis"
- **Durum:** DOĞRULANDI (VERIFIED)
- **Sorun:**
  - Model test projelerinin %58.3'üne "promising" diyor, baseline kuralı ise %49.9'una. Recall'ü farklı etiket paylarında karşılaştırmak modeli olduğundan iyi gösteriyor: daha fazla projeye etiket veren her zaman daha fazla başarılı proje bulur.
  - "When it says 'unlikely', it is right 84 times in 100" ifadesi 0.30 eşiğindeki etikete dayanıyor. Launch Check bu etiketi değil bantları gösteriyor; yani dinleyici iki farklı çıktı görüyor.
- **Neden önemli:** Model gerçekten daha iyi, ama "81'e 63" farkı kısmen eşik seçiminin bir sonucu ve deste iki çıktı türünü karıştırıyor.
- **Kanıt:** Baseline'ın etiket payında (eşik 0.349) model %53.0 precision ve %73.6 recall'e ulaşıyor (baseline %45.1 / %62.5; F1 0.616'ya karşı 0.524). "Düşük" bant (%25'in altı) %86.4 oranında haklı (%13.6'sı fonlanmış); etiket ise %83.7 oranında haklı.
- **Nasıl düzeltilir:** 7. slaytta aynı payda karşılaştırın: "Kuralla aynı sayıda proje seçtiğinde modelimiz fonlanan 100 projenin 74'ünü buluyor (kural: 63) ve seçtiği 100 projenin 53'ü fonlanıyor (kural: 45)." 8. slaytta bunun yerine düşük bandı kullanın: "Düşük banttaki projelerin yalnızca 100'de 14'ü fonlandı (ortalama: 36)." Teknik okuyucu için F1 tablosunu notebook'ta tutun.

### [Minor] Test seti değerlendirme turları boyunca yeniden kullanılmış, ama notebook tek kez kullanıldığını söylüyor

- **Nerede:** Notebook "Final Model and Test Evaluation" ("The test set has not been used for any decision so far … We do not change the model after seeing them"); 7. slaytın alt notu ("evaluated once on a held-out test set"); SUMMARY §3
- **Durum:** Yeniden kullanım DOĞRULANDI (VERIFIED); sayılara etkisinin küçük olduğu TAHMİN EDİLİYOR (SUSPECTED)
- **Sorun:** İlk değerlendirme test seti sonuçlarını raporladı (kalibrasyon aralıkları, recall, NPV) ve revizyon buna yanıt olarak modeli değiştirdi (sınıf ağırlıkları, `launch_year`, kodlama, örneklem büyüklüğü). Kesin konuşmak gerekirse, test seti artık modelleme kararlarını etkilemiş durumda.
- **Neden önemli:** İyimserlik payı muhtemelen çok küçük, çünkü değişiklikler ilkelere dayalıydı ve CV kanıtıyla uyuşuyor (CV ROC-AUC 0.7517'ye karşı test 0.754; CV Brier 0.1895'e karşı test 0.189). Ama "bir kez kullanıldı" artık harfiyen doğru değil ve teknik bir değerlendirici bunu fark eder.
- **Nasıl düzeltilir:** "Test seti son değerlendirmede ve bir değerlendirme turunda kullanıldı; sonrasında yapılan değişiklikler cross validation ve kalibrasyon ilkelerine dayanıyordu ve CV ile test skorları uyuşuyor" şeklinde yeniden yazın. Bunu karar kaydına (decision log) ekleyin.

### [Minor] Kalibrasyon yıllar birlikte ele alındığında geçerli, tek tek yıllarda değil

- **Nerede:** Notebook "Are the Probabilities Trustworthy?", "Does the Model Hold Up Over Time?"; 7. slayt ("the chance estimates are honest"); README
- **Durum:** DOĞRULANDI (VERIFIED)
- **Sorun:** `launch_year` olmadan model 2009–2017 ortalamasında kalibre, ama tek bir yıl için değil. 2026'daki bir yaratıcı, o yılların ortalamasını yansıtan bir şans görür.
- **Kanıt:** Rastgele bölmenin test setinde, başlangıç yılına göre ortalama tahmin ve gerçek oran: 2013 0.399'a karşı 0.436, 2015 0.317'ye karşı 0.279, 2017 0.357'ye karşı 0.379. Zamana dayalı kontrol de aynı kaymayı gösteriyor (0.330'a karşı 0.350). Notebook kaymadan bahsediyor, ama slaytlar tahminlere zaman kaydı koymadan "honest" diyor.
- **Nasıl düzeltilir:** 7. slaytta "2009–2017 projeleri için ortalamada dürüst" deyin. Gerçek kullanımdan önce en son yıl üzerinde yeniden kalibre edin (örneğin 2017 verisiyle eğitilmiş `CalibratedClassifierCV(FrozenEstimator(model), method="isotonic")`) ve daha sonraki bir dilimde kalibrasyonunu raporlayın.

### [Minor] Notebook'taki birkaç ifade çıktılarla uyuşmuyor

- **Nerede:** Notebook "Error Analysis" (kategori çıkarımı), "Compare Models with Cross Validation" çıkarımı, "Campaign Duration" çıkarımı, "Feature Importance and Direction" çıkarımı, "Success Rate by Country" çıkarımı
- **Durum:** DOĞRULANDI (VERIFIED)
- **Sorun:**
  - "All are below the overall 0.754" yanlış: Technology (0.804) ve Games (0.789) bu değerin üstünde.
  - "The differences between models are at least 7 times larger than the standard deviation": log loss için Logistic Regression ile Random Forest arasındaki fark 0.0061, standart sapma 0.0010 (yaklaşık 6 kat). Sonuç değişmiyor, ama sayı yanlış. Doğru ölçüt, fold'lar arasındaki farkların eşleştirilmiş (paired) karşılaştırması olurdu.
  - "very short campaigns (1-14 days) do clearly worse" ifadesi belirsiz: 1k–5k USD hedeflerde 1–14 gün (%45.7), 30 günlük varsayılandan (%38.0) daha iyi; yalnızca 15–29 ve 31–44 günden daha kötü.
  - Partial dependence çıkarımı yalnızca 30 ve 60. günlerdeki düşüşlerden bahsediyor; grafik 15, 20, 25, 35, 40 ve 45. günlerde de düşüyor (Major bulguya bakın).
  - "the 3,797 raw rows with `N,0"` are exactly the rows with a missing `usd pledged` value" doğru (doğruladım), ama bunu hesaplayan bir hücre yok.
- **Neden önemli:** Her hata küçük, ama bir araya geldiklerinde kanıt konusunda genelde dikkatli olan bir notebook'a duyulan güveni zayıflatıyorlar.
- **Nasıl düzeltilir:** İfadeleri düzeltin ("çoğu kategori genel değerin altında; Technology ve Games üstünde", "yaklaşık 6–20 kat", "15–29 ve 31–44 günden daha kötü"), tüm düşüşleri anlatın ve leakage sütunları atılmadan önce `N,0"` iddiası için tek satırlık bir kontrol ekleyin, örneğin `print(((kickstarter_raw["country"] == 'N,0"') == kickstarter_raw["usd pledged"].isna()).all())`.

### [Minor] SUMMARY ve slaytlarda hâlâ küçük tutarsızlıklar var; düzeltme kaydı tamamlanmayı abartıyor

- **Nerede:** `SUMMARY.md` §3 ve §11; 3. ve 4. slaytlar
- **Durum:** DOĞRULANDI (VERIFIED)
- **Sorun:**
  - SUMMARY'deki milestone adları hâlâ ödevden farklı: SUMMARY'de "Milestone 0 – Load and explore the data (EDA)", "Milestone 1 – Baseline", "Milestone 2 – Slide draft" var; ödevde M0 Data ingestion, M1 EDA, M2 Baseline, M3 Error analysis, M4 Final deliverables var.
  - 4. slaytın alt notu "372,293 Kickstarter projects, 2009–2017" diyor, 3. slayt ise "2009 to early 2018" (2 proje 2018'den).
  - §11 "All were addressed" diyor, ama 12. slayt ve milestone adları değiştirilmemiş.
- **Nasıl düzeltilir:** Milestone'ları `01_assignment.md` ile uyumlu olacak şekilde yeniden adlandırın, her yerde "2009 to early 2018" kullanın ve düzeltme kaydında kısmi düzeltmeleri dürüstçe belirtin.

### [Nit] Random Forest ordinal kategori kodları alıyor, bu da onu dezavantajlı bırakıyor

- **Nerede:** Notebook "Preprocessing Pipelines", "Compare Models with Cross Validation"
- **Durum:** DOĞRULANDI (VERIFIED)
- **Sorun:** `OrdinalEncoder` 159 kategoriyi rastgele tam sayılara dönüştürüyor. Gradient Boosting bunları kategori olarak ele alıyor, ama Random Forest onları sıralı sayılarmış gibi bölüyor.
- **Kanıt:** 100 bin satırlık eğitim örneğinde, aynı Random Forest ayarlarıyla 3-fold CV: ordinal ROC-AUC 0.709 / 0.707 / 0.709, one-hot 0.728 / 0.722 / 0.729; bu da Logistic Regression ile aynı seviye. Gradient Boosting (0.752) yine kazanıyor, yani sonuç değişmiyor.
- **Nasıl düzeltilir:** Random Forest'a one-hot preprocessor'ı verin (ölçekleme olmadan) ya da ordinal kodlarla çalıştırıldığını ve bu yüzden biraz dezavantajlı olduğunu söyleyen bir cümle ekleyin.

### [Nit] Zamana dayalı kontrol, tüm yıllar üzerinde ayarlanmış hiperparametreleri yeniden kullanıyor

- **Nerede:** Notebook "Does the Model Hold Up Over Time?"
- **Durum:** Kurulum DOĞRULANDI (VERIFIED); etkisinin ihmal edilebilir olduğu TAHMİN EDİLİYOR (SUSPECTED)
- **Sorun:** `search.best_estimator_`, 2016–2017 projelerini de içeren rastgele eğitim setinde ayarlanmış ve sonra 2016 öncesiyle eğitilen modelde yeniden kullanılmış. Hiperparametre araması ve eşik ayarlaması da aynı CV fold'larını paylaşıyor.
- **Neden önemli:** Çok az önemli, çünkü tuning log loss'u yalnızca 0.0003 değiştirdi; ama bu temiz bir zaman dışı (out-of-time) test değil.
- **Nasıl düzeltilir:** Bunu belirten bir cümle ekleyin veya zamana dayalı model için varsayılan Gradient Boosting ayarlarını kullanın.

## İyi yapılanlar

- Revizyon yalnızca belirtileri değil, temel nedenleri ele aldı: sınıf ağırlıklarını kaldırmak, tüm aralıkta kalibre olasılıklar sağladı (10 aralıklı kontrolüm: 0.055 → 0.053, 0.251 → 0.255, 0.549 → 0.547, 0.741 → 0.734); her ana kategori ve hedef aralığı içinde de kalibre (yaklaşık 1.5 yüzde puan içinde).
- Model karşılaştırması artık paydaşın sorusuna uyan, eşikten bağımsız metrikler kullanıyor (ROC-AUC, log loss, Brier skoru); fold standart sapmalarıyla ve eğitim setinin tamamında.
- Baseline, medyan her fold'un içinde öğrenilerek aynı CV fold'larıyla puanlanıyor; bu dikkatli ve doğru.
- Zamana dayalı kontrol açık ve dürüstçe yorumlanmış (sıralama tutuyor, recall ve oranlar kayıyor, kullanmadan önce yeniden eğitin) ve `launch_year` sağlam bir gerekçeyle çıkarılmış.
- Leakage çalışması kapsamlı: büyük/küçük harfe duyarsız etiket temizliği (24,135 isim, hepsi etiket 0), geride yarım etiket yok ve bozuk `N,0"` kayıtlarının açık bir açıklaması var.
- Hedefe göre katmanlı süre tablosu karışıklık (confounding) endişesini doğrudan yanıtlıyor ve 6. ile 9. slaytlar bunu, slaytın üzerinde "a correlation" ifadesiyle birlikte yansıtıyor.
- 4–9. slaytlardaki her paydaş sayısı notebook çıktılarıyla uyuşuyor ve her öne çıkan sayının yanında temel oranlar var.
- Tekrarlanabilirlik iyi: notebook baştan sona çalıştırılmış (çalıştırma sayıları 1–38), veri yolu kontrolü açık bir hata veriyor, scikit-learn sürümü yazdırılıyor, `ruff` 88 karakterde geçiyor, notebook'ta mutlak dosya yolu yok ve README ile `pyproject.toml` artık bu projeyi anlatıyor.
- Karar kaydı (D1–D16) ve düzeltme kaydı, mantığı takip etmeyi ve değerlendirmeyi kolaylaştırıyor.

## Önerilen düzeltme sırası (adım başına yaklaşık emekle)

1. **Kapanış slaydını düzeltin** (Major: "short campaign"). Bir satırı değiştirin ve PDF'yi yeniden dışa aktarın. *Yaklaşık 5 dakika.*
2. **Launch Check'i ve süre hikâyesini yeniden çerçeveleyin** (Major: what-if). "Try a different length" davetini kaldırın, "Explain each prediction" maddesini yeniden yazın, tam süre tablosunu ve yuvarlak sayı bulgusunu notebook'a ekleyin ve 6. slaydı ayarlayın. *Yaklaşık 1 saat.*
3. **Bant etiketlerini yeniden adlandırın veya kaldırın ve "benzer projeler" sayısını hesaplayın** (Minor). *Yaklaşık 20 dakika.*
4. **7–8. slaytları eşit paylı karşılaştırma ve düşük bant etrafında yeniden düzenleyin** (Minor). *Yaklaşık 30 dakika.*
5. **Notebook ifadelerini düzeltin** (Minor: hepsi-0.754'ün-altında, 7 kat, 1–14 gün, düşüşler, `N,0"` kontrolü). *Yaklaşık 20 dakika artı yeniden çalıştırma.*
6. **Kalibrasyon iddialarına zaman kaydı ve test setinin yeniden kullanımı notunu ekleyin** (iki Minor). *Yaklaşık 15 dakika.*
7. **SUMMARY milestone'larını, yıl aralığını ve düzeltme kaydını uyumlu hale getirin** (Minor). *Yaklaşık 15 dakika.*
8. **Nit'ler:** Random Forest için one-hot veya bununla ilgili bir cümle; zaman kontrolündeki hiperparametreler hakkında bir cümle. *Yaklaşık 15–30 dakika, isteğe bağlı.*

## Yazara sorular

1. Launch Check tavsiye vermek ("X'i değiştir") için mi, yoksa yalnızca bir tahmin ("şansın yaklaşık Y") için mi tasarlandı? Yanıt, bir what-if özelliğinin oraya ait olup olmadığını belirler.
2. Yuvarlak sayılı sürelerin (20, 25, 35, 40, 45 gün) de 30 gün gibi düştüğünü fark ettiniz mi? Bunu bir yaratıcıya nasıl açıklardınız?
3. Bantlar neden %25 ve %50'de belirlendi? %36'lık temel orana göre belirlenmiş bantlar daha kolay okunmaz mıydı?
4. Bugün bir yaratıcıya şans göstermeden önce en son yıl (2017) üzerinde yeniden kalibrasyon yapmaya istekli misiniz?
5. Ürün bantları gösterdiğine göre, F1 etiketi kayıtlı modelde hiç tutulmalı mı?
