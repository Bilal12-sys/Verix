import {
    db,
    addDoc,
    collection,
    serverTimestamp,
    getDocs,
    deleteDoc,
    doc
} from "./config/firebase.js";

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

// ===============================
// Loader (fixed)
// - loader() now removes any stale loader first, so calling it
//   twice in a row can never leave two loaders stacked in the DOM.
// - removeLoader() actually removes the node instead of just hiding it,
//   and is now safe to call even if no loader exists (no more throw).
// ===============================
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

function removeLoader() {
    const loaderEl = document.querySelector(".loader");
    if (!loaderEl) return; // nothing to remove, avoid throwing

    loaderEl.classList.add("hide");
    loaderEl.remove()
}

function closeBox(pop, delay = 1500) {
    setTimeout(() => {
        pop.classList.add("pop_out");
        setTimeout(() => pop.remove(), 300);
    }, delay);
}

// ===============================
// Element References
// ===============================
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

// Guard: fail loudly in dev if markup/IDs don't match, instead of silent null errors later
const requiredEls = {
    opem_assest_model, assest_model, Cancel_assest_model, form,
    Asset_image, Asset_preview, uploadBtn, Assest_img_box,
    Assest_img_cross_btn, uploadText
};
for (const [name, el] of Object.entries(requiredEls)) {
    if (!el) {
        console.error(`Missing required DOM element: #${name}. Check your HTML IDs.`);
    }
}

const submitBtn = form?.querySelector('button[type="submit"]');

// ===============================
// Open / Close Modal
// ===============================
opem_assest_model.addEventListener("click", () => {
    assest_model.classList.add("show");
});

Cancel_assest_model.addEventListener("click", () => {
    assest_model.classList.remove("show");
    resetImagePreview();
    form.reset();

    const pop = box("Asset Cancel", "error");
    closeBox(pop, 1200);
});

// ===============================
// Image Preview
// ===============================
const MAX_IMAGE_SIZE_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

Asset_image.addEventListener("change", () => {
    const file = Asset_image.files[0];

    if (!file) return;

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
        const pop = box("Please select a valid image file (JPG, PNG, WEBP, GIF).", "error");
        closeBox(pop, 2000);
        Asset_image.value = "";
        return;
    }

    // Validate size
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        const pop = box(`Image must be smaller than ${MAX_IMAGE_SIZE_MB}MB.`, "error");
        closeBox(pop, 2000);
        Asset_image.value = "";
        return;
    }

    const fileReader = new FileReader();

    fileReader.onload = () => {
        Asset_preview.src = fileReader.result;
        Asset_preview.style.display = "block";
        Assest_img_box.style.display = "flex";
        uploadText.style.display = "none";
        uploadBtn.style.display = "none";
        Assest_img_cross_btn.style.display = "block";
    };

    fileReader.onerror = () => {
        console.error("Failed to read image.");
        const pop = box("Failed to read image file.", "error");
        closeBox(pop, 2000);
    };

    fileReader.readAsDataURL(file);
});

const open_public_page = document.getElementById("open_public_page");
const copy_link = document.getElementById("copy_link");
const download_qr = document.getElementById("download_qr");

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


// ===============================
// Upload Image To Cloudinary
// ===============================
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
        // fetch itself throws on network failure (offline, CORS, DNS, etc.)
        throw new Error("Network error while uploading image. Please check your connection.");
    }

    let data;
    try {
        data = await response.json();
    } catch {
        throw new Error("Unexpected response from image upload service.");
    }

    if (!response.ok) {
        const message = data?.error?.message || `Image upload failed (status ${response.status}).`;
        throw new Error(message);
    }

    if (!data.secure_url) {
        throw new Error("Image upload succeeded but no URL was returned.");
    }

    return data.secure_url;
}

// ===============================
// Remove Image
// ===============================
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

// ===============================
// Form Validation
// ===============================
function validateAssetForm(fields) {
    const requiredStringFields = [
        ["Asset_name", "Asset name"],
        ["Asset_id", "Asset ID"],
        ["Asset_location", "Location"]
    ];

    for (const [key, label] of requiredStringFields) {
        if (!fields[key]) {
            return `${label} is required.`;
        }
    }

    // <select> elements often default to a disabled/placeholder option with value ""
    const requiredSelectFields = [
        ["Asset_category", "Category"],
        ["Asset_department", "Department"],
        ["Asset_status", "Status"]
    ];

    for (const [key, label] of requiredSelectFields) {
        if (!fields[key]) {
            return `Please select a ${label.toLowerCase()}.`;
        }
    }

    return null; // no errors
}

