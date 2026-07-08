Aşağıdaki eğitim planında 
- Notes koleksiyonu Access Control parametrelerindeki 'doc' hatalıdır. 'doc' degil 'data' kullanılır
- Notes koleksiyonu query duzeyine access controller yazilirken Access ve AccessResult tiplerinden yararlanıildi
- Notes koleksiyonu role bazli access control stratejisinde delete isleminde doc olmaz sadece id olur ve diger access controllerde de parametre olarak 'doc' degil 'data' olur
- field duzeyi access control test senaryolari ile yazilan ornek kodda uyusmazliklar yer alabilir

---

## 🎯 Eğitim Planı - Payload CMS 3 Access Control

### Hedef
- Access Control'ün (AC) ne olduğunu, neden önemli olduğunu anlamak
- Koleksiyon ve field düzeyinde AC yapılandırmasını öğrenmek
- Farklı senaryolarda (rol bazlı, sahiplik bazlı, sorgu bazlı) AC kurmayı deneyimlemek
- Postman ile API testleri yaparak AC'nin request/response üzerindeki etkisini gözlemlemek

### Eğitim Oturumları

| Oturum | Konu |
|--------|------|
| **1. Giriş & Temel Kavramlar** | AC nedir, varsayılan davranış, `access` property'si |
| **2. Koleksiyon Düzeyi AC - Temel** | `read`, `create`, `update`, `delete` fonksiyonları, boolean dönüş |
| **3. Koleksiyon Düzeyi AC - Sorgu Dönüşü** | Query constraint ile veri filtreleme (kullanıcının sadece kendi kayıtlarını görmesi vb.) |
| **4. Rol Tabanlı AC (RBAC)** | `role` alanı ile admin/editor/author ayrımı |
| **5. Field Düzeyi AC** | Belirli alanların okuma/yazma izinlerini kısıtlama |
| **6. İleri AC & Admin Panel Entegrasyonu** | `admin` access kontrolü, `overrideAccess` |
| **7. Postman ile Test Stratejileri** | Authentication, header'lar, farklı kullanıcı rollerle test |
| **8. Gerçek Proje Senaryoları** | Multi-tenant, sahiplik bazlı, durum bazlı (yayınlanmış/yayınlanmamış) |

---

## 🚀 Oturum 1: Giriş & Temel Kavramlar

### Access Control Nedir?

Payload CMS'de Access Control, bir kullanıcının hangi dokümanlar üzerinde **okuma, oluşturma, güncelleme, silme** işlemlerini yapabileceğini belirleyen kurallardır.

Üç seviyede AC tanımlanabilir:
1. **Koleksiyon seviyesi** - Tüm koleksiyon bazında
2. **Field seviyesi** - Belirli alanlar bazında
3. **Global seviyesi** - Global dokümanlar bazında

### Varsayılan Davranış

Payload varsayılan olarak tüm koleksiyonlarda **giriş yapmış kullanıcı** gerektirir:

```typescript
const defaultPayloadAccess = ({ req: { user } }) => {
  return Boolean(user) // user varsa true, yoksa false
}
```

Yani hiçbir AC tanımlaması yapmasanız bile, **anonim kullanıcılar hiçbir koleksiyona erişemez**.

### Access Property Yapısı

Her koleksiyonda `access` objesi ile AC tanımlanır:

```typescript
const Posts: CollectionConfig = {
  slug: 'posts',
  access: {
    create: ({ req }) => { ... },
    read: ({ req }) => { ... },
    update: ({ req }) => { ... },
    delete: ({ req }) => { ... },
    admin: ({ req }) => { ... }, // Auth-enabled koleksiyonlarda
  },
}
```

---

## 🚀 Oturum 2: Koleksiyon Düzeyi AC - Boolean Dönüş

### Örnek Proje: "Notes" Koleksiyonu

