import {
    db,
    collection,
    query,
    where,
    limit,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from "./config/firebase.js";

console.log("admin.js loaded");

/* =====================================================
   SMALL SHARED HELPERS
===================================================== */

function showPopup(message, type = "info") {
    const pop = document.createElement("div");
    const popup = document.createElement("div");
    const inside_text = document.createElement("h3");

    pop.classList.add("box_p");
    popup.classList.add("pop_box", `pop_${type}`);
    inside_text.classList.add("box_text");
    inside_text.textContent = message;

    popup.appendChild(inside_text);
    pop.appendChild(popup);
    document.body.appendChild(pop);

    setTimeout(() => {
        pop.classList.add("pop_out");
        setTimeout(() => pop.remove(), 300);
    }, 3000);
}

function formatDate(timestamp) {
    if (!timestamp) return "N/A";
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return d.toLocaleDateString();
}

/* =====================================================
   SECTION SWITCHING (Dashboard / Assets / Issues nav)
   NOTE: sidebar open/close + collapse behavior lives in
   dashboard.js — not duplicated here.
===================================================== */

const Dashboard_btn = document.getElementById("Dashboard_btn");
const Asset_btn = document.getElementById("Asset_btn");
const Issue_btn = document.getElementById("Issue_btn");

const Dashboard_Section = document.getElementById("Dashboard_Section");
const Asset_Section = document.getElementById("Asset_Section");
const Asset_Issue_Section = document.getElementById("Asset_Issue_Section");

function hideSections() {
    Dashboard_Section.style.display = "none";
    Asset_Section.style.display = "none";
    Asset_Issue_Section.style.display = "none";
}

function setActiveNav(activeBtn) {
    document.querySelectorAll(".items > span").forEach(i => i.classList.remove("active"));
    activeBtn.classList.add("active");
}

Dashboard_btn.addEventListener("click", () => {
    hideSections();
    Dashboard_Section.style.display = "block";
    setActiveNav(Dashboard_btn);
});

Asset_btn.addEventListener("click", () => {
    hideSections();
    Asset_Section.style.display = "block";
    setActiveNav(Asset_btn);
    loadAssets();
});

Issue_btn.addEventListener("click", () => {
    hideSections();
    Asset_Issue_Section.style.display = "block";
    setActiveNav(Issue_btn);
    loadIssueReports();
});

/* =====================================================
   ADD ASSET MODAL (Dashboard section)
   CSS shows this modal via the "show" class (.assetModal.show)
===================================================== */

const assetModal = document.getElementById("assetModal");
const openAssetBtn = document.getElementById("openAsset");
const cancelAssetBtn = document.getElementById("cancelAsset");
const assetForm = document.getElementById("assetForm");
const saveBtn = document.getElementById("saveBtn");

const Asset_image_input = document.getElementById("Asset_image");
const Asset_preview = document.getElementById("Asset_preview");
const previewBox = document.getElementById("previewBox");
const uploadText = document.getElementById("uploadText");
const Asset_cross = document.getElementById("Asset_cross");

let selectedAssetFile = null;

function openAssetModal() {
    assetModal.classList.add("show");
}

function closeAssetModal() {
    assetModal.classList.remove("show");
    assetForm.reset();
    selectedAssetFile = null;
    Asset_preview.src = "";
    Asset_preview.style.display = "none";
    previewBox.style.display = "none";
    uploadText.style.display = "block";
}

if (openAssetBtn) openAssetBtn.addEventListener("click", openAssetModal);
if (cancelAssetBtn) cancelAssetBtn.addEventListener("click", closeAssetModal);

// Click outside the box closes the modal (overlay click)
if (assetModal) {
    assetModal.addEventListener("click", (e) => {
        if (e.target === assetModal) closeAssetModal();
    });
}

if (Asset_image_input) {
    Asset_image_input.addEventListener("change", () => {
        const file = Asset_image_input.files[0];
        if (!file) return;

        selectedAssetFile = file;

        const reader = new FileReader();
        reader.onload = (e) => {
            Asset_preview.src = e.target.result;
            Asset_preview.style.display = "block";
            previewBox.style.display = "flex";
            uploadText.style.display = "none";
        };
        reader.readAsDataURL(file);
    });
}

if (Asset_cross) {
    Asset_cross.addEventListener("click", (e) => {
        e.stopPropagation();
        selectedAssetFile = null;
        Asset_image_input.value = "";
        Asset_preview.src = "";
        Asset_preview.style.display = "none";
        previewBox.style.display = "none";
        uploadText.style.display = "block";
    });
}

async function uploadAssetImage(file) {
    if (!file) return "";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "Verix_Asset_images");

    try {
        const response = await fetch(
            "https://api.cloudinary.com/v1_1/dai3lqoez/image/upload",
            { method: "POST", body: formData }
        );

        if (!response.ok) throw new Error("Upload failed");

        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error("Image upload error:", error);
        showPopup("Image upload failed. Saving without image.", "error");
        return "";
    }
}

