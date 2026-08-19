# C Akış Diyagramı Yorumlayıcısı (Flowchart C Interpreter)

**C Akış Diyagramı Yorumlayıcısı**, Bilgisayar Mühendisliği ve Yazılım Mühendisliği 1. sınıf öğrencilerine **C Programlama Dili** ve temel algoritma mantığını görsel ve etkileşimli olarak öğretmek için özel olarak geliştirilmiş, **%100 istemci taraflı (client-side)** çalışan modern bir web uygulamasıdır.

Öğrenciler standart kağıt formatındaki akış şeması geometrik sembollerini tuval üzerinde sürükleyip birleştirerek algoritmalar oluşturabilir, programı adım adım (**Step**) veya sürekli (**Play**) çalıştırabilir, değişken bellek tablosunu canlı takip edebilir ve konsol çıktılarını anlık olarak izleyebilirler.

---

## 🌟 Öne Çıkan Özellikler

### 1. ⚙️ Durum Makinesi & Komut Deseni Yorumlayıcı (`/src/engine`)
- **Deterministik Çalıştırma Motoru**: Klasik `while` döngüleri ve asenkron karmaşalar yerine *Command Pattern* ve durum makinesi (State Machine) mimarisi kullanılır.
- Her akış düğümü `execute(context)` metodu bulunan atomik bir komuttur.
- Adım adım çalışma (**Step**), duraklatma (**Pause**), sıfırlama (**Reset**) ve program bittiğinde doğrudan yeniden çalıştırma (**Direct Re-run**) özelliklerini destekler.

### 2. 🛡️ Güvenli AST İfade Ayrıştırıcı (`/src/evaluator`)
- `jsep` tabanlı güvenli Soyut Sözdizim Ağacı (AST) motoru.
- Kesinlikle tehlikeli `eval()` veya `new Function()` kod çalıştırması **kullanmaz**.
- Aritmetik (`+`, `-`, `*`, `/`, `%`), ilişkisel (`==`, `!=`, `<`, `<=`, `>`, `>=`), mantıksal (`&&`, `||`, `!`) ve atama ifadelerini C semantiğine uygun şekilde güvenle işler.

### 3. 📐 90 Derece Manhattan Bağlantı Hatları & Otomatik Düzenleme (`/src/ui/layout`)
- **Dikey Dik Açılı Manhattan Bağlantıları**: Düğümler arasındaki oklar karmaşık yaylar yerine temiz 90° açılı hatlarla otomatik yönlendirilir.
- **Anlamsal Renklendirme**:
  - 🟢 **Doğru (True) Kolu**: Zümrüt Yeşili
  - 🔴 **Yanlış (False) Kolu**: Gül Kırmızısı
  - 🔷 **Döngü Gövdesi (Body)**: Elektrik Camgöbeği
  - 🟣 **Döngü Dönüş Hattı (Loopback)**: Mor
  - 🟡 **Aktif Yürütme Hattı**: Hareketli yürüyen karınca animasyonu
- **Otomatik Düzenle (Auto-Layout)**: *Dagre* tabanlı hiyerarşik algoritma ile blokları dikey düzlemde simetrik hizalar.

### 4. 📦 Kompakt Çoklu Atama & Çoklu Girdi Blokları
- **Çoklu Atama**: Tek bir dikdörtgen blok içine birden fazla değişken ataması yazılabilir (ör. `a = 5\nb = 10\ntoplam = a + b` veya `a=5, b=10;`).
- **Çoklu Girdi**: Tek bir paralelkenar blok içine birden fazla değişken tanımlanabilir (ör. `a, b, c`).
- **Dinamik Otomatik Büyüyen Metin Alanları**: İçeriğe göre otomatik genişleyen ve kullanıcı metin seçimini kolaylaştıran yapı.

### 5. 🌐 Çoklu Dil Desteği (Türkçe & İngilizce - İstemci Taraflı i18n)
- **Varsayılan Dil**: Türkçe (`tr`), başlıkta yer alan `[ 🇹🇷 TR | 🇬🇧 EN ]` butonu ile İngilizceye anlık geçiş yapılabilir.
- Sayfa yenilemeye gerek kalmadan tuval üzerindeki tüm blok başlıkları, port etiketleri (`Doğru/Yanlış` $\leftrightarrow$ `True/False`), durum rozetleri ve açıklamalar anında güncellenir.
- Seçilen dil tercihi `localStorage` üzerinde saklanır.