Bir not uygulaması düşünelim. Kullanıcılar `admin`, `editor`, `author` rollerine sahip olsun.

**User koleksiyonu** (auth: true):

```typescript
// collections/Users.ts
const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  fields: [
    { name: 'email', type: 'email', required: true, unique: true },
    { name: 'password', type: 'password', required: true },
    { 
      name: 'role', 
      type: 'select', 
      options: ['admin', 'editor', 'author'],
      defaultValue: 'author',
      required: true 
    },
  ],
  access: {
    read: ({ req }) => req.user?.role === 'admin', // Sadece adminler okuyabilir
    create: ({ req }) => req.user?.role === 'admin', // Sadece adminler oluşturabilir
    update: ({ req, doc }) => 
      req.user?.role === 'admin' || req.user?.id === doc?.id, // Admin veya kendisi
    delete: ({ req }) => req.user?.role === 'admin', // Sadece admin silebilir
  }
}
```

### Postman Testi - User Koleksiyonu

**Test 1: Anonim kullanıcı ile GET /api/users**
- Request: `GET http://localhost:3000/api/users`
- Header: Yok
- Beklenen: `401 Unauthorized` veya `403 Forbidden`
- **Sonuç**: Anonim kullanıcı hiçbir işlem yapamaz

**Test 2: Author rolü ile GET /api/users**
- Önce login: `POST http://localhost:3000/api/users/login` (email/password)
- Response'dan `token` al
- `GET http://localhost:3000/api/users` with Header: `Authorization: Bearer <token>`
- Beklenen: `403 Forbidden` (çünkü read sadece admin)
- **Sonuç**: Author, users koleksiyonunu göremez

**Test 3: Admin rolü ile GET /api/users**
- Admin ile login → token al
- GET /api/users with Bearer token
- Beklenen: `200 OK` ve users listesi
- **Sonuç**: Admin tüm kullanıcıları görebilir

---

## 🚀 Oturum 3: Koleksiyon Düzeyi AC - Sorgu Dönüşü

### Query Constraint ile Veri Filtreleme

`read` ve `update` fonksiyonları **boolean** yerine **query constraint** döndürebilir. Bu, kullanıcının sadece belirli koşullara uyan dokümanları görmesini/güncellemesini sağlar.

### Örnek: "Notes" Koleksiyonu - Sahiplik Bazlı

```typescript
// collections/Notes.ts
const Notes: CollectionConfig = {
  slug: 'notes',
  fields: [
    { 
      name: 'owner', 
      type: 'relationship', 
      relationTo: 'users', 
      required: true 
    },
    { name: 'title', type: 'text', required: true },
    { name: 'content', type: 'textarea' },
    { name: 'isPublic', type: 'checkbox', defaultValue: false },
  ],
  access: {
    // READ: Herkes kendi notlarını görebilir, public olanları herkes görebilir
    read: ({ req }) => {
      if (!req.user) {
        // Anonim kullanıcı sadece public notları görebilir
        return { isPublic: { equals: true } }
      }
      // Giriş yapmış kullanıcı: kendi notları + public notlar
      return {
        or: [
          { owner: { equals: req.user.id } },
          { isPublic: { equals: true } }
        ]
      }
    },
    
    // CREATE: Tüm giriş yapmış kullanıcılar not oluşturabilir
    create: ({ req }) => Boolean(req.user),
    
    // UPDATE: Sadece kendi notlarını güncelleyebilir
    update: ({ req }) => {
      if (!req.user) return false
      return { owner: { equals: req.user.id } }
    },
    
    // DELETE: Sadece kendi notlarını silebilir
    delete: ({ req }) => {
      if (!req.user) return false
      return { owner: { equals: req.user.id } }
    }
  }
}
```

### Postman Testi - Notes Koleksiyonu

**Test 1: Anonim kullanıcı GET /api/notes**
- `GET http://localhost:3000/api/notes`
- Beklenen: Sadece `isPublic: true` olan notlar gelir
- **Sonuç**: Query constraint çalıştı, anonim kullanıcıya filtreli veri döndü

