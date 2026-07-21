import {
    db,
    addDoc,
    collection,
    serverTimestamp,
    getDocs,
    deleteDoc,
    updateDoc,
    doc
} from "./config/firebase.js";

// popup box

function box(text, type = "info") {
    const box_parent = document.createElement("div");
    const popup = document.createElement("div");
    const inside_text = document.createElement("h3");

    box_parent.classList.add("box_p");
    popup.classList.add("pop_box", `pop_${type}`);
    inside_text.classList.add("box_text");
    inside_text.textContent = text;

    popup.appendChild(inside_text);
    box_parent.appendChild(popup);
    document.body.appendChild(box_parent);

    return box_parent;
}

// close popup box
function closeBox(pop, delay = 1500) {
    setTimeout(() => {
        pop.classList.add("pop_out");
        setTimeout(() => pop.remove(), 300);
    }, delay);
}

// loader
function loader() {
    // clean up any leftover loader before creating a new one
    const existing = document.querySelector(".loader");
    if (existing) existing.remove();

    const loaderEl = document.createElement("div");
    const span = document.createElement("span");
    loaderEl.className = "loader";
    loaderEl.appendChild(span);
    document.body.appendChild(loaderEl);
}

// remove loader
function removeLoader() {
    const loaderEl = document.querySelector(".loader");
    if (!loaderEl) return; // nothing to remove, avoid throwing
    loaderEl.remove();
}


//Comfim Box function

function Confirm(title, message) {
    return new Promise((resolve) => {

        const confirm_box = document.createElement("div");
        const confirm_h3 = document.createElement("h3");
        const confirm_p = document.createElement("p");
        const btns = document.createElement("div");
        const confirm_yes = document.createElement("button");
        const confirm_no = document.createElement("button");

        confirm_box.className = "confirm_box";
        confirm_h3.className = "confirm_h3";
        confirm_p.className = "confirm_p";
        btns.className = "confirm_btns";
        confirm_yes.className = "confirm_yes";
        confirm_no.className = "confirm_no";

        confirm_h3.innerText = title;
        confirm_p.innerText = message;
        confirm_yes.innerText = "Delete";
        confirm_no.innerText = "Cancel";

        btns.append(confirm_no, confirm_yes);
        confirm_box.append(confirm_h3, confirm_p, btns);

        const overlay = document.createElement("div");
        overlay.className = "confirm_overlay";
        document.body.appendChild(overlay);
        document.body.appendChild(confirm_box);

        confirm_yes.onclick = () => {
            overlay.remove();
            confirm_box.remove();
            resolve(true);
        };

        confirm_no.onclick = () => {
            overlay.remove();
            confirm_box.remove();
            resolve(false);
        };
    });
}

// selected
const opem_assest_model = document.getElementById("openAsset");
const assest_model = document.getElementById("assetModal");
const Cancel_assest_model = document.getElementById("cancelAsset");
const form = document.getElementById("assetForm");

const Asset_image = document.getElementById("Asset_image");
const Asset_preview = document.getElementById("Asset_preview");
const uploadBtn = document.getElementById("uploadBtn");
const Assest_img_box = document.getElementById("previewBox");
const Assest_img_cross_btn = document.getElementById("Asset_cross");
const uploadText = document.getElementById("uploadText");

// Sections
const Dashboard_btn = document.getElementById("Dashboard_btn");
const Asset_btn = document.getElementById("Asset_btn");
const Issue_btn = document.getElementById("Issue_btn");

const Dashboard_Section = document.getElementById("Dashboard_Section");
const Asset_Section = document.getElementById("Asset_Section");
const Asset_Issue_Section = document.getElementById("Asset_Issue_Section");

// Asset view box
const Asset_full_view = document.getElementById("view_div");
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
const Asset_view_box_close = document.getElementById("view_close");

// Edit asset modal
const edit_asset_modal = document.getElementById("edit_asset_modal");
const editForm = document.getElementById("edit_asset_form");
const editPreview = document.getElementById("edit_preview");
const editImage = document.getElementById("edit_image");
const editName = document.getElementById("edit_name");
const editAssetId = document.getElementById("edit_asset_id");
const editCategory = document.getElementById("edit_category");
const editDepartment = document.getElementById("edit_department");
const editLocation = document.getElementById("edit_location");
const editStatus = document.getElementById("edit_status");
const editDescription = document.getElementById("edit_description");
const editClose = document.getElementById("edit_close");
const editCancel = document.getElementById("edit_cancel");

