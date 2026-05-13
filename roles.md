# PlanForge — Roller ve İzinler (RBAC) Dokümantasyonu

Bu belge, kod tabanında uygulanan **kimlik doğrulama**, **platform düzeyi roller**, **workspace üyeliği** ve **HTTP API yetkilendirme** modelinin resmi referansıdır. Ürün terminolojisinde “Workspace Admin / Manager” veya “Viewer” gibi ifadeler kullanılsa da kalıcı roller şemada aşağıda listelenen enum değerleriyle tanımlıdır.

---

## 1. Rol mimarisi özeti

Sistem **iki eksenli** bir model kullanır:

| Eksen | Kaynak | Amaç |
|--------|--------|------|
| **Platform** | `User.platformRole` | Tüm kiracılar üzerinde operasyonel yönetim (`/admin/*`). |
| **Workspace** | `WorkspaceMember.role` + `status` | Belirli bir workspace içindeki kaynaklara erişim. |

**Project düzeyinde ayrı bir rol tablosu yoktur.** Bir kullanıcı bir projeye yalnızca üyesi olduğu workspace bağlamında erişir; yetki sınırları workspace rolüyle belirlenir.

---

## 2. Platform-level roller

`User` şemasında:

| Değer | Açıklama |
|--------|-----------|
| `user` | Varsayılan son kullanıcı. |
| `platform_admin` | Platform yöneticisi; `/admin/*` API’leri ve ilgili UI. |

JWT erişim token’ında taşınan iddialar (claims): `sub`, `email`, `platformRole`.

---

## 3. Workspace-level roller

`WorkspaceMember` şemasında:

| Değer | Tipik anlam |
|--------|----------------|
| `owner` | Workspace ayarları, üye daveti/çıkarma, faturalanabilir “tam” yetki. |
| `member` | İç ekip; proje/görev üzerinde oluşturma ve düzenleme. |
| `client` | Dış paydaş / gözlemci; çoğunlukla okuma ve sınırlı etkileşim. |

Üyelik durumu `status`: `invited` | `active` | `removed`. API tarafında yetki kontrolü **`active`** üyeler için yapılır.

### 3.1 “Workspace Admin / Manager” eşlemesi

Kalıcı şemada **`manager` veya `admin` rolü yoktur.** Ürün dilinde “workspace admin” genelde **`member`** ile eşlenir (operasyonel işleri yürüten iç kullanıcı). Yapısal ve üyelik yönetimi **`owner`** ile ilişkilendirilir.

### 3.2 “Client / Viewer” eşlemesi

Kalıcı rol adı **`client`**’tır; okuma ağırlıklı erişim için kullanılır.

### 3.3 “Guest”

**Misafir / guest workspace rolü tanımlı değildir.** Kimliği doğrulanmamış kullanıcılar:

- `@Public()` ile işaretlenmiş uçlara,
- auth sayfalarına ve genel site içeriğine

erişir. Ücretli veya workspace verisi **JWT** ile korunur.

---

## 4. Project-level erişim mantığı

- Proje ve görev uçları URL’de `workspaceId` (ve gerektiğinde `projectId`) taşır.
- `WorkspaceRoleGuard` önce kullanıcının ilgili workspace’te **aktif üye** olduğunu doğrular, sonra `@WorkspaceRoles(...)` ile izin verilen workspace rolleriyle kıyaslar.
- **Ayrı “project member” tablosu veya proje bazlı RBAC yoktur**; tüm projeler workspace içindedir.

---

## 5. Rol hiyerarşisi (yetki genişliği)

Workspace içi kabaca sıralama (dar → geniş yetki):

```text
client  ⊂  member  ⊂  owner
```

`platform_admin` bu hiyerarşinin **üzerinde değildir** — farklı bir boyuttur; aşağıdaki edge case bölümüne bakınız.

---

## 6. Permission matrix (HTTP API)

Aşağıdaki tablo **controller’daki `@WorkspaceRoles` dekoratörlerine** göre özetlenmiştir. Boş hücre = uç, ilgili guard ile korunmuyor veya global JWT yeterli.

### 6.1 Workspace

| Uç (özet) | owner | member | client |
|-----------|:-----:|:------:|:------:|
| `POST /workspaces` (oluştur) | ✓ (JWT) | ✓ (JWT) | ✓ (JWT) |
| `GET /workspaces` (liste) | ✓ | ✓ | ✓ |
| `GET /workspaces/:workspaceId` | ✓ | ✓ | ✓ |
| `PATCH /workspaces/:workspaceId` | ✓ | — | — |
| `GET /workspaces/:workspaceId/members` | ✓ | ✓ | ✓ |
| `POST /workspaces/:workspaceId/invites` | ✓ | — | — |
| `PATCH /workspaces/:workspaceId/members/:userId` | ✓ | — | — |
| `DELETE /workspaces/:workspaceId/members/:userId` | ✓ | — | — |

### 6.2 Projects

| Uç | owner | member | client |
|----|:-----:|:------:|:------:|
| `POST .../projects` | ✓ | ✓ | — |
| `GET .../projects` | ✓ | ✓ | ✓ |
| `GET .../projects/:projectId` | ✓ | ✓ | ✓ |
| `PATCH .../projects/:projectId` | ✓ | ✓ | — |
| `DELETE .../projects/:projectId` | ✓ | — | — |

### 6.3 Tasks

| Uç | owner | member | client |
|----|:-----:|:------:|:------:|
| `POST .../tasks` | ✓ | ✓ | — |
| `GET .../tasks` | ✓ | ✓ | ✓ |
| `GET .../tasks/tree` | ✓ | ✓ | ✓ |
| `GET .../tasks/:taskId` | ✓ | ✓ | ✓ |
| `PATCH .../tasks/:taskId` | ✓ | ✓ | — |
| `DELETE .../tasks/:taskId` | ✓ | ✓ | — |

### 6.4 Dependencies

| Uç | owner | member | client |
|----|:-----:|:------:|:------:|
| `POST .../dependencies` | ✓ | ✓ | — |
| `GET .../dependencies` | ✓ | ✓ | ✓ |
| `DELETE .../dependencies/:depId` | ✓ | ✓ | — |

### 6.5 Resources (allocations + histogram)

| Uç | owner | member | client |
|----|:-----:|:------:|:------:|
| `POST .../allocations` | ✓ | ✓ | — |
| `GET .../allocations` | ✓ | ✓ | ✓ |
| `PATCH .../allocations/:id` | ✓ | ✓ | — |
| `DELETE .../allocations/:id` | ✓ | ✓ | — |
| `GET .../resources/histogram` | ✓ | ✓ | ✓ |

### 6.6 Planning (CPM)

| Uç | owner | member | client |
|----|:-----:|:------:|:------:|
| `GET .../planning/cpm` | ✓ | ✓ | ✓ |
| `POST .../planning/cpm/recompute` | ✓ | ✓ | — |

> **Not:** CPM uçları ayrıca workspace **`entitlements.cpmEnabled`** kontrolüne tabidir; plan özelliği kapalıysa `403` / `PLAN_FEATURE_DISABLED`.

### 6.7 Analytics

| Uç | owner | member | client |
|----|:-----:|:------:|:------:|
| `GET .../analytics/overview` | ✓ | ✓ | ✓ |
| `GET .../analytics/burndown` | ✓ | ✓ | ✓ |

### 6.8 Platform admin (`/admin/*`)

Tüm `AdminController` sınıfı `PlatformAdminGuard` ile korunur; **`platform_admin`** olmayan kimlikler bu yolu kullanamaz.

Örnek kapsam: istatistikler, kullanıcı/workspace tabloları, CMS yönetimi, faturalama operasyonları.

---

## 7. RBAC kuralları (uygulanabilir ilkeler)

1. **Kimlik zorunluluğu:** Global `JwtAuthGuard`; `@Public()` istisnası yoksa her istek doğrulanmış JWT ister.
2. **Workspace izolasyonu:** Workspace bağlamı `workspaceId` parametresi ile taşınır; üyelik başka workspace’ten **otomatik devralınmaz**.
3. **Rol birleşimi:** Bir kullanıcının birden fazla workspace’te farklı rolleri olabilir; **API her istekte tek workspace bağlamında** değerlendirilir.
4. **Üyelik durumu:** `status !== 'active'` üyeler için `WorkspaceRoleGuard` reddeder.
5. **Plan / kota:** Üye daveti gibi işlemlerde `maxMembers` ve özellik bayrakları ek katman oluşturur (RBAC dışı iş kuralı).

---

## 8. API authorization yaklaşımı

### 8.1 Global JWT

```text
AppModule → APP_GUARD: JwtAuthGuard
```

`JwtAuthGuard`, handler/controller’da `@Public()` yoksa Passport JWT stratejisini çalıştırır.

### 8.2 Platform admin

```typescript
// Özet: AdminController sınıf düzeyi
@UseGuards(PlatformAdminGuard)
@Controller('admin')
export class AdminController { /* ... */ }
```

### 8.3 Workspace rolü

```typescript
// Özet: WorkspaceRoleGuard + route meta verisi
@UseGuards(WorkspaceRoleGuard)
@WorkspaceRoles('owner', 'member')
@Post()
create() { /* ... */ }
```

Guard davranışı (özet):

1. `req.user.sub` ve `req.params.workspaceId` zorunlu.
2. `WorkspaceMember` kaydı (`active`) bulunur.
3. Kayıttaki `role`, `@WorkspaceRoles` listesinde yoksa `403` (`INSUFFICIENT_WORKSPACE_ROLE`).

**Varsayılan:** Handler’da meta yoksa guard içinde yedek liste **`['owner','member']`** kabul edilir (yalnızca bu roller).

---

## 9. Multi-tenant isolation mantığı

- **Tenant birimi:** `Workspace` (`workspaceId`).
- Veri erişimi REST yollarında workspace segmenti ile bağlanır; guard üyeliği bu kimlik üzerinden doğrular.
- **Platform admin** global raporlama için `/admin/*` kullanır; bu uçlar workspace guard’ını bypass etmez şekilde **ayrı** bir yüzeydir.
- **Önemli:** `platform_admin`, otomatik olarak tüm workspace üyeliklerine **eklenmez**. Bir admin, başka bir kullanıcının workspace verisine üye olmadan **yalnızca admin API’leri** üzerinden erişebilir; ürün içi “normal” workspace rotaları için üyelik gerekebilir (bkz. edge case).

---

## 10. Frontend rol guard mantığı

### 10.1 Oturum

- `Protected`: kullanıcı yoksa `/login`.
- `PlatformAdminOnly`: `user.platformRole === 'platform_admin'` değilse `/dashboard`.

### 10.2 Dashboard bileşeni seçimi

`/dashboard` rotası, `/me/dashboard` (aggregated) yanıtındaki `myRole` ile görünüm seçer:

| `myRole` | Görünüm |
|-----------|---------|
| `platform_admin` | `AdminDashboardView` |
| `owner` | `OwnerDashboardView` |
| `member` | `MemberDashboardView` |
| `client` | `ClientDashboardView` |

`myRole` çözümlemesi (backend özeti): önce platform admin; değilse kullanıcının workspace rolleri arasında **owner > member > client** önceliği.

### 10.3 Navigasyon

`AppLayout.buildNavLinks`:

- **Platform admin:** Activity, All workspaces, Users, Billing, Settings vb.
- **Owner / Member:** Workspaces + bağlamda Projects.
- **Client:** “Projects” etiketiyle Workspaces listesine yönlendirme (dar nav).

> **Uyarı:** Frontend kontrolleri UX içindir; asıl güvenlik backend guard’larındadır.

---

## 11. Roller — ayrıntılı kartlar

### 11.1 Platform Admin

| | |
|--|--|
| **Açıklama** | Platform genelinde kullanıcı/workspace/CMS/faturalama yönetimi. |
| **Yetkiler** | `/admin/*` altındaki operasyonlar (JWT + `platform_admin`). |
| **Yasaklı** | Role bağlı olmayan kullanıcıların admin corpus’una erişimi (403 `NOT_PLATFORM_ADMIN`). |
| **Erişebildiği alanlar** | Admin dashboard, billing modülü, kullanıcı/workspace yönetimi, ayarlar (UI’da `PlatformAdminOnly`). |
| **Yönettiği kaynaklar** | Platform kullanıcı kayıtları, workspace listeleri, CMS, faturalama nesneleri (API kapsamına göre). |
| **Billing** | Tam operasyonel erişim (`/dashboard/billing/*` UI + `/admin/billing/*` API). |
| **User management** | Admin kullanıcı tabloları ve düzenleme uçları. |
| **Project/task** | Doğrudan “platform rolü” ile değil; workspace üyesiyse ilgili workspace API’leri. |

### 11.2 Workspace Owner

| | |
|--|--|
| **Açıklama** | Workspace’in yapılandırması ve üyelik yaşam döngüsünden sorumlu ana rol. |
| **Yetkiler** | Workspace güncelleme; davet; üye rolü değişimi; üye çıkarma; proje silme (archive). |
| **Yasaklı** | `client` veya `member` için tanımlı dar uçlar owner için genelde açıktır; üst platform işlemleri (`/admin`) için `platform_admin` gerekir. |
| **Erişebildiği alanlar** | Kendi workspace’leri (üyelik + owner rolü). |
| **Yönettiği kaynaklar** | Workspace ayarları, üyeler, projeler (oluşturma/silme dahil). |
| **Billing** | Workspace planı / koltuk olayları üyelik değişimleriyle ilişkili; platform faturalama konsolu **`platform_admin`**. |
| **User management** | Kendi workspace’sinde davet ve rol güncelleme. |
| **Project/task** | Oluşturma, güncelleme, silme; okuma. |

### 11.3 Workspace Admin / Manager → **`member`**

| | |
|--|--|
| **Açıklama** | İç ekip üyesi; işbirlikçi düzenleme yetkisi. |
| **Yetkiler** | Proje oluşturma/güncelleme; görev CRUD (client’tan farklı olarak yazma); bağımlılık ve kaynak tahsisi yazma; CPM yeniden hesaplama; analytics okuma. |
| **Yasaklı** | Workspace meta patch; davet/rol/member silme; proje silme (`DELETE .../projects`). |
| **Erişebildiği alanlar** | Üye olduğu workspace’ler. |
| **Yönettiği kaynaklar** | Proje, görev, allocation, dependency (yazma where applicable). |
| **Billing** | Doğrudan platform billing konsolu yok. |
| **User management** | Workspace üye yönetimi yok. |
| **Project/task** | Tam yazma (platform kuralları içinde). |

### 11.4 Member (şema adı ile)

Şema ile ürün terimi aynıdır; kart için bkz. **11.3**.

### 11.5 Client / Viewer → **`client`**

| | |
|--|--|
| **Açıklama** | Dış rol; gözlem ve raporlama ağırlıklı. |
| **Yetkiler** | Workspace/project/task **okuma**; analytics okuma; çoğu liste/tree uçları; allocation **list**; CPM **GET**; dependency **GET**. |
| **Yasaklı** | Görev/proje oluşturma veya güncelleme; allocation/dependency yazma; CPM recompute POST; proje silme. |
| **Erişebildiği alanlar** | Üye olduğu workspace’ler (salt okuma profili). |
| **Yönettiği kaynaklar** | Yok (veya çok sınırlı genişletme yok). |
| **Billing** | Yok. |
| **User management** | Yok. |
| **Project/task** | Okuma ağırlıklı. |

### 11.6 Guest

| | |
|--|--|
| **Açıklama** | Oturum açmamış ziyaretçi. |
| **Yetkiler** | `@Public()` uçlar ve marketing/site sayfaları. |
| **Yasaklı** | Tüm workspace/project/task API’leri. |
| **Kaynaklar** | Yok. |

---

## 12. Edge cases

| Durum | Davranış |
|--------|-----------|
| Çoklu workspace rolü | Her API çağrısı tek `workspaceId` bağlamında değerlendirilir. |
| `myRole` önceliği (dashboard) | Owner üyeliği varsa aggregate rol owner seçilir (platform admin hariç). |
| Çoklu `owner` üyeliği | Şema birden fazla `owner` rolüne izin verir; iş kuralları tek “workspace.ownerId” ile birincil sahipliği tutabilir — çakışma politikası ürün kararıdır. |
| Platform admin + workspace üyesi değil | Admin API erişimi olabilir; workspace-scoped route’lar üyelik istemeye devam eder. |
| Plan özelliği kapalı | RBAC geçse bile `cpmEnabled` vb. iş kuralları `403` dönebilir. |
| Davet için kullanıcı yok | API, kayıtlı e-posta bekler (`INVITE_USER_NOT_FOUND`). |