**Test 2: Author ile GET /api/notes**
- Author login → token
- `GET /api/notes` with Bearer token
- Beklenen: Kendi notları + public notlar
- **Sonuç**: `or` sorgusu ile hem sahiplik hem public koşulu sağlandı

**Test 3: Author ile farklı bir kullanıcının notunu UPDATE**
- Author login → token
- `PATCH /api/notes/{başkasının_note_id}` with `{ title: "Hacked!" }`
- Beklenen: `403 Forbidden` veya not bulunamadı
- **Sonuç**: Update query constraint (`owner: { equals: req.user.id }`) nedeniyle başkasının notu güncellenemez

---

## 🚀 Oturum 4: Rol Tabanlı AC (RBAC)

### Örnek: Notes Koleksiyonu - Rol Bazlı

Farklı rollerin farklı yetkileri olsun:

```typescript
const Notes: CollectionConfig = {
  slug: 'notes',
  fields: [
    { name: 'owner', type: 'relationship', relationTo: 'users', required: true },
    { name: 'title', type: 'text', required: true },
    { name: 'content', type: 'textarea' },
  ],
  access: {
    // READ: Admin ve Editor tüm notları okuyabilir, Author sadece kendi notlarını
    read: ({ req, doc }) => {
      if (!req.user) return false
      if (req.user.role === 'admin' || req.user.role === 'editor') return true
      return req.user.id === doc?.owner // Author sadece kendi notları
    },
    
    // CREATE: Admin, Editor, Author hepsi oluşturabilir
    create: ({ req }) => {
      return ['admin', 'editor', 'author'].includes(req.user?.role)
    },
    
    // UPDATE: Admin ve Editor tüm notları güncelleyebilir, Author sadece kendi notlarını
    update: ({ req, doc }) => {
      if (!req.user) return false
      if (req.user.role === 'admin' || req.user.role === 'editor') return true
      return req.user.id === doc?.owner
    },
    
    // DELETE: Admin her şeyi silebilir, Author kendi notlarını silebilir, Editor silemez
    delete: ({ req, doc }) => {
      if (!req.user) return false
      if (req.user.role === 'admin') return true
      if (req.user.role === 'editor') return false // Editor silemez
      return req.user.id === doc?.owner // Author kendi notlarını silebilir
    }
  }
}
```

### Postman Testi - Rol Bazlı

| Test | Rol | Action | Beklenen |
|------|-----|--------|----------|
| 1 | Admin | DELETE herhangi bir not | ✅ 200 OK |
| 2 | Editor | DELETE herhangi bir not | ❌ 403 Forbidden |
| 3 | Author | DELETE kendi notu | ✅ 200 OK |
| 4 | Author | DELETE başkasının notu | ❌ 403 Forbidden |

---

## 🚀 Oturum 5: Field Düzeyi AC

### Field Access Control Yapısı

Field seviyesinde AC, belirli bir alanın okunup yazılamayacağını kontrol eder:

```typescript
const Posts: CollectionConfig = {
  slug: 'posts',
  fields: [
    {
      name: 'title',
      type: 'text',
      access: {
        create: ({ req }) => req.user?.role === 'admin', // Sadece admin title belirleyebilir
        read: ({ req }) => true, // Herkes okuyabilir
        update: ({ req }) => req.user?.role === 'admin' // Sadece admin güncelleyebilir
      }
    },
    {
      name: 'draftContent',
      type: 'textarea',
      access: {
        read: ({ req }) => req.user?.role === 'admin' || req.user?.role === 'editor',
        // Sadece admin ve editor taslak içeriği görebilir
        update: ({ req }) => req.user?.role === 'admin' // Sadece admin düzenleyebilir
      }
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      access: {
        create: ({ req }) => true, // Herkes author belirtebilir
        read: ({ req }) => true,
        update: ({ req }) => false // Hiç kimse author'ı güncelleyemez (sadece oluşturma)
      }
    }
  ]
}
```