// Asset container
const Asset_Boxes = document.querySelector(".Asset_boxes");

// Public link / QR
const open_public_page = document.getElementById("open_public_page");
const copy_link = document.getElementById("copy_link");
const download_qr = document.getElementById("download_qr");

// Issue section
const issue_container = document.getElementById("issue_container");
const issue_empty = document.getElementById("issue_empty");
const issue_card_template = document.getElementById("issue_card_template");
const issue_search_input = document.getElementById("issue_search_input");
const issue_filter_btns = document.querySelectorAll(".issue_filter_btn");

// Issue detail modal
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

const BASE_URL = "https://verix-app.netlify.app";


const submitBtn = form?.querySelector('button[type="submit"]');

let currentEditDocId = null;

// Section Swich Dashboard Asset Issue
function showSection(section) {
    Dashboard_Section.style.display = section === "dashboard" ? "block" : "none";
    Asset_Section.style.display = section === "assets" ? "block" : "none";
    Asset_Issue_Section.style.display = section === "issues" ? "block" : "none";

    if (section === "issues") {
        loadIssues();
    }
}

Dashboard_btn.addEventListener("click", () => showSection("dashboard"));
Asset_btn.addEventListener("click", () => showSection("assets"));
Issue_btn.addEventListener("click", () => showSection("issues"));

//Aside open/Close
opem_assest_model.addEventListener("click", () => {
    assest_model.classList.add("show");
});

//Cancle model btn to close model
Cancel_assest_model.addEventListener("click", () => {
    assest_model.classList.remove("show");
    resetImagePreview();
    form.reset();

    const pop = box("Asset Cancel", "error");
    closeBox(pop, 1200);
});



//Image Prewiew
Asset_image.addEventListener("change", () => {
    const file = Asset_image.files[0];

    if (!file) {
        const pop = box("Please Selet Asset Image", "error");
        closeBox(pop, 1200);
        return
    };
    const fileReader = new FileReader();

    fileReader.onload = () => {
        Asset_preview.src = fileReader.result;
        Asset_preview.style.display = "block";
        Assest_img_box.style.display = "flex";
        uploadText.style.display = "none";
        uploadBtn.style.display = "none";
        Assest_img_cross_btn.style.display = "block";
    };

    fileReader.onerror = (err) => {
        console.error(`Image  Read Error ${err}`);
        const pop = box("Failed to read image file.", "error");
        closeBox(pop, 2000);
    };
    fileReader.readAsDataURL(file);
});

//Qr generate
function generateQR(text) {
    const qrContainer = document.createElement("div");

    new QRCode(qrContainer, {
        text: text,
        width: 250,
        height: 250,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });

    return new Promise((resolve) => {
        setTimeout(() => {
            const img = qrContainer.querySelector("img");
            const canvas = qrContainer.querySelector("canvas");

            if (img) {
                resolve(img.src);
            } else {
                resolve(canvas.toDataURL("image/png"));
            }
        }, 100);
    });
}

// Upload Imge in cloudinary
async function img_upload(file) {
    if (!file) return "";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "Verix_Asset_images");

    let response;
    try {
        response = await fetch(
            "https://api.cloudinary.com/v1_1/dai3lqoez/image/upload",
            {
                method: "POST",
                body: formData
            }
        );
    } catch (networkErr) {
        const pop = box("Network error while uploading image. Please check your connection", "error");
        closeBox(pop, 2000);
    }

    let data;
    try {
        data = await response.json();
    } catch {
        const pop = box("Unexpected response from image upload service.", "error");
        closeBox(pop, 2000);
    }

    if (!response.ok) {
        const message = data?.error?.message || `Image upload failed (status ${response.status}).`;
        const pop = box(message, "error");
        closeBox(pop, 2000);
    }

    if (!data.secure_url) {
        const pop = box("Image upload succeeded but no URL was returned.", "error");
        closeBox(pop, 2000);
    }

    return data.secure_url;
}

//Remove Imagw 
function resetImagePreview() {
    Asset_image.value = "";
    Asset_preview.src = "";
    Asset_preview.style.display = "none";
    Assest_img_box.style.display = "none";
    uploadBtn.style.display = "block";
    uploadText.style.display = "block";
    Assest_img_cross_btn.style.display = "none";
}

