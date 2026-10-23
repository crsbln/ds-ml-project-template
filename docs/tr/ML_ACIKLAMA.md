# Makine Öğrenmesi Kısmı: Ne Yaptık, Neden Yaptık?

Bu dosya, Kickstarter başarı tahmini projesinin makine öğrenmesi (ML) kısmını hiç bilmeyen birine anlatır gibi açıklıyor. Her adımda dört soruyu cevaplıyoruz: **Ne yaptık? Neden? Sonuç ne? Hangi tercihi neden yaptık?**

Bütün sayılar [04_kickstarter_eda_and_modeling.ipynb](../../notebooks/01_kickstarter_eda_and_modeling.ipynb) notebook'unun çıktılarından geliyor. İngilizcesi: [ML_EXPLAINED.md](../ML_EXPLAINED.md).

---

## EDA özeti (kısaca)

- **Veri:** Kaggle'dan 378.661 Kickstarter projesi geldi. Sonucu belli olmayanları (live, undefined) attık; bozuk tarihleri ve ülke kodlarını düzelttik. Geriye **372.293 proje** kaldı ve bunların **%36'sı fonlanmıştı**.
- **Hedef (`success`):** Fonlandıysa 1, başka her durumda 0 (failed, canceled, suspended).
- **Leakage temizliği:** Kampanya bittikten sonra bilinen her şeyi attık: toplanan para, destekçi sayısı, `state` ve isimlerdeki "(Canceled)" etiketleri. Model sadece **lansmandan önce bilinen** bilgiyi görmeli.
- **Keşif:** Başarıyla en çok ilişkili üç şey hedef tutar, kategori ve kampanya süresi.
  - Küçük hedefler çok daha sık başarılı.
  - Dance ve Theater yüksek, Technology düşük.
  - 30 ve 60 gibi yuvarlak süreler komşu sürelerin gerisinde kalıyor.
- **Modelin 8 girdisi:** kategori, ülke, hedefin logaritması (`log_goal`), süre, başlangıç ayı, haftanın günü, isim uzunluğu, isimdeki kelime sayısı.

---

## Önce temel fikir: "model" ne demek?

Elimizde 372 bin geçmiş proje var ve her birinin sonucunu biliyoruz. Modelden istediğimiz şu: bu örneklere bakıp **"hangi özellikler başarıyla birlikte geliyor?"** kalıbını öğrensin, sonra **hiç görmediği yeni bir projeye** bir başarı olasılığı versin.

Buna **supervised learning** (denetimli öğrenme) deniyor, çünkü öğrenirken doğru cevapları (`success`) görüyor. Tıpkı cevap anahtarı olan deneme sınavlarıyla çalışan bir öğrenci gibi.

---

## Adım 1: Veriyi ikiye bölmek (train / test)

**Ne yaptık?** Projelerin %80'ini (297.834) **eğitim**, %20'sini (74.459) **test** için ayırdık. Test projelerine sona kadar dokunmadık.

**Neden?** Bir öğrenciyi, çalıştığı soruların aynısıyla sınarsan ezberleyip ezberlemediğini anlayamazsın. Test seti modelin **hiç görmediği "gerçek sınav"**. Modelin yeni projelerde ne kadar iyi olacağını ancak onunla dürüstçe ölçebiliriz.

**Tercihler:**
- **Neden %80/20?** Yaygın bir standart. 74 bin test projesi, sonuçların şansa bağlı olmaması için fazlasıyla yeterli.
- **Neden "stratified" (katmanlı)?** Bölmeyi, iki tarafta da başarı oranı tam %36 kalacak şekilde yaptık. Rastgele bölmede bir taraf şans eseri %38, diğeri %34 olabilirdi ve karşılaştırma bozulurdu.
- **Neden `random_state=42`?** Bölme her çalıştırmada aynı olsun, sonuçlar tekrarlanabilsin diye. 42 sayısının özel bir anlamı yok.

---

## Adım 2: Baseline, yani "yenilmesi gereken basit kural"

**Ne yaptık?** Hiç makine öğrenmesi kullanmadan çok basit bir kural kurduk: **"Hedef 5.500 doların altındaysa başarılı de."** 5.500 dolar eğitim verisindeki medyan hedef.

**Neden?** Karmaşık bir model kurup "F1 = 0,62" demek tek başına bir şey anlatmaz. Bu iyi mi, kötü mü? Basit bir kuralla kıyaslayınca anlam kazanır. Model bu kuralı yenemiyorsa, onu kurmaya değmez.

**Sonuç:** Kuralın F1 değeri **0,524**. Günlük dille:
- Kuralın "başarılı" dediği 100 projeden **45'i** gerçekten başarılı.
- Gerçekten başarılı olan 100 projeden **63'ünü** buluyor.

