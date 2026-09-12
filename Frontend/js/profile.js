/* =========================================
   PROFILE DETAILS - JAVASCRIPT
========================================= */

// 1. Setup Accordion (Collapsible Sections) logic
const accordions = document.querySelectorAll(".accordion");

accordions.forEach(function(acc) {
    acc.addEventListener("click", function() {
        this.classList.toggle("active");
        const panel = this.nextElementSibling;
        if (panel.style.maxHeight) {
            panel.style.maxHeight = null;
        } else {
            panel.style.maxHeight = panel.scrollHeight + "px";
        }
    });
});

// 2. Fetch the specific profile data
async function loadProfileData() {
    const profileId = localStorage.getItem("selectedProfileId");

    if (!profileId) {
        document.getElementById("loadingMessage").textContent = "No profile selected. Please return to the Browse page and select a profile.";
        return;
    }

    try {
        const response = await fetch(`[https://matrimonial-api-0097.onrender.com/api/profiles/${profileId}`);
        
        if (!response.ok) throw new Error("Profile not found");
        
        const profile = await response.json();
        
        // Hide loading, show content
        document.getElementById("loadingMessage").style.display = "none";
        document.getElementById("profileContent").style.display = "block";
        
// 3. Populate HTML with backend data
        const uniqueId = profile.unique_id ? profile.unique_id : `MAT-${profile.id}`;
        document.getElementById("detailUniqueId").textContent = uniqueId;
        document.getElementById("detailName").textContent = profile.name || "N/A";
        
        const basicStr = `${profile.age || '-'} yrs • ${profile.gender || '-'} • ${profile.city || '-'}, ${profile.state || '-'}`;
        document.getElementById("detailBasic").textContent = basicStr;

        // REPLACE YOUR IF STATEMENT WITH THIS LINE:
        document.getElementById("detailImage").src = profile.image || "../images/default-profile.jpg";

        // Personal Info
        document.getElementById("infoAge").textContent = profile.age || "-";

        // Personal Info
        document.getElementById("infoAge").textContent = profile.age || "-";
        document.getElementById("infoGender").textContent = profile.gender || "-";
        document.getElementById("infoHeight").textContent = profile.height || "-";
        document.getElementById("infoWeight").textContent = profile.weight || "-";
        document.getElementById("infoCity").textContent = profile.city || "-";
        document.getElementById("infoState").textContent = profile.state || "-";

        // Religion & Community
        document.getElementById("infoReligion").textContent = profile.religion || "-";
        document.getElementById("infoCommunity").textContent = profile.community || "-";
        document.getElementById("infoCaste").textContent = profile.caste || "-";
        document.getElementById("infoSubReligion").textContent = profile.sub_religion || "-";

        // Education & Career
        document.getElementById("infoEducation").textContent = profile.education || "-";
        document.getElementById("infoOccupation").textContent = profile.occupation || "-";
        document.getElementById("infoIncome").textContent = profile.income || "-";
        document.getElementById("infoFuturePlans").textContent = profile.future_plans || "-";

    } catch (error) {
        console.error(error);
        document.getElementById("loadingMessage").textContent = "Error loading profile data.";
    }
}

// Load data when page opens
document.addEventListener("DOMContentLoaded", loadProfileData);