Assest_img_cross_btn.addEventListener("click", resetImagePreview);



// Add Asset
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fields = {
        Asset_name: document.getElementById("Asset_name").value.trim(),
        Asset_id: document.getElementById("Asset_id").value.trim(),
        Asset_category: document.getElementById("Asset_category").value,
        Asset_department: document.getElementById("Asset_department").value,
        Asset_location: document.getElementById("Asset_location").value.trim(),
        Asset_status: document.getElementById("Asset_status").value,
        Asset_description: document.getElementById("Asset_description").value.trim()
    };



    const file = Asset_image.files[0];

    // Prevent double-submit
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.originalText = submitBtn.dataset.originalText || submitBtn.textContent;
        submitBtn.textContent = "Saving...";
    }

    loader();

    // Qr Url 
    const publicURL = `${BASE_URL}/public.html?id=${encodeURIComponent(fields.Asset_id)}`;

    try {
        const qrImage = await generateQR(publicURL);

        let imageURL = "";
        if (file) {
            imageURL = await img_upload(file);
        }
        //Add Doc
        await addDoc(collection(db, "assets"), {
            name: fields.Asset_name,
            assetId: fields.Asset_id,
            category: fields.Asset_category,
            department: fields.Asset_department,
            location: fields.Asset_location,
            status: fields.Asset_status,
            description: fields.Asset_description,
            image: imageURL,
            qr: qrImage,
            createdAt: serverTimestamp()
        });

        const pop = box("Asset Added Successfully!", "success");
        closeBox(pop, 1200);

        form.reset();
        resetImagePreview();

        assest_model.classList.remove("show");

        await loadAssets();

    } catch (error) {
        const pop = box(error.message || "Something went wrong. Please try again.", "error");
        closeBox(pop, 2000);

    } finally {
        removeLoader();
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = submitBtn.dataset.originalText || "Save";
        }
    }
});

//Edit Model Close btn
editClose.addEventListener("click", () => {
    edit_asset_modal.classList.remove("show");
    currentEditDocId = null;
    editForm.reset();
});

// Edit Image chage Selet
editImage.addEventListener("change", () => {
    const file = editImage.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        editPreview.src = reader.result;
    };
    reader.readAsDataURL(file);
});

//Form Submit btn
editForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!currentEditDocId) {
        const pop = box("No asset selected to edit.", "error");
        closeBox(pop, 1500);
        return;
    }
    loader();

    try {
        let imageURL = editPreview.src;

        if (editImage.files[0]) {
            imageURL = await img_upload(editImage.files[0]);
        }

        await updateDoc(doc(db, "assets", currentEditDocId), {
            name: editName.value.trim(),
            assetId: editAssetId.value.trim(),
            category: editCategory.value,
            department: editDepartment.value,
            location: editLocation.value.trim(),
            status: editStatus.value,
            description: editDescription.value.trim(),
            image: imageURL
        });

        const pop = box("Asset Updated Successfully!", "success");
        closeBox(pop, 1500);

        edit_asset_modal.classList.remove("show");
        currentEditDocId = null;

        await loadAssets();

    } catch (error) {
        const pop = box(error.message || "Something went wrong. Please try again.", "error");
        closeBox(pop, 2000);
    } finally {
        removeLoader();
    }
});

// Asset view box Close btn
Asset_view_box_close.addEventListener("click", () => {
    Asset_full_view.classList.remove("show");
});


