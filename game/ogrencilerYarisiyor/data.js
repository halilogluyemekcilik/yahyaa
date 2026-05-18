// data.js — Soru ve Cevap Veritabanı
// Her soru 5 cevap içerir. acceptedInputs ile yazım toleransı sağlanır.

const QUESTIONS = [
  {
    id: 1,
    question: "Bir yazarın olmazsa olmaz eşyası nedir?",
    answers: [
      { text: "Kalem", points: 35, acceptedInputs: ["kalem", "tukenmez", "tükenmez", "dolma kalem", "kursun kalem", "kurşun kalem"] },
      { text: "Defter / Kâğıt", points: 25, acceptedInputs: ["defter", "kagit", "kağıt", "kâğıt", "not defteri", "not kagidi", "not kağıdı", "ajanda"] },
      { text: "Bilgisayar", points: 20, acceptedInputs: ["bilgisayar", "pc", "laptop", "dizustu", "dizüstü", "tablet", "daktilo"] },
      { text: "İlham", points: 10, acceptedInputs: ["ilham", "hayal gucu", "hayal gücü", "fikir", "ilham perisi"] },
      { text: "Kahve / Çay", points: 10, acceptedInputs: ["kahve", "cay", "çay", "icecek", "içecek", "kupa", "bardak"] }
    ]
  },
  {
    id: 2,
    question: "Edebiyatımızda «aşk» denilince akla gelen kahraman çiftler hangileridir?",
    answers: [
      { text: "Leyla ile Mecnun", points: 40, acceptedInputs: ["leyla ile mecnun", "leyla mecnun", "leyla", "mecnun"] },
      { text: "Ferhat ile Şirin", points: 25, acceptedInputs: ["ferhat ile sirin", "ferhat ile şirin", "ferhat sirin", "ferhat şirin", "ferhat", "sirin", "şirin"] },
      { text: "Aslı ile Kerem", points: 15, acceptedInputs: ["asli ile kerem", "aslı ile kerem", "asli kerem", "aslı kerem", "asli", "aslı", "kerem"] },
      { text: "Mehmet ile Zilan", points: 10, acceptedInputs: ["mehmet ile zilan", "mehmet zilan", "mehmet", "zilan"] },
      { text: "Arzu ile Kamber", points: 10, acceptedInputs: ["arzu ile kamber", "arzu kamber", "arzu", "kamber"] }
    ]
  },
  {
    id: 3,
    question: "Türk edebiyatı denince akla ilk gelen şairler hangileridir?",
    answers: [
      { text: "Nazım Hikmet Ran", points: 30, acceptedInputs: ["nazim hikmet", "nazım hikmet", "nazim hikmet ran", "nazım hikmet ran", "nazim", "nazım"] },
      { text: "Mehmet Akif Ersoy", points: 25, acceptedInputs: ["mehmet akif ersoy", "mehmet akif", "akif ersoy", "akif"] },
      { text: "Aşık Veysel", points: 20, acceptedInputs: ["asik veysel", "aşık veysel", "asik veysel satiroglu", "aşık veysel şatıroğlu", "veysel"] },
      { text: "Necip Fazıl Kısakürek", points: 15, acceptedInputs: ["necip fazil", "necip fazıl", "necip fazil kisakurek", "necip fazıl kısakürek", "nfk", "necip", "kisakurek", "kısakürek"] },
      { text: "Yunus Emre", points: 10, acceptedInputs: ["yunus emre", "yunus"] }
    ]
  },
  {
    id: 4,
    question: "Kitaplar en çok nerelerde okunur?",
    answers: [
      { text: "Evimizde", points: 35, acceptedInputs: ["ev", "evimizde", "evde", "odamda", "yatakta", "salonda"] },
      { text: "Kütüphanede", points: 30, acceptedInputs: ["kutuphane", "kütüphane", "kutuphanede", "kütüphanede", "okuma salonu"] },
      { text: "Otobüste", points: 15, acceptedInputs: ["otobus", "otobüs", "otobuste", "otobüste", "toplu tasima", "metro", "vapur", "yolda", "minibus"] },
      { text: "Sınıfta / Okulda", points: 10, acceptedInputs: ["sinif", "sınıf", "sinifta", "sınıfta", "okul", "okulda", "ders", "derste"] },
      { text: "Parkta / Açık Havada", points: 10, acceptedInputs: ["park", "parkta", "acik hava", "açık hava", "disarida", "dışarıda", "bahce", "bahçe"] }
    ]
  },
  {
    id: 5,
    question: "Bir romanı ilgi çekici yapan şey nedir?",
    answers: [
      { text: "Olay Örgüsü", points: 35, acceptedInputs: ["olay orgüsü", "olay örgüsü", "olay", "kurgu", "hikaye", "hikayesi", "konu", "konusu"] },
      { text: "Sürükleyicilik", points: 25, acceptedInputs: ["surukleyicilik", "sürükleyicilik", "surukleyici", "sürükleyici", "akicilik", "akıcılık", "heyecan", "merak"] },
      { text: "Karakterler", points: 20, acceptedInputs: ["karakterler", "karakter", "kahramanlar", "kisiler", "kişiler", "tipler"] },
      { text: "Merak Duygusu", points: 10, acceptedInputs: ["merak", "merak duygusu", "gizem", "bilinmezlik", "merak tetikleme"] },
      { text: "Dil / Üslup", points: 10, acceptedInputs: ["dil", "uslup", "üslup", "anlatim", "anlatım", "anlatım tarzı", "betimleme"] }
    ]
  },
  {
    id: 6,
    question: "Bir kitabın ilk bakılan yeri neresidir?",
    answers: [
      { text: "Arka Kapak Yazısı", points: 40, acceptedInputs: ["arka kapak", "arka kapak yazisi", "arka kapak yazısı", "ozet", "özet", "arka", "konusu", "arkasi", "arkası"] },
      { text: "Ön Kapak", points: 25, acceptedInputs: ["on kapak", "ön kapak", "kapak", "kapagi", "kapağı", "tasarim", "resmi", "onu", "önü"] },
      { text: "Yazar Adı", points: 15, acceptedInputs: ["yazar", "yazarina", "yazarına", "yazari kim", "yazarı kim", "kim yazmis", "isim"] },
      { text: "İçindekiler", points: 10, acceptedInputs: ["icindekiler", "içindekiler", "fihrist", "basliklar", "başlıklar", "bolumler", "bölümler"] },
      { text: "Görseller / Resimler", points: 10, acceptedInputs: ["gorsel", "görsel", "gorseller", "görseller", "resim", "resimler", "cizimler", "çizimler", "fotograflar", "fotoğraflar"] }
    ]
  },
  {
    id: 7,
    question: "Filme ya da diziye uyarlanan kitaplar hangileridir?",
    answers: [
      { text: "Aşkı Memnu", points: 35, acceptedInputs: ["aski memnu", "aşkı memnu", "ask-i memnu", "aşk-ı memnu", "askimemnu"] },
      { text: "Yaprak Dökümü", points: 30, acceptedInputs: ["yaprak dokumu", "yaprak dökümü", "yaprak"] },
      { text: "Hababam Sınıfı", points: 15, acceptedInputs: ["hababam sinifi", "hababam sınıfı", "hababam"] },
      { text: "Selvi Boylum Al Yazmalım", points: 10, acceptedInputs: ["selvi boylum", "al yazmali", "al yazmalım", "selvi boylum al yazmali", "selvi boylum al yazmalım", "kirmizi esarp", "kırmızı eşarp"] },
      { text: "Zübük", points: 10, acceptedInputs: ["zubuk", "zübük"] }
    ]
  },
  {
    id: 8,
    question: "Öğrencilerin en çok zorlandığı dil bilgisi konuları hangileridir?",
    answers: [
      { text: "Yazım Kuralları", points: 30, acceptedInputs: ["yazim kurallari", "yazım kuralları", "yazim", "yazım", "imla", "imla kurallari", "yazilis", "yazılış"] },
      { text: "Noktalama İşaretleri", points: 25, acceptedInputs: ["noktalama isaretleri", "noktalama işaretleri", "noktalama", "virgul", "virgül", "nokta"] },
      { text: "Anlatım Bozukluğu", points: 20, acceptedInputs: ["anlatim bozuklugu", "anlatım bozukluğu", "anlatim", "anlatım", "bozukluk", "anlatim bozukluklari"] },
      { text: "Zarflar", points: 15, acceptedInputs: ["zarflar", "zarf", "belirtec", "belirteç", "zarf fiil"] },
      { text: "Edat / Bağlaç / Ünlem", points: 10, acceptedInputs: ["edat", "baglac", "bağlaç", "unlem", "ünlem", "edat baglac", "edat bağlaç", "ilgec", "ilgeç"] }
    ]
  },
  {
    id: 9,
    question: "Kitap okumayan biri en çok hangi bahaneyi söyler?",
    answers: [
      { text: "Vaktim Yok", points: 45, acceptedInputs: ["vaktim yok", "zamanim yok", "zamanım yok", "vakit yok", "zaman yok", "cok yogunum", "çok yoğunum", "vakit bulamiyor", "vakit bulamıyorum"] },
      { text: "Sıkılıyorum", points: 25, acceptedInputs: ["sikiliyorum", "sıkılıyorum", "canim sıkılıyor", "uykum geliyor", "sikiliyorum", "sikici", "sıkıcı"] },
      { text: "Telefon Daha Eğlenceli", points: 15, acceptedInputs: ["telefon", "telefon daha eglenceli", "sosyal medya", "internet", "oyun", "bilgisayar"] },
      { text: "Gözüm Ağrıyor", points: 10, acceptedInputs: ["gozum agriyor", "gözüm ağrıyor", "gozlerim agriyor", "başım ağrıyor", "yoruluyorum", "gozlerimi yoruyor"] },
      { text: "Kitap Pahalı", points: 5, acceptedInputs: ["kitap pahali", "kitap pahalı", "pahali", "pahalı", "param yok", "fiyatlar yuksek", "butcem yok", "bütçem yok"] }
    ]
  }
];