if (assetForm) {
    assetForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        saveBtn.disabled = true;
        saveBtn.textContent = "Saving...";

        try {
            let imageUrl = "";
            if (selectedAssetFile) {
                imageUrl = await uploadAssetImage(selectedAssetFile);
            }

            const newAsset = {
                name: document.getElementById("Asset_name").value.trim(),
                assetId: document.getElementById("Asset_id").value.trim(),
                category: document.getElementById("Asset_category").value,
                department: document.getElementById("Asset_department").value,
                location: document.getElementById("Asset_location").value.trim(),
                status: document.getElementById("Asset_status").value,
                description: document.getElementById("Asset_description").value.trim(),
                image: imageUrl,
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, "assets"), newAsset);

            showPopup("Asset added successfully.", "success");
            closeAssetModal();

            loadDashboardStats();
            loadAssets();

        } catch (error) {
            console.error("Error saving asset:", error);
            showPopup("Failed to save asset. Please try again.", "error");
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = "Save Asset";
        }
    });
}

/* =====================================================
   DASHBOARD: stat cards (Open Issues / Resolved)
   NOTE: total_Assets + total_Technicians are populated in dashboard.js
===================================================== */

const open_Issues_el = document.getElementById("open_Issues");
const resolved_Issues_el = document.getElementById("resolved_Issues");

async function loadDashboardStats() {
    try {
        const snapshot = await getDocs(collection(db, "reports"));

        let open = 0;
        let resolved = 0;

        snapshot.forEach((docSnap) => {
            const report = docSnap.data();
            if ((report.status || "").toLowerCase() === "resolved") {
                resolved++;
            } else {
                open++;
            }
        });

        if (open_Issues_el) open_Issues_el.textContent = open;
        if (resolved_Issues_el) resolved_Issues_el.textContent = resolved;

    } catch (error) {
        console.error("Error loading dashboard stats:", error);
    }
}

/* =====================================================
   DASHBOARD: Recent Issues table
===================================================== */

const issuesBody = document.getElementById("issuesBody");

async function loadRecentIssues() {
    if (!issuesBody) return;

    try {
        const snapshot = await getDocs(collection(db, "reports"));

        const reports = [];
        snapshot.forEach((docSnap) => {
            reports.push({ id: docSnap.id, ...docSnap.data() });
        });

        reports.sort((a, b) => {
            const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return bTime - aTime;
        });

        const recent = reports.slice(0, 5);

        issuesBody.innerHTML = "";

        recent.forEach((report) => {
            const row = document.createElement("tr");

            const assetCell = document.createElement("td");
            assetCell.textContent = report.assetName || "N/A";

            const issueCell = document.createElement("td");
            issueCell.textContent = report.issue || "N/A";

            const statusCell = document.createElement("td");
            statusCell.textContent = report.status || "Pending";

            const priorityCell = document.createElement("td");
            priorityCell.textContent = report.priority || "N/A";

            const dateCell = document.createElement("td");
            dateCell.classList.add("date");
            dateCell.textContent = formatDate(report.createdAt);

            row.appendChild(assetCell);
            row.appendChild(issueCell);
            row.appendChild(statusCell);
            row.appendChild(priorityCell);
            row.appendChild(dateCell);

            issuesBody.appendChild(row);
        });
        // Note: tbody:empty::after in dashboard.css shows a
        // "No recent issues to show" message automatically when empty.

    } catch (error) {
        console.error("Error loading recent issues:", error);
    }
}

/* =====================================================
   ASSETS SECTION: search + card grid
   CSS structure: .assetCard > .assetImage img
                              > .assetContent
                                  > .assetHeader2 > h2, span (status)
                                  > .assetID > span (id)
                                  > .assetInfo > .info (category/dept/location)
                                  > .assetDescription
                                  > .assetBtns > .Asset_box_view/.Asset_box_edit/.Asset_box_delete
===================================================== */

const Asset_Serch = document.getElementById("Asset_Serch");
const Asset_boxes = document.querySelector(".Asset_boxes");

let allAssets = [];

async function loadAssets() {
    if (!Asset_boxes) return;

    try {
        const snapshot = await getDocs(collection(db, "assets"));

        allAssets = [];
        snapshot.forEach((docSnap) => {
            allAssets.push({ id: docSnap.id, ...docSnap.data() });
        });

        renderAssets(allAssets);

    } catch (error) {
        console.error("Error loading assets:", error);
        showPopup("Failed to load assets.", "error");
    }
}