### Field AC'de Available Properties

| Operasyon | Argümanlar |
|-----------|------------|
| **create** | `req`, `data`, `siblingData` |
| **read** | `req`, `id`, `doc`, `siblingData` |
| **update** | `req`, `id`, `data`, `siblingData`, `doc` |

### Postman Testi - Field AC

**Test 1: Author ile POST /api/posts - draftContent gönderme**
- Author login → token
- `POST /api/posts` with `{ title: "My Post", draftContent: "secret draft" }`
- Beklenen: `200 OK` ama `draftContent` kaydedilmez (çünkü create access false)
- **Sonuç**: `false` dönen field'ların değerleri **discard** edilir

**Test 2: Editor ile GET /api/posts/{id}**
- Editor login → token
- `GET /api/posts/{id}`
- Beklenen: `draftContent` alanı **gösterilmez** (çünkü read access false)
- **Sonuç**: `false` dönen field'lar response'dan **tamamen çıkarılır**

---

## 🚀 Oturum 6: İleri AC & Admin Panel

### Admin Access Control

Auth-enabled koleksiyonlarda `admin` access kontrolü, kullanıcının **Payload Admin Panel'ine erişimini** kısıtlar:

```typescript
const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  access: {
    admin: ({ req }) => req.user?.role === 'admin', // Sadece adminler admin panele girebilir
    // ... diğer access'ler
  }
}
```

### overrideAccess ile Local API

Payload Local API'si **varsayılan olarak access kontrolünü bypass eder**:

```typescript
// Access kontrolü DEVRE DIŞI (varsayılan)
await payload.create({
  collection: 'notes',
  data: { title: 'Bypass!' }
})

// Access kontrolü DEVREDE
await payload.create({
  collection: 'notes',
  data: { title: 'Respect AC' },
  user: currentUser,
  overrideAccess: false // 
})
```

### Postman ile /api/access Endpoint'i

Payload, `/api/access` endpoint'i ile mevcut kullanıcının tüm yetkilerini döndürür:

**Test: Admin ile GET /api/access**
- Admin login → token
- `GET http://localhost:3000/api/access` with Bearer token
- Response: Hangi koleksiyonlarda hangi işlemleri yapabileceğinin listesi
- **Sonuç**: Admin paneli bu veriyi kullanarak UI'ı dinamik olarak düzenler

---

## 🚀 Oturum 7: Postman ile Test Stratejileri

### Authentication Setup

Payload'da authentication iki şekilde yapılır:

1. **Cookie-based** (Admin UI için)
2. **Bearer Token** (API için)

**Login Request**:
```
POST http://localhost:3000/api/users/login
Content-Type: application/json
Body: { "email": "admin@example.com", "password": "123456" }
```

