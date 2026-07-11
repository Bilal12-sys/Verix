import {
    auth,
    db,
    signOut,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
    updateDoc,
    doc,
    deleteDoc,
    onSnapshot
} from "./config/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

let currentUser = null;
let allAssets = [];
let allIssues = [];
let currentEditingAsset = null;
let currentEditingIssue = null;

document.addEventListener("DOMContentLoaded", async () => {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = "index.html";
            return;
        }
        
        currentUser = user;
        updateUserProfile();
        await loadAssets();
        await loadIssues();
        initializeUI();
        refreshDashboard();
    });
});

function updateUserProfile() {
    if (!currentUser) return;
    const userAvatar = document.getElementById("userAvatar");
    const userName = document.getElementById("userName");
    const userEmail = document.getElementById("userEmail");
    
    const initial = (currentUser.displayName || currentUser.email).charAt(0).toUpperCase();
    userAvatar.textContent = initial;
    userName.textContent = currentUser.displayName || "User";
    userEmail.textContent = currentUser.email;
}

function initializeUI() {
    setupNavigation();
    setupModals();
    setupFormHandlers();
    setupSearch();
    setupLogout();
}

function setupNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            showPage(page);
            navItems.forEach(i => i.classList.remove("active"));
            item.classList.add("active");
        });
    });
}

function showPage(page) {
    const sections = document.querySelectorAll(".page-section");
    sections.forEach(s => s.classList.remove("active"));
    
    const targetSection = document.getElementById(page + "View");
    if (targetSection) {
        targetSection.classList.add("active");
        
        if (page === "assets") renderAssets();
        else if (page === "issues") renderIssues();
        else if (page === "maintenance") renderMaintenance();
        else if (page === "history") renderHistory();
    }
}

async function loadAssets() {
    try {
        const q = query(collection(db, "users", currentUser.uid, "assets"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        allAssets = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
    } catch (error) {
        console.error("Error loading assets:", error);
    }
}

async function loadIssues() {
    try {
        const q = query(collection(db, "users", currentUser.uid, "issues"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        allIssues = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
    } catch (error) {
        console.error("Error loading issues:", error);
    }
}

function refreshDashboard() {
    const totalAssets = allAssets.length;
    const activeIssues = allIssues.filter(i => !["Resolved", "Closed"].includes(i.status)).length;
    const underMaintenance = allAssets.filter(a => a.status === "Under Maintenance").length;
    const operational = allAssets.filter(a => a.status === "Operational").length;
    
    document.getElementById("totalAssets").textContent = totalAssets;
    document.getElementById("activeIssues").textContent = activeIssues;
    document.getElementById("underMaintenance").textContent = underMaintenance;
    document.getElementById("operationalAssets").textContent = operational;
    
    renderRecentIssues();
    updateAssetSelects();
}

function renderRecentIssues() {
    const container = document.getElementById("recentIssuesContainer");
    const recent = allIssues.slice(0, 5);
    
    if (recent.length === 0) {
        container.innerHTML = '<p class="empty-state">No issues yet</p>';
        return;
    }
    
    container.innerHTML = recent.map(issue => `
        <div class="issue-item">
            <div class="issue-item-header">
                <span class="issue-number">ISS-${issue.id.substring(0, 6).toUpperCase()}</span>
                <div class="issue-title">${escapeHtml(issue.title)}</div>
                <div class="issue-meta">
                    <span>Asset: ${allAssets.find(a => a.id === issue.assetId)?.name || 'Unknown'}</span>
                    <span class="issue-priority ${issue.priority.toLowerCase()}">${issue.priority}</span>
                    <span>${issue.status}</span>
                </div>
            </div>
        </div>
    `).join("");
}

function setupModals() {
    const modalCloseButtons = document.querySelectorAll(".modal-close, .modal-close-btn");
    modalCloseButtons.forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const modal = btn.closest(".modal");
            if (modal) modal.classList.remove("active");
        });
    });
    
    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("modal")) {
            e.target.classList.remove("active");
        }
    });
    
    // Create Asset Buttons
    document.getElementById("createAssetBtn")?.addEventListener("click", openAssetModal);
    document.getElementById("createAssetBtn2")?.addEventListener("click", openAssetModal);
}