**Tercih: neden hedef tutar?** EDA'da en güçlü ve en kolay anlaşılan kalıp buydu. Baseline'ın amacı makul ve dürüst bir çıta koymak.

### Bu ölçüler ne demek?
- **Precision (isabet):** "Başarılı" dediklerimin ne kadarı gerçekten başarılı? → 100'de 45
- **Recall (yakalama):** Gerçekten başarılı olanların ne kadarını yakaladık? → 100'de 63
- **F1:** İkisinin dengeli bir ortalaması. Biri çok düşükse F1 de düşük çıkar.

---

## Adım 3: Üç modeli karşılaştırmak

**Ne yaptık?** Üç farklı öğrenme yöntemini denedik:

| Model | Basitçe nasıl çalışır |
|---|---|
| **Logistic Regression** | Her girdiye bir ağırlık verir ve bunları toplar. Basit ve hızlıdır. |
| **Random Forest** | Yüzlerce karar ağacı **bağımsız** olarak kurulur ve oylama yapılır. |
| **Gradient Boosting** | Ağaçlar **sırayla** kurulur. Her yeni ağaç, öncekilerin hatalarını düzeltir. |

**Nasıl karşılaştırdık? Cross validation (çapraz doğrulama).** Eğitim verisini 5 parçaya böldük. Model 4 parçayla eğitilip 5. parçada sınandı, bu da 5 kez tekrarlandı ve her seferinde başka bir parça sınav oldu. Böylece her model 5 farklı deneme sınavına girmiş oldu.

**Neden cross validation, neden doğrudan test seti değil?** Modeller arasında **seçim yapmak** da bir tür öğrenmedir. Seçimi test setine bakarak yapsaydık, test seti artık "hiç görülmemiş" olmazdı. Seçimleri eğitim verisi içinde yaptık; test setini en sona sakladık.

**Sonuç:**

| Model | ROC-AUC ↑ | Log loss ↓ | Brier ↓ |
|---|---|---|---|
| Logistic Regression | 0,728 | 0,575 | 0,197 |
| Random Forest | 0,718 | 0,581 | 0,200 |
| **Gradient Boosting** | **0,752** | **0,556** | **0,190** |

Gradient Boosting üç ölçüde de birinci oldu.

### Bu ölçüler ne demek?
- **ROC-AUC (sıralama becerisi):** Rastgele bir başarılı ve bir başarısız proje seç. Model başarılıya daha yüksek olasılık veriyor mu? 0,5 yazı-tura demek, 1,0 kusursuz demek. 0,75 "4 karşılaştırmanın 3'ünde doğru sıralıyor" demek.
- **Log loss ve Brier:** Olasılıkların **ne kadar doğru** olduğunu ölçer. Model "%90 eminim" deyip yanılırsa çok ceza alır. Değer ne kadar düşükse o kadar iyi.

### Tercihler
- **Neden Gradient Boosting'i seçtik?** En iyi sıraladı ve en iyi olasılıkları verdi. Ayrıca kategoriyi "gerçek kategori" olarak işleyebiliyor (native categorical support). Örneğin "Tabletop Games"i bir sayıya çevirip sıralamıyor, benzer kategorileri gruplayabiliyor.
- **Neden üç model denedik?** Bir yöntemin bu veri için en iyisi olduğunu önceden bilemezsin. Basit bir modelden karmaşığa doğru denemek standart yaklaşım.
- **Neden ana ölçü ROC-AUC ve log loss, accuracy değil?** Veride %64 başarısız var. Her projeye "başarısız" diyen bir model %64 accuracy alır ama işe yaramaz. Bizim asıl çıktımız bir **olasılık**. Bu yüzden sıralamayı ve olasılık kalitesini ölçtük.
- **Neden "class weights" kullanmadık?** Dengesiz veride sık kullanılan bir hile, azınlık sınıfa (başarılı projeler) daha fazla ağırlık vermek. Ama bu bütün olasılıkları yukarı iter. Model %50 dediğinde gerçek oran %36 olurdu. Proje sahibine **dürüst bir olasılık** vermek istediğimiz için bunu yapmadık.

**Küçük bir dürüstlük notu:** Random Forest kategorileri sayı kodu olarak aldı, bu da onu biraz dezavantajlı bıraktı. Ama aradaki fark büyük olduğu için seçim değişmezdi; notebook'ta bunu yazdık.

---

## Adım 4a: Ayarlama (hyperparameter tuning)

**Ne yaptık?** Gradient Boosting'in ayar düğmeleri var: kaç ağaç, her ağaç ne kadar büyük, her adım ne kadar büyük. `RandomizedSearchCV` ile **20 farklı ayar kombinasyonu** denedik ve her birini yine 5 katlı cross validation ve log loss ile ölçtük.