// Load Assets function
async function loadAssets() {
    loader();
    try {
        Asset_Boxes.innerHTML = "";

        const querySnapshot = await getDocs(collection(db, "assets"));

        querySnapshot.forEach((docSnap) => {
            const asset = docSnap.data();
            const assetDocId = docSnap.id;

            const card = document.createElement("div");
            card.className = "assetCard";

            card.innerHTML = `
                <div class="assetContent">

                    <div class="assetHeader2">
                        <h2>${asset.name}</h2>
                        <span>${asset.status}</span>
                    </div>

                    <div class="assetInfo">

                        <div class="info">
                            <strong>Category</strong>
                            <span>${asset.category}</span>
                        </div>

                        <div class="info">
                            <strong>Department</strong>
                            <span>${asset.department}</span>
                        </div>

                        <div class="info">
                            <strong>Location</strong>
                            <span>${asset.location}</span>
                        </div>

                        <p class="assetID">
                            Asset ID:
                            <span>${asset.assetId}</span>
                        </p>

                    </div>

                    <p class="assetDescription">
                        ${asset.description || ""}
                    </p>

                    <div class="assetBtns">
                        <button class="Asset_box_view">View</button>
                        <button class="Asset_box_edit">Edit</button>
                        <button class="Asset_box_delete">Delete</button>
                    </div>

                </div>
            `;

            const viewBtn = card.querySelector(".Asset_box_view");
            const editBtn = card.querySelector(".Asset_box_edit");
            const deleteBtn = card.querySelector(".Asset_box_delete");

            // View Asset box btn
            viewBtn.addEventListener("click", () => {
                view_img.src = asset.image || "";
                view_name.textContent = asset.name || "";
                view_assetId.textContent = asset.assetId || "";
                view_category.textContent = asset.category || "";
                view_department.textContent = asset.department || "";
                view_location.textContent = asset.location || "";
                view_status2.textContent = asset.status || "";
                view_description.textContent = asset.description || "";
                open_public_page.dataset.id = asset.assetId;

                view_created.textContent = asset.createdAt
                    ? asset.createdAt.toDate().toLocaleString()
                    : "N/A";

                view_qr_img.src = asset.qr || "No Qr Available";

                Asset_full_view.classList.add("show");
            });

            // Edit Asset btn
            editBtn.addEventListener("click", () => {
                currentEditDocId = assetDocId;
                editPreview.src = asset.image || "";
                editName.value = asset.name || "";
                editAssetId.value = asset.assetId || "";
                editCategory.value = asset.category || "";
                editDepartment.value = asset.department || "";
                editLocation.value = asset.location || "";
                editStatus.value = asset.status || "";
                editDescription.value = asset.description || "";

                edit_asset_modal.classList.add("show");
            });

            deleteBtn.addEventListener("click", async () => {
                const result = await Confirm(
                    `Delete ${asset.name}?`,
                    "This action cannot be undone."
                );

                if (!result) return;

                loader();
                deleteBtn.disabled = true;

                try {
                    await deleteDoc(doc(db, "assets", assetDocId));

                    card.remove();

                    const pop = box("Asset Deleted", "info");
                    closeBox(pop, 1200);

                } catch (error) {
                    console.error(error);

                    const pop = box(error.message || "Failed to delete asset.", "error");
                    closeBox(pop, 2000);

                } finally {
                    removeLoader();
                    deleteBtn.disabled = false;
                }
            });

            Asset_Boxes.appendChild(card);
        });

    } catch (error) {
        const pop = box("Failed to load assets.", "error");
        closeBox(pop, 2000);
    } finally {
        removeLoader();
    }
}

await loadAssets();

// Qr Url
open_public_page.addEventListener("click", () => {
    const assetId = open_public_page.dataset.id;

    window.open(
        `${BASE_URL}/public.html?id=${encodeURIComponent(assetId)}`,
        "_blank"
    );
});

//Download Qr btn
download_qr.addEventListener("click", () => {
    if (!view_qr_img.src) {
        const pop = box("No QR code available.", "error");
        closeBox(pop, 1200);
        return;
    }

    const a = document.createElement("a");
    a.href = view_qr_img.src;
    a.download = `${view_assetId.textContent}-QR.png`;

    document.body.appendChild(a);
    a.click();
    a.remove();
});

//Copy Qr btn
copy_link.addEventListener("click", async () => {
    const assetId = open_public_page.dataset.id;
    const link = `${BASE_URL}/public.html?id=${encodeURIComponent(assetId)}`;

    try {
        await navigator.clipboard.writeText(link);

        const pop = box("Public link copied!", "success");
        closeBox(pop, 1500);
    } catch (error) {
        console.error(error);
        const pop = box("Failed to copy link.", "error");
        closeBox(pop, 1500);
    }
});


//Issue Section
let allIssues = [];        // full cache of loaded reports { id, ...data }
let currentIssueFilter = "all";
let currentSearchTerm = "";
let issuesLoaded = false;  // avoid refetching every time the tab is opened
let currentDetailDocId = null;