function openAssetModal(assetId = null) {
    currentEditingAsset = assetId ? allAssets.find(a => a.id === assetId) : null;
    const modal = document.getElementById("assetModal");
    const form = document.getElementById("assetForm");
    
    if (currentEditingAsset) {
        document.getElementById("assetModalTitle").textContent = "Edit Asset";
        document.getElementById("assetName").value = currentEditingAsset.name;
        document.getElementById("assetCode").value = currentEditingAsset.code;
        document.getElementById("assetCategory").value = currentEditingAsset.category;
        document.getElementById("assetLocation").value = currentEditingAsset.location;
        document.getElementById("assetCondition").value = currentEditingAsset.condition;
        document.getElementById("assetStatus").value = currentEditingAsset.status;
        document.getElementById("lastServiceDate").value = currentEditingAsset.lastServiceDate || "";
        document.getElementById("nextServiceDate").value = currentEditingAsset.nextServiceDate || "";
        document.getElementById("assetDescription").value = currentEditingAsset.description || "";
        document.getElementById("qrSection").style.display = "block";
        generateQRCode(currentEditingAsset.id, currentEditingAsset.code);
    } else {
        document.getElementById("assetModalTitle").textContent = "Create Asset";
        form.reset();
        document.getElementById("assetCode").value = generateAssetCode();
        document.getElementById("qrSection").style.display = "none";
    }
    
    modal.classList.add("active");
}

function generateAssetCode() {
    return "AST-" + Date.now().toString().slice(-8).toUpperCase();
}

function setupFormHandlers() {
    // Asset Form
    document.getElementById("assetForm")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const assetData = {
            name: document.getElementById("assetName").value,
            code: document.getElementById("assetCode").value,
            category: document.getElementById("assetCategory").value,
            location: document.getElementById("assetLocation").value,
            condition: document.getElementById("assetCondition").value,
            status: document.getElementById("assetStatus").value,
            lastServiceDate: document.getElementById("lastServiceDate").value,
            nextServiceDate: document.getElementById("nextServiceDate").value,
            description: document.getElementById("assetDescription").value,
            updatedAt: serverTimestamp()
        };
        
        try {
            if (currentEditingAsset) {
                await updateDoc(doc(db, "users", currentUser.uid, "assets", currentEditingAsset.id), assetData);
                showNotification("Asset updated successfully", "success");
            } else {
                assetData.createdAt = serverTimestamp();
                await addDoc(collection(db, "users", currentUser.uid, "assets"), assetData);
                showNotification("Asset created successfully", "success");
            }
            
            document.getElementById("assetModal").classList.remove("active");
            await loadAssets();
            refreshDashboard();
            renderAssets();
        } catch (error) {
            showNotification("Error saving asset: " + error.message, "error");
        }
    });
    
    // Issue Form
    document.getElementById("issueForm")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const issueData = {
            assetId: document.getElementById("issueAsset").value,
            title: document.getElementById("issueTitle").value,
            description: document.getElementById("issueDescription").value,
            priority: document.getElementById("issuePriority").value,
            category: document.getElementById("issueCategory").value,
            reporterName: document.getElementById("reporterName").value,
            reporterContact: document.getElementById("reporterContact").value,
            status: "Reported",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        
        try {
            await addDoc(collection(db, "users", currentUser.uid, "issues"), issueData);
            
            const asset = allAssets.find(a => a.id === issueData.assetId);
            if (asset && asset.status !== "Out of Service") {
                await updateDoc(doc(db, "users", currentUser.uid, "assets", asset.id), {
                    status: "Issue Reported",
                    updatedAt: serverTimestamp()
                });
            }
            
            showNotification("Issue reported successfully", "success");
            document.getElementById("issueModal").classList.remove("active");
            document.getElementById("issueForm").reset();
            
            await loadAssets();
            await loadIssues();
            refreshDashboard();
            renderIssues();
        } catch (error) {
            showNotification("Error reporting issue: " + error.message, "error");
        }
    });
    
    // Maintenance Form
    document.getElementById("maintenanceForm")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const issueId = document.getElementById("maintenanceModal")?.dataset.issueId;
        if (!issueId) return;
        
        try {
            const maintenanceRecord = {
                issueId,
                notes: document.getElementById("maintenanceNotes").value,
                parts: document.getElementById("maintenanceParts").value,
                cost: parseFloat(document.getElementById("maintenanceCost").value) || 0,
                timeSpent: parseFloat(document.getElementById("maintenanceTime").value) || 0,
                status: document.getElementById("maintenanceStatus").value,
                nextServiceDate: document.getElementById("maintenanceNextService").value,
                recordedAt: serverTimestamp()
            };
            
            const issue = allIssues.find(i => i.id === issueId);
            if (issue) {
                await updateDoc(doc(db, "users", currentUser.uid, "issues", issueId), {
                    status: maintenanceRecord.status,
                    maintenance: maintenanceRecord,
                    updatedAt: serverTimestamp()
                });
                
                const asset = allAssets.find(a => a.id === issue.assetId);
                if (asset) {
                    const newStatus = maintenanceRecord.status === "Resolved" ? "Operational" : "Under Maintenance";
                    await updateDoc(doc(db, "users", currentUser.uid, "assets", asset.id), {
                        status: newStatus,
                        lastServiceDate: new Date().toISOString().split('T')[0],
                        nextServiceDate: maintenanceRecord.nextServiceDate,
                        updatedAt: serverTimestamp()
                    });
                }
            }
            
            showNotification("Maintenance recorded successfully", "success");
            document.getElementById("maintenanceModal").classList.remove("active");
            document.getElementById("maintenanceForm").reset();
            
            await loadAssets();
            await loadIssues();
            refreshDashboard();
        } catch (error) {
            showNotification("Error recording maintenance: " + error.message, "error");
        }
    });
    
    // AI Triage Button
    document.getElementById("aiTriageBtn")?.addEventListener("click", async () => {
        const description = document.getElementById("issueDescription").value;
        const assetId = document.getElementById("issueAsset").value;
        const asset = allAssets.find(a => a.id === assetId);
        
        if (!description || !asset) {
            showNotification("Please select an asset and provide a description", "error");
            return;
        }
        
        await getAISuggestions(description, asset);
    });
}