### 6. 📖 Kapsamlı Kullanım Kılavuzu & C Referansı (`❓ Kılavuz`)
- Uygulama içi kılavuz modalı ile bloklar, veri tipleri, operatörler ve klavye kısayolları detaylıca açıklanmıştır.
- ⌨️ **Klavye Kısayolları Rehberi**: `==`, `!=`, `<=`, `>=`, `&&`, `||`, `!`, `%`, `"..."` gibi özel sembollerin hem **Türkçe Q Klavye** hem de **İngilizce (US) Klavye** tuş kombinasyonları görsel tuş rozetleri (`<kbd>`) ile gösterilir.

---

## 🔷 Akış Şeması Blokları ve C Karşılıkları

| Blok Adı | Geometrik Şekil | C Dili Karşılığı | Açıklama |
| :--- | :---: | :--- | :--- |
| **Başla** | Oval | `int main() {` | Programın başlangıç giriş noktasıdır. |
| **İşlem / Atama** | Dikdörtgen | `x = 10;`<br>`toplam = a + b;` | Değişken atamaları ve matematiksel hesaplamalar. Çok satırlı veya virgüllü yazılabilir. |
| **Karar / Koşul** | Baklava (Eşkenar Dörtgen) | `if (x >= 50) { ... } else { ... }` | Mantıksal şart değerlendirmesi. Sol port **Doğru (True)**, sağ port **Yanlış (False)**. |
| **Döngü** | Altıgen | `for (i = 1; i <= N; i++)` | Sayaçlı döngü (`i = 1, N, 1`). Sağ üst **Gövde**, sağ alt **Dönüş (In)**, alt **Çıkış (Exit)**. |
| **Girdi (scanf)** | Paralelkenar | `scanf("%d %d", &a, &b);` | Kullanıcıdan klavye ile değer alır (`a, b, c`). |
| **Çıktı (printf)** | Belge (Tabanı Dalgalı) | `printf("Sonuc: %d\n", sum);` | Konsola metin veya hesaplanan değerleri yazdırır (`"Toplam: " + sum`). |
| **Bitiş** | Oval | `return 0; }` | Programın başarıyla sonlandığı noktadır. |

---

## 🔢 Desteklenen C Veri Tipleri & Operatörler

### Otomatik Tip Çıkarımı (Type Inference)
Bellek takipçisi (Variable Watcher) değişkenlerin değerlerini analiz ederek C türlerini otomatik olarak belirler:
- `int`: Tamsayılar (`x = 42`, `sayac = -5`)
- `double` / `float`: Ondalıklı reel sayılar (`pi = 3.14159`, `oran = 0.5`)
- `bool`: Mantıksal doğruluk (`true` / `false`, `1` / `0`)
- `char[]`: Çift tırnak içindeki metin dizileri (`"Merhaba Dünya"`)

### Operatörler
- **Aritmetik**: `+` (Toplama), `-` (Çıkarma), `*` (Çarpma), `/` (Bölme), `%` (Modulo / Kalan)
- **Karşılaştırma**: `==` (Eşit mi), `!=` (Eşit değil mi), `<` (Küçük), `<=` (Küçük eşit), `>` (Büyük), `>=` (Büyük eşit)
- **Mantıksal**: `&&` (Mantıksal VE), `||` (Mantıksal VEYA), `!` (Mantıksal DEĞİL)
- **Öncelik & Parantezler**: `(a + b) * (c - d)` matematiksel öncelik kurallarına tam uyumludur.

---

## ⌨️ Klavye ile Programlama Sembolleri Yazımı

Öğrencilerin klavyede yazmakta zorlandığı semboller için hızlı tuş rehberi:

| Sembol | Anlamı | 🇹🇷 Türkçe Q Klavye | 🇬🇧 İngilizce (US) Klavye | Örnek İfade |
| :---: | :--- | :--- | :--- | :--- |
| `==` | Eşit mi? | <kbd>Shift</kbd> + <kbd>0</kbd> (iki kez) | <kbd>=</kbd> <kbd>=</kbd> | `a == b` |
| `!=` | Eşit değil mi? | <kbd>Shift</kbd> + <kbd>1</kbd> ardından <kbd>=</kbd> | <kbd>Shift</kbd> + <kbd>1</kbd> ardından <kbd>=</kbd> | `x != 0` |
| `<` | Küçük mü? | <kbd>&lt;</kbd> (Z harfinin solundaki tuş) | <kbd>Shift</kbd> + <kbd>,</kbd> | `i < N` |
| `<=` | Küçük veya eşit | <kbd>&lt;</kbd> ardından <kbd>=</kbd> | <kbd>Shift</kbd> + <kbd>,</kbd> ardından <kbd>=</kbd> | `i <= 10` |
| `>` | Büyük mü? | <kbd>Shift</kbd> + <kbd>&lt;</kbd> | <kbd>Shift</kbd> + <kbd>.</kbd> | `puan > 50` |
| `>=` | Büyük veya eşit | <kbd>Shift</kbd> + <kbd>&lt;</kbd> ardından <kbd>=</kbd> | <kbd>Shift</kbd> + <kbd>.</kbd> ardından <kbd>=</kbd> | `sayi >= 0` |
| `&&` | Mantıksal VE | <kbd>Shift</kbd> + <kbd>6</kbd> (iki kez `&&`) | <kbd>Shift</kbd> + <kbd>7</kbd> (iki kez `&&`) | `a > 0 && b > 0` |
| `\|\|` | Mantıksal VEYA | <kbd>AltGr</kbd> + <kbd>-</kbd> veya <kbd>AltGr</kbd> + <kbd>&lt;</kbd> | <kbd>Shift</kbd> + <kbd>\</kbd> (iki kez `\|\|`) | `x == 0 \|\| y == 0` |
| `!` | Mantıksal DEĞİL | <kbd>Shift</kbd> + <kbd>1</kbd> | <kbd>Shift</kbd> + <kbd>1</kbd> | `!asal` |
| `%` | Kalan / Modulo | <kbd>Shift</kbd> + <kbd>5</kbd> | <kbd>Shift</kbd> + <kbd>5</kbd> | `N % i == 0` |
| `*` | Çarpma | <kbd>Shift</kbd> + <kbd>8</kbd> veya Numpad <kbd>*</kbd> | <kbd>Shift</kbd> + <kbd>8</kbd> | `f * i` |
| `/` | Bölme | <kbd>Shift</kbd> + <kbd>7</kbd> veya Numpad <kbd>/</kbd> | <kbd>/</kbd> | `a / b` |
| `"..."` | Çift Tırnak (Metin) | <kbd>Shift</kbd> + <kbd>2</kbd> veya <kbd>é</kbd> tuşu | <kbd>Shift</kbd> + <kbd>'</kbd> | `"Toplam: " + sum` |
| `;` | Noktalı Virgül | <kbd>Shift</kbd> + <kbd>,</kbd> | <kbd>;</kbd> | `a = 5; b = 10;` |

---

## 📂 Hazır Müfredat Örnekleri (10 Algoritma)

Uygulama içerisinde birinci sınıf algoritma eğitiminde en sık işlenen 10 hazır örnek bulunmaktadır:
1. **Dikdörtgen Alanı**: Sıralı akış ve kompakt işlem bloğu.
2. **Tek / Çift Sayı**: Modulo (`%`) ve `if-else` koşullu dallanma.
3. **Üç Sayının En Büyüğü**: Çoklu girdi (`a, b, c`) ve iç içe koşul blokları.
4. **1'den N'e Toplam**: Parametrik sayaçlı döngü (`i = 1, N, 1`).
5. **N Faktöriyel**: Çarpımsal döngü ve kümülatif değişkenler.
6. **Asal Sayı Testi (N Asal mı?)**: Bölünebilirlik denetimi ve erken çıkış.
7. **N'e Kadar Olan Asal Sayılar**: İç içe çift döngü yapısı.
8. **Fibonacci Dizisi**: İlk N terimin kompakt bloklarla üretimi.
9. **Öklid EBOB (Ardışık Çıkarma)**: Klasik çıkarma temelli EBOB algoritması.
10. **Öklid EBOB (Kalanlı Bölme Modulo)**: Modulo temelli modern EBOB algoritması.

---

## 📁 Proje Dizin Yapısı