// ---------- helpers ----------
function formatIssueDate(createdAt) {
    if (!createdAt) return "N/A";
    try {
        if (typeof createdAt.toDate === "function") {
            return createdAt.toDate().toLocaleString();
        }
        if (createdAt.seconds) {
            return new Date(createdAt.seconds * 1000).toLocaleString();
        }
        return new Date(createdAt).toLocaleString();
    } catch {
        return "N/A";
    }
}

function normalizeStatus(status) {
    const s = (status || "pending").toLowerCase().trim();
    if (s === "open") return "pending";
    if (["pending", "in-progress", "resolved", "closed"].includes(s)) return s;
    return "pending";
}

function normalizePriority(priority) {
    const p = (priority || "").toLowerCase().trim();
    if (["high", "medium", "low"].includes(p)) return p;
    return "medium";
}

function statusLabel(status) {
    const map = {
        pending: "Pending",
        "in-progress": "In Progress",
        resolved: "Resolved",
        closed: "Closed"
    };
    return map[status] || "Pending";
}

function avatarUrlFor(name) {
    const safeName = encodeURIComponent(name || "User");
    return `https://ui-avatars.com/api/?name=${safeName}&background=4169E1&color=fff`;
}

// ---------- render a single card from the template ----------
function renderIssueCard(issue) {
    const node = issue_card_template.content.cloneNode(true);
    const card = node.querySelector(".issue_card");

    const status = normalizeStatus(issue.status);
    const priority = normalizePriority(issue.priority);

    card.dataset.docId = issue.id;
    card.dataset.priority = priority;

    card.querySelector(".issue_user_image").src = issue.reporterImage || avatarUrlFor(issue.reporterName);
    card.querySelector(".issue_reporter_name").textContent = issue.reporterName || "";
    card.querySelector(".issue_reporter_email").textContent = issue.reporterEmail || "";

    const statusEl = card.querySelector(".issue_status");
    statusEl.dataset.status = status;
    statusEl.textContent = statusLabel(status);

    card.querySelector(".issue_asset_name").textContent = issue.assetName || "";
    card.querySelector(".issue_asset_id").textContent = issue.assetId || "";
    card.querySelector(".issue_reason").textContent = issue.reason || "";

    const priorityEl = card.querySelector(".issue_priority");
    priorityEl.dataset.priority = priority;
    priorityEl.textContent = priority.charAt(0).toUpperCase() + priority.slice(1);

    card.querySelector(".issue_description").textContent = issue.description || "";
    card.querySelector(".issue_date").textContent = formatIssueDate(issue.createdAt);

    // View report -> open detail modal
    card.querySelector(".issue_view_btn").addEventListener("click", () => {
        openIssueDetail(issue.id);
    });

    // Quick resolve
    const resolveBtn = card.querySelector(".issue_resolve_btn");
    if (status === "resolved") {
        resolveBtn.style.opacity = ".5";
        resolveBtn.style.pointerEvents = "none";
        resolveBtn.title = "Already resolved";
    }
    resolveBtn.addEventListener("click", async () => {
        await updateIssueStatus(issue.id, "resolved");
    });

    return card;
}

// ---------- filter + search + repaint ----------
function applyIssueFilters() {
    if (!issue_container) return;

    let filtered = allIssues;

    if (currentIssueFilter !== "all") {
        filtered = filtered.filter((i) => normalizeStatus(i.status) === currentIssueFilter);
    }

    if (currentSearchTerm) {
        const term = currentSearchTerm.toLowerCase();
        filtered = filtered.filter((i) => {
            return (
                (i.assetName || "").toLowerCase().includes(term) ||
                (i.assetId || "").toLowerCase().includes(term) ||
                (i.reporterName || "").toLowerCase().includes(term) ||
                (i.reporterEmail || "").toLowerCase().includes(term)
            );
        });
    }

    issue_container.innerHTML = "";

    if (filtered.length === 0) {
        issue_empty.classList.add("show");
    } else {
        issue_empty.classList.remove("show");
        filtered.forEach((issue) => {
            issue_container.appendChild(renderIssueCard(issue));
        });
    }
}