**Response**:
```json
{
  "user": { "id": "...", "email": "...", "role": "admin" },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Sonraki request'ler**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Postman Test Koleksiyonu Önerisi

| Request | Method | Endpoint | Auth | Beklenen |
|---------|--------|----------|------|----------|
| Login | POST | /api/users/login | - | 200, token |
| Get Users (anonim) | GET | /api/users | - | 401/403 |
| Get Users (author) | GET | /api/users | Bearer | 403 |
| Get Users (admin) | GET | /api/users | Bearer | 200, list |
| Create Note (author) | POST | /api/notes | Bearer | 201 |
| Get Notes (anonim) | GET | /api/notes | - | Sadece public |
| Get Notes (author) | GET | /api/notes | Bearer | Kendi + public |
| Update others note | PATCH | /api/notes/{id} | Bearer | 403 |

---

## 🚀 Oturum 8: Gerçek Proje Senaryoları

### Senaryo 1: Multi-Tenant SaaS Uygulaması

Kullanıcılar bir organizasyona aittir ve her organizasyonda roller (owner, admin, member) vardır:

```typescript
const Documents: CollectionConfig = {
  slug: 'documents',
  fields: [
    { name: 'organization', type: 'relationship', relationTo: 'organizations' },
    { name: 'owner', type: 'relationship', relationTo: 'users' },
  ],
  access: {
    read: ({ req }) => {
      if (!req.user) return false
      // Kullanıcının organizasyonundaki tüm dokümanları görebilir
      return { organization: { equals: req.user.organization } }
    },
    update: ({ req }) => {
      if (!req.user) return false
      // Sadece kendi organizasyonundaki dokümanları güncelleyebilir
      return { organization: { equals: req.user.organization } }
    }
  }
}
```

### Senaryo 2: Yayın Durumuna Göre Erişim

Sadece `status: 'published'` olan yazılar herkese açık olsun:

```typescript
const Articles: CollectionConfig = {
  slug: 'articles',
  fields: [
    { name: 'status', type: 'select', options: ['draft', 'published', 'archived'] },
    { name: 'author', type: 'relationship', relationTo: 'users' },
  ],
  access: {
    read: ({ req }) => {
      if (!req.user) {
        // Anonim: sadece yayınlanmış olanlar
        return { status: { equals: 'published' } }
      }
      if (req.user.role === 'admin' || req.user.role === 'editor') {
        return true // Admin/Editor her şeyi görebilir
      }
      // Author: kendi yazıları + yayınlanmış olanlar
      return {
        or: [
          { author: { equals: req.user.id } },
          { status: { equals: 'published' } }
        ]
      }
    }
  }
}
```

### Senaryo 3: Alan Bazlı Hassas Veri Koruması

Kullanıcı profilinde `email` ve `phone` gibi hassas alanlar sadece admin ve kullanıcının kendisi tarafından görülsün:

```typescript
const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  fields: [
    { name: 'username', type: 'text' },
    { 
      name: 'email', 
      type: 'email',
      access: {
        read: ({ req, doc }) => {
          if (!req.user) return false
          return req.user.role === 'admin' || req.user.id === doc?.id
        }
      }
    },
    {
      name: 'phone',
      type: 'text',
      access: {
        read: ({ req, doc }) => {
          if (!req.user) return false
          return req.user.role === 'admin' || req.user.id === doc?.id
        }
      }
    }
  ]
}
```

---

## 📝 Özet & Sonraki Adımlar

### Bugüne kadar öğrendiklerimiz:

| Konu | Açıklama |
|------|----------|
| **Varsayılan AC** | Giriş yapmış kullanıcı gerektirir |
| **Boolean dönüş** | true/false ile erişim izni |
| **Query dönüş** | Sorgu constraint ile veri filtreleme |
| **Rol bazlı AC** | `role` alanı ile farklı yetkiler |
| **Field AC** | Alan bazında okuma/yazma kısıtlaması |
| **Admin AC** | Admin panel erişim kontrolü |
| **overrideAccess** | Local API'de AC'yi bypass etme |
| **/api/access** | Kullanıcının yetkilerini sorgulama |

### Bir sonraki oturum için öneriler:

1. **Hooks ile AC entegrasyonu** - `beforeChange`, `afterChange` hook'ları ile AC
2. **Custom endpoints** - Özel endpoint'lerde AC kullanımı
3. **Versiyonlama ile AC** - Version'lanmış koleksiyonlarda AC
4. **Plugin'ler** - `payload-gatekeeper` veya `@kurto/payload-access` gibi RBAC plugin'leri

---

Hazır olduğunda **2. oturum** ile devam edebiliriz. O oturumda **koleksiyon düzeyinde boolean dönüşlü AC** uygulamasını beraber yapacağız ve Postman'den canlı testler gerçekleştireceğiz. 🚀