**Sonuç:** En iyi ayarlar `max_iter=400`, `learning_rate=0.05`, `max_leaf_nodes=31`, `min_samples_leaf=100`, `l2_regularization=1.0`. Ama kazanç neredeyse sıfırdı: log loss 0,5558'den 0,5555'e indi.

**Bunun anlamı ne?** Model zaten verinin izin verdiği sınıra yakın. Daha iyi sonuç için **daha iyi ayarlar değil, daha iyi bilgi** gerekiyor: kampanya videosu, ödüller, sahibinin çevresi gibi. Bu, müşteri sunumundaki "Limitations & Constraints" (sınırlamalar ve kısıtlar) slaytının temeli.

**Ayarlar ne anlama geliyor?**
- `learning_rate=0.05`: Her yeni ağaç hatanın sadece %5'ini düzeltir. Küçük adımlar daha yavaş ama daha sağlam öğrenir.
- `min_samples_leaf=100`: Bir ağaç dalı en az 100 projeye dayanmak zorunda. Böylece model "3 projede gördüğüm bir tesadüf" üzerine kural kuramaz, yani ezber yapamaz.
- `max_iter=400`: Ağaç sayısının **üst sınırı**. Early stopping devreye girdi ve model 231 ağaçta durdu, çünkü daha fazla ağaç artık işe yaramıyordu.

**Tercih: neden 20 rastgele kombinasyon, bütün kombinasyonlar değil?** Bütün kombinasyonları denemek (grid search) saatler sürerdi. Rastgele 20 deneme genelde iyi bir bölgeyi bulur ve sonuç zaten "fark yok" çıktı.

## Adım 4b: Karar eşiği (threshold)

**Sorun:** Model bir olasılık veriyor, örneğin %42. Peki "başarılı" mı diyeceğiz, "başarısız" mı? Varsayılan eşik %50. Ama başarı oranı sadece %36 olduğu için %50 çok yüksek bir çıta; birçok başarılı projeyi kaçırırız.

**Ne yaptık?** `TunedThresholdClassifierCV` ile F1'i en yüksek yapan eşiği, yine cross validation ile aradık. Sonuç: **0,30**. Model %30'un üstünde bir olasılık verirse "başarılı" diyor.

**Tercih:** Ana çıktımız yine **olasılık**. Evet/hayır etiketi sadece baseline kuralla kıyaslayabilmek için var. Proje sahibine "başarılı/başarısız" değil, "şansın yaklaşık %51" diyoruz.

---

## Adım 5: Test sonuçları, yani gerçek sınav

Ancak şimdi, bütün seçimler bittikten sonra test setini açtık.

| Ölçü | Sonuç | Anlamı |
|---|---|---|
| **ROC-AUC** | **0,754** | Cross validation'daki 0,752 ile neredeyse aynı, yani model ezber yapmamış |
| **F1** (eşik 0,30) | **0,619** | Baseline'ın 0,524'ünden belirgin şekilde iyi |
| **Brier** | **0,189** | Olasılıklar isabetli |

### Adil karşılaştırma: aynı sayıda seçim
F1 karşılaştırmasında bir sorun vardı: model ve kural farklı sayıda projeye "başarılı" diyordu. Ne kadar çok projeye "başarılı" dersen o kadar çok başarılıyı yakalarsın, yani karşılaştırma adil değildi. Bu yüzden modelin eşiğini 0,349'a ayarladık; böylece kuralla **aynı sayıda proje** seçti:

| | Basit kural | Model |
|---|---|---|
| "Başarılı" dediği 100 projeden gerçekten başarılı olan | 45 | **53** |
| Gerçekten başarılı 100 projeden bulduğu | 63 | **74** |
| Olasılık veriyor mu? | hayır | **evet** |

Karşılaştırma için: rastgele seçim yapsaydık 100'de 36 tutardı.

### Kalibrasyon: olasılıklara güvenebilir miyiz?
Model "%35" diyorsa, böyle 100 projeden yaklaşık 35'i gerçekten başarılı olmalı. Test setinde kontrol ettik: **ortalamada bu tutuyor**. Bunu üç anlaşılır banda da çevirdik:

| Bant | Gerçekte fonlanan |
|---|---|
| Ortalamanın altında (<%25) | 100'de **14** → iyi bir uyarı işareti |
| Ortalama civarı (%25–50) | 100'de **37** |
| Ortalamanın üstünde (>%50) | 100'de **62** → garanti değil |

**Tercih: neden bantlar?** "%47" gibi bir sayı çoğu insana pek bir şey anlatmaz. "Ortalamanın üstünde" anlaşılır. Ama önce sayıyı gösteriyoruz, çünkü %49 ile %51 farklı bantlara düşüyor.

