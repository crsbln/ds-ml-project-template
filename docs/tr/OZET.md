# Proje Özeti: Kickstarter Başarı Tahmini

Bu belge, bu projede neler yapıldığını, hangi aracın nerede kullanıldığını ve hangi kararların neden verildiğini sade bir dille anlatıyor. Veri bilimi hakkında hiçbir şey bilmeyen biri için yazıldı.

> English version: [SUMMARY.md](../SUMMARY.md)

## 1. Bu proje ne hakkında?

[Kickstarter](https://www.kickstarter.com) bir kitle fonlama (crowdfunding) sitesidir. İnsanlar bir fikri tanıtır (bir albüm, bir masa oyunu, bir cihaz), bir **hedef tutar** belirler ve halktan destek ister. Kickstarter **"ya hep ya hiç"** modeliyle çalışır: Süre bitene kadar hedefe ulaşılamazsa proje sahibi hiç para alamaz.

Projelerin yalnızca yaklaşık **üçte biri** hedefine ulaşıyor. Sorumuz şuydu:

> **Bir projenin fonlanma şansını, sadece proje sahibinin kampanyayı *başlatmadan önce* bildiği bilgilerle tahmin edebilir miyiz?**

Hedef kitlemiz (paydaş, "stakeholder"): Kampanya açmayı düşünen ve başarı şansını, ayrıca hangi faktörlerin başarıyla ilişkili olduğunu öğrenmek isteyen proje sahipleri.

Bu, neuefische Data Science eğitiminin ikinci projesiydi. Ödev dosyası ([01_assignment.md](../course/01_assignment.md)) birkaç seçenek sunuyordu. Biz **Option B: Kickstarter project success** seçeneğini seçtik.

## 2. Veri

- **Kaynak:** Kaggle'daki herkese açık [Kickstarter Projects](https://www.kaggle.com/datasets/kemical/kickstarter-projects) veri seti, `ks-projects-201801.csv` dosyası (yaklaşık 58 MB).
- **Boyut:** 2009'dan 2018 başına kadar başlatılmış 378.661 proje, 15 sütun. Sütunlar arasında proje adı, kategori, ülke, para birimi, hedef tutar, başlangıç tarihi, bitiş tarihi, toplanan para, destekçi sayısı ve sonuç durumu var.
- **Nerede duruyor:** Sadece kendi bilgisayarındaki `data/` klasöründe. GitHub'a **yüklenmedi** (bkz. karar K3).

## 3. Adım adım ne yaptık?

Çalışma, ödevdeki beş milestone'u (M0'dan M4'e) takip etti. Her şey tek bir notebook dosyasında: [04_kickstarter_eda_and_modeling.ipynb](../../notebooks/01_kickstarter_eda_and_modeling.ipynb).

### Kurulum ve planlama
- Kurs şablonundan GitHub'da kendi kopyamızı oluşturduk (private repo) ve Python ortamını `uv sync` ile kurduk.
- İşi planlamak ve takip etmek için GitHub'da 5 milestone ve 21 görevden (issue) oluşan bir **Kanban board** kurduk.

### Milestone 0: Data Ingestion (veriyi almak)
- Veriyi yükleyip yapısını, eksik değerleri ve tekrar eden satırları kontrol ettik. Tekrar eden satır yoktu.
- **Hedef değişkeni tanımladık**, yani tahmin edeceğimiz şeyi: Proje fonlandıysa 1, fonlanmadıysa 0 değerini alan `success` adlı yeni bir sütun.
- **"Kopya çektiren" sütunları çıkardık** (leakage): Toplanan para ve destekçi sayısı ancak kampanya bittiğinde belli oluyor.
- Birkaç veri hatası bulup düzelttik (bkz. bölüm 6).

### Milestone 1: EDA (keşifsel veri analizi)
*EDA = Exploratory Data Analysis (keşifsel veri analizi): Veriyi tablolar ve grafiklerle inceleyip anlamaya çalışmak.*
- Beş grafik çizdik: kategoriye, hedef tutarına, kampanya süresine, ülkeye ve başlangıç yılı ile ayına göre başarı oranı. Kampanya süresini, **aynı hedef büyüklüğündeki** projeler arasında da karşılaştırdık, çünkü kısa kampanyaların hedefleri genelde küçük.
- **Sınıf dengesini** kontrol ettik: projelerin %36'sı fonlanmış, %64'ü fonlanmamış.

### Milestone 2: Baseline (temel ölçüt)
- İş hedefini yazdık ve **metrikleri** seçtik (bkz. karar K6).
- Model için yeni **özellikler** (girdiler) oluşturduk. Örneğin kampanya süresini gün olarak ve hedef tutarını logaritmik ölçekte.
- Veriyi böldük: **%80'i eğitim** için, **%20'si test seti** olarak, son değerlendirme için ayrıldı.
- Bir **baseline** kurduk. Akla gelebilecek en basit kural: "Hedefi ortanca değer olan 5.500 doların altındaysa proje başarılı olur." Cross validation ile F1 skoru **0,520** çıktı (test setinde 0,524). Geçilmesi gereken skor buydu.

### Milestone 3: Error analysis (hata analizi)
- Veriyi modellere hazırladık: metin kategorileri sayıya çevirdik, sayıları sadece doğrusal model için ölçekledik.
- **Üç algoritmayı** tüm eğitim seti üzerinde **5 katmanlı cross validation** ile karşılaştırdık: Logistic Regression, Random Forest ve Gradient Boosting. Gradient Boosting kazandı.
- Gradient Boosting'in **ayarlarını** yaptık (20 farklı ayar kombinasyonu) ve evet/hayır etiketi için bir **karar eşiği** seçtik.
- Final modeli test setinde değerlendirdik. Olasılıklarının **kalibre** olduğunu kontrol ettik ve ek olarak **zamana göre bir test** yaptık (2016 öncesiyle eğitip 2016 ve sonrasıyla test ettik). Test setine ilk inceleme turunda da bakılmıştı; notebook'taki nota bakın.
- **Hata analizi:** Modelin nerede yanıldığına (genel olarak, kategoriye göre, hedef büyüklüğüne göre), hangi girdilerin en önemli olduğuna ve tahmini hangi yöne ittiklerine baktık.
- Final modeli `models/` klasörüne kaydettik.

### Milestone 4: Final (nihai teslimler)
- `reports/results.json` dosyasından `presentations/build/` (Node.js, pptxgenjs) ile üretilen iki sunum hazırladık: teknik olmayan dinleyiciler için **16 slaytlık bir müşteri sunumu** (sorun, üç bulgu, modeli nasıl kurup kontrol ettiğimiz, Launch Check, sınırlamalar, öneriler; animasyonlu web sürümü: [crsbln.github.io/ds-ml-slides](https://crsbln.github.io/ds-ml-slides/), sunucu için not kâğıdıyla) ve inceleyiciler ile soru-cevap için **25 slaytlık bir teknik sunum**.
- Notebook'u temizledik: Tüm importlar en üstte, bir "How to Run" bölümü ve bir özet eklendi, kod stili `ruff` ile kontrol edildi (PEP 8 kuralları, 88 karakterlik satırlar).
- Slaytları PDF olarak aldık: [kickstarter_success_presentation.pdf](../../presentations/technical/Kickstarter_Success_Technical.pdf).
- Projeyi iki kez bağımsız olarak inceletip ([CRITIQUE.md](../reviews/CRITIQUE.md), [CRITIQUE_2.md](../reviews/CRITIQUE_2.md)) bulguları düzelttik (bkz. bölüm 11).
- Her şeyi GitHub'a gönderdik (push).

## 4. Kullandığımız araçlar ve nerede kullandığımız

| Araç | Ne işe yarar | Nerede kullandık |
|---|---|---|
| **uv** | Python'u ve projenin paketlerini kurar | Ortamı kurmak için `uv sync` ([pyproject.toml](../../pyproject.toml), `uv.lock`) |
| **VS Code + Jupyter** | Notebook editörü: kod, metin ve grafikler tek bir dosyada | Notebook'u yazmak ve çalıştırmak |
| **pandas** | Tablo verileriyle çalışmak | Veriyi yüklemek, temizlemek, gruplamak, yeni sütunlar oluşturmak |
| **NumPy** | Sayılarla hızlı matematik | Hedef tutarının logaritmasını almak (`np.log1p`) |
| **matplotlib / seaborn** | Grafik çizmek | Tüm EDA ve hata analizi grafikleri |
| **scikit-learn** | Ana makine öğrenmesi kütüphanesi | Train/test ayrımı, ön işleme, üç model, cross validation, ayar yapma, eşik, kalibrasyon, metrikler, özellik önemi, partial dependence |
| **joblib** | Python nesnelerini dosyaya kaydetmek | Final modeli `models/kickstarter_success_model.joblib` dosyasına kaydetmek |
| **ruff** | Kod stili denetleyicisi | Notebook'u PEP 8 kurallarına göre kontrol etmek |
| **Git + GitHub** | Sürüm kontrolü ve çevrimiçi depolama | Commit, push, private repo |
| **GitHub Projects / Issues / Milestones** | Görev planlama | 21 issue ve 5 milestone içeren Kanban board |
| **Kaggle** | Herkese açık veri setlerinin bulunduğu site | Veriyi indirmek |

### Üç model, sade bir dille
- **Logistic Regression:** Her girdiye bir ağırlık verir ve bunları toplayarak bir olasılık hesaplar. Basit ve açıklaması kolay.
- **Random Forest:** Birçok karar ağacı kurar ("hedef > X ve kategori = Y ise …") ve bu ağaçları oylatır.
- **Gradient Boosting:** Ağaçları sırayla kurar. Her yeni ağaç, öncekilerin hatalarını düzeltmeye çalışır. Tablo verisinde genellikle en güçlü yöntem, burada da kazanan oldu.

## 5. Verdiğimiz kararlar

| # | Soru | Seçenekler | Seçimimiz | Neden |
|---|---|---|---|---|
| K1 | Hangi proje? | 5 Zindi yarışması, Kickstarter, 10 Kaggle veri seti | **Kickstarter (Option B)** | Net bir hikayesi ve paydaşı var, tek bir veri dosyası, esnek kurallar, başlangıç seviyesine uygun |
| K2 | Hangi veri dosyası? | `201612` veya `201801` | **`ks-projects-201801.csv`** | Daha yeni, ve hedef tutarı dolara çevrilmiş halde içeriyor (`usd_goal_real`) |
| K3 | Veri GitHub'a konsun mu? | Evet / Hayır | **Hayır** (`.gitignore` içinde `data/*`) | Dosya büyük ve lisans kısıtlamaları var. Notebook, verinin nereden indirileceğini açıklıyor. |
| K4 | "Başarı" ne demek? | Sadece başarılı ve başarısız / iptal ve askıya alınanlar da başarısız | **İptal ve askıya alınanlar = fonlanmadı**. `live` ve `undefined` çıkarıldı. | Proje sahibi açısından bu projeler parayı hiç almadı. Sonucu bilinmeyen projelerden model bir şey öğrenemez. |
| K5 | Hangi sütunlar leakage? | – | `pledged`, `usd pledged`, `usd_pledged_real`, `backers`, `state` **çıkarıldı**. Proje adlarındaki "(Canceled)" ve "(Suspended)" ekleri silindi. | Ancak kampanya bittiğinde belli oluyorlar ve cevabı doğrudan ele veriyorlar |
| K6 | Hangi metrikler? | Accuracy, precision, recall, F1, ROC-AUC, log loss, Brier | **Önce olasılık:** ROC-AUC, log loss, Brier skoru ve kalibrasyon. Evet/hayır etiketi için **F1** (precision ve recall ile birlikte). | Proje sahibinin sorusu "Şansım ne?". Accuracy yanıltıcı, çünkü "hepsi başarısız olur" demek bile %64 accuracy alıyor. |
| K7 | Hangi baseline? | "Hepsi başarısız" ya da basit bir kural | **Hedef, eğitim setindeki ortancanın (5.500 $) altındaysa başarılı**. Modellerle aynı cross validation ile puanlandı. | EDA'daki en güçlü bulguya dayanıyor ve anlatması kolay |
| K8 | Veri nasıl bölünsün? | Rastgele stratified ya da zamana göre | **Rastgele, stratified, 80/20, `random_state=42`**, ayrıca ek bir **zamana göre test** | %36/%64 oranı korunuyor. Zamana göre test, modelin sonraki yıllarda nasıl çalıştığını kontrol ediyor. |
| K9 | Hangi modeller? | Birçok seçenek | **Logistic Regression, Random Forest, Gradient Boosting** | Bir basit, iki ağaç tabanlı model. Ödev en az üç model istiyor. |
| K10 | Tüm veri mi, örneklem mi? | 50 bin örneklem ya da tüm eğitim seti | **Tüm eğitim seti** (yaklaşık 298.000 proje) | Kategorileri doğrudan işleyen (native categorical) ağaçlarla modeller saniyeler içinde eğitiliyor, örnekleme gerek yok |
| K11 | Sınıf dengesizliği? | Sınıf ağırlıkları ya da eşik | **Sınıf ağırlığı yok**. Dengesizlik karar eşiğiyle ele alındı. | Sınıf ağırlıkları tüm olasılıkları yaklaşık 11 puan yukarı itiyor ve yanıltıcı yapıyordu |
| K12 | Bilinmeyen ülke kodu `N,0"` | Silmek, "Unknown" yapmak, para biriminden tahmin etmek | **Para biriminden tahmin et**, EUR projelerine `EU` etiketi | Verideki her gerçek ülke tek bir para birimi kullanıyor. Euro'yu ise birçok ülke kullanıyor. |
| K13 | Evet/hayır eşiği | Varsayılan 0,5 ya da ayarlanmış | **F1'e göre ayarlandı (0,30)**, esas olarak baseline ile karşılaştırma için. Proje sahipleri **olasılığı** üç **şans aralığında** görüyor. | Tek başına etiket, çok fazla projeye "umut verici" diyor. Aralıklar hem dürüst hem okunması kolay. |
| K14 | Notebook düzeni | Örnek notebook'u düzenlemek ya da yeni bir notebook açmak | **Yeni notebook** (`04_…`) | Kahve örneği referans olarak kalıyor |
| K15 | Slaytlar | Dil ve araç | **İngilizce**, slayt destesi olarak hazırlandı ve reponun en üst klasörüne PDF olarak kondu | Kursun dili İngilizce. Ödev PDF istiyor. |
| K16 | Hangi özellikler? | Mevcut olanların hepsi | **`main_category`** (zaten `category` içinde var) ve **`launch_year`** çıkarıldı | `launch_year` gelecekteki yıllar için kullanılamaz. `main_category` gereksiz tekrar. |
| K17 | İlk incelemeden sonra test setinin tekrar kullanımı | "Bir kez kullanıldı" demeye devam etmek ya da açıkça söylemek | Notebook'ta **açıkça söylendi** | İlk inceleme test sonuçlarına baktı ve model sonra değişti. Değişiklikler CV ve kalibrasyon ilkelerine dayanıyor; CV ve test skorları uyumlu (ROC-AUC 0,752 ve 0,754). |
| K18 | Şans aralıklarının adları | Düşük / orta / yüksek ya da ortalamaya göre | **Ortalamanın altında / civarında / üstünde** (%36), sınırlar aynı | %51'lik yazı tura gibi bir şansa "yüksek" denmemeli. Sınırlar sabit olduğu için önce sayı gösteriliyor. |
| K19 | Launch Check'te what-if | Sunmak ya da sadece tahmini göstermek | **Sadece tahmin** | Model proje sahiplerinin alışkanlıklarını öğrendi (yuvarlak süreler, başlangıç günü). Küçük girdi değişiklikleri tahmini çok oynatır ama gerçek şansı değiştirmez. |

## 6. Bulduğumuz ve düzelttiğimiz sorunlar

| Sorun | Ne gördük | Çözüm |
|---|---|---|
| Eksik başlangıç tarihleri | 7 projenin başlangıç tarihi 1970-01-01 (bilgisayarlarda "tarih yok" anlamına gelen değer). Bu yüzden kampanya süreleri 46 yıl çıkıyordu. | Bu 7 satırı çıkardık |
| Bozuk ülke kodu | 234 projenin ülkesi `N,0"` olarak kayıtlıydı. Bunlar bozuk kayıtlar: Ham verideki tüm `N,0"` satırlarında `usd pledged` değeri de eksik. | Ülkeyi para biriminden tahmin ettik (210 proje). 24 euro projesine `EU` etiketi verdik. |
| Proje adında gizli leakage | Kickstarter, bir proje iptal edildikten ya da askıya alındıktan **sonra** adına "(Canceled)" veya "(Suspended)" ekliyor (24.135 proje, bazen birden fazla kez) | Ad özelliklerini oluşturmadan önce bu eklerin hepsini sildik |
| Yanıltıcı 2018 noktası | 2018'de sadece 2 proje var (veri Ocak 2018 başında toplanmış) | 2018'i yıl grafiğinden çıkardık |

## 7. Sonuçlar

**Başarıyı ne belirliyor? (Grafiklerden)**
- **Hedef tutarı:** 1.000 dolara kadar olan projelerin %49'u fonlanıyor. 100.000 doların üstündekilerin ise sadece %6'sı. Çok küçük test projeleri (100 doların altındaki hedefler) bu sonucu değiştirmiyor.
- **Kategori:** En başarılılar Dans (%62), Tiyatro (%60) ve Çizgi Roman (%54). En başarısızlar Teknoloji (%20), Gazetecilik (%21) ve El Sanatları (%24). Fark, hedef aynı olduğunda da sürüyor: 1.000–5.000 dolarlık hedeflerde Dans projelerinin %69'u, Teknoloji projelerinin %26'sı fonlanıyor. Olası bir neden (kanıtlanmış değil): fonlanan küçük Dans, Tiyatro ve Müzik projelerinin az ama cömert destekçisi vardı (medyan 43–53 kişi, kişi başı yaklaşık 60–75 dolar). Bu, proje sahibinin kendi çevresinden gelen desteğe uyuyor. Oyun ve Çizgi Roman projelerinin ise çok sayıda küçük destekçisi vardı (98–141 kişi, kişi başı yaklaşık 40 dolar).
- **Kampanya süresi:** Aynı hedef büyüklüğündeki projeler arasında tam olarak 30 gün (proje sahiplerinin %45'i bunu seçiyor) hem 15–29 hem de 31–44 günden daha başarısız, 60 gün ise en zayıf seçenek. 5.000 dolara kadar olan hedeflerde 30 ve 60 gün en kötü iki seçenek. Daha büyük hedeflerde çok kısa (1–14 gün) ve çok uzun (61–92 gün) kampanyalar da 30 gün kadar zayıf. Her yuvarlak süre (15, 20, 25, … 60 gün) bir gün öncesinden ve sonrasından daha kötü. Bu, sürenin kendisinden çok proje sahibinin davranışına işaret ediyor.
- **Ülke ve başlangıç ayının** etkisi çok küçük.

**Model ne kadar iyi? (Hiç görmediği 74.459 test projesinde)**

| | Basit kural (baseline) | Final model |
|---|---|---|
| "Umut verici" denen her 100 projeden fonlanan (precision) | 45 | **50** |
| Fonlanan her 100 projeden bulunan (recall) | 63 | **81** |
| F1 skoru | 0,524 | **0,619** |
| ROC-AUC | – | **0,754** |
| Brier skoru (düşük olan daha iyi) | – | **0,189** |

Model, kurala göre daha fazla projeye "umut verici" diyor (%58'e karşı %50). İkisi aynı sayıda proje seçtiğinde (yarısı), modelin precision'ı **53** (kural: 45), recall'u **74** (kural: 63).

Olasılıklar tüm yılların **ortalamasında kalibre**: %35 civarında şans verilen projelerin %35'i fonlanmış. Tek tek yıllarda sapma 4 puana kadar çıkıyor. Şans aralıkları, ortalama başarı oranına (%36) göre adlandırıldı:

| Şans aralığı | Projelerin payı | Gerçekte fonlanan |
|---|---|---|
| Ortalamanın altında (%25'in altı) | %34 | %14 |
| Ortalama civarında (%25–50) | %39 | %37 |
| Ortalamanın üstünde (%50 ve üstü) | %27 | %62 |

Model en çok kategoriye, hedef tutarına ve kampanya süresine dayanıyor.

**Sınırlar:**
- "Ortalamanın altında" aralığındaki projelerin 100'de sadece 14'ü fonlanmış (ortalama: 36). Bu yüzden bu aralık iyi bir **risk uyarısı**.
- "Ortalamanın üstünde" olmak bir garanti değil: Bu projeler yaklaşık on seferin altısında fonlanıyor.
- Model **tahmin verir, tavsiye vermez**: Geçmiş proje sahiplerinin alışkanlıklarını (örneğin yuvarlak süreler) öğrendi. Bu yüzden bir girdideki küçük bir değişiklik tahmini çok oynatabilir (örnek projede 30 yerine 29 gün: %51 yerine %72), ama gerçek şansı değiştirmez.
- Sonraki yıllarda (zamana göre test) sıralama korunuyor (ROC-AUC 0,757), ama recall %81'den %75'e düşüyor ve oranlar kayıyor. Model, yeni verilerle yeniden eğitilmeli.
- Kampanyanın kendisini göremiyor: video, ödüller, tanıtım ve proje sahibinin çevresi veride yok. Bulduğu örüntüler de neden-sonuç ilişkisinin kanıtı değil, sadece ilişkiler (korelasyon).

**Proje sahiplerine öneriler:** Gerçekçi bir hedef belirle (daha küçük bir hedef, toplayabileceğin parayı da sınırlar). Kampanya süresini bilinçli seç (30 ve 60 gibi yuvarlak süreler, hemen öncesindeki ve sonrasındaki sürelerden daha kötü sonuç verdi). Kendi kategorinin başarı oranını bil.

## 8. Repodaki dosyalar

| Dosya / klasör | İçerik |
|---|---|
| [04_kickstarter_eda_and_modeling.ipynb](../../notebooks/01_kickstarter_eda_and_modeling.ipynb) | Analizin tamamı: veri temizliği, EDA, modeller, kalibrasyon, hata analizi |
| [Müşteri sunumu](../../presentations/client/Kickstarter_Launch_Check_Client.pptx) ([PDF](../../presentations/client/Kickstarter_Launch_Check_Client.pdf), [canlı](https://crsbln.github.io/ds-ml-slides/)) | Teknik olmayan dinleyiciler için 16 slayt, konuşma notlarıyla |
| [Teknik sunum](../../presentations/technical/Kickstarter_Success_Technical.pptx) ([PDF](../../presentations/technical/Kickstarter_Success_Technical.pdf)) | İnceleyiciler ve soru-cevap için 25 slayt |
| [Sunucu not kâğıdı](../../presentations/PRESENTER_CHEATSHEET.md) | Her müşteri slaytında ne söyleneceği ve slaytlardan çıkarılan ayrıntılar (İngilizce) |
| `models/kickstarter_success_model.joblib` | Kaydedilmiş final model (scikit-learn 1.9.0) |
| `data/` | İndirilen CSV dosyasının konacağı yer (GitHub'da yok) |
| [README.md](../../README.md) | Proje özeti ve projenin nasıl çalıştırılacağı |
| [CRITIQUE.md](../reviews/CRITIQUE.md) / [ELESTIRI.md](ELESTIRI.md) | Projenin bağımsız incelemesi, İngilizce ve Türkçe |
| [CRITIQUE_2.md](../reviews/CRITIQUE_2.md) / [ELESTIRI_2.md](ELESTIRI_2.md), [CRITIQUE_3.md](../reviews/CRITIQUE_3.md) / [ELESTIRI_3.md](ELESTIRI_3.md) | İkinci ve üçüncü inceleme turları |
| [DESIGN_REVIEW.md](../reviews/DESIGN_REVIEW.md) / [TASARIM_INCELEME.md](TASARIM_INCELEME.md) | Sunumun tasarım incelemesi |
| [01_assignment.md](../course/01_assignment.md), [02_kanban_board.md](../course/02_kanban_board.md) | Kurs ödevi ve Kanban rehberi |
| [03_eda-and-modeling.ipynb](../../notebooks/reference/course_example_coffee.ipynb) | Kursun örnek notebook'u (kahve verisi). Sadece referans olarak kullanıldı. |
| [SUMMARY.md](../SUMMARY.md) / [OZET.md](OZET.md) | Bu özetin İngilizce ve Türkçe hali |

## 9. Kendin nasıl çalıştırırsın?

1. Proje klasöründe `uv sync` komutunu çalıştır.
2. Kaggle'dan `ks-projects-201801.csv` dosyasını indirip `data/` klasörüne koy.
3. Notebook'u VS Code'da aç, kernel olarak `.venv` (Python 3.13) ortamını seç ve **Restart** → **Run All** düğmelerine bas. Birkaç dakika sürer.

## 10. Terimler sözlüğü

| Terim | Anlamı |
|---|---|
| **Hedef değişken (target)** | Tahmin etmek istediğimiz şey (burada: fonlandı mı, fonlanmadı mı) |
| **Özellik (feature)** | Modelin kullandığı bir girdi (hedef tutarı, kategori …) |
| **Leakage (veri sızıntısı)** | Modele gerçek hayatta sahip olamayacağı bir bilgiyi vermek. Model böylece "kopya çekmiş" olur. |
| **Eğitim / test seti** | Modelin öğrendiği veri / modeli dürüstçe kontrol etmek için ayrılan veri |
| **Cross validation** | Eğitim verisini 5 parçaya bölüp 5 kez test etmek. Böylece tek bir şanslı bölme bizi yanıltmaz. |
| **Baseline** | Akla gelebilecek en basit kural. Gerçek bir modelin geçmesi gereken skor. |
| **Precision** | "Umut verici" denen projelerin kaçının gerçekten fonlandığı |
| **Recall** | Gerçekten fonlanan projelerin kaçını modelin bulduğu |
| **F1 skoru** | Precision ile recall'un dengesi (0 = işe yaramaz, 1 = mükemmel) |
| **ROC-AUC** | Modelin başarılı projeleri başarısızların önüne ne kadar iyi sıraladığı (0,5 = tahmin etmek, 1 = mükemmel) |
| **Brier skoru / log loss** | Tahmin edilen olasılıkların gerçekte olandan ne kadar uzak olduğu (düşük olan daha iyi) |
| **Kalibrasyon** | "%40" denildiğinde, bu tür 100 projenin gerçekten yaklaşık 40'ının fonlanıp fonlanmadığı |
| **Hiperparametreler** | Bir modelin veriden öğrenilmeyen, bizim seçtiğimiz ayarları |
| **Karar eşiği** | Modelin bir projeye "umut verici" demesi için gereken minimum olasılık |
| **One-hot encoding** | Metin bir kategoriyi, modelin okuyabileceği 0/1 sütunlarına çevirmek |
| **Pipeline** | Ön işleme ve modelin tek bir nesnede toplanması. Böylece ikisi her zaman birlikte uygulanır. |
| **Partial dependence** | Bir girdi değiştiğinde ortalama tahminin nasıl değiştiğini gösteren grafik |

## 11. Bağımsız incelemeden sonra yapılan değişiklikler

Bağımsız bir inceleyici ([CRITIQUE.md](../reviews/CRITIQUE.md), Türkçesi [ELESTIRI.md](ELESTIRI.md)) kritik bir sorun bulmadı, ama 4 major, 7 minor ve 5 küçük (nit) sorun tespit etti. 13'ü tamamen, 3'ü ise kısmen çözüldü. Kalanları ikinci inceleme buldu ve o turda düzeltildi (aşağıda). İlk iki tablodaki slayt numaraları sunumun önceki 12 slaytlık sürümüne aittir.

| Bulgu | Yaptığımız değişiklik |
|---|---|
| Sınıf ağırlıklandırması skorları şişiriyor (Major) | `class_weight="balanced"` kaldırıldı. Olasılıklar artık kalibre (kalibrasyon grafiği, Brier skoru). Launch Check slaytı kalibre edilmiş bir şans ve bir aralık gösteriyor. |
| F1 eşiği kötü bir çalışma noktası (Major) | Ana çıktı artık olasılık. Modeller ROC-AUC, log loss ve Brier skoruyla karşılaştırılıyor. Proje sahipleri şans aralıklarını görüyor. %84'lük uyarı rakamı %64'lük temel oranla birlikte veriliyor. *Kısmen: Slayt 7–8 hâlâ F1 etiketini kullanıyordu. 2. turda düzeltildi (aynı oranda karşılaştırma, ortalamanın altı aralığı).* |
| "Kampanyayı kısa tut" önerisi hedefle karışıyor (Major) | Hedefe göre katmanlı bir tablo ve partial dependence grafikleri eklendi. Öneri ile 6. ve 9. slaytlar yeniden yazıldı. *Kısmen: Kapanış slaytında hâlâ "short campaign" yazıyordu. 2. turda düzeltildi.* |
| Sadece rastgele bölme (Major) | Zamana göre bir test eklendi (2016 öncesi ve 2016 sonrası). `launch_year` çıkarıldı. Genelleme iddiası yumuşatıldı. |
| "(Suspended)" ad sızıntısı (Minor) | Ad temizliği artık büyük/küçük harf fark etmeksizin tüm "(Canceled)" ve "(Suspended)" eklerini siliyor. |
| CV ve test skorları karışık, ayar kazancı gürültü düzeyinde (Minor) | Baseline aynı CV ile puanlandı. Ortalama ± standart sapma raporlandı. Test tablosu ayrıldı. Ayar için "anlamlı bir fark yaratmadı" denildi. |
| Hata analizi farklı bir model üzerinde (Minor) | Hata analizi, permutation importance (ROC-AUC ve standart sapmayla) ve partial dependence artık final modeli kullanıyor. |
| Koddan gelmeyen sayılar, küçük tutarsızlıklar (Minor) | Kategori ve ay tabloları artık yazdırılıyor. Eşik, yıl aralığı ve veri hatası sayısı tutarlı hale getirildi. *Kısmen: Slayt 4'te hâlâ 2009–2017 yazıyordu ve milestone adları ödevden farklıydı. 2. turda düzeltildi.* |
| "+%19" ve "%83" yanlış anlaşılabilir (Minor) | Slaytlar artık "100 projede kaç" şeklinde sayılar ve temel oranlar kullanıyor. |
| Hedef değişken ve hedef tutarındaki uç durumlar (Minor) | Notebook, hedefine ulaşıp iptal edilen projeleri (698), çok küçük hedefleri ve yeniden başlatılan projeleri belgeliyor. |
| README ve bağımlılıklar (Minor) | Projeye özel yeni bir README yazıldı. `pyproject.toml` yeniden adlandırıldı, `plotly` çıkarıldı, `pandas`, `numpy`, `matplotlib`, `joblib` ve `ruff` eklendi. scikit-learn sürümü not edildi. |
| Küçük sorunlar (Nit) | Satırlar ruff ile 88 karakter sınırına göre kontrol edildi. Hedef etiketleri "up to 1k" oldu. Gradient Boosting için native categorical özellikler kullanıldı. Bozuk `N,0"` kayıtları için bir not eklendi. Ayar tüm eğitim setinde yapıldı. |

### İkinci inceleme ([CRITIQUE_2.md](../reviews/CRITIQUE_2.md))

İkinci bağımsız inceleme ([CRITIQUE_2.md](../reviews/CRITIQUE_2.md), Türkçesi [ELESTIRI_2.md](ELESTIRI_2.md)) metrikleri doğruladı (test ROC-AUC 0,754) ve 2 major, 6 minor ve 2 küçük (nit) sorun buldu. Sorunların çoğu slaytların ve notebook'un ifadelerindeydi. Modelin kendisi değiştirilmedi.

| Bulgu | Durum | Yaptığımız değişiklik |
|---|---|---|
| Launch Check'teki what-if yanıltıcı tavsiye veriyor (Major) | Düzeltildi | What-if daveti kaldırıldı (slayt 10). "Explain each prediction" artık "tahminin hangi faktörlere dayandığı" anlamına geliyor (slayt 11). Notebook'a yuvarlak süreler tablosu ve bir what-if gösterimi eklendi (29 gün: %51 yerine %72). Slayt 6 ve 9 artık "round numbers like 30 and 60 days" diyor. Sadece hedefe dayalı ve `monotonic_cst` kullanan bir what-if, gelecekteki her what-if için bir koşul olarak anlatıldı; yapılmadı. |
| Kapanış slaytı "short campaign" diyor (Major) | Düzeltildi | Slayt 12 artık "Realistic goal, deliberate length, know your odds." diyor. |
| %51'e "High chance" deniyor; "benzer projeler" sayısı hesaplanmamış (Minor) | Düzeltildi | Aralıklar ortalamanın (%36) altında / civarında / üstünde olarak yeniden adlandırıldı, sınırlar aynı. Benzer projeler sayısı artık hesaplanıyor (1.375 proje, %43'ü fonlanmış) ve açıklanıyor; slayttan kaldırıldı. |
| Slayt 7–8 recall'u farklı oranlarda karşılaştırıyor (Minor) | Düzeltildi | Yeni aynı oranda karşılaştırma (eşik 0,349): precision 53'e karşı 45, recall 74'e karşı 63 (slayt 7). Slayt 8 ortalamanın altı aralığını gösteriyor (100'de 14 fonlanmış). F1 tablosu notebook'ta kalıyor. |
| Test seti inceleme turlarında tekrar kullanıldı (Minor) | Düzeltildi | Notebook'a açık bir not ve K17 kararı eklendi. Slayt 7 artık "evaluated once" demiyor. |
| Kalibrasyon ortalamada geçerli, yıl yıl değil (Minor) | Düzeltildi; yeniden kalibrasyon bilerek yapılmadı | Yeni 10 aralıklı ve yıllara göre kalibrasyon tabloları (yıllık sapma 4 puana kadar). Slayt 7'ye ve README'ye "on average" eklendi. 2017 verisiyle yeniden kalibrasyon notebook'ta öneriliyor ama yapılmadı, çünkü model bir kurs prototipi ve kullanımda değil. |
| Notebook ifadeleri çıktılarla uyuşmuyor (Minor) | Düzeltildi | Technology ve Games 0,754'ün üstünde; "about 6 to 15 times or more"; 1–14 gün ifadesi; tüm yuvarlak süre düşüşleri; yeni `N,0"` kontrol hücresi. |
| SUMMARY ve slaytlardaki tutarsızlıklar (Minor) | Düzeltildi | Milestone adları ödevle uyumlu hale getirildi (burada ve GitHub'da; issue'lar taşındı). Slayt 4 artık "2009 to early 2018" diyor. Bu düzeltme listesi yeniden yazıldı. |
| Random Forest kategorileri sıralı kodlarla alıyor (Nit) | Bilerek bırakıldı; not eklendi | One-hot ile yeniden çalıştırma yapılmadı, çünkü Gradient Boosting seçimini değiştirmezdi. Notebook artık bu dezavantajı belirtiyor. |
| Zaman testi ayarlanmış hiperparametreleri kullanıyor (Nit) | Bilerek bırakıldı; not eklendi | Ayarlama CV log loss'u sadece 0,0003 değiştirdi, etkisi ihmal edilebilir; notebook bunu söylüyor. |

**Bu turdaki diğer değişiklikler:** Slayt kaynakları artık bir build script'iyle birlikte `slides/` klasöründe (`python3 slides/build_pdf.py`). Notebook baştan sona yeniden çalıştırıldı (ana sayıların hepsi aynı kaldı). ELESTIRI.md'deki milestone'larla ilgili çevirmen notu düzeltildi. Sunuma ekip isimleri, bir outline, adım adım bir hikaye (veri hikayesi, baseline ve makine öğrenmesi slaytları, sonuç slaytı) ve 8 teknik not eklendi.

### Üçüncü inceleme ([CRITIQUE_3.md](../reviews/CRITIQUE_3.md))

Üçüncü bağımsız inceleme ([CRITIQUE_3.md](../reviews/CRITIQUE_3.md), Türkçesi [ELESTIRI_3.md](ELESTIRI_3.md)) metrikleri yeniden üretti. Kritik ya da major sorun bulmadı, ama 3 minor ve 3 küçük (nit) sorun buldu. Model değiştirilmedi. Slayt numaraları, teknik notlar appendix'e taşınmadan önceki 24 sayfalık sunuma aittir.

| Bulgu | Durum | Yaptığımız değişiklik |
|---|---|---|
| "30 ve 60 gün en kötü" sadece 5.000 dolara kadar olan hedeflerde doğru (Minor) | Düzeltildi | Slayt 10, 19 ve 23, konuşma notları, README, bu özet ve notebook artık "komşularının gerisinde kalıyor" diyor: her hedef büyüklüğünde 15–29 ve 31–44 günün altında, 60 gün en düşük. |
| "Yaratıcı projeler ürün fikirlerini geçiyor" 15 kategoriden 8'ine dayanıyor (Minor) | Düzeltildi | Slayt 8'in başlığı artık "Dance, theater and comics do best; technology worst"; dipnot gösterilmeyen kategorileri (Publishing, Photography, Crafts) sayıyor. |
| Sonuç slaytı "en önemlisi hedef" diyor, model ise kategori diyor (Minor) | Düzeltildi | Slayt 23: "hedef ve kategori en önemlisi". |
| Düzeltme listesi eski slayt numaralarını kullanıyor; dosya tabloları eksik (Nit) | Düzeltildi | Yukarıya not eklendi; sonraki inceleme dosyaları dosya tablolarına eklendi. |
| İsim temizliği "(Cancelled)" yazımını ve serbest metinli iptalleri kaçırıyor (Nit) | Bilerek bırakıldı; not eklendi | Yaklaşık 130 isim hâlâ bir iptalden bahsediyor. İsim özelliklerinin ağırlığı çok küçük (0,008 ve 0,002), bu yüzden modeli yeniden eğitmek yerine notebook bunu açıkça yazıyor. |
| Early stopping: 400 değil 231 ağaç (Nit) | Düzeltildi | Notebook ve slayt 15, `max_iter=400`'ün bir üst sınır olduğunu söylüyor. |

### Tasarım incelemesi ([TASARIM_INCELEME.md](TASARIM_INCELEME.md))

Bir tasarım incelemesi (İngilizcesi: [DESIGN_REVIEW.md](../reviews/DESIGN_REVIEW.md)) sunuma görsel tasarım için 8/10, anlaşılırlık için 7/10 puan verdi ve 22 nokta buldu (2 yüksek, 6 orta, 14 düşük öneme sahip). En büyük etkisi olan üç değişikliği uyguladık:
- 8 teknik not "Thank you"dan sonraki bir appendix'e taşındı (sayfa 17–24). Böylece konuşma, sayfa atlamadan 16 slayttan oluşuyor.
- Sınırlar slaytı artık grafiklerle aynı renk kuralını kullanıyor: uyarı turuncu (14 / 100), geri kalanı mavi.
- Daha kısa bir konuşma: Gündem slaytı kısaldı, makine öğrenmesi slaytında her adım için tek satır kaldı, model slaytının başlığı sonucu söylüyor ve konuşma notları yaklaşık 1.520 kelimeden 1.200 kelimeye indi (yaklaşık 8,5 dakika).

Destekçi çevresi kontrolünü de (bölüm 7) notebook'a, kategori teknik notuna, önerilere ("lansmandan önce destekçilerini bul") ve sonraki adımlara ekledik. Sonraki adımlar slaytındaki beşinci kart şunu soruyor: küçük dans, tiyatro ve müzik projelerinin az ama cömert destekçileri çoğunlukla arkadaşlar ve aile mi? Diğer tasarım önerileri incelemede listeleniyor ve isteğe bağlı.

Daha sonra 8–11. slaytlar (baseline, makine öğrenmesi, sonuçlar, sınırlar) daha sade bir dille yeniden yazıldı: kuralı ve modeli rastgele tahminle karşılaştıran çubuk grafikler, %80/%20 "final sınavı" çubuğu ve bantların "model %25'in altında / %50'nin üstünde diyor" diye anlatılması. Appendix'in başına olası sorular ve kısa cevaplardan oluşan bir yedek slayt eklendi.
