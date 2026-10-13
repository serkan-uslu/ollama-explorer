<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- project-managment:managed:start project=b7966fa3-cd10-43a9-8290-88cc5e32868d -->
# Project Managment — proje köprüsü

Proje adı: Ollama Explorer
Proje kimliği: b7966fa3-cd10-43a9-8290-88cc5e32868d
Proje çalışma alanı: http://127.0.0.1:3210/projects/b7966fa3-cd10-43a9-8290-88cc5e32868d
GitHub deposu: https://github.com/serkan-uslu/ollama-explorer
GitHub Projects panosu: https://github.com/users/serkan-uslu/projects/16
Yönetilen yapı sürümü: 11

Bu blok Project Managment tarafından yönetilir ve eşitlenir; içini düzenleme. Depoya özel talimatları bloğun dışına yaz. Proje tanımı, kararlar ve geliştirme geçmişi bu dosyada değil, Project Managment veritabanındadır.

## Her oturumda

1. Depoda AGENTS.md veya CLAUDE.md commit edilmemişse ve değişiklik yalnızca Project Managment bloğundaysa, işe başlamadan yalnızca bu iki dosyayı ayrı bir commit olarak al: git commit -m "Refresh Project Managment agent bridge" -- AGENTS.md CLAUDE.md. Bloğun dışında da değişiklik varsa dokunma ve kullanıcıya sor. Gönderme.
2. MCP ile get_project (projectId: b7966fa3-cd10-43a9-8290-88cc5e32868d) ve get_structure oku: kapsam, mevcut odak, kararlar, son günlük kayıtları ve ortak kurallar. get_structure içinde includeInAgents: true olan bölümler bağlayıcı çalışma kurallarıdır; diğerlerine gerektiğinde başvur.
3. list_tasks ile panonun kayıtlı halini oku. Güncel durum gerekiyorsa sync_project çağır ve yeniden oku.
4. Kullanıcının her geliştirme isteğini panoda bir göreve bağla. Aynı işi kapsayan görev yoksa get_structure içindeki taskRules kurallarına göre create_task ile aç; açıklamada şu bölümler olsun: Amaç, Kapsam, Kabul kriterleri, Doğrulama, Bağımlılıklar; kabul kriterleri zorunludur. İşe başlarken görevi panonun devam eden durumuna al. Görev açmak ve durumunu güncellemek için kalıcı yetkin var; yalnızca soru soran veya bilgi isteyen mesajlar için görev açma. Pano bağlı değilse görev açmadan bunu bildir.
5. Kayıtlı kapsamda kal ve ilerleme bildirmeden önce gerçek depoyu incele.
6. Anlamlı bir işten sonra append_development_log veya record_progress ile gerçekte yapılanı, çalıştırılan kontrolleri ve sonraki adımı yaz. Önemli kararlar için record_decision, mevcut odak için update_project_focus kullan. Kayıtları Türkçe yaz.
7. Görevi yalnızca kabul ölçütleri doğrulanınca Done yap; commit, push veya merge tek başına kanıt değildir. Sırları ve özel notları görevlere, commit'lere veya uzak depolara koyma.
8. Kullanıcı projects klasöründeki mevcut bir projeyi Project Managment'a almanı isterse get_structure içindeki "Mevcut Projeyi Project Managment'a Alma" bölümünü izle. Mevcut bir projede yeni çalışma alanı oluşturan provizyon adımını kullanma.

## Project Managment bağlantısı

Project Managment http://127.0.0.1:3210 adresinde çalışır durumda olmalıdır. Bu proje için kapsamlı MCP sunucusunun adı `project_management_b7966fa3cd1043a9829088cc5e32868d`; genel sunucu `project_management` adını taşır ve her çağrıda `projectId: b7966fa3-cd10-43a9-8290-88cc5e32868d` ister. MCP araçları görünmüyorsa bunu kullanıcıya bildir; kurulum http://127.0.0.1:3210/settings sayfasında anlatılır. Masaüstü uygulamalarının ayar dosyalarını kendin düzenleme.

MCP kullanılamıyorsa yalnızca bu bilgisayardaki yerel API'yi kullan: GET http://127.0.0.1:3210/api/projects/b7966fa3-cd10-43a9-8290-88cc5e32868d, GET http://127.0.0.1:3210/api/structure?projectId=b7966fa3-cd10-43a9-8290-88cc5e32868d ve gerektiğinde GET http://127.0.0.1:3210/api/projects/b7966fa3-cd10-43a9-8290-88cc5e32868d/board. İsteklere X-Structure-Client: codex başlığını ekle; bu başlık ve MCP istemci adı doğrulanmış kimlik değildir. Yazma isteklerinde Content-Type: application/json, Origin: http://127.0.0.1:3210, son okunan version ve işlem için benzersiz idempotencyKey gönder. Başarısız isteği başarılı gibi bildirme.
<!-- project-managment:managed:end -->