```
AkisDiyagrami/
├── index.html                  # Ana uygulama arayüzü & Kılavuz Modalı
├── vite.config.js              # Vite ve Vitest yapılandırması
├── package.json                # Bağımlılıklar ve npm betikleri
├── src/
│   ├── main.js                 # Ana uygulama kontrolcüsü ve olay bağlayıcıları
│   ├── style.css               # Arayüz, tuval, kbd tuşları ve blok stilleri
│   ├── i18n/                   # İstemci Taraflı Çoklu Dil Motoru
│   │   ├── I18n.js             # Declarative DOM çevirici & olay yöneticisi
│   │   └── locales/
│   │       ├── tr.js           # Türkçe sözlük & Kılavuz içerikleri
│   │       └── en.js           # İngilizce sözlük & Guide içerikleri
│   ├── engine/                 # Durum Makinesi Yorumlayıcı Motoru
│   │   ├── InterpreterContext.js  # Bellek tablosu, konsol tamponu & durum
│   │   ├── FlowchartInterpreter.js# Yorumlayıcı durum makinesi yöneticisi
│   │   └── nodes/              # Komut Deseni Akış Blokları
│   │       ├── FlowchartNode.js   # Temel soyut komut sınıfı
│   │       ├── StartNode.js       # Başla düğümü (main)
│   │       ├── EndNode.js         # Bitiş düğümü (return 0)
│   │       ├── AssignmentNode.js  # İşlem / Çoklu Atama düğümü
│   │       ├── DecisionNode.js    # Karar / Koşul düğümü (if/else)
│   │       ├── LoopNode.js        # Altıgen Döngü düğümü (for/while)
│   │       ├── InputNode.js       # Çoklu Girdi düğümü (scanf)
│   │       ├── OutputNode.js      # Çıktı düğümü (printf)
│   │       └── index.js           # Düğüm modülü dışa aktarımı
│   ├── evaluator/
│   │   └── Evaluator.js        # jsep tabanlı güvenli AST ifade ayrıştırıcı
│   ├── ui/
│   │   ├── CanvasManager.js    # Drawflow tuval yöneticisi & anlık çeviri
│   │   ├── SidePanel.js        # Bellek tablosu, konsol & çalıştırma kontrolleri
│   │   ├── GraphParser.js      # Tuval grafiğini AST yürütme ağacına dönüştürücü
│   │   └── layout/
│   │       ├── AutoLayout.js   # Dagre tabanlı hiyerarşik otomatik hizalama
│   │       └── OrthogonalRouter.js # 90° Manhattan bağlantı yönlendiricisi
│   └── utils/
│       ├── FileHandler.js      # JSON Kaydet & Yükle & LocalStorage
│       └── SamplePrograms.js   # 10 adet hazır müfredat programı
└── tests/
    ├── autoLayout.test.js      # Otomatik hizalama birim testleri
    ├── engine.test.js          # Yorumlayıcı motoru testleri
    ├── evaluator.test.js       # AST ifade değerlendirici testleri
    ├── graphParser.test.js     # Çizge ayrıştırıcı testleri
    ├── i18n.test.js            # Çoklu dil ve anahtar uyumluluk testleri
    ├── orthogonalRouting.test.js # 90° Manhattan yönlendirici testleri
    └── samplePrograms.test.js  # 10 örnek algoritmanın yürütme testleri
```

---

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler
- **Node.js**: v18.0.0 veya üzeri (v20+ önerilir)
- **npm**: v9.0.0 veya üzeri

### 1. Bağımlılıkları Yükleme
```bash
cd AkisDiyagrami
npm install
```

### 2. Geliştirici Sunucusunu Başlatma
```bash
npm run dev
```
Uygulama yerel geliştirici sunucusunda açılacaktır (varsayılan: `http://localhost:3000`).

### 3. Otomatik Birim Testleri Çalıştırma
```bash
npm run test
```
Vitest test koşucusu çalıştırılır ve 7 farklı test dosyasındaki **48 birim testi** doğrular.

### 4. Üretim Derlemesi (Production Build)
```bash
npm run build
```
Uygulamayı sıfır sunucu bağımlılığıyla tamamen statik `/dist` klasörüne derler.

---

## 🌐 Web Sunucusuna Dağıtım (Deployment)

Uygulama **%100 saf istemci taraflı (Pure Client-Side)** çalışacak şekilde tasarlanmıştır:
- Herhangi bir veritabanı veya dinamik arka uç sunucusuna (Node.js backend, Python, PHP vb.) ihtiyaç duymaz.
- `npm run build` komutu ile oluşturulan `/dist` klasöründeki dosyaları herhangi bir statik web sunucusuna (**Nginx**, **Apache**, **GitHub Pages**, **Vercel**, **Netlify**, **Cloudflare Pages** veya yerel sunucu) kopyalayarak doğrudan yayınlayabilirsiniz.

---

## 📜 Lisans

Bu proje eğitim amaçlı geliştirilmiş olup **ISC Lisansı** altında lisanslanmıştır.