async function getAISuggestions(description, asset) {
    const container = document.getElementById("aiSuggestionsContainer");
    container.style.display = "block";
    container.innerHTML = '<p>Analyzing issue...</p>';
    
    try {
        const mockSuggestions = {
            title: `${asset.name}: Issue Detected`,
            category: "Maintenance",
            priority: "High",
            possibleCauses: [
                "Regular wear and tear",
                "Environmental factors",
                "Component degradation"
            ],
            initialChecks: [
                "Inspect visible components",
                "Check operational history",
                "Verify maintenance schedule"
            ]
        };
        
        container.innerHTML = `
            <div class="ai-suggestions">
                <div class="ai-suggestion-item">
                    <div class="ai-suggestion-label">Suggested Title:</div>
                    ${escapeHtml(mockSuggestions.title)}
                </div>
                <div class="ai-suggestion-item">
                    <div class="ai-suggestion-label">Category:</div>
                    ${mockSuggestions.category}
                </div>
                <div class="ai-suggestion-item">
                    <div class="ai-suggestion-label">Priority:</div>
                    ${mockSuggestions.priority}
                </div>
                <div class="ai-suggestion-item">
                    <div class="ai-suggestion-label">Possible Causes:</div>
                    <ul>${mockSuggestions.possibleCauses.map(c => `<li>${c}</li>`).join('')}</ul>
                </div>
                <div class="ai-suggestion-item">
                    <div class="ai-suggestion-label">Initial Checks:</div>
                    <ul>${mockSuggestions.initialChecks.map(c => `<li>${c}</li>`).join('')}</ul>
                </div>
            </div>
        `;
        
        document.getElementById("issueTitle").value = mockSuggestions.title;
        document.getElementById("issueCategory").value = mockSuggestions.category;
        document.getElementById("issuePriority").value = mockSuggestions.priority;
        
    } catch (error) {
        container.innerHTML = '<p class="error">Failed to get AI suggestions. Please try again.</p>';
    }
}

function generateQRCode(assetId, assetCode) {
    const qrContainer = document.getElementById("qrCode");
    const publicURL = `${window.location.origin}/public-asset.html?code=${assetCode}`;
    
    qrContainer.innerHTML = `
        <div style="text-align: center;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(publicURL)}" alt="QR Code">
            <p style="margin-top: 10px; font-size: 12px; color: #64748B;">${assetCode}</p>
        </div>
    `;
    
    document.getElementById("downloadQr").onclick = () => downloadQR(assetCode, publicURL);
    document.getElementById("copyLink").onclick = () => copyToClipboard(publicURL);
    document.getElementById("openPublic").onclick = () => window.open(publicURL, "_blank");
}