function renderAssets(assets) {
    Asset_boxes.innerHTML = "";

    if (assets.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "No assets found.";
        empty.style.color = "var(--text2)";
        Asset_boxes.appendChild(empty);
        return;
    }

    assets.forEach((asset, index) => {
        const card = document.createElement("div");
        card.className = "assetCard";
        card.style.animationDelay = `${index * 0.05}s`;

        // ---- Image ----
        const imageWrap = document.createElement("div");
        imageWrap.className = "assetImage";

        const img = document.createElement("img");
        img.src = asset.image || "";
        img.alt = asset.name || "Asset";

        imageWrap.appendChild(img);

        // ---- Content ----
        const content = document.createElement("div");
        content.className = "assetContent";

        const header = document.createElement("div");
        header.className = "assetHeader2";

        const nameEl = document.createElement("h2");
        nameEl.textContent = asset.name || "";

        const statusEl = document.createElement("span");
        statusEl.textContent = asset.status || "";

        header.appendChild(nameEl);
        header.appendChild(statusEl);

        const idEl = document.createElement("div");
        idEl.className = "assetID";
        idEl.append("ID: ");
        const idSpan = document.createElement("span");
        idSpan.textContent = asset.assetId || "N/A";
        idEl.appendChild(idSpan);

        const infoGrid = document.createElement("div");
        infoGrid.className = "assetInfo";

        function infoItem(label, value) {
            const wrap = document.createElement("div");
            wrap.className = "info";
            const strong = document.createElement("strong");
            strong.textContent = label;
            const span = document.createElement("span");
            span.textContent = value || "";
            wrap.appendChild(strong);
            wrap.appendChild(span);
            return wrap;
        }

        infoGrid.appendChild(infoItem("Category", asset.category));
        infoGrid.appendChild(infoItem("Department", asset.department));
        infoGrid.appendChild(infoItem("Location", asset.location));

        const descEl = document.createElement("p");
        descEl.className = "assetDescription";
        descEl.textContent = asset.description || "";

        const btns = document.createElement("div");
        btns.className = "assetBtns";

        const viewBtn = document.createElement("button");
        viewBtn.type = "button";
        viewBtn.className = "Asset_box_view";
        viewBtn.textContent = "View";
        viewBtn.addEventListener("click", () => openViewModal(asset));

        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.className = "Asset_box_edit";
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", () => openEditModal(asset));

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "Asset_box_delete";
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", () => deleteAsset(asset));

        btns.appendChild(viewBtn);
        btns.appendChild(editBtn);
        btns.appendChild(deleteBtn);

        content.appendChild(header);
        content.appendChild(idEl);
        content.appendChild(infoGrid);
        content.appendChild(descEl);
        content.appendChild(btns);

        card.appendChild(imageWrap);
        card.appendChild(content);

        Asset_boxes.appendChild(card);
    });
}

if (Asset_Serch) {
    Asset_Serch.addEventListener("input", () => {
        const term = Asset_Serch.value.trim().toLowerCase();

        const filtered = allAssets.filter((asset) => {
            return (
                (asset.name || "").toLowerCase().includes(term) ||
                (asset.assetId || "").toLowerCase().includes(term) ||
                (asset.location || "").toLowerCase().includes(term)
            );
        });

        renderAssets(filtered);
    });
}