// ---------- load reports from Firestore ----------
async function loadIssues(force = false) {
    if (issuesLoaded && !force) {
        applyIssueFilters();
        return;
    }

    loader();
    try {
        const querySnapshot = await getDocs(collection(db, "reports"));

        allIssues = [];
        querySnapshot.forEach((docSnap) => {
            allIssues.push({ id: docSnap.id, ...docSnap.data() });
        });

        // newest first
        allIssues.sort((a, b) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return bTime - aTime;
        });

        issuesLoaded = true;
        applyIssueFilters();

    } catch (error) {
        console.error("Error loading issues:", error);
        const pop = box("Failed to load issue reports.", "error");
        closeBox(pop, 2000);
    } finally {
        removeLoader();
    }
}

// ---------- search + filter listeners ----------
if (issue_search_input) {
    let searchDebounce;
    issue_search_input.addEventListener("input", () => {
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => {
            currentSearchTerm = issue_search_input.value.trim();
            applyIssueFilters();
        }, 200);
    });
}

issue_filter_btns.forEach((btn) => {
    btn.addEventListener("click", () => {
        issue_filter_btns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        currentIssueFilter = btn.dataset.filter;
        applyIssueFilters();
    });
});

// ---------- update status (used by quick-resolve + detail modal) ----------
async function updateIssueStatus(docId, newStatus) {
    loader();
    try {
        await updateDoc(doc(db, "reports", docId), { status: newStatus });

        const issue = allIssues.find((i) => i.id === docId);
        if (issue) issue.status = newStatus;

        applyIssueFilters();

        if (issue_detail.classList.contains("show") && currentDetailDocId === docId) {
            renderIssueDetail(issue);
        }

        const pop = box("Issue status updated.", "success");
        closeBox(pop, 1200);
    } catch (error) {
        console.error("Error updating issue:", error);
        const pop = box(error.message || "Failed to update issue.", "error");
        closeBox(pop, 2000);
    } finally {
        removeLoader();
    }
}

// ---------- detail modal ----------
function renderIssueDetail(issue) {
    const status = normalizeStatus(issue.status);
    const priority = normalizePriority(issue.priority);

    detail_user_image.src = issue.reporterImage || avatarUrlFor(issue.reporterName);
    detail_reporter_name.textContent = issue.reporterName || "";
    detail_reporter_email.textContent = issue.reporterEmail || "";

    detail_asset_name.textContent = issue.assetName || "";
    detail_asset_id.textContent = issue.assetId || "";
    detail_reason.textContent = issue.reason || "";

    detail_priority.textContent = priority.charAt(0).toUpperCase() + priority.slice(1);
    detail_priority.dataset.priority = priority;

    detail_date.textContent = formatIssueDate(issue.createdAt);
    detail_status.textContent = statusLabel(status);

    detail_description.textContent = issue.description || "No description provided.";

    detail_status_select.value = status === "closed" ? "resolved" : status;
}

function openIssueDetail(docId) {
    const issue = allIssues.find((i) => i.id === docId);
    if (!issue) return;

    currentDetailDocId = docId;
    renderIssueDetail(issue);
    issue_detail.classList.add("show");
}

function closeIssueDetail() {
    issue_detail.classList.remove("show");
    currentDetailDocId = null;
}

issue_detail_close.addEventListener("click", closeIssueDetail);

issue_detail.addEventListener("click", (e) => {
    if (e.target === issue_detail) closeIssueDetail();
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && issue_detail.classList.contains("show")) {
        closeIssueDetail();
    }
});

detail_status_select.addEventListener("change", async () => {
    if (!currentDetailDocId) return;
    await updateIssueStatus(currentDetailDocId, detail_status_select.value);
});

issue_detail_delete.addEventListener("click", async () => {
    if (!currentDetailDocId) return;

    const issue = allIssues.find((i) => i.id === currentDetailDocId);
    const confirmed = window.confirm(
        `Delete this report for "${issue?.assetName || "this asset"}"? This cannot be undone.`
    );
    if (!confirmed) return;

    loader();
    issue_detail_delete.disabled = true;

    try {
        await deleteDoc(doc(db, "reports", currentDetailDocId));

        allIssues = allIssues.filter((i) => i.id !== currentDetailDocId);
        applyIssueFilters();
        closeIssueDetail();

        const pop = box("Report Deleted", "info");
        closeBox(pop, 1200);
    } catch (error) {
        console.error("Error deleting report:", error);
        const pop = box(error.message || "Failed to delete report.", "error");
        closeBox(pop, 2000);
    } finally {
        removeLoader();
        issue_detail_delete.disabled = false;
    }
});