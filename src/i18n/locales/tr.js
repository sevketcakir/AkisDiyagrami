export default {
  brand: {
    title: 'C Akış Diyagramı',
    badge: 'C Programlama Laboratuvarı'
  },
  header: {
    sampleSelectDefault: '📂 Müfredat Örnekleri Yükle...',
    autoLayout: '✨ Otomatik Düzenle',
    autoLayoutTitle: 'Akış diyagramı bloklarını otomatik ve simetrik hizalar',
    save: '💾 Kaydet',
    saveTitle: 'Diyagramı JSON dosyası olarak dışa aktar',
    load: '📁 Yükle',
    loadTitle: 'JSON dosyasından diyagram içe aktar',
    clear: '🗑️ Temizle',
    clearTitle: 'Tüm düğümleri temizle',
    clearConfirm: 'Akış diyagramı tuvalini temizlemek istediğinizden emin misiniz?',
    langSwitch: 'Dil / Language'
  },
  samples: {
    rectangleArea: '1. Dikdörtgen Alanı (Sıralı Akış)',
    evenOrOdd: '2. Tek / Çift Sayı (If-Else Koşulu)',
    maxOfThree: '3. Üç Sayının En Büyüğü (İç İçe Koşul)',
    sum1ToN: "4. 1'den N'e Toplam (Sayaç Döngüsü)",
    factorial: "5. N Faktöriyel (Çarpımsal Döngü)",
    isPrimeCheck: '6. Asal Sayı Testi (N Asal mı?)',
    allPrimesUpToN: "7. N'e Kadar Olan Asal Sayılar (İç İçe Döngü)",
    fibonacci: '8. Fibonacci Dizisi (İlk N Terim)',
    gcdEuclideanSubtraction: "9. Öklid EBOB (Çıkarma Yöntemi)",
    gcdEuclidean: "10. Öklid EBOB (Kalanlı Bölme Modulo)"
  },
  sampleDescriptions: {
    rectangleArea: 'Genişlik ve yükseklik değerleri verilen dikdörtgenin alanını hesaplar.',
    evenOrOdd: 'Girilen sayının çift veya tek olduğunu modulo operatörü ile denetler.',
    maxOfThree: 'Kompakt çoklu girdi bloğu ile girilen 3 sayıyı karşılaştırıp en büyüğünü bulur.',
    sum1ToN: "1'den N'e kadar olan sayıların toplamını döngü ile hesaplar.",
    factorial: '1 * 2 * ... * N çarpımıyla N faktöriyeli hesaplar.',
    isPrimeCheck: 'Girilen N sayısının asal olup olmadığını bölenlerini test ederek bulur.',
    allPrimesUpToN: "2'den N'e kadar olan tüm asal sayıları iç içe döngülerle listeler.",
    fibonacci: 'Fibonacci dizisinin ilk N elemanını hesaplar ve ekrana yazar.',
    gcdEuclideanSubtraction: "İki sayının EBOB'unu Öklid ardışık çıkarma algoritmasıyla bulur.",
    gcdEuclidean: "İki sayının EBOB'unu Öklid kalanlı bölme (modulo) algoritmasıyla bulur."
  },
  palette: {
    title: 'Akış Diyagramı Blokları',
    startTitle: 'Başla',
    startDesc: 'Oval (main başlangıcı)',
    assignmentTitle: 'İşlem / Atama',
    assignmentDesc: 'Dikdörtgen (x = 5)',
    decisionTitle: 'Karar / Koşul',
    decisionDesc: 'Baklava (if / else)',
    loopTitle: 'Döngü',
    loopDesc: 'Altıgen (i = 1, N, 1)',
    inputTitle: 'Girdi (scanf)',
    inputDesc: 'Paralelkenar (veri girişi)',
    outputTitle: 'Çıktı (printf)',
    outputDesc: 'Belge (ekrana yazdırma)',
    endTitle: 'Bitiş',
    endDesc: 'Oval (return 0;)',
    instructionsTitle: 'Kullanım Talimatı',
    instructionsText: 'Soldaki blokları tuvale sürükleyin ve portları oklarla bağlayın. Bellek ve değişken değişimlerini canlı izlemek için <strong>Adımla</strong> veya <strong>Çalıştır</strong> düğmesine basın!'
  },
  controls: {
    title: 'Çalıştırma Kontrolleri',
    play: '▶ Çalıştır',
    playTitle: 'Diyagramı sürekli çalıştır',
    pause: '⏸ Duraklat',
    pauseTitle: 'Çalıştırmayı duraklat',
    step: '⏭ Adımla',
    stepTitle: 'Tek bir adımı çalıştır',
    reset: '🔄 Sıfırla',
    resetTitle: 'Başlangıç durumuna sıfırla',
    delayTitle: '⏱️ Adım Gecikmesi:',
    delayInstant: '0 ms (Anında)',
    promptTitle: 'Girdi Giriniz:',
    promptPlaceholder: 'Değer yazıp Enter tuşuna basın...',
    promptSubmit: 'Gönder'
  },
  status: {
    ready: 'Hazır',
    running: 'Çalışıyor...',
    paused: 'Duraklatıldı',
    stepping: 'Adımlanıyor...',
    finished: 'Tamamlandı (return 0)',
    error: 'Çalışma Zamanı Hatası',
    waitingInput: 'Girdi Bekleniyor'
  },
  variables: {
    title: 'Değişken Takipçisi (Bellek)',
    colVariable: 'Değişken',
    colType: 'C Tipi',
    colValue: 'Değer',
    emptyHint: 'Bellekte henüz tanımlı değişken yok'
  },
  console: {
    title: 'Konsol Çıktısı (printf)',
    clear: 'Temizle',
    emptyHint: 'Konsol çıktıları (printf) burada görüntülenecektir...'
  },
  nodes: {
    startTitle: 'BAŞLA',
    startSubtitle: 'int main()',
    endTitle: 'BİTİR',
    endSubtitle: 'return 0;',
    processHeader: 'İşlem / Atama',
    processPlaceholder: 'ör. a = 5\nb = 10',
    decisionHeader: 'Karar (If)',
    decisionPlaceholder: 'ör. puan >= 50',
    portTrue: 'Doğru (← D)',
    portFalse: 'Yanlış (Y →)',
    loopHeader: 'Döngü (Altıgen)',
    loopPlaceholder: 'ör. i = 1, N, 1',
    portBody: 'Gövde (→)',
    portIn: 'Giriş (←)',
    portExit: 'Çıkış (↓)',
    inputHeader: 'Girdi (scanf)',
    inputPlaceholder: 'ör. a, b, c',
    outputHeader: 'Çıktı (printf)',
    outputPlaceholder: 'ör. "Sonuç: " + toplam'
  },
  zoom: {
    in: 'Yakınlaştır',
    out: 'Uzaklaştır',
    reset: 'Sıfırla'
  }
};