async function deleteAsset(asset) {
    const confirmed = window.confirm(`Delete "${asset.name}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
        await deleteDoc(doc(db, "assets", asset.id));
        showPopup("Asset deleted.", "success");
        loadDashboardStats();
        loadAssets();
    } catch (error) {
        console.error("Error deleting asset:", error);
        showPopup("Failed to delete asset.", "error");
    }
}

/* =====================================================
   VIEW ASSET MODAL (with QR code)
   CSS shows this via the "show" class (.view_div.show)
===================================================== */

const view_div = document.getElementById("view_div");
const view_close = document.getElementById("view_close");
const view_img = document.getElementById("view_img");
const view_name = document.getElementById("view_name");
const view_assetId = document.getElementById("view_assetId");
const view_category = document.getElementById("view_category");
const view_department = document.getElementById("view_department");
const view_location = document.getElementById("view_location");
const view_status2 = document.getElementById("view_status2");
const view_created = document.getElementById("view_created");
const view_description = document.getElementById("view_description");
const view_qr_img = document.getElementById("view_qr_img");
const open_public_page = document.getElementById("open_public_page");
const copy_link = document.getElementById("copy_link");
const download_qr = document.getElementById("download_qr");

let currentViewAsset = null;

function getPublicAssetUrl(asset) {
    return `${window.location.origin}/asset.html?id=${encodeURIComponent(asset.assetId)}`;
}

function openViewModal(asset) {
    currentViewAsset = asset;

    view_img.src = asset.image || "";
    view_name.textContent = asset.name || "Unnamed Asset";
    view_assetId.textContent = asset.assetId || "N/A";
    view_category.textContent = asset.category || "N/A";
    view_department.textContent = asset.department || "N/A";
    view_location.textContent = asset.location || "N/A";
    view_status2.textContent = asset.status || "N/A";
    view_created.textContent = formatDate(asset.createdAt);
    view_description.textContent = asset.description || "No description available.";

    const publicUrl = getPublicAssetUrl(asset);

    // Render QR code offscreen with qrcodejs, then transfer to an <img> for
    // display/copy/download consistency.
    const qrTemp = document.createElement("div");
    new QRCode(qrTemp, {
        text: publicUrl,
        width: 200,
        height: 200
    });

    setTimeout(() => {
        const qrCanvas = qrTemp.querySelector("canvas");
        if (qrCanvas) {
            view_qr_img.src = qrCanvas.toDataURL("image/png");
        }
    }, 150);

    view_div.classList.add("show");
}

function closeViewModal() {
    view_div.classList.remove("show");
    currentViewAsset = null;
}

if (view_close) view_close.addEventListener("click", closeViewModal);

if (view_div) {
    view_div.addEventListener("click", (e) => {
        if (e.target === view_div) closeViewModal();
    });
}

if (open_public_page) {
    open_public_page.addEventListener("click", () => {
        if (!currentViewAsset) return;
        window.open(getPublicAssetUrl(currentViewAsset), "_blank");
    });
}

if (copy_link) {
    copy_link.addEventListener("click", async () => {
        if (!currentViewAsset) return;
        try {
            await navigator.clipboard.writeText(getPublicAssetUrl(currentViewAsset));
            showPopup("Link copied to clipboard.", "success");
        } catch (error) {
            showPopup("Failed to copy link.", "error");
        }
    });
}

if (download_qr) {
    download_qr.addEventListener("click", () => {
        if (!view_qr_img.src) return;
        const link = document.createElement("a");
        link.href = view_qr_img.src;
        link.download = `${currentViewAsset?.assetId || "asset"}-qr.png`;
        link.click();
    });
}

/* =====================================================
   EDIT ASSET MODAL
   CSS shows this via the "show" class (.edit_asset_modal.show)
===================================================== */

const edit_asset_modal = document.getElementById("edit_asset_modal");
const edit_close = document.getElementById("edit_close");
const edit_cancel = document.getElementById("edit_cancel");
const edit_asset_form = document.getElementById("edit_asset_form");

const edit_preview = document.getElementById("edit_preview");
const edit_image = document.getElementById("edit_image");
const edit_name = document.getElementById("edit_name");
const edit_asset_id = document.getElementById("edit_asset_id");
const edit_category = document.getElementById("edit_category");
const edit_department = document.getElementById("edit_department");
const edit_location = document.getElementById("edit_location");
const edit_status = document.getElementById("edit_status");
const edit_description = document.getElementById("edit_description");

let currentEditAsset = null;
let selectedEditFile = null;

function openEditModal(asset) {
    currentEditAsset = asset;
    selectedEditFile = null;

    edit_preview.src = asset.image || "";
    edit_name.value = asset.name || "";
    edit_asset_id.value = asset.assetId || "";
    edit_category.value = asset.category || "";
    edit_department.value = asset.department || "";
    edit_location.value = asset.location || "";
    edit_status.value = asset.status || "Active";
    edit_description.value = asset.description || "";

    edit_asset_modal.classList.add("show");
}

function closeEditModal() {
    edit_asset_modal.classList.remove("show");
    currentEditAsset = null;
    selectedEditFile = null;
}

if (edit_close) edit_close.addEventListener("click", closeEditModal);
if (edit_cancel) edit_cancel.addEventListener("click", closeEditModal);

if (edit_asset_modal) {
    edit_asset_modal.addEventListener("click", (e) => {
        if (e.target === edit_asset_modal) closeEditModal();
    });
}

if (edit_image) {
    edit_image.addEventListener("change", () => {
        const file = edit_image.files[0];
        if (!file) return;

        selectedEditFile = file;

        const reader = new FileReader();
        reader.onload = (e) => {
            edit_preview.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

if (edit_asset_form) {
    edit_asset_form.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!currentEditAsset) return;

        const saveButton = document.getElementById("edit_save");
        saveButton.disabled = true;
        saveButton.textContent = "Saving...";

        try {
            let imageUrl = currentEditAsset.image || "";
            if (selectedEditFile) {
                imageUrl = await uploadAssetImage(selectedEditFile);
            }

            const updatedData = {
                name: edit_name.value.trim(),
                category: edit_category.value,
                department: edit_department.value,
                location: edit_location.value.trim(),
                status: edit_status.value,
                description: edit_description.value.trim(),
                image: imageUrl
            };

            await updateDoc(doc(db, "assets", currentEditAsset.id), updatedData);

            showPopup("Asset updated successfully.", "success");
            closeEditModal();

            loadDashboardStats();
            loadAssets();

        } catch (error) {
            console.error("Error updating asset:", error);
            showPopup("Failed to update asset.", "error");
        } finally {
            saveButton.disabled = false;
            saveButton.textContent = "Save Changes";
        }
    });
}

/* =====================================================
   ISSUES SECTION: cards, filters, search, detail panel
===================================================== */

const issue_container = document.getElementById("issue_container");
const issue_empty = document.getElementById("issue_empty");
const issue_card_template = document.getElementById("issue_card_template");
const issue_search_input = document.getElementById("issue_search_input");
const issue_filter_btns = document.querySelectorAll(".issue_filter_btn");

let allReports = [];
let currentIssueFilter = "all";
let currentIssueSearch = "";

async function loadIssueReports() {
    if (!issue_container) return;

    try {
        const snapshot = await getDocs(collection(db, "reports"));

        allReports = [];
        snapshot.forEach((docSnap) => {
            allReports.push({ id: docSnap.id, ...docSnap.data() });
        });

        allReports.sort((a, b) => {
            const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return bTime - aTime;
        });

        renderIssueReports();

    } catch (error) {
        console.error("Error loading issue reports:", error);
        showPopup("Failed to load issue reports.", "error");
    }
}

function normalizeStatus(status) {
    return (status || "pending").toLowerCase().replace(/\s+/g, "-");
}

function renderIssueReports() {
    issue_container.innerHTML = "";

    const filtered = allReports.filter((report) => {
        const status = normalizeStatus(report.status);

        const matchesFilter =
            currentIssueFilter === "all" || status === currentIssueFilter;

        const term = currentIssueSearch.toLowerCase();
        const matchesSearch =
            !term ||
            (report.assetName || "").toLowerCase().includes(term) ||
            (report.assetId || "").toLowerCase().includes(term) ||
            (report.name || "").toLowerCase().includes(term);

        return matchesFilter && matchesSearch;
    });

    if (filtered.length === 0) {
        issue_empty.classList.add("show");
        return;
    }

    issue_empty.classList.remove("show");

    filtered.forEach((report) => {
        const clone = issue_card_template.content.cloneNode(true);

        const card = clone.querySelector(".issue_card");
        const img = clone.querySelector(".issue_user_image");
        const nameEl = clone.querySelector(".issue_reporter_name");
        const emailEl = clone.querySelector(".issue_reporter_email");
        const statusEl = clone.querySelector(".issue_status");
        const assetNameEl = clone.querySelector(".issue_asset_name");
        const assetIdEl = clone.querySelector(".issue_asset_id");
        const reasonEl = clone.querySelector(".issue_reason");
        const priorityEl = clone.querySelector(".issue_priority");
        const descriptionEl = clone.querySelector(".issue_description");
        const dateEl = clone.querySelector(".issue_date");
        const viewBtn = clone.querySelector(".issue_view_btn");
        const resolveBtn = clone.querySelector(".issue_resolve_btn");

        img.src = report.image || "";
        nameEl.textContent = report.name || "";
        emailEl.textContent = report.email || "";

        const status = normalizeStatus(report.status);
        statusEl.textContent = report.status || "Pending";
        statusEl.dataset.status = status;

        assetNameEl.textContent = report.assetName || "N/A";
        assetIdEl.textContent = report.assetId || "N/A";
        reasonEl.textContent = report.issue || "N/A";

        const priority = (report.priority || "").toLowerCase();
        priorityEl.textContent = report.priority || "N/A";
        priorityEl.dataset.priority = priority;
        card.dataset.priority = priority;

        descriptionEl.textContent = report.description || "";
        dateEl.textContent = formatDate(report.createdAt);

        viewBtn.addEventListener("click", () => openIssueDetail(report));

        if (status === "resolved") {
            resolveBtn.style.display = "none";
        } else {
            resolveBtn.addEventListener("click", () => resolveIssue(report.id));
        }

        issue_container.appendChild(card);
    });
}

if (issue_filter_btns.length) {
    issue_filter_btns.forEach((btn) => {
        btn.addEventListener("click", () => {
            issue_filter_btns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentIssueFilter = btn.dataset.filter;
            renderIssueReports();
        });
    });
}

if (issue_search_input) {
    issue_search_input.addEventListener("input", () => {
        currentIssueSearch = issue_search_input.value.trim();
        renderIssueReports();
    });
}

async function resolveIssue(reportId) {
    try {
        await updateDoc(doc(db, "reports", reportId), { status: "resolved" });
        showPopup("Marked as resolved.", "success");
        loadIssueReports();
        loadDashboardStats();
        loadRecentIssues();
    } catch (error) {
        console.error("Error resolving issue:", error);
        showPopup("Failed to update issue.", "error");
    }
}

/* =====================================================
   ISSUE DETAIL PANEL
   CSS shows this via the "show" class (.issue_detail.show)
===================================================== */

const issue_detail = document.getElementById("issue_detail");
const issue_detail_close = document.getElementById("issue_detail_close");
const detail_user_image = document.getElementById("detail_user_image");
const detail_reporter_name = document.getElementById("detail_reporter_name");
const detail_reporter_email = document.getElementById("detail_reporter_email");
const detail_asset_name = document.getElementById("detail_asset_name");
const detail_asset_id = document.getElementById("detail_asset_id");
const detail_reason = document.getElementById("detail_reason");
const detail_priority = document.getElementById("detail_priority");
const detail_date = document.getElementById("detail_date");
const detail_status = document.getElementById("detail_status");
const detail_description = document.getElementById("detail_description");
const detail_status_select = document.getElementById("detail_status_select");
const issue_detail_delete = document.getElementById("issue_detail_delete");

let currentDetailReport = null;

function openIssueDetail(report) {
    currentDetailReport = report;

    detail_user_image.src = report.image || "";
    detail_reporter_name.textContent = report.name || "Anonymous";
    detail_reporter_email.textContent = report.email || "No email provided";
    detail_asset_name.textContent = report.assetName || "N/A";
    detail_asset_id.textContent = report.assetId || "N/A";
    detail_reason.textContent = report.issue || "N/A";
    detail_priority.textContent = report.priority || "N/A";
    detail_date.textContent = formatDate(report.createdAt);
    detail_status.textContent = report.status || "Pending";
    detail_description.textContent = report.description || "No description provided.";
    detail_status_select.value = normalizeStatus(report.status);

    issue_detail.classList.add("show");
}

function closeIssueDetail() {
    issue_detail.classList.remove("show");
    currentDetailReport = null;
}

if (issue_detail_close) issue_detail_close.addEventListener("click", closeIssueDetail);

if (issue_detail) {
    issue_detail.addEventListener("click", (e) => {
        if (e.target === issue_detail) closeIssueDetail();
    });
}

if (detail_status_select) {
    detail_status_select.addEventListener("change", async () => {
        if (!currentDetailReport) return;

        try {
            await updateDoc(doc(db, "reports", currentDetailReport.id), {
                status: detail_status_select.value
            });
            detail_status.textContent = detail_status_select.value;
            showPopup("Status updated.", "success");

            loadIssueReports();
            loadDashboardStats();
            loadRecentIssues();
        } catch (error) {
            console.error("Error updating status:", error);
            showPopup("Failed to update status.", "error");
        }
    });
}

if (issue_detail_delete) {
    issue_detail_delete.addEventListener("click", async () => {
        if (!currentDetailReport) return;

        const confirmed = window.confirm("Delete this report? This cannot be undone.");
        if (!confirmed) return;

        try {
            await deleteDoc(doc(db, "reports", currentDetailReport.id));
            showPopup("Report deleted.", "success");
            closeIssueDetail();

            loadIssueReports();
            loadDashboardStats();
            loadRecentIssues();
        } catch (error) {
            console.error("Error deleting report:", error);
            showPopup("Failed to delete report.", "error");
        }
    });
}

/* =====================================================
   PUBLIC ASSET PAGE LOGIC
   (Restored from your original admin.js — these elements
   don't exist on Dashboard.html, so all handlers below are
   guarded with `if (element)` checks and stay inactive here.
   They belong to a separate public-facing asset page, e.g.
   asset.html, which loads a single asset by ?id= and lets
   visitors submit an issue report.)
===================================================== */

const Asset_main_image = document.getElementById("Asset_main_image");
const Asset_name = document.getElementById("Asset_name");
const Asset_Id = document.getElementById("Asset_Id");
const Asset_caterogery = document.getElementById("Asset_caterogery");
const Asset_serial = document.getElementById("Asset_serial");
const Asset_location = document.getElementById("Asset_location");
const Asset_installed = document.getElementById("Asset_installed");
const Asset_Department = document.getElementById("Asset_Department");
const Asset_warranty = document.getElementById("Asset_warranty");
const Asset_model = document.getElementById("Asset_model");
const Asset_status = document.getElementById("Asset_status");
const Asset_decription = document.getElementById("Asset_decription");

function showPublicError(message) {
    showPopup(message, "error");
}

function populatePublicAsset(asset) {
    if (Asset_main_image) Asset_main_image.src = asset.image || "./images/no-image.png";
    if (Asset_name) Asset_name.textContent = asset.name || "Unknown Asset";
    if (Asset_Id) Asset_Id.textContent = asset.assetId || "N/A";
    if (Asset_caterogery) Asset_caterogery.textContent = asset.category || "N/A";
    if (Asset_serial) Asset_serial.textContent = asset.Asset_serial || "N/A";
    if (Asset_location) Asset_location.textContent = asset.location || "N/A";
    if (Asset_installed) Asset_installed.textContent = asset.installedOn || "N/A";
    if (Asset_Department) Asset_Department.textContent = asset.department || "N/A";
    if (Asset_warranty) Asset_warranty.textContent = asset.warranty || "N/A";
    if (Asset_model) Asset_model.textContent = asset.model || "N/A";
    if (Asset_status) Asset_status.innerHTML = `${asset.status || "Unknown"}`;
    if (Asset_decription) Asset_decription.textContent = asset.description || "No description available.";
}

async function loadPublicAsset() {
    const urlParams = new URLSearchParams(window.location.search);
    const assetId = urlParams.get("id");

    if (!assetId) {
        if (Asset_main_image) {
            showPublicError("Asset information is missing from the public link.");
        }
        return;
    }

    try {
        const assetsQuery = query(
            collection(db, "assets"),
            where("assetId", "==", assetId),
            limit(1)
        );
        const querySnapshot = await getDocs(assetsQuery);

        if (querySnapshot.empty) {
            showPublicError("Asset not found. The public link may be invalid or the asset has been removed.");
            return;
        }

        const docSnap = querySnapshot.docs[0];
        const asset = docSnap.data();
        populatePublicAsset(asset);
    } catch (error) {
        console.error("Failed to load asset from Firestore:", error);
        showPublicError("Unable to load asset details at this time. Please try again later.");
    }
}

if (Asset_main_image) {
    loadPublicAsset();
}

async function img_upload(file) {
    if (!file) return "";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "Verix_Asset_images");

    try {
        const response = await fetch(
            "https://api.cloudinary.com/v1_1/dai3lqoez/image/upload",
            { method: "POST", body: formData }
        );

        if (!response.ok) throw new Error("Upload failed");

        const data = await response.json();
        return data.secure_url;

    } catch (error) {
        console.error("Image upload error:", error);
        showPopup("Image upload failed. Submitting without image.", "error");
        return "";
    }
}

function Report() {

    const overlay = document.createElement("div");
    overlay.className = "report_overlay";

    const popup = document.createElement("div");
    popup.className = "report_popup";

    const report_header = document.createElement("div");
    report_header.className = "report_header";

    const header_text_wrap = document.createElement("div");

    const header_title = document.createElement("h2");
    header_title.textContent = "Report Asset Issue";

    const header_subtitle = document.createElement("p");
    header_subtitle.textContent = "Help us by providing accurate information.";

    header_text_wrap.appendChild(header_title);
    header_text_wrap.appendChild(header_subtitle);

    const report_close = document.createElement("button");
    report_close.className = "report_close";
    report_close.innerHTML = "&times;";
    report_close.type = "button";

    report_header.appendChild(header_text_wrap);
    report_header.appendChild(report_close);

    const report_body = document.createElement("div");
    report_body.className = "report_body";

    const report_grid = document.createElement("div");
    report_grid.className = "report_grid";

    function createGroup(labelText, fieldEl, extraClass = "") {
        const group = document.createElement("div");
        group.className = "report_group" + (extraClass ? " " + extraClass : "");

        const label = document.createElement("label");
        label.textContent = labelText;

        const error = document.createElement("span");
        error.className = "field_error";
        error.style.display = "none";

        group.appendChild(label);
        group.appendChild(fieldEl);
        group.appendChild(error);

        return { group, error };
    }

    const report_name = document.createElement("input");
    report_name.type = "text";
    report_name.id = "report_name";
    report_name.placeholder = "Enter your full name";
    const nameField = createGroup("Full Name", report_name);

    const report_email = document.createElement("input");
    report_email.type = "email";
    report_email.id = "report_email";
    report_email.placeholder = "example@email.com";
    const emailField = createGroup("Email (Optional)", report_email);

    const report_type = document.createElement("select");
    report_type.id = "report_type";

    const issueOptions = [
        "Select Issue",
        "Not Working",
        "Damaged",
        "Maintenance Required",
        "Missing",
        "Broken Part",
        "Other"
    ];

    issueOptions.forEach((text, idx) => {
        const opt = document.createElement("option");
        opt.textContent = text;
        opt.value = idx === 0 ? "" : text;
        report_type.appendChild(opt);
    });
    const typeField = createGroup("Issue Type", report_type);

    const priority_box = document.createElement("div");
    priority_box.className = "priority_box";

    const priorities = [
        { value: "Low", checked: false },
        { value: "Medium", checked: true },
        { value: "High", checked: false }
    ];

    priorities.forEach(p => {
        const label = document.createElement("label");

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "priority";
        radio.value = p.value;
        if (p.checked) radio.checked = true;

        label.appendChild(radio);
        label.appendChild(document.createTextNode(" " + p.value));

        priority_box.appendChild(label);
    });

    const priorityField = createGroup("Priority", priority_box);

    const report_description = document.createElement("textarea");
    report_description.id = "report_description";
    report_description.rows = 6;
    report_description.placeholder = "Explain what happened with this asset...";
    const descField = createGroup("Describe the Issue", report_description, "full");

    const upload_group = document.createElement("div");
    upload_group.className = "report_group full";

    const upload_label = document.createElement("label");
    upload_label.textContent = "Attach Image (Optional)";

    const uploadBox = document.createElement("div");
    uploadBox.className = "upload_box";
    uploadBox.id = "uploadBox";

    const issueImage = document.createElement("input");
    issueImage.type = "file";
    issueImage.id = "issueImage";
    issueImage.accept = "image/*";
    issueImage.hidden = true;

    const upload_content = document.createElement("div");
    upload_content.className = "upload_content";

    const uploadSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    uploadSvg.setAttribute("width", "56");
    uploadSvg.setAttribute("height", "56");
    uploadSvg.setAttribute("viewBox", "0 0 24 24");
    uploadSvg.setAttribute("fill", "none");
    uploadSvg.setAttribute("stroke", "currentColor");
    uploadSvg.setAttribute("stroke-width", "2");

    const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path1.setAttribute("d", "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4");

    const polyline1 = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    polyline1.setAttribute("points", "17 8 12 3 7 8");

    const line1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line1.setAttribute("x1", "12");
    line1.setAttribute("y1", "3");
    line1.setAttribute("x2", "12");
    line1.setAttribute("y2", "15");

    uploadSvg.appendChild(path1);
    uploadSvg.appendChild(polyline1);
    uploadSvg.appendChild(line1);

    const upload_title = document.createElement("h3");
    upload_title.textContent = "Upload Asset Image";

    const upload_desc = document.createElement("p");
    upload_desc.textContent = "Click anywhere to select an image";

    const upload_span = document.createElement("span");
    upload_span.textContent = "PNG • JPG • JPEG";

    upload_content.appendChild(uploadSvg);
    upload_content.appendChild(upload_title);
    upload_content.appendChild(upload_desc);
    upload_content.appendChild(upload_span);

    const previewImage = document.createElement("img");
    previewImage.id = "previewImage";
    previewImage.style.display = "none";

    uploadBox.appendChild(issueImage);
    uploadBox.appendChild(upload_content);
    uploadBox.appendChild(previewImage);

    upload_group.appendChild(upload_label);
    upload_group.appendChild(uploadBox);

    report_grid.appendChild(nameField.group);
    report_grid.appendChild(emailField.group);
    report_grid.appendChild(typeField.group);
    report_grid.appendChild(priorityField.group);

    report_body.appendChild(report_grid);
    report_body.appendChild(descField.group);
    report_body.appendChild(upload_group);

    const report_footer = document.createElement("div");
    report_footer.className = "report_footer";

    const cancel_report = document.createElement("button");
    cancel_report.className = "cancel_report";
    cancel_report.type = "button";
    cancel_report.textContent = "Cancel";

    const submit_report = document.createElement("button");
    submit_report.className = "submit_report";
    submit_report.type = "button";
    submit_report.textContent = "Submit Report";

    report_footer.appendChild(cancel_report);
    report_footer.appendChild(submit_report);

    popup.appendChild(report_header);
    popup.appendChild(report_body);
    popup.appendChild(report_footer);

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    uploadBox.addEventListener("click", () => {
        if (previewImage.style.display === "none") {
            issueImage.click();
        }
    });

    issueImage.addEventListener("change", () => {
        const file = issueImage.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = (e) => {
            previewImage.src = e.target.result;
            previewImage.style.display = "block";
            upload_content.style.display = "none";
        };

        reader.readAsDataURL(file);
    });

    function setError(field, message) {
        field.error.textContent = message;
        field.error.style.display = "block";
        field.group.classList.add("has_error");
    }

    function clearError(field) {
        field.error.textContent = "";
        field.error.style.display = "none";
        field.group.classList.remove("has_error");
    }

    report_name.addEventListener("input", () => clearError(nameField));
    report_type.addEventListener("change", () => clearError(typeField));
    report_description.addEventListener("input", () => clearError(descField));
    report_email.addEventListener("input", () => clearError(emailField));

    function validateForm() {
        let isValid = true;

        if (!report_name.value.trim()) {
            setError(nameField, "Full name is required.");
            isValid = false;
        } else {
            clearError(nameField);
        }

        if (!report_type.value) {
            setError(typeField, "Please select an issue type.");
            isValid = false;
        } else {
            clearError(typeField);
        }

        if (!report_description.value.trim()) {
            setError(descField, "Please describe the issue.");
            isValid = false;
        } else {
            clearError(descField);
        }

        if (report_email.value) {
            const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(report_email.value);
            if (!valid) {
                setError(emailField, "Invalid email");
                isValid = false;
            } else {
                clearError(emailField);
            }
        }

        return isValid;
    }

    function closePopup() {
        overlay.remove();
        document.removeEventListener("keydown", escHandler);
    }

    report_close.addEventListener("click", () => {
        closePopup();
        showPopup("Report closed.", "info");
    });

    cancel_report.addEventListener("click", () => {
        closePopup();
        showPopup("Report cancelled.", "error");
    });

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
            closePopup();
            showPopup("Report closed.", "error");
        }
    });

    const escHandler = (e) => {
        if (e.key === "Escape") {
            closePopup();
            showPopup("Report form closed.", "error");
        }
    };

    document.addEventListener("keydown", escHandler);

    submit_report.addEventListener("click", async () => {

        if (!validateForm()) {
            return;
        }

        submit_report.disabled = true;
        submit_report.textContent = "Submitting...";

        try {
            let imageUrl = "";
            if (issueImage.files[0]) {
                showPopup("Uploading image...", "info");
                imageUrl = await img_upload(issueImage.files[0]);
            }

            const selectedPriority = popup.querySelector('input[name="priority"]:checked').value;

            const urlParams = new URLSearchParams(window.location.search);
            const assetId = urlParams.get("id");

            await addDoc(collection(db, "reports"), {
                assetId: assetId,
                assetName: Asset_name.textContent,
                assetLocation: Asset_location.textContent,
                name: report_name.value.trim(),
                email: report_email.value.trim() || "",
                issue: report_type.value,
                description: report_description.value.trim(),
                priority: selectedPriority,
                image: imageUrl,
                status: "Pending",
                createdAt: serverTimestamp()
            });

            closePopup();
            showPopup("Report submitted successfully.", "success");

        } catch (error) {
            console.error("Error submitting report:", error);
            showPopup("Failed to submit report. Please try again.", "error");

            submit_report.disabled = false;
            submit_report.textContent = "Submit Report";
        }
    });
}

const Report_btn = document.getElementById("Report_Issue_btn2");

if (Report_btn) {
    Report_btn.addEventListener("click", Report);
}

/* =====================================================
   INITIAL LOAD
===================================================== */

loadDashboardStats();
loadRecentIssues();