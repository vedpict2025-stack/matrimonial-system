/* =========================================
   PREMIUM RIPPLE CLICK EFFECT
========================================= */
document.addEventListener('mousedown', function (e) {
    const target = e.target.closest('button, .nav-link, .theme-option');
    if (!target) return;

    const circle = document.createElement('span');
    const diameter = Math.max(target.clientWidth, target.clientHeight);
    const radius = diameter / 2;

    const rect = target.getBoundingClientRect();
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.clientX - rect.left - radius}px`;
    circle.style.top = `${e.clientY - rect.top - radius}px`;
    circle.classList.add('ripple');

    const existingRipple = target.querySelector('.ripple');
    if (existingRipple) existingRipple.remove();

    target.appendChild(circle);
});

/* =========================================
   API HELPER & CONFIG
========================================= */
const API_BASE = "https://matrimonial-api-0097.onrender.com"; // Production backend URL

// Wake up the free-tier backend on load to mitigate cold start
fetch(`${API_BASE}/api/ping`).catch(() => {});

async function apiFetch(endpoint, options = {}) {
    const savedId = localStorage.getItem("registeredProfileId") || "";
    const headers = {
        "Content-Type": "application/json",
        "x-user-id": savedId,
        ...(options.headers || {})
    };

    return fetch(`${API_BASE}${endpoint}`, { ...options, headers });
}

/* =========================================
   PAGE NAVIGATION LOGIC
========================================= */
const navLinks = document.querySelectorAll('[data-page]');
const pages = document.querySelectorAll('.page');

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        const targetPageId = link.getAttribute('data-page');
        const targetPage = document.getElementById(targetPageId);

        if (targetPage) {
            document.querySelectorAll('.nav-link').forEach(btn => btn.classList.remove('active'));
            pages.forEach(page => page.classList.remove('active-page'));

            if (link.classList.contains('nav-link')) link.classList.add('active');
            targetPage.classList.add('active-page');
            window.scrollTo({ top: 0, behavior: 'smooth' });

            if (targetPageId === 'browsePage') fetchAndRenderProfiles(true); // Reset scroll on load
            if (targetPageId === 'dashboardPage') syncDashboard();
        }
    });
});

/* =========================================
   SIDEBAR FORM NAVIGATION & REVIEW SYNC
========================================= */
const formNavItems = document.querySelectorAll('#formNav li');
const formSections = document.querySelectorAll('.form-section');
const nextButtons = document.querySelectorAll('.next-btn');

function switchFormSection(targetId) {
    if (!targetId) return;

    // Hide all sections and remove active class from sidebar
    formSections.forEach(sec => sec.classList.remove('active-section'));
    formNavItems.forEach(nav => nav.classList.remove('active'));

    // Show target section and highlight sidebar item
    const targetSection = document.getElementById(targetId);
    const targetNav = document.querySelector(`[data-target="${targetId}"]`);

    if (targetSection) targetSection.classList.add('active-section');
    if (targetNav) targetNav.classList.add('active');

    // If Review tab is opened, dynamically generate the summary
    if (targetId === 'sec-review') {
        generateReviewSummary();
    }

    // Check for completions
    if (typeof updateSectionProgress === 'function') {
        updateSectionProgress();
    }

    // Scroll to top of the form area so the user sees the new section
    const formLayout = document.querySelector('.form-layout-split');
    if (formLayout) {
        formLayout.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Sidebar Click Listener
formNavItems.forEach(item => {
    item.addEventListener('click', () => {
        switchFormSection(item.getAttribute('data-target'));
    });
});

// "Next" Button Click Listener
nextButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        switchFormSection(btn.getAttribute('data-next'));
    });
});

// Dynamic Review Generator
function generateReviewSummary() {
    const reviewContent = document.getElementById('reviewContent');
    if (!reviewContent) return;

    // Key-Value map of input IDs, readable labels, and their parent sections
    const fieldsToReview = [
        { id: 'name', label: 'Full Name', section: 'sec-personal' },
        { id: 'dob', label: 'Date of Birth', section: 'sec-personal' },
        { id: 'gender', label: 'Gender', section: 'sec-personal' },
        { id: 'city', label: 'City', section: 'sec-personal' },
        { id: 'state', label: 'State', section: 'sec-personal' },
        { id: 'height', label: 'Height', section: 'sec-personal' },
        { id: 'qualification', label: 'Qualification', section: 'sec-education' },
        { id: 'job', label: 'Profession', section: 'sec-education' },
        { id: 'income', label: 'Annual Income', section: 'sec-education' },
        { id: 'religion', label: 'Religion', section: 'sec-religion' },
        { id: 'caste', label: 'Caste', section: 'sec-religion' },
        { id: 'phone', label: 'Mobile Number', section: 'sec-contact' },
        { id: 'email', label: 'Email', section: 'sec-contact' }
    ];

    let html = '';
    fieldsToReview.forEach(field => {
        const inputElement = document.getElementById(field.id);

        // If empty, create a clickable routing link instead of plain text
        const value = (inputElement && inputElement.value.trim() !== "")
            ? inputElement.value
            : `<span style="color:var(--pink); font-size:0.9em; font-weight:700; cursor:pointer; text-decoration:underline;" onclick="switchFormSection('${field.section}')">Add ${field.label} ✎</span>`;

        html += `
            <div class="review-item">
                <span class="review-label">${field.label}</span>
                <span class="review-value">${value}</span>
            </div>
        `;
    });

    reviewContent.innerHTML = html;
}

/* AUTOMATIC AGE CALCULATION FROM DOB */
const dobInput = document.getElementById("dob");
const ageInput = document.getElementById("age");

if (dobInput && ageInput) {
    dobInput.addEventListener("input", function () {
        let digits = this.value.replace(/\D/g, "").slice(0, 8);
        let formatted = digits;
        if (digits.length > 4) formatted = digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
        else if (digits.length > 2) formatted = digits.slice(0, 2) + "/" + digits.slice(2);

        this.value = formatted;

        const match = formatted.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (match) {
            const birthDate = new Date(match[3], match[2] - 1, match[1]);
            let age = new Date().getFullYear() - birthDate.getFullYear();
            const m = new Date().getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && new Date().getDate() < birthDate.getDate())) age--;
            ageInput.value = (age >= 18) ? age : "";
        } else {
            ageInput.value = "";
        }
    });
}

/* =========================================
   BUILT-IN PHOTO EDITOR (Preview + Drag/Zoom Crop)
========================================= */
const photoInput = document.getElementById("photo");
const photoPreview = document.getElementById("photoPreview");
const removePhotoBtn = document.getElementById("removePhoto");
let originalPhotoHTML = photoPreview ? photoPreview.innerHTML : "";
let finalPhotoBase64 = null; // Stores the final cropped image

// Crop modal elements
const photoCropModal = document.getElementById("photoCropModal");
const cropStage = document.getElementById("cropStage");
const cropImageEl = document.getElementById("cropImage");
const cropZoomSlider = document.getElementById("cropZoom");
const cropCancelBtn = document.getElementById("cropCancelBtn");
const cropConfirmBtn = document.getElementById("cropConfirmBtn");

const CROP_STAGE_SIZE = 280;   // Must match .crop-stage width/height in CSS
const CROP_OUTPUT_SIZE = 480;  // Final saved photo resolution

let cropMinScale = 1;
let cropScale = 1;
let cropOffsetX = 0;
let cropOffsetY = 0;
let cropNaturalWidth = 0;
let cropNaturalHeight = 0;
let isDraggingCrop = false;
let cropDragStartX = 0;
let cropDragStartY = 0;
let cropDragOffsetStartX = 0;
let cropDragOffsetStartY = 0;

function renderCropTransform() {
    if (!cropImageEl) return;
    cropImageEl.style.width = (cropNaturalWidth * cropScale) + "px";
    cropImageEl.style.height = (cropNaturalHeight * cropScale) + "px";
    cropImageEl.style.transform = `translate(${cropOffsetX}px, ${cropOffsetY}px)`;
}

function clampCropOffsets() {
    const scaledW = cropNaturalWidth * cropScale;
    const scaledH = cropNaturalHeight * cropScale;
    const minX = Math.min(0, CROP_STAGE_SIZE - scaledW);
    const minY = Math.min(0, CROP_STAGE_SIZE - scaledH);
    cropOffsetX = Math.max(minX, Math.min(0, cropOffsetX));
    cropOffsetY = Math.max(minY, Math.min(0, cropOffsetY));
}

function openCropModal(dataUrl) {
    if (!photoCropModal || !cropImageEl) return;
    cropImageEl.onload = function () {
        cropNaturalWidth = cropImageEl.naturalWidth;
        cropNaturalHeight = cropImageEl.naturalHeight;
        // Smallest scale that still lets the image fully cover the round crop stage
        cropMinScale = Math.max(CROP_STAGE_SIZE / cropNaturalWidth, CROP_STAGE_SIZE / cropNaturalHeight);
        cropScale = cropMinScale;
        cropOffsetX = (CROP_STAGE_SIZE - cropNaturalWidth * cropScale) / 2;
        cropOffsetY = (CROP_STAGE_SIZE - cropNaturalHeight * cropScale) / 2;
        clampCropOffsets();
        if (cropZoomSlider) cropZoomSlider.value = "1";
        renderCropTransform();
        photoCropModal.classList.remove("hidden");
    };
    cropImageEl.src = dataUrl;
}

function closeCropModal(resetInput) {
    if (photoCropModal) photoCropModal.classList.add("hidden");
    if (resetInput && photoInput) photoInput.value = "";
}

if (photoInput) {
    photoInput.addEventListener("change", function () {
        const file = this.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (event) {
            openCropModal(event.target.result);
        };
        reader.readAsDataURL(file);
    });
}

// Zoom slider — keeps the center point of the stage fixed while zooming
if (cropZoomSlider) {
    cropZoomSlider.addEventListener("input", function () {
        const zoomFactor = parseFloat(this.value) || 1;
        const stageCenterX = CROP_STAGE_SIZE / 2;
        const stageCenterY = CROP_STAGE_SIZE / 2;
        const imgPointX = (stageCenterX - cropOffsetX) / cropScale;
        const imgPointY = (stageCenterY - cropOffsetY) / cropScale;

        cropScale = cropMinScale * zoomFactor;
        cropOffsetX = stageCenterX - imgPointX * cropScale;
        cropOffsetY = stageCenterY - imgPointY * cropScale;

        clampCropOffsets();
        renderCropTransform();
    });
}

// Drag to reposition (mouse + touch via Pointer Events)
if (cropStage) {
    cropStage.addEventListener("pointerdown", function (e) {
        isDraggingCrop = true;
        cropStage.classList.add("dragging");
        cropDragStartX = e.clientX;
        cropDragStartY = e.clientY;
        cropDragOffsetStartX = cropOffsetX;
        cropDragOffsetStartY = cropOffsetY;
        cropStage.setPointerCapture(e.pointerId);
    });

    cropStage.addEventListener("pointermove", function (e) {
        if (!isDraggingCrop) return;
        cropOffsetX = cropDragOffsetStartX + (e.clientX - cropDragStartX);
        cropOffsetY = cropDragOffsetStartY + (e.clientY - cropDragStartY);
        clampCropOffsets();
        renderCropTransform();
    });

    ["pointerup", "pointercancel", "pointerleave"].forEach(evt => {
        cropStage.addEventListener(evt, function () {
            isDraggingCrop = false;
            cropStage.classList.remove("dragging");
        });
    });
}

// Confirm crop -> bake the visible circle into the final square photo
if (cropConfirmBtn) {
    cropConfirmBtn.addEventListener("click", function () {
        const canvas = document.createElement("canvas");
        canvas.width = CROP_OUTPUT_SIZE;
        canvas.height = CROP_OUTPUT_SIZE;
        const ctx = canvas.getContext("2d");

        const sourceX = -cropOffsetX / cropScale;
        const sourceY = -cropOffsetY / cropScale;
        const sourceSize = CROP_STAGE_SIZE / cropScale;

        ctx.filter = "brightness(1.02) contrast(1.05) saturate(1.1)";
        ctx.drawImage(cropImageEl, sourceX, sourceY, sourceSize, sourceSize, 0, 0, CROP_OUTPUT_SIZE, CROP_OUTPUT_SIZE);

        finalPhotoBase64 = canvas.toDataURL("image/jpeg", 0.85);

        if (photoPreview) {
            photoPreview.innerHTML = `<img src="${finalPhotoBase64}" alt="Profile Photo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 14px;">`;
        }
        if (removePhotoBtn) removePhotoBtn.style.display = "flex";

        closeCropModal(false);
        if (typeof updateSectionProgress === "function") updateSectionProgress();
        if (typeof saveDraftToDatabase === "function") saveDraftToDatabase();
    });
}

if (cropCancelBtn) {
    cropCancelBtn.addEventListener("click", function () {
        closeCropModal(true);
    });
}

document.querySelectorAll("[data-close-crop]").forEach(el => {
    el.addEventListener("click", function () {
        closeCropModal(true);
    });
});

if (removePhotoBtn) {
    removePhotoBtn.addEventListener("click", function (event) {
        event.stopPropagation();
        if (photoInput) photoInput.value = "";
        finalPhotoBase64 = null;
        if (photoPreview) photoPreview.innerHTML = originalPhotoHTML;
        removePhotoBtn.style.display = "none";
        if (typeof updateSectionProgress === 'function') updateSectionProgress();
        if (typeof saveDraftToDatabase === 'function') saveDraftToDatabase();
    });
}

/* =========================================
   SECURE FORM SUBMISSION & SAVE PROGRESS
========================================= */

function collectProfileData(status = 'Submitted') {
    return {
        name: document.getElementById("name").value,
        dob: document.getElementById("dob").value,
        age: document.getElementById("age").value,
        pin: document.getElementById("pin").value,
        photo_base64: finalPhotoBase64,
        gender: document.getElementById("gender").value,
        city: document.getElementById("city").value,
        state: document.getElementById("state").value,
        height: document.getElementById("height").value,
        weight: document.getElementById("weight").value,
        physicalStatus: document.getElementById("physicalStatus").value,
        maritalStatus: document.getElementById("maritalStatus")?.value || "",
        qualification: document.getElementById("qualification").value,
        job: document.getElementById("job").value,
        jobLocation: document.getElementById("jobLocation").value,
        income: document.getElementById("income").value,
        religion: document.getElementById("religion").value,
        caste: document.getElementById("caste").value,
        status: status
    };
}

async function saveDraftToDatabase(showAlert = false) {
    const profile = collectProfileData('Submitted');
    if (!profile.name || !profile.pin) {
        if (showAlert) alert("Please enter at least your Name and PIN to save progress.");
        return;
    }

    try {
        const savedId = localStorage.getItem("registeredProfileId");
        let response;
        if (savedId && !savedId.startsWith("COM-")) {
            const dbId = parseInt(savedId.replace(/\D/g, ''), 10);
            response = await apiFetch(`/api/profiles/${dbId}`, {
                method: "PUT",
                body: JSON.stringify(profile)
            });
        } else {
            response = await apiFetch("/api/profiles", {
                method: "POST",
                body: JSON.stringify(profile)
            });
        }

        const data = await response.json();
        if (response.ok) {
            const newId = "MAT-" + String(data.profile.id).padStart(4, "0");
            localStorage.setItem("registeredProfileId", newId);
            if (showAlert) {
                alert("Progress saved successfully! Your Profile ID is " + newId + ". You can log in later with this ID and your PIN.");
            } else {
                showToast("✓ Saved just now");
            }
        } else {
            if (showAlert) alert("Error saving draft: " + data.error);
        }
    } catch (error) {
        console.error(error);
        if (showAlert) alert("Could not connect to the server to save draft.");
    }
}

function showToast(msg) {
    let toast = document.getElementById('toastMsg');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toastMsg';
        toast.style.cssText = 'position:fixed;bottom:20px;right:20px;background:var(--teal);color:#fff;padding:12px 24px;border-radius:8px;box-shadow:var(--shadow);z-index:9999;transition:opacity 0.3s;opacity:0;font-weight:600;';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => toast.style.opacity = '0', 3000);
}

const saveExitBtn = document.getElementById("saveExitBtn");
if (saveExitBtn) {
    saveExitBtn.addEventListener("click", () => {
        saveDraftToDatabase(true).then(() => {
            // Optional: redirect to login or dashboard
            window.location.reload();
        });
    });
}

const form = document.getElementById("profileForm");
if (form) {
    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        const submitBtn = document.getElementById("submitBtn");
        const submitText = document.getElementById("submitText");

        const profile = collectProfileData('Submitted');

        submitBtn.disabled = true;
        submitText.textContent = "Saving Securely...";

        try {
            const savedId = localStorage.getItem("registeredProfileId");
            let response;
            if (savedId && !savedId.startsWith("COM-")) {
                const dbId = parseInt(savedId.replace(/\D/g, ''), 10);
                response = await apiFetch(`/api/profiles/${dbId}`, {
                    method: "PUT",
                    body: JSON.stringify(profile)
                });
            } else {
                response = await apiFetch("/api/profiles", {
                    method: "POST",
                    body: JSON.stringify(profile)
                });
            }

            const data = await response.json();

            if (response.ok) {
                const newId = "MAT-" + String(data.profile.id).padStart(4, "0");
                localStorage.setItem("registeredProfileId", newId);

                document.getElementById('formContainer').style.display = 'none';

                const successBox = document.getElementById('successContainer');
                successBox.classList.remove('hidden');
                successBox.style.display = 'block';

                document.getElementById('displayId').textContent = newId;

                unlockApp('user');
            } else {
                alert("Error: " + data.error);
            }

        } catch (error) {
            alert("Could not connect to the server.");
        }
        submitBtn.disabled = false;
        submitText.textContent = "Final Submit Profile";
    });
}

/* =========================================
   AUTHENTICATION LOGIC
========================================= */
const authPage = document.getElementById('authPage');
const mainNavigation = document.getElementById('mainNavigation');

function unlockApp(role) {
    document.querySelectorAll('.auth-only').forEach(link => link.style.display = 'none');
    document.getElementById('btnLogOut').style.display = 'inline-block';

    const isAdmin = role === 'super_admin' || role === 'committee_admin' || role === 'committee_member';

    if (isAdmin) {
        document.querySelector('[data-page="adminPage"]').style.display = 'inline-block';
        document.querySelector('[data-page="browsePage"]').style.display = 'inline-block';
        document.getElementById('navRegister').style.display = 'none';

        // Specifically for adminPage: we could filter UI inside it if needed later
    } else {
        document.querySelector('[data-page="dashboardPage"]').style.display = 'inline-block';
        document.querySelector('[data-page="browsePage"]').style.display = 'inline-block';
        document.getElementById('navRegister').style.display = 'inline-block';
        document.getElementById('navRegister').textContent = 'Edit Profile';
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const savedId = localStorage.getItem("registeredProfileId");
    let role = localStorage.getItem("userRole");
    if (!role) role = (savedId && savedId.startsWith("COM-")) ? 'committee_admin' : 'user';

    if (savedId && authPage) {
        mainNavigation.style.display = 'flex';
        unlockApp(role);
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
        document.getElementById(role !== 'user' ? 'adminPage' : 'dashboardPage').classList.add('active-page');
        if (role === 'user') {
            syncDashboard();
        } else {
            syncAdminDashboard();
        }
    }
});

document.getElementById('btnCreateAccount')?.addEventListener('click', () => {
    mainNavigation.style.display = 'flex';
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
    document.getElementById('registerPage').classList.add('active-page');
});

document.getElementById('btnShowLogin')?.addEventListener('click', () => {
    document.getElementById('authButtons').style.display = 'none';
    document.getElementById('loginSection').style.display = 'block';
});

document.getElementById('btnBackToAuth')?.addEventListener('click', () => {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('authButtons').style.display = 'flex';
});

document.getElementById('btnSubmitLogin')?.addEventListener('click', async () => {
    const id = document.getElementById('loginProfileId').value.trim().toUpperCase();
    const pin = document.getElementById('loginPin').value.trim();
    const btn = document.getElementById('btnSubmitLogin');

    if (!id || pin.length !== 4) return alert("Please enter a valid ID and 4-digit PIN.");

    btn.textContent = "Verifying...";
    btn.disabled = true;

    try {
        const res = await apiFetch('/api/login', {
            method: 'POST',
            body: JSON.stringify({ id, pin })
        });

        const data = await res.json();

        if (res.ok) {
            localStorage.setItem("registeredProfileId", id);
            localStorage.setItem("userRole", data.role);
            mainNavigation.style.display = 'flex';
            unlockApp(data.role);
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));

            if (data.role === 'user' && data.status === 'Draft') {
                // It's a draft, prompt to continue
                const continueDraft = confirm("You have an unfinished profile. Would you like to continue filling it out?");
                if (continueDraft) {
                    document.getElementById('registerPage').classList.add('active-page');
                    populateFormFromDraft(id);
                } else {
                    document.getElementById('dashboardPage').classList.add('active-page');
                    syncDashboard();
                }
            } else {
                document.getElementById(data.role !== 'user' ? 'adminPage' : 'dashboardPage').classList.add('active-page');
                if (data.role === 'user') syncDashboard();
                else syncAdminDashboard();
            }
        } else {
            alert(data.error);
        }
    } catch (err) {
        alert("Server connection failed.");
    }
    btn.textContent = "Secure Login";
    btn.disabled = false;
});

async function populateFormFromDraft(id) {
    try {
        const dbId = parseInt(id.replace(/\D/g, ''), 10);
        const res = await apiFetch(`/api/profiles/${dbId}`);
        if (res.ok) {
            const data = await res.json();
            document.getElementById("name").value = data.name || "";
            document.getElementById("dob").value = data.dob || "";
            document.getElementById("age").value = data.age || "";
            document.getElementById("pin").value = data.pin || "";
            if (data.photo_base64) {
                finalPhotoBase64 = data.photo_base64;
                const photoPreview = document.getElementById("photoPreview");
                if (photoPreview) {
                    photoPreview.innerHTML = `<img src="${finalPhotoBase64}" alt="Profile Photo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 14px;">`;
                }
                const removePhotoBtn = document.getElementById("removePhoto");
                if (removePhotoBtn) removePhotoBtn.style.display = "flex";
            }
            document.getElementById("gender").value = data.gender || "";
            document.getElementById("city").value = data.city || "";
            document.getElementById("state").value = data.state || "";
            document.getElementById("height").value = data.height || "";
            document.getElementById("weight").value = data.weight || "";
            document.getElementById("physicalStatus").value = data.physicalStatus || "";
            if (document.getElementById("maritalStatus")) document.getElementById("maritalStatus").value = data.maritalStatus || "";
            document.getElementById("qualification").value = data.qualification || "";
            document.getElementById("job").value = data.job || "";
            document.getElementById("jobLocation").value = data.jobLocation || "";
            document.getElementById("income").value = data.income || "";
            document.getElementById("religion").value = data.religion || "";
            document.getElementById("caste").value = data.caste || "";

            updateSectionProgress();
        }
    } catch (err) {
        console.error("Failed to populate form", err);
    }
}

document.getElementById('btnLogOut')?.addEventListener('click', () => {
    localStorage.removeItem("registeredProfileId");
    mainNavigation.style.display = 'none';
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('authButtons').style.display = 'flex';
    document.getElementById('loginProfileId').value = '';
    document.getElementById('loginPin').value = '';
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
    authPage.classList.add('active-page');
});

/* =========================================
   INFINITE SCROLL & BROWSE LOGIC
========================================= */
let currentPage = 1;
let isFetching = false;
let hasMoreProfiles = true;

async function fetchAndRenderProfiles(reset = false) {
    const grid = document.getElementById('profileGrid');
    if (!grid) return;

    if (reset) {
        currentPage = 1;
        hasMoreProfiles = true;
        grid.innerHTML = '';
        document.getElementById('profileCount').textContent = `Searching...`;
    }

    if (!hasMoreProfiles || isFetching) return;
    isFetching = true;

    try {
        const res = await apiFetch(`/api/profiles?page=${currentPage}&limit=12`);
        let data = await res.json();
        let profiles = data.profiles || data; // handle new structure

        if (profiles.length < 12) hasMoreProfiles = false;

        const searchTxt = document.getElementById('profileSearch')?.value.toLowerCase() || "";
        const gender = document.getElementById('filterGender')?.value;
        const state = document.getElementById('filterState')?.value;

        profiles = profiles.filter(p => {
            const matchesSearch = !searchTxt || (p.name && p.name.toLowerCase().includes(searchTxt)) || (p.city && p.city.toLowerCase().includes(searchTxt));
            const matchesGender = !gender || gender === "Any Gender" || p.gender === gender;
            const matchesState = !state || state === "Any State" || p.state === state;
            return matchesSearch && matchesGender && matchesState;
        });

        if (reset) document.getElementById('profileCount').textContent = `Showing Matches`;

        window.loadedProfiles = window.loadedProfiles || {};
        if (profiles.length === 0 && reset) {
            grid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 30px;">No profiles match your criteria.</div>';
        } else {
            profiles.forEach(p => {
                window.loadedProfiles[p.id] = p;
                const visualId = "MAT-" + String(p.id).padStart(4, "0");
                const imgSrc = p.photo_base64 || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlNWEwZTUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiLz48L3N2Zz4='; // Fallback

                grid.innerHTML += `
                    <div class="profile-card">
                        <div class="profile-cover" style="background-image: url('${imgSrc}'); background-size: cover; background-position: center; transition: transform 0.4s ease;"></div>
                        <div class="profile-card-body">
                            <span class="eyebrow">${visualId}</span>
                            <h3 style="margin-bottom: 5px; color: var(--text);">${p.name || 'Anonymous'}</h3>
                            <p style="color: var(--muted); font-size: 13px; margin-bottom: 15px;">${p.age || '--'} yrs • ${p.height || '--'} • ${p.city || 'Unknown'}</p>
                            <div style="background: var(--input-bg); padding: 10px; border-radius: 10px; font-size: 13px; margin-bottom: 15px;">
                                <strong>💼</strong> ${p.job || 'Not specified'}<br>
                                <strong>🎓</strong> ${p.qualification || 'Not specified'}
                            </div>
                            <button class="primary-btn" onclick="openProfileModal('${p.id}')" style="width: 100%; padding: 10px;">View  Profile</button>
                        </div>
                    </div>
                `;
            });
        }
        currentPage++;
    } catch (err) {
        console.error(err);
        if (reset) grid.innerHTML = '<div style="grid-column: 1/-1; color: var(--pink); text-align: center;">Error loading database. Make sure server is running.</div>';
    }
    isFetching = false;
}

document.getElementById('applyFiltersBtn')?.addEventListener('click', () => fetchAndRenderProfiles(true));

window.addEventListener('scroll', () => {
    if (document.getElementById('browsePage').classList.contains('active-page')) {
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        if (scrollTop + clientHeight >= scrollHeight - 150) {
            fetchAndRenderProfiles(false);
        }
    }
});

/* =========================================
   PROFILE MODAL & FULL DETAILS LOGIC
========================================= */
window.openProfileModal = function (id) {
    const p = window.loadedProfiles[id];
    if (!p) return;

    const visualId = "MAT-" + String(p.id).padStart(4, "0");
    const imgSrc = p.photo_base64 || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlNWEwZTUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiLz48L3N2Zz4=';

    // Check authorization to view private details (phone, email, exact address)
    const viewerIdStr = localStorage.getItem("registeredProfileId") || "";
    const viewerId = parseInt(viewerIdStr.replace(/\\D/g, ''), 10);
    const viewerRole = localStorage.getItem("userRole");
    const isAdmin = viewerRole === 'super_admin' || viewerRole === 'committee_admin' || viewerRole === 'committee_member';
    const isOwner = (viewerId === p.id);
    const canViewPrivate = isAdmin || isOwner;

    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = `
        <div class="print-container" style="max-width: 800px; margin: 0 auto; background: var(--surface); color: var(--text);">
            
            <!-- Quick View Header -->
            <div id="quickHeader-${p.id}" style="display: flex; gap: 28px; flex-wrap: wrap; margin-bottom: 20px;">
                <div style="flex: 1; min-width: 250px;">
                    <img src="${imgSrc}" style="width: 100%; border-radius: 18px; object-fit: cover; box-shadow: var(--shadow);">
                </div>
                <div style="flex: 1.5; min-width: 280px; display: flex; flex-direction: column; justify-content: center;">
                    <span class="eyebrow">${visualId}</span>
                    <h2 style="font-family: var(--font-display); font-size: 2.4rem; margin-bottom: 8px; color: var(--text);">${p.name || 'Anonymous'}</h2>
                    <p style="color: var(--muted); font-size: 15px; margin-bottom: 24px;">
                        ${p.age ? p.age + ' yrs' : ''} ${p.height ? ' • ' + p.height : ''} ${p.city ? ' • ' + p.city : ''}
                    </p>
                    <div style="color: var(--teal); font-size: 13px; font-weight: 600;">
                        ✓ Verified by Committee
                    </div>
                </div>
            </div>

            <!-- Quick Info Grid -->
            <div id="quickInfo-${p.id}" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px;">
                <div style="background: var(--input-bg); padding: 18px; border-radius: 16px; border: 1px solid var(--border);">
                    <span style="font-size: 11px; color: var(--muted); text-transform: uppercase; font-weight: 700;">Profession</span>
                    <strong style="display: block; font-size: 1.15rem; color: var(--maroon); margin-top: 4px;">${p.job || 'Not specified'}</strong>
                    <small style="color: var(--muted);">${p.income || ''}</small>
                </div>
                <div style="background: var(--input-bg); padding: 18px; border-radius: 16px; border: 1px solid var(--border);">
                    <span style="font-size: 11px; color: var(--muted); text-transform: uppercase; font-weight: 700;">Education</span>
                    <strong style="display: block; font-size: 1.15rem; color: var(--maroon); margin-top: 4px;">${p.qualification || 'Not specified'}</strong>
                </div>
                <div style="background: var(--input-bg); padding: 18px; border-radius: 16px; border: 1px solid var(--border);">
                    <span style="font-size: 11px; color: var(--muted); text-transform: uppercase; font-weight: 700;">Religion & Caste</span>
                    <strong style="display: block; font-size: 1.15rem; color: var(--maroon); margin-top: 4px;">${p.religion || 'Any'} - ${p.caste || 'Any'}</strong>
                </div>
                <div style="background: var(--input-bg); padding: 18px; border-radius: 16px; border: 1px solid var(--border);">
                    <span style="font-size: 11px; color: var(--muted); text-transform: uppercase; font-weight: 700;">Marital Status</span>
                    <strong style="display: block; font-size: 1.15rem; color: var(--maroon); margin-top: 4px;">${p.maritalStatus || 'Never Married'}</strong>
                </div>
            </div>

            <!-- Formal Details Table Layout (Hidden by Default) -->
            <div id="fullDetails-${p.id}" style="display: none; background: #fff; padding: 20px; border-radius: 12px; margin-bottom: 28px; max-height: 60vh; overflow-y: auto;">
                
                <div class="print-only-header" style="display: none; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px; justify-content: space-between; align-items: flex-start;">
                    <div style="text-align: left;">
                        <h2 style="font-family: Arial, sans-serif; font-size: 1.8rem; margin: 0; color: #333; text-transform: uppercase;">Matrimonial Profile</h2>
                        <p style="margin: 5px 0 0; font-size: 14px; color: #555;">Profile ID: <strong>${visualId}</strong></p>
                        <p style="margin: 5px 0 0; font-size: 14px; color: #555;">Status: <strong>${p.status || 'Draft'}</strong></p>
                    </div>
                    <div>
                        <img src="${imgSrc}" style="width: 120px; height: 140px; object-fit: cover; border: 1px solid #ccc; padding: 4px; background: #fff;">
                    </div>
                </div>

                <div class="print-section">
                    <h3 style="background: #f0f0f0; padding: 8px 12px; margin-bottom: 12px; font-size: 16px; border-left: 4px solid var(--maroon); color: #333;">1. Personal Information</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px; color: #000;">
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 25%; background: #fafafa;">Full Name</td>
                            <td style="padding: 8px; border: 1px solid #ddd; width: 25%;">${p.name || '-'}</td>
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 25%; background: #fafafa;">Date of Birth / Age</td>
                            <td style="padding: 8px; border: 1px solid #ddd; width: 25%;">${p.dob || '-'} (${p.age ? p.age + ' yrs' : '-'})</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #fafafa;">Gender</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${p.gender || '-'}</td>
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #fafafa;">Marital Status</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${p.maritalStatus || '-'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #fafafa;">Height / Weight</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${p.height || '-'} / ${p.weight ? p.weight + ' kg' : '-'}</td>
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #fafafa;">Physical Status</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${p.physicalStatus || 'Normal'}</td>
                        </tr>
                    </table>
                </div>

                <div class="print-section">
                    <h3 style="background: #f0f0f0; padding: 8px 12px; margin-bottom: 12px; font-size: 16px; border-left: 4px solid var(--maroon); color: #333;">2. Religion & Background</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px; color: #000;">
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 25%; background: #fafafa;">Religion</td>
                            <td style="padding: 8px; border: 1px solid #ddd; width: 25%;">${p.religion || '-'}</td>
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 25%; background: #fafafa;">Caste</td>
                            <td style="padding: 8px; border: 1px solid #ddd; width: 25%;">${p.caste || '-'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #fafafa;">Sub-Religion</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${p.subReligion || '-'}</td>
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #fafafa;">Diet</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${p.diet || '-'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #fafafa;">Family Type</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${p.familyType || '-'}</td>
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #fafafa;">Lifestyle</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${p.lifestyle || '-'}</td>
                        </tr>
                    </table>
                </div>

                <div class="print-section">
                    <h3 style="background: #f0f0f0; padding: 8px 12px; margin-bottom: 12px; font-size: 16px; border-left: 4px solid var(--maroon); color: #333;">3. Education & Profession</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px; color: #000;">
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 25%; background: #fafafa;">Highest Qualification</td>
                            <td style="padding: 8px; border: 1px solid #ddd; width: 75%;" colspan="3">${p.qualification || '-'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #fafafa;">Profession</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${p.job || '-'}</td>
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #fafafa;">Annual Income</td>
                            <td style="padding: 8px; border: 1px solid #ddd;">${canViewPrivate ? (p.income || '-') : 'Visible to matches'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #fafafa;">Job Location</td>
                            <td style="padding: 8px; border: 1px solid #ddd;" colspan="3">${p.jobLocation || '-'}</td>
                        </tr>
                    </table>
                </div>

                <div class="print-section">
                    <h3 style="background: #f0f0f0; padding: 8px 12px; margin-bottom: 12px; font-size: 16px; border-left: 4px solid var(--maroon); color: #333;">4. Location & Contact Details</h3>
                    <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px; color: #000;">
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 25%; background: #fafafa;">City, State</td>
                            <td style="padding: 8px; border: 1px solid #ddd; width: 75%;" colspan="3">${p.city || '-'}, ${p.state || '-'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; background: #fafafa;">Mobile Number</td>
                            <td style="padding: 8px; border: 1px solid #ddd;" colspan="3">
                                ${canViewPrivate ? (p.phone || 'Not provided') : '<span style="color:#888;"><i>Hidden for privacy. Send Interest to request contact.</i></span>'}
                            </td>
                        </tr>
                    </table>
                </div>
                
                <div class="print-section">
                    <h3 style="background: #f0f0f0; padding: 8px 12px; margin-bottom: 12px; font-size: 16px; border-left: 4px solid var(--maroon); color: #333;">5. About & Expectations</h3>
                    <div style="font-size: 14px; color: #000; border: 1px solid #ddd; padding: 12px;">
                        <p style="margin-bottom: 8px;"><strong>About Me:</strong><br>${p.aboutMe || 'Not provided'}</p>
                        <p><strong>Partner Expectations:</strong><br>${p.goals || 'Not provided'}</p>
                    </div>
                </div>

                <div class="no-print" style="margin-top: 16px;">
                    <button class="primary-btn" style="padding: 10px 16px; font-size: 14px;" onclick="window.print()">🖨️ Print as PDF</button>
                </div>
            </div>

            <!-- Action Buttons -->
            <div id="actionButtons-${p.id}" style="display: flex; gap: 16px; flex-wrap: wrap; margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border);">
                ${!isOwner ? `<button class="primary-btn" style="flex: 1; padding: 16px; font-size: 1.05rem; background: var(--teal);" onclick="this.innerHTML='Interest Sent ✓';">❤️ Send Interest</button>` : ''}
                <button class="secondary-btn" id="saveProfileBtn-${p.id}" style="flex: 1; padding: 16px; font-size: 1.05rem;" onclick="toggleShortlist('${p.id}', this)">★ Save Profile</button>
                <button class="text-btn" id="toggleDetailsBtn-${p.id}" style="width: 100%; margin-top: 8px; font-size: 14px; text-decoration: underline; color: var(--maroon);" onclick="toggleFullDetails('${p.id}')">View Full Details</button>
            </div>
        </div>
    `;

    const savedProfiles = JSON.parse(localStorage.getItem('shortlistedProfiles') || '[]');
    const saveBtn = document.getElementById(`saveProfileBtn-${p.id}`);
    if (saveBtn && savedProfiles.includes(String(p.id))) {
        saveBtn.innerHTML = '★ Saved';
        saveBtn.style.borderColor = 'var(--gold)';
        saveBtn.style.color = 'var(--gold)';
    }

    document.getElementById('profileModal').classList.remove('hidden');
};

window.toggleFullDetails = function (id) {
    const quickInfo = document.getElementById(`quickInfo-${id}`);
    const fullDetails = document.getElementById(`fullDetails-${id}`);
    const btnElement = document.getElementById(`toggleDetailsBtn-${id}`);

    if (fullDetails.style.display === 'none') {
        quickInfo.style.display = 'none';
        fullDetails.style.display = 'block';
        btnElement.textContent = 'Hide Full Details';
    } else {
        quickInfo.style.display = 'grid';
        fullDetails.style.display = 'none';
        btnElement.textContent = 'View Full Details';
    }
};

window.toggleShortlist = function (id, btnElement) {
    id = String(id);
    let saved = JSON.parse(localStorage.getItem('shortlistedProfiles') || '[]');
    if (saved.includes(id)) {
        saved = saved.filter(s => s !== id);
        btnElement.innerHTML = 'Save Profile';
        btnElement.style.borderColor = '';
        btnElement.style.color = '';
    } else {
        saved.push(id);
        btnElement.innerHTML = 'Saved ★';
        btnElement.style.borderColor = 'var(--gold)';
        btnElement.style.color = 'var(--gold)';
    }
    localStorage.setItem('shortlistedProfiles', JSON.stringify(saved));
    if (document.getElementById('dashboardPage').classList.contains('active-page')) {
        syncDashboard();
    }
};

document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
        document.getElementById('profileModal').classList.add('hidden');
    });
});

/* =========================================
   DASHBOARD SYNC LOGIC
========================================= */
async function syncDashboard() {
    const savedId = localStorage.getItem("registeredProfileId");
    if (!savedId || savedId.startsWith("COM-")) return;

    document.getElementById('dashId').textContent = savedId;
    document.getElementById('dashName').textContent = "Loading...";

    try {
        const res = await apiFetch(`/api/profiles/${savedId}`);
        if (res.ok) {
            const data = await res.json();
            document.getElementById('dashName').textContent = data.name || "Anonymous User";

            const statusBadge = document.getElementById('dashStatus');
            statusBadge.textContent = "Profile " + (data.status || "Submitted");
            if (data.status === 'Draft') {
                statusBadge.style.background = "#fff3cd";
                statusBadge.style.color = "#856404";
            } else if (data.status === 'Approved') {
                statusBadge.style.background = "#dcfce7";
                statusBadge.style.color = "#166534";
            } else {
                statusBadge.style.background = "#e2e8f0";
                statusBadge.style.color = "#334155";
            }

            // Completion percentage
            let filledSections = 0;
            const requiredFields = ['name', 'photo_base64', 'city', 'qualification', 'religion', 'height', 'goals', 'phone'];
            requiredFields.forEach(f => {
                if (data[f]) filledSections++;
            });
            const completionPercent = Math.round((filledSections / requiredFields.length) * 100);

            document.getElementById('dashCompletion').textContent = `${completionPercent}%`;
            document.getElementById('dashBar').style.width = `${completionPercent}%`;

            let actionHtml = `<button class="secondary-btn" type="button" data-page="registerPage" onclick="document.getElementById('registerPage').classList.add('active-page'); document.querySelectorAll('.page').forEach(p => p !== document.getElementById('registerPage') && p.classList.remove('active-page'));">Edit Profile</button>
                              <button class="primary-btn" type="button" onclick="openProfileModal('${savedId}')">View My Profile</button>`;

            if (completionPercent < 100) {
                actionHtml = `<button class="primary-btn" type="button" onclick="document.getElementById('registerPage').classList.add('active-page'); document.querySelectorAll('.page').forEach(p => p !== document.getElementById('registerPage') && p.classList.remove('active-page')); populateFormFromDraft('${savedId}');">Complete Profile</button>
                               <button class="secondary-btn" type="button" onclick="openProfileModal('${savedId}')">View Partial Profile</button>`;
            }
            document.querySelector('.dashboard-actions').innerHTML = actionHtml;

            window.loadedProfiles = window.loadedProfiles || {};
            window.loadedProfiles[savedId] = data;
        } else {
            document.getElementById('dashName').textContent = "Profile Not Found";
        }
    } catch (err) {
        console.error("Dashboard sync error", err);
    }

    // Sync Shortlisted Profiles
    const saved = JSON.parse(localStorage.getItem('shortlistedProfiles') || '[]');
    const shortlistGrid = document.getElementById('shortlistGrid');
    const shortlistCount = document.getElementById('shortlistCount');
    if (shortlistCount) shortlistCount.textContent = saved.length;

    if (saved.length === 0) {
        shortlistGrid.innerHTML = '<div class="empty-state">You haven\'t shortlisted any profiles yet.</div>';
    } else {
        shortlistGrid.innerHTML = '';
        saved.forEach(id => {
            const p = window.loadedProfiles ? window.loadedProfiles[id] : null;
            if (p) {
                const visualId = "MAT-" + String(p.id).padStart(4, "0");
                const imgSrc = p.photo_base64 || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlNWEwZTUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiLz48L3N2Zz4=';
                shortlistGrid.innerHTML += `
                    <div class="profile-card" style="display: flex; gap: 12px; padding: 12px; cursor: pointer;" onclick="openProfileModal('${p.id}')">
                        <img src="${imgSrc}" style="width: 70px; height: 70px; border-radius: 12px; object-fit: cover;">
                        <div>
                            <span class="eyebrow">${visualId}</span>
                            <h4 style="margin: 2px 0;">${p.name || 'Anonymous'}</h4>
                            <p style="font-size: 12px; color: var(--muted);">${p.age ? p.age + ' yrs' : ''} • ${p.city || ''}</p>
                        </div>
                    </div>
                `;
            } else {
                shortlistGrid.innerHTML += `
                    <div class="profile-card" style="padding: 12px;">
                        <span class="eyebrow">MAT-${String(id).padStart(4, "0")}</span>
                        <p style="font-size: 12px; color: var(--muted); margin-top: 4px;">Profile details unavailable. Please browse profiles to load data.</p>
                    </div>
                `;
            }
        });
    }
}

/* =========================================
   THEME MENU POPUP
========================================= */
const btnThemeToggle = document.getElementById('btnThemeToggle');
const themeDropdown = document.getElementById('themeDropdown');

btnThemeToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    themeDropdown.classList.toggle('hidden');
});

document.addEventListener('click', (e) => {
    if (!themeDropdown?.contains(e.target) && e.target !== btnThemeToggle) {
        themeDropdown?.classList.add('hidden');
    }
});

document.querySelectorAll('.theme-option').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const newTheme = e.target.getAttribute('data-theme-val');
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('appTheme', newTheme);
        themeDropdown.classList.add('hidden');
    });
});

const savedTheme = localStorage.getItem('appTheme') || 'default';
document.documentElement.setAttribute('data-theme', savedTheme);

/* =========================================
   REAL-TIME SECTION COMPLETION CHECKER
========================================= */
function updateSectionProgress() {
    const formSectionsForProgress = document.querySelectorAll('.form-section');
    let missingLabels = [];

    formSectionsForProgress.forEach(sec => {
        if (sec.id === 'sec-review') return; // Skip the review tab itself

        // Find all fields marked as "required" in the HTML for this specific section
        const requiredFields = sec.querySelectorAll('input[required], select[required], textarea[required]');
        let isComplete = true;

        if (requiredFields.length > 0) {
            // Check if every required field has a value
            requiredFields.forEach(field => {
                if (!field.value || field.value.trim() === '') {
                    isComplete = false;
                }
            });
        } else {
            // Custom check for the Photo section
            if (sec.id === 'sec-photo') {
                isComplete = (typeof finalPhotoBase64 !== 'undefined' && finalPhotoBase64 !== null);
            } else {
                isComplete = true;
            }
        }

        // Apply or remove the glowing checkmark class on the sidebar
        const navItem = document.querySelector(`[data-target="${sec.id}"]`);
        if (navItem) {
            if (isComplete) {
                navItem.classList.add('completed');
            } else {
                navItem.classList.remove('completed');
                missingLabels.push(navItem.textContent.replace(/[📷👤🎓🏠👨‍👩‍👧💭❤️📞📄✅✎]/g, '').trim());
            }
        }
    });

    // Update global completion meter
    const totalSections = document.querySelectorAll('#formNav li[data-target]').length - 1; // minus review
    const completedSections = document.querySelectorAll('#formNav li.completed').length;
    const percent = Math.round((completedSections / totalSections) * 100) || 0;

    const formCompletionPercent = document.getElementById('formCompletionPercent');
    const formProgressBar = document.getElementById('formProgressBar');
    const formMissingText = document.getElementById('formMissingText');

    if (formCompletionPercent) formCompletionPercent.textContent = percent + '%';
    if (formProgressBar) formProgressBar.style.width = percent + '%';

    if (formMissingText) {
        if (missingLabels.length > 0) {
            formMissingText.innerHTML = `Missing: <span style="color:var(--maroon);">${missingLabels.slice(0, 2).join(', ')}${missingLabels.length > 2 ? '...' : ''}</span>`;
        } else {
            formMissingText.innerHTML = `<span style="color:var(--teal);">All sections complete ✨</span>`;
        }
    }
}

// Debounce utility function to improve performance on high-frequency events
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Trigger the progress check every time the user types, selects an option, or uploads a file
const profileFormElement = document.getElementById('profileForm');
if (profileFormElement) {
    const debouncedUpdateProgress = debounce(updateSectionProgress, 300);
    profileFormElement.addEventListener('input', debouncedUpdateProgress);
    profileFormElement.addEventListener('change', debouncedUpdateProgress);
}

/* =========================================
   ADMIN DASHBOARD LOGIC
========================================= */
async function syncAdminDashboard() {
    try {
        const res = await apiFetch(`/api/profiles?page=1&limit=1000&admin=true`);
        if (res.ok) {
            let data = await res.json();
            let profiles = data.profiles || data;

            const tbody = document.getElementById('adminTableBody');
            if (!tbody) return;

            let html = '';
            let approved = 0, pending = 0, draft = 0, correction = 0, rejected = 0;
            
            const activeTab = document.querySelector('.admin-tab.active');
            const activeStatus = activeTab ? activeTab.getAttribute('data-tab-status') : 'Submitted';

            window.loadedProfiles = window.loadedProfiles || {};

            profiles.forEach(p => {
                window.loadedProfiles[p.id] = p;
                if (p.status === 'Approved') approved++;
                if (p.status === 'Submitted') pending++;
                if (p.status === 'Draft') draft++;
                if (p.status === 'Needs Correction') correction++;
                if (p.status === 'Rejected') rejected++;

                // Only render if it matches the active tab status
                if (p.status !== activeStatus) return;

                const visualId = "MAT-" + String(p.id).padStart(4, "0");
                const role = localStorage.getItem("userRole");

                let actions = `<button class="text-btn" onclick="openProfileModal('${p.id}')">View</button>`;

                // Only super admin or committee admin can approve/reject, unless member is given access
                if (role === 'super_admin' || role === 'committee_admin') {
                    if (p.status === 'Submitted' || p.status === 'Needs Correction') {
                        actions += ` | <button class="text-btn" style="color:var(--teal);" onclick="changeProfileStatus('${p.id}', 'Approved')">Approve</button>
                                     | <button class="text-btn" style="color:var(--maroon);" onclick="changeProfileStatus('${p.id}', 'Rejected')">Reject</button>
                                     | <button class="text-btn" style="color:var(--orange);" onclick="changeProfileStatus('${p.id}', 'Needs Correction')">Need Correction</button>`;
                    } else if (p.status === 'Approved') {
                        actions += ` | <button class="text-btn" style="color:var(--orange);" onclick="changeProfileStatus('${p.id}', 'Needs Correction')">Revoke Approval</button>`;
                    }
                }

                let badgeClass = 'status-badge ';
                if (p.status === 'Draft') badgeClass += 'pending';
                else if (p.status === 'Approved') badgeClass += 'approved';
                else if (p.status === 'Needs Correction') badgeClass += 'correction';
                else if (p.status === 'Rejected') badgeClass += 'correction';
                else badgeClass += 'pending'; // yellow

                html += `
                    <tr>
                        <td>${visualId}</td>
                        <td>${p.name || 'N/A'}</td>
                        <td>${p.age || '-'}</td>
                        <td>${p.city || '-'}</td>
                        <td><span class="${badgeClass}">${p.status || 'Draft'}</span></td>
                        <td>${actions}</td>
                    </tr>
                `;
            });

            tbody.innerHTML = html || '<tr><td colspan="6" style="text-align:center; padding: 20px;">No profiles found in this section.</td></tr>';

            document.getElementById('adminTotal').textContent = profiles.length;
            document.getElementById('adminPending').textContent = pending;
            document.getElementById('adminApproved').textContent = approved;
            const adminCorrectionEl = document.getElementById('adminCorrection');
            if (adminCorrectionEl) adminCorrectionEl.textContent = correction;
            document.getElementById('adminShortlisted').textContent = JSON.parse(localStorage.getItem('shortlistedProfiles') || '[]').length; // Mock stat for now
        }
    } catch (e) {
        console.error("Admin sync failed", e);
    }
}

document.getElementById('refreshAdmin')?.addEventListener('click', syncAdminDashboard);

window.changeProfileStatus = async function (id, newStatus) {
    if (!confirm(`Are you sure you want to change profile MAT-${String(id).padStart(4, '0')} to ${newStatus}?`)) return;

    try {
        const res = await apiFetch(`/api/profiles/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });
        if (res.ok) {
            showToast(`Profile updated to ${newStatus}`);
            syncAdminDashboard(); // refresh table
        } else {
            const data = await res.json();
            alert("Error: " + data.error);
        }
    } catch (e) {
        alert("Failed to update profile.");
    }
};

/* =========================================
   AUTO-FILL STATE BASED ON CITY
========================================= */
const cityInput = document.getElementById('city');
const stateSelect = document.getElementById('state');

// Dictionary of common cities and their exact state dropdown values
const cityStateMap = {
    "sangli": "Maharashtra",
    "pune": "Maharashtra",
    "mumbai": "Maharashtra",
    "nagpur": "Maharashtra",
    "nashik": "Maharashtra",
    "kolhapur": "Maharashtra",
    "bengaluru": "Karnataka",
    "bangalore": "Karnataka",
    "mysuru": "Karnataka",
    "ahmedabad": "Gujarat",
    "surat": "Gujarat",
    "vadodara": "Gujarat",
    "hyderabad": "Telangana",
    "jaipur": "Rajasthan",
    "lucknow": "Uttar Pradesh",
    "chennai": "Tamil Nadu",
    "delhi": "Delhi",
    "new delhi": "Delhi",
    "indore": "Madhya Pradesh",
    "bhopal": "Madhya Pradesh"
};

if (cityInput && stateSelect) {
    cityInput.addEventListener('input', function () {
        // Convert typed text to lowercase and remove extra spaces
        const typedCity = this.value.trim().toLowerCase();

        // If the typed city exists in our map, auto-select the state
        if (cityStateMap[typedCity]) {
            stateSelect.value = cityStateMap[typedCity];

            // Force the progress checker to run so the pink checkmark updates instantly
            if (typeof updateSectionProgress === 'function') {
                updateSectionProgress();
            }
        }
    });
}
document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab').forEach(t => {
            t.classList.remove('active');
            t.style.color = 'var(--text)';
        });
        tab.classList.add('active');
        tab.style.color = 'var(--pink)';
        syncAdminDashboard();
    });
});