function downloadQR(assetCode, publicURL) {
    const link = document.createElement("a");
    link.href = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(publicURL)}`;
    link.download = `${assetCode}-QR.png`;
    link.click();
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification("Link copied to clipboard", "success");
    });
}

function renderAssets() {
    const container = document.getElementById("assetsContainer");
    const statusFilter = document.getElementById("statusFilter").value;
    const searchTerm = document.getElementById("assetSearch").value.toLowerCase();
    
    let filtered = allAssets;
    if (statusFilter) {
        filtered = filtered.filter(a => a.status === statusFilter);
    }
    if (searchTerm) {
        filtered = filtered.filter(a => 
            a.name.toLowerCase().includes(searchTerm) ||
            a.code.toLowerCase().includes(searchTerm) ||
            a.location.toLowerCase().includes(searchTerm)
        );
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '<p class="empty-state">No assets found</p>';
        return;
    }
    
    container.innerHTML = filtered.map(asset => `
        <div class="asset-card">
            <div class="asset-card-header">
                <span class="asset-code">${escapeHtml(asset.code)}</span>
                <span class="asset-status ${asset.status.toLowerCase().replace(/\s+/g, '-')}">${asset.status}</span>
            </div>
            <h4>${escapeHtml(asset.name)}</h4>
            <div class="asset-card-info">
                <span><strong>Category:</strong> ${asset.category}</span>
                <span><strong>Location:</strong> ${asset.location}</span>
                <span><strong>Condition:</strong> ${asset.condition}</span>
                ${asset.nextServiceDate ? `<span><strong>Next Service:</strong> ${asset.nextServiceDate}</span>` : ''}
            </div>
            <div class="asset-card-actions">
                <button onclick="editAsset('${asset.id}')">Edit</button>
                <button onclick="viewAssetDetails('${asset.id}')">View</button>
                <button onclick="reportIssueForAsset('${asset.id}')">Report Issue</button>
            </div>
        </div>
    `).join("");
}

function renderIssues() {
    const container = document.getElementById("issuesContainer");
    const statusFilter = document.getElementById("issueStatusFilter").value;
    const searchTerm = document.getElementById("issueSearch").value.toLowerCase();
    
    let filtered = allIssues;
    if (statusFilter) {
        filtered = filtered.filter(i => i.status === statusFilter);
    }
    if (searchTerm) {
        filtered = filtered.filter(i => 
            i.title.toLowerCase().includes(searchTerm) ||
            i.description.toLowerCase().includes(searchTerm)
        );
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '<p class="empty-state">No issues found</p>';
        return;
    }
    
    container.innerHTML = filtered.map(issue => `
        <div class="issue-item">
            <div class="issue-item-header">
                <span class="issue-number">ISS-${issue.id.substring(0, 6).toUpperCase()}</span>
                <div class="issue-title">${escapeHtml(issue.title)}</div>
                <div class="issue-meta">
                    <span>Asset: ${allAssets.find(a => a.id === issue.assetId)?.name || 'Unknown'}</span>
                    <span class="issue-priority ${issue.priority.toLowerCase()}">${issue.priority}</span>
                    <span>${issue.status}</span>
                </div>
            </div>
            <div style="display: flex; gap: 8px;">
                <button class="btn btn-secondary" onclick="updateIssueStatus('${issue.id}')">Update</button>
                <button class="btn btn-secondary" onclick="recordMaintenance('${issue.id}')">Record Maintenance</button>
            </div>
        </div>
    `).join("");
}

function renderMaintenance() {
    const container = document.getElementById("maintenanceContainer");
    const maintenanceIssues = allIssues.filter(i => i.maintenance);
    
    if (maintenanceIssues.length === 0) {
        container.innerHTML = '<p class="empty-state">No maintenance records yet</p>';
        return;
    }
    
    container.innerHTML = maintenanceIssues.map(issue => `
        <div class="maintenance-list" style="background: rgba(248, 250, 255, .75); backdrop-filter: blur(20px); border: 1px solid rgba(65, 105, 225, .15); border-radius: 12px; padding: 16px; margin-bottom: 12px;">
            <h4>${escapeHtml(issue.title)}</h4>
            <p><strong>Status:</strong> ${issue.maintenance.status}</p>
            <p><strong>Notes:</strong> ${escapeHtml(issue.maintenance.notes)}</p>
            <p><strong>Parts:</strong> ${escapeHtml(issue.maintenance.parts || 'None')}</p>
            <p><strong>Cost:</strong> $${issue.maintenance.cost}</p>
            <p><strong>Time Spent:</strong> ${issue.maintenance.timeSpent} hours</p>
        </div>
    `).join("");
}

function renderHistory() {
    const container = document.getElementById("historyContainer");
    let historyItems = [];
    
    allAssets.forEach(asset => {
        if (asset.updatedAt) {
            historyItems.push({
                date: asset.updatedAt.toDate ? asset.updatedAt.toDate() : new Date(asset.updatedAt),
                action: "Asset Updated",
                description: `${escapeHtml(asset.name)} - Status: ${asset.status}`,
                type: "asset"
            });
        }
    });
    
    allIssues.forEach(issue => {
        if (issue.createdAt) {
            historyItems.push({
                date: issue.createdAt.toDate ? issue.createdAt.toDate() : new Date(issue.createdAt),
                action: "Issue Reported",
                description: `${escapeHtml(issue.title)} - Priority: ${issue.priority}`,
                type: "issue"
            });
        }
    });
    
    historyItems.sort((a, b) => b.date - a.date);
    
    if (historyItems.length === 0) {
        container.innerHTML = '<p class="empty-state">No history yet</p>';
        return;
    }
    
    container.innerHTML = `<div class="history-timeline">
        ${historyItems.map(item => `
            <div class="history-item">
                <div class="history-item-header">${item.action}</div>
                <div class="history-item-meta">${item.date.toLocaleDateString()} ${item.date.toLocaleTimeString()}</div>
                <div class="history-item-description">${item.description}</div>
            </div>
        `).join('')}
    </div>`;
}

function setupSearch() {
    document.getElementById("assetSearch")?.addEventListener("input", renderAssets);
    document.getElementById("statusFilter")?.addEventListener("change", renderAssets);
    document.getElementById("issueSearch")?.addEventListener("input", renderIssues);
    document.getElementById("issueStatusFilter")?.addEventListener("change", renderIssues);
}

function updateAssetSelects() {
    const select = document.getElementById("issueAsset");
    if (!select) return;
    
    select.innerHTML = '<option value="">Select Asset</option>' +
        allAssets.map(a => `<option value="${a.id}">${escapeHtml(a.name)} (${a.code})</option>`).join("");
}

function setupLogout() {
    document.getElementById("Logout_btn")?.addEventListener("click", async () => {
        try {
            await signOut(auth);
            window.location.href = "index.html";
        } catch (error) {
            showNotification("Error logging out: " + error.message, "error");
        }
    });
}

window.editAsset = function(id) {
    openAssetModal(id);
};

window.viewAssetDetails = function(id) {
    const asset = allAssets.find(a => a.id === id);
    if (asset) {
        showNotification(`Asset: ${asset.name}\nCode: ${asset.code}\nStatus: ${asset.status}`, "info");
    }
};

window.reportIssueForAsset = function(id) {
    document.getElementById("issueAsset").value = id;
    document.getElementById("issueModal").classList.add("active");
};

window.updateIssueStatus = async function(id) {
    const issue = allIssues.find(i => i.id === id);
    const newStatus = prompt("Enter new status (Assigned/Inspection Started/Maintenance In Progress/Waiting for Parts/Resolved/Closed):", issue.status);
    
    if (newStatus && newStatus !== issue.status) {
        try {
            await updateDoc(doc(db, "users", currentUser.uid, "issues", id), {
                status: newStatus,
                updatedAt: serverTimestamp()
            });
            await loadIssues();
            renderIssues();
            showNotification("Issue status updated", "success");
        } catch (error) {
            showNotification("Error updating status: " + error.message, "error");
        }
    }
};

window.recordMaintenance = function(id) {
    document.getElementById("maintenanceModal").dataset.issueId = id;
    document.getElementById("maintenanceModal").classList.add("active");
};

function showNotification(message, type = "info") {
    const container = document.getElementById("notificationContainer");
    const box = document.createElement("div");
    box.classList.add("pop_box", `pop_${type}`);
    box.innerHTML = `<h3 class="box_text">${escapeHtml(message)}</h3>`;
    container.appendChild(box);
    
    setTimeout(() => {
        box.classList.add("pop_out");
        setTimeout(() => box.remove(), 300);
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

document.addEventListener("mousemove", e => {
    document.documentElement.style.setProperty("--mx", e.clientX + "px");
    document.documentElement.style.setProperty("--my", e.clientY + "px");
});