// ===============================
// Add Asset
// ===============================
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

    // Validate before doing any network work (avoids wasted image uploads AND wasted loader)
    const validationError = validateAssetForm(fields);
    if (validationError) {
        const pop = box(validationError, "error");
        closeBox(pop, 2000);
        return;
    }

    const file = Asset_image.files[0];

    // Prevent double-submit
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.originalText = submitBtn.dataset.originalText || submitBtn.textContent;
        submitBtn.textContent = "Saving...";
    }

    loader();

    const publicURL = `https://yourdomain.com/asset.html?id=${fields.Asset_id}`;

    const qrImage = await generateQR(publicURL);

    try {
        let imageURL = "";

        if (file) {
            imageURL = await img_upload(file);
        }

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

        // refresh the list so the new asset shows up immediately
        await loadAssets();

    } catch (error) {
        console.error(error);

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

// Sections
const Dashboard_btn = document.getElementById("Dashboard_btn");
const Asset_btn = document.getElementById("Asset_btn");
const Dashboard_Section = document.getElementById("Dashboard_Section");
const Asset_Section = document.getElementById("Asset_Section");


// Assest view Box Select
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

// ==============================
// Edit Asset Modal
// ==============================


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

let currentEditDocId = null;


function Show_Dashboard_Section() {
    Dashboard_Section.style.display = "block"
    Asset_Section.style.display = "none"
}

function Show_Asset_Section() {
    Dashboard_Section.style.display = "none"
    Asset_Section.style.display = "block"
}

Dashboard_btn.addEventListener('click', () => {
    Show_Dashboard_Section()
})

Asset_btn.addEventListener('click', () => {
    Show_Asset_Section()
})



// Asset Container
const Asset_Boxes = document.querySelector(".Asset_boxes");

// =========================
// Load All Assets (fixed)
// - loader() is called once before the fetch, removeLoader() once after
//   ALL cards are built. Previously removeLoader() was called inside the
//   forEach on every card, which broke after the first card and could
//   throw on the rest.
// =========================
async function loadAssets() {
    loader();
    try {
        Asset_Boxes.innerHTML = "";

        const querySnapshot = await getDocs(collection(db, "assets"));

        querySnapshot.forEach((docSnap) => {
            const asset = docSnap.data();
            const assetDocId = docSnap.id; // real Firestore doc id, needed for edit/delete

            const card = document.createElement("div");
            card.className = "assetCard";

            card.innerHTML = `
                <div class="assetContent">

                    <div class="assetHeader">
                        <h2>${asset.name}</h2>
                        <span>${asset.status}</span>
                    </div>

                    <p class="assetID">
                        Asset ID:
                        <span>${asset.assetId}</span>
                    </p>

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

            // Select buttons from THIS card
            const viewBtn = card.querySelector(".Asset_box_view");
            const editBtn = card.querySelector(".Asset_box_edit");
            const deleteBtn = card.querySelector(".Asset_box_delete");


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

                // Created Date
                if (asset.createdAt) {
                    view_created.textContent = asset.createdAt.toDate().toLocaleString();
                } else {
                    view_created.textContent = "N/A";
                }

                // QR image (if you save one)
                view_qr_img.src = asset.qr || "";

                Asset_full_view.classList.add("show");
            });

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
            editClose.addEventListener("click", () => {
                edit_asset_modal.classList.remove("show");
                // clear the current edit id and reset the form to avoid stale state
                currentEditDocId = null;
                editForm.reset();
            });

            editCancel.addEventListener("click", () => {
                edit_asset_modal.classList.remove("show");
                currentEditDocId = null;
                editForm.reset();
            });

            editImage.addEventListener("change", () => {

                const file = editImage.files[0];

                if (!file) return;

                const reader = new FileReader();

                reader.onload = () => {
                    editPreview.src = reader.result;
                };

                reader.readAsDataURL(file);

            });

            // Save btn

            editForm.addEventListener("submit", async (e) => {

                e.preventDefault();

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

                    await loadAssets();

                } catch (error) {

                    console.error(error);

                    const pop = box(error.message, "error");
                    closeBox(pop, 2000);

                } finally {

                    removeLoader();

                }

            });

            // Delete now actually deletes from Firestore, with its own loader
            // and a confirm step so a stray click can't wipe an asset.
            deleteBtn.addEventListener("click", async () => {
                const confirmed = window.confirm(`Delete "${asset.name}"? This cannot be undone.`);
                if (!confirmed) return;

                loader();
                deleteBtn.disabled = true;

                try {
                    await deleteDoc(doc(db, "assets", assetDocId));

                    card.remove(); // remove just this card, no need to reload everything

                    const pop = box("Asset Deleted", "success");
                    closeBox(pop, 1200);
                } catch (error) {
                    console.error("Error Deleting Asset:", error);
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
        console.error("Error Loading Assets:", error);
        const pop = box("Failed to load assets.", "error");
        closeBox(pop, 2000);
    } finally {
        removeLoader(); // guaranteed to run exactly once, success or fail
    }
}
await loadAssets();

Asset_view_box_close.addEventListener('click', () => {
    Asset_full_view.classList.remove("show")
})
const BASE_URL = "https://verix-app.netlify.app";

open_public_page.addEventListener("click", () => {

    const assetId = open_public_page.dataset.id;

    window.open(
        `${BASE_URL}/public.html?id=${encodeURIComponent(assetId)}`,
        "_blank"
    );

});

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

// Edit input