---

## Adım 6: Ekstra testler, yani modelin zayıf yerlerini aramak

### Zaman testi
**Sorun:** Rastgele bölmede bütün yıllar karışık. Ama model **gelecekteki** projeler için kullanılacak ve başarı oranları yıllar içinde değişti: 2011'de %46, 2015'te %28.

**Ne yaptık?** Modeli **2016 öncesi** projelerle eğittik ve **2016 ve sonrası** projelerle test ettik.

**Sonuç:** Sıralama becerisi korundu (ROC-AUC 0,757). Ama olasılık seviyeleri kaydı; yıl bazında yaklaşık 4 puana kadar sapma var. Yani model "hangi proje daha iyi"yi hâlâ biliyor, ama "tam yüzde kaç"ı zamanla eskiyor. Bu yüzden önerimiz: **modeli düzenli olarak yeni verilerle güncelle**.

### Hata analizi
Kategoriye göre baktık:
- Olasılıklar her ana kategoride gerçek orana yaklaşık 1,5 puan yakın.
- Sıralama becerisi kategoriye göre değişiyor: Theater'da 0,685, Technology'de 0,804.

**Neden yaptık?** "Ortalamada iyi" bir model bazı gruplarda kötü olabilir. Bunu kontrol etmeden "model iyi" demek eksik olurdu.

---

## Adım 7: Model neye bakıyor? Kaydetme ve Launch Check

### Permutation importance (önem sıralaması)
**Fikir:** Bir girdinin değerlerini rastgele karıştır. Modelin başarısı ne kadar düşerse, o girdi o kadar önemlidir.

| Girdi | ROC-AUC kaybı |
|---|---|
| category | **0,108** |
| log_goal | **0,091** |
| duration_days | 0,034 |
| name_words, country | ~0,008 |
| diğerleri | neredeyse 0 |

Model en çok **kategoriye** ve **hedefe** bakıyor. Sonuç slaytındaki "goal and category matter most" cümlesi buradan geliyor.

### Partial dependence: hangi yöne?
Hedef arttıkça olasılık düzenli olarak düşüyor. Sürede ise 15, 20, 30, 45 ve 60 gibi yuvarlak sayılarda çukurlar var.

**Burada kritik bir yorum var:** Bir gün fark kimin destek vereceğini değiştirmez. Bu çukurlar, "süreyi düşünmeden yuvarlak bir sayı seçen" proje sahiplerinin davranışını yansıtıyor. **Bu bir korelasyon, sebep değil.** Bu yüzden Launch Check'te what-if yok. Aksi halde "30 yerine 29 gün seç, şansın %51'den %72'ye çıksın" gibi yanıltıcı bir tavsiye verirdik.

### Kaydetme ve kullanım
Model `joblib` ile tek bir dosyaya kaydedildi (pipeline ve eşik birlikte): `models/kickstarter_success_model.joblib`. Yeni bir proje girildiğinde, örneğin 10.000 dolarlık bir Tabletop Games projesi, 30 gün, ABD, model **yaklaşık %51** veriyor. Sunumdaki Launch Check örneği bu.

---

## Bütün tercihler tek tabloda

| Tercih | Neden |
|---|---|
| Sadece lansman öncesi bilgi | Gerçek kullanımda sonuçlar henüz bilinmiyor (leakage önlemi) |
| %80/20, stratified | Dürüst bir final sınavı, iki tarafta aynı başarı oranı |
| Önce baseline | Modelin gerçekten bir şey kattığını kanıtlamak için |
| Cross validation ile seçim | Test setini sona saklamak için |
| Gradient Boosting | En iyi sıralama ve en iyi olasılıklar, kategorileri doğrudan işliyor |
| Class weights yok | Olasılıklar dürüst kalsın diye |
| Log loss ile tuning | Ana çıktı olasılık olduğu için |
| Eşik 0,30 | Başarı oranı %36 olduğu için %50 çok yüksek bir çıta |
| Aynı sayıda seçimle karşılaştırma | Model ile kuralı adil kıyaslamak için |
| Zaman testi | Model geleceğe uygulanacak |
| What-if yok | Model korelasyon öğrendi, sebep değil |

**Dürüstlük notu:** İnceleme turları sırasında test setine birden fazla kez baktık. Bu yüzden notebook'ta "test seti tek bir kez kullanıldı" demiyoruz, bunu açıkça yazdık.

---

## Kendini kontrol et

1. Modelleri neden test setiyle değil de cross validation ile karşılaştırdık?
2. Class weights kullansaydık proje sahibine verdiğimiz olasılıklara ne olurdu?
3. Model 29 gün için %72, 30 gün için %51 veriyorsa, proje sahibine "29 gün seç" demek neden yanlış olur?
