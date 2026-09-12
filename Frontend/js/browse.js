/* =========================================
   BROWSE PROFILES - JAVASCRIPT
========================================= */

// DOM Elements
const profilesContainer = document.getElementById("profilesContainer");
const profileCount = document.getElementById("profileCount");
const noResults = document.getElementById("noResults");

// Filter Elements
const searchInput = document.getElementById("searchInput");
const genderFilter = document.getElementById("genderFilter");
const minAgeFilter = document.getElementById("minAgeFilter");
const maxAgeFilter = document.getElementById("maxAgeFilter");
const religionFilter = document.getElementById("religionFilter");
const stateFilter = document.getElementById("stateFilter");
const applyFiltersBtn = document.getElementById("applyFilters");
const clearFiltersBtn = document.getElementById("clearFilters");

let allProfiles = []; // Store database records here

// 1. Fetch ALL profiles from the database
async function loadAllProfiles() {
    try {
        const response = await fetch("[https://matrimonial-api-0097.onrender.com/api/profiles");
        
        if (!response.ok) throw new Error("Failed to fetch profiles");
        
        allProfiles = await response.json();
        displayProfiles(allProfiles); // Show all initially
    } catch (error) {
        console.error("Error loading profiles:", error);
        profilesContainer.innerHTML = "<p>Error loading profiles. Make sure your server is running.</p>";
    }
}

// 2. Display the profiles on the screen
function displayProfiles(profilesToDisplay) {
    profilesContainer.innerHTML = ""; // Clear current cards
    
    // Update the badge count
    profileCount.textContent = `${profilesToDisplay.length} Profiles`;

    // Show or hide the "No Results" warning
    if (profilesToDisplay.length === 0) {
        noResults.style.display = "block";
        return;
    } else {
        noResults.style.display = "none";
    }

    // Generate cards
    profilesToDisplay.forEach(profile => {
        const card = document.createElement("div");
        card.className = "profile-card";
        
        const uniqueId = profile.unique_id || `MAT-${profile.id}`;
        const name = profile.name || "Unknown";
        const age = profile.age || "-";
        const religion = profile.religion || "-";
        const city = profile.city || "-";
        const image = profile.image || "../images/default-profile.jpg";

        card.innerHTML = `
            <img src="${image}" alt="Profile Photo" class="profile-photo" style="width:100%; height:200px; object-fit:cover; border-radius: 8px 8px 0 0;">
            <div class="profile-info" style="padding: 15px; background: white; border-radius: 0 0 8px 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <span class="unique-id" style="background: #eee; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold;">${uniqueId}</span>
                <h3 style="margin: 10px 0 5px 0;">${name}</h3>
                <p class="summary-text" style="color: #666; margin-bottom: 15px;">${age} yrs • ${religion} • ${city}</p>
                
                <div class="card-actions">
                    <button class="view-btn" onclick="viewProfile('${profile.id}')" style="width: 100%; padding: 10px; background: #900C3F; color: white; border: none; border-radius: 4px; cursor: pointer;">View Profile</button>
                </div>
            </div>
        `;
        profilesContainer.appendChild(card);
    });
}

// 3. Filter Logic (Runs when you click "Apply Filters")
function applyFilters() {
    const searchVal = searchInput.value.toLowerCase();
    const genderVal = genderFilter.value;
    const religionVal = religionFilter.value;
    const stateVal = stateFilter.value;
    
    // Parse ages (default to 0 or 200 if left blank)
    const minAge = parseInt(minAgeFilter.value) || 0;
    const maxAge = parseInt(maxAgeFilter.value) || 200;

    const filtered = allProfiles.filter(profile => {
        // Search matches Name, City, or ID
        const matchesSearch = !searchVal || 
            (profile.name && profile.name.toLowerCase().includes(searchVal)) ||
            (profile.city && profile.city.toLowerCase().includes(searchVal)) ||
            (profile.unique_id && profile.unique_id.toLowerCase().includes(searchVal));

        // Exact match filters (Ignore if dropdown is left blank)
        const matchesGender = !genderVal || profile.gender === genderVal;
        const matchesReligion = !religionVal || profile.religion === religionVal;
        const matchesState = !stateVal || profile.state === stateVal;

        // Age logic
        const profileAge = profile.age ? parseInt(profile.age) : 0;
        const matchesAge = profileAge >= minAge && profileAge <= maxAge;

        return matchesSearch && matchesGender && matchesReligion && matchesState && matchesAge;
    });

    displayProfiles(filtered);
}

// 4. Clear Filters Logic
function clearFilters() {
    searchInput.value = "";
    genderFilter.value = "";
    minAgeFilter.value = "";
    maxAgeFilter.value = "";
    religionFilter.value = "";
    stateFilter.value = "";
    
    // Reset to show all
    displayProfiles(allProfiles);
}

// 5. Handle routing to the single profile page
function viewProfile(id) {
    localStorage.setItem("selectedProfileId", id);
    window.location.href = "profile.html";
}

// 6. Event Listeners
applyFiltersBtn.addEventListener("click", applyFilters);
clearFiltersBtn.addEventListener("click", clearFilters);
document.addEventListener("DOMContentLoaded", loadAllProfiles);