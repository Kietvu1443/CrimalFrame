// URL của file JSON database
const DB_URL = "./database/criminals.json";
let currentPage = 1;
const itemsPerPage = 9;

// Hàm lấy dữ liệu (Kết hợp JSON tĩnh + LocalStorage động)
// Hàm lấy dữ liệu (Kết hợp JSON tĩnh + IndexedDB động)
async function getCriminals() {
  try {
    // 1. Lấy dữ liệu tĩnh
    const response = await fetch(DB_URL);
    let staticData = await response.json();
    // Gán nguồn cho dữ liệu tĩnh
    staticData = staticData.map((c) => ({
      ...c,
      source: "Công An",
      status: "Đã xử lý",
    }));

    // 2. Lấy dữ liệu động từ IndexedDB (CHỈ LẤY ĐÃ DUYỆT)
    let dynamicData = [];
    try {
      dynamicData = await db.getReportsByStatus("approved");
    } catch (e) {
      console.error("Lỗi đọc DB:", e);
    }

    // Gán nguồn cho dữ liệu động (trạng thái trong DB đã là 'approved', nhưng ta muốn hiển thị text khác)
    // Map trường DB sang trường UI nếu cần thiết
    dynamicData = dynamicData.map((c) => ({
      ...c,
      source: "citizen",
      status: "ĐANG CẬP NHẬT (Tin dân báo)",
    }));

    // 3. Gộp lại (Đưa dữ liệu mới lên đầu)
    return [...dynamicData, ...staticData];
  } catch (error) {
    console.error("Lỗi khi tải dữ liệu:", error);
    return [];
  }
}

// Hàm render danh sách ra Grid
async function renderWantedList() {
  const grid = document.getElementById("wanted-grid");
  if (!grid) return;

  const criminals = await getCriminals();
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const areaTerm = document.getElementById("areaInput").value.toLowerCase();
  const filterType = document.getElementById("crimeFilter").value;
  const filterSource = document.getElementById("sourceFilter").value;

  grid.innerHTML = ""; // Xóa cũ

  // Lọc dữ liệu
  const filtered = criminals.filter((c) => {
    const matchName = c.name.toLowerCase().includes(searchTerm);
    const matchArea = c.address.toLowerCase().includes(areaTerm);
    const matchType = filterType === "" || c.crime.includes(filterType);
    const matchSource = filterSource === "all" || c.source === filterSource;

    return matchName && matchArea && matchType && matchSource;
  });

  if (filtered.length === 0) {
    grid.innerHTML =
      '<p style="grid-column: 1/-1; text-align: center;">Không tìm thấy kết quả nào.</p>';
    renderPagination(0);
    return;
  }

  // --- PHÂN TRANG ---
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Đảm bảo currentPage hợp lệ
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filtered.slice(startIndex, endIndex);

  // Hiển thị HTML
  paginatedItems.forEach((c) => {
    const card = document.createElement("div");
    card.className = "wanted-card";

    // Badge cho nguồn tin
    let sourceBadge = "";
    if (c.source === "citizen") {
      sourceBadge =
        '<span style="background: #eab308; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; margin-left: 5px;">Tin dân báo</span>';
    } else if (c.source === "Công An") {
      sourceBadge =
        '<span style="background: Red; color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; margin-left: 5px;">Tin Công An</span>';
    }

    card.innerHTML = `
            <div class="card-status">${c.status} ${sourceBadge}</div>
            <div class="card-body">
                <img src="${c.image}" alt="${c.name}" class="card-img">
                <div class="card-info">
                    <a href="wanted_detail.html?id=${c.id}" class="card-name">${c.name}</a>
                    <div class="card-detail-row">
                        <span class="card-label">Ngày sinh:</span> ${c.dob}
                    </div>
                    <div class="card-detail-row">
                        <span class="card-label">HKTT:</span> ${c.address}
                    </div>
                    <div class="card-detail-row">
                        <span class="card-label">Tội danh:</span> ${c.crime}
                    </div>
                </div>
            </div>
        `;
    grid.appendChild(card);
  });

  renderPagination(totalPages);
}

// Hàm render nút phân trang
function renderPagination(totalPages) {
  const paginationContainer = document.getElementById("pagination");
  if (!paginationContainer) return;

  paginationContainer.innerHTML = "";

  if (totalPages <= 1) return;

  // Nút Previous
  const prevBtn = document.createElement("button");
  prevBtn.className = "btn";
  prevBtn.style.border = "1px solid #ccc";
  prevBtn.textContent = "Trước";
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      renderWantedList();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  paginationContainer.appendChild(prevBtn);

  // Các nút số trang
  for (let i = 1; i <= totalPages; i++) {
    const pageBtn = document.createElement("button");
    pageBtn.className = "btn";
    pageBtn.style.border = "1px solid #ccc";
    pageBtn.textContent = i;

    if (i === currentPage) {
      pageBtn.style.backgroundColor = "var(--primary-color)";
      pageBtn.style.color = "white";
    }

    pageBtn.onclick = () => {
      currentPage = i;
      renderWantedList();
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    paginationContainer.appendChild(pageBtn);
  }

  // Nút Next
  const nextBtn = document.createElement("button");
  nextBtn.className = "btn";
  nextBtn.style.border = "1px solid #ccc";
  nextBtn.textContent = "Sau";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderWantedList();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  paginationContainer.appendChild(nextBtn);
}

// Hàm render trang chi tiết
async function renderWantedDetail() {
  const detailContainer = document.getElementById("detail-container");
  if (!detailContainer) return;

  // Lấy ID từ URL
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    detailContainer.innerHTML = "<p>Không tìm thấy thông tin đối tượng.</p>";
    return;
  }

  const criminals = await getCriminals();
  const criminal = criminals.find((c) => c.id == id);

  if (!criminal) {
    detailContainer.innerHTML = "<p>Đối tượng không tồn tại.</p>";
    return;
  }

  // Điền dữ liệu vào HTML
  document.getElementById("detail-img").src = criminal.image;
  document.getElementById("detail-name").textContent = criminal.name;

  // Thông tin chung
  const infoTable = document.getElementById("info-table");
  infoTable.innerHTML = `
        <tr><td class="info-label">Họ Tên</td><td class="info-value">: ${criminal.name}</td></tr>
        <tr><td class="info-label">Ngày sinh</td><td class="info-value">: ${criminal.dob}</td></tr>
        <tr><td class="info-label">Quê quán</td><td class="info-value">: ${criminal.hometown}</td></tr>
        <tr><td class="info-label">HKTT</td><td class="info-value">: ${criminal.address}</td></tr>
    `;

  // Xử lý dữ liệu cũ (nếu identity chưa tách riêng)
  let displayIdentity = criminal.identity;
  let displayDesc = criminal.description;

  if (!displayIdentity && displayDesc.includes("\n\nĐặc điểm nhận dạng:")) {
    const parts = displayDesc.split("\n\nĐặc điểm nhận dạng:");
    displayDesc = parts[0];
    displayIdentity = parts[1].trim();
  }

  // Đặc điểm nhận dạng
  document.getElementById("detail-identity").textContent =
    displayIdentity || "Chưa rõ";

  // Mô tả chi tiết
  document.getElementById("detail-desc").textContent = displayDesc;

  // Tội danh
  document.getElementById("detail-crime").textContent = criminal.crime;

  // Hiển thị hình ảnh khác (Evidence)
  const otherImagesGrid = document.querySelector(".other-images-grid");
  if (otherImagesGrid) {
    otherImagesGrid.innerHTML = ""; // Xóa placeholder cũ
    if (
      criminal.evidence &&
      Array.isArray(criminal.evidence) &&
      criminal.evidence.length > 0
    ) {
      criminal.evidence.forEach((imgSrc) => {
        const img = document.createElement("img");
        img.src = imgSrc;
        img.className = "other-img";
        otherImagesGrid.appendChild(img);
      });
    } else {
      otherImagesGrid.innerHTML = "<p>Không có hình ảnh khác.</p>";
    }
  }

  // Nút báo tin
  document.getElementById("btn-report").onclick = () => {
    window.location.href = `index.html?suspect=${encodeURIComponent(
      criminal.name
    )}`;
  };
}

// Khởi chạy
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("wanted-grid")) {
    renderWantedList();

    // Event listeners cho search
    const resetAndRender = () => {
      currentPage = 1;
      renderWantedList();
    };

    document
      .getElementById("searchInput")
      .addEventListener("input", resetAndRender);
    document
      .getElementById("areaInput")
      .addEventListener("input", resetAndRender);
    document
      .getElementById("crimeFilter")
      .addEventListener("change", resetAndRender);
    document
      .getElementById("sourceFilter")
      .addEventListener("change", resetAndRender);
  }

  if (document.getElementById("detail-container")) {
    renderWantedDetail();
  }
});