---

## 13. Security notes

- Yetkilendirme **sunucu tarafında** guard’larla uygulanır; istemci yalnızca UX filtresi yapar.
- JWT secret rotation ve süre politikası ortam değişkenleriyle yönetilir.
- Throttling global (`ThrottlerGuard`) brute-force / abuse için ek katmandır.
- Soft-deleted kullanıcılar oturum politikası `UsersService.assertEligibleForSession` ile bağlanır (detay için kullanıcı servisi).

---

## 14. Best practices

1. Yeni workspace-scoped controller’larda **`WorkspaceRoleGuard`** ve **`@WorkspaceRoles`** kullanın.
2. Platform yüzeyleri için **`PlatformAdminGuard`**’ı controller düzeyinde tutun.
3. Müşteri verisine dokunan iç uçlarda **`@Public()` eklemeden önce** iki kez gözden geçirin.
4. Ürün içi “manager” ihtiyacı doğarsa ya **`member`** davranışını genişletin ya da şemaya **yeni bir enum** ekleyin; guard’ları güncelleyin.
5. Permission isimleri için tek kaynak: **dekoratör meta + guard**; dokümantasyonu PR ile güncel tutun.

---

## 15. Permission naming convention (öneri)

| Alan | Öneri |
|------|--------|
| Platform | `platform.{resource}.{action}` — örn. `platform.users.patch`. |
| Workspace | `workspace.{resource}.{action}` — örn. `workspace.members.invite`. |
| HTTP eşlemesi | Nest dekoratörleri veya policy tablosu ile eşlenir. |

Mevcut kodda çoğunlukla **implicit** isimlendirme vardır (dekoratör + guard); ileride merkezi policy tablosuna taşınabilir.

---

## 16. Örnek route protection

### 16.1 Backend

```typescript
@UseGuards(WorkspaceRoleGuard)
@WorkspaceRoles('owner', 'member')
@Post('workspaces/:workspaceId/projects/:projectId/tasks')
async createTask() {
  /* ... */
}
```

```typescript
@UseGuards(PlatformAdminGuard)
@Get('admin/stats/overview')
async overview() {
  /* ... */
}
```

### 16.2 Frontend

```tsx
function PlatformAdminOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.platformRole !== 'platform_admin') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
```

---

## 17. Önerilen veri modeli (referans)

### 17.1 User (platform)

```typescript
// Özet — Mongoose şema ile uyumlu
platformRole: 'platform_admin' | 'user';
isActive: boolean;
deletedAt?: Date;
```

### 17.2 WorkspaceMember

```typescript
workspaceId: ObjectId;
userId: ObjectId;
role: 'owner' | 'member' | 'client';
status: 'invited' | 'active' | 'removed';
```

### 17.3 JWT payload

```typescript
interface JwtPayload {
  sub: string;
  email: string;
  platformRole: 'platform_admin' | 'user';
}
```

---

## 18. Önerilen RBAC mimarisi (evrim)

Kısa vadede mevcut **meta + guard** modeli yeterlidir. Büyüme için:

1. **Policy kayıt defteri:** route → gerekli izin kümesi.
2. **Öznitelik bazlı kısıtlar:** örn. görev atama kuralları (isteğe bağlı).
3. **Audit log:** özellikle admin ve üyelik değişiklikleri.
4. **Ayrı “project role”** gereksinimi çıkarsa: `ProjectMember` koleksiyonu + guard zinciri.

---

## 19. Sürüm notu

Bu doküman, kod tabanındaki NestJS guard’ları ve React yönlendirme bileşenleri ile uyumlu olacak şekilde yazılmıştır. API yüzeyi genişledikçe **Permission matrix** bölümü güncellenmelidir.

---

*Dosya: `roles.md` — PlanForge RBAC referansı.*
