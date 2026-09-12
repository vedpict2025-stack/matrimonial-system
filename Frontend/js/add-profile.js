/* =========================================
   ADD PROFILE - JAVASCRIPT
========================================= */
// 1. Get the new image elements
const photoInput = document.getElementById("profilePhoto");
const photoPreview = document.getElementById("photoPreview");
let base64Image = "../images/default-profile.jpg"; // Default if they don't upload one

// 2. Listen for when the user selects a file
photoInput.addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            // This converts the image to a Base64 text string
            base64Image = e.target.result; 
            
            // Show the preview on the screen
            photoPreview.src = base64Image;
            photoPreview.style.display = "block";
        };
        reader.readAsDataURL(file);
    }
});

// 1. Setup Accordion Logic
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

// 2. Handle Form Submission
const profileData = {
    name: document.getElementById("name").value,
    age: document.getElementById("age").value,
    // ... all your other fields ...
    
    // Change your image line to this:
    image: base64Image
};
const addProfileForm = document.getElementById("addProfileForm");
const submitMessage = document.getElementById("submitMessage");
const submitBtn = document.getElementById("submitBtn");

addProfileForm.addEventListener("submit", async function(event) {
    event.preventDefault(); // Prevent page reload

    // Change button state
    submitBtn.textContent = "Saving Profile...";
    submitBtn.disabled = true;

    // Generate a random 4-digit number for the Unique ID (e.g., MAT-8392)
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const generatedUniqueId = `MAT-${randomNum}`;

    // Collect data from inputs
    const profileData = {
        unique_id: generatedUniqueId,
        name: document.getElementById("name").value,
        age: Number(document.getElementById("age").value),
        gender: document.getElementById("gender").value,
        dob: document.getElementById("dob").value,
        height: document.getElementById("height").value,
        weight: Number(document.getElementById("weight").value) || null,
        city: document.getElementById("city").value,
        state: document.getElementById("state").value,
        religion: document.getElementById("religion").value,
        sub_religion: document.getElementById("sub_religion").value,
        community: document.getElementById("community").value,
        caste: document.getElementById("caste").value,
        education: document.getElementById("education").value,
        occupation: document.getElementById("occupation").value,
        income: document.getElementById("income").value,
        future_plans: document.getElementById("future_plans").value,
        image: "../images/default-profile.jpg" // Default image for now
    };

    try {
        // Send data to your Node.js backend (which sends it to Supabase)
        const response = await fetch("[https://matrimonial-api-0097.onrender.com/api/profiles", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(profileData)
        });

        const result = await response.json();

        if (response.ok) {
            // Show Success Message
            submitMessage.textContent = `Success! Profile saved with ID: ${generatedUniqueId}`;
            submitMessage.className = "message-box message-success";
            submitMessage.style.display = "block";
            
            // Clear the form
            addProfileForm.reset();
            
            // Optional: Redirect to Browse page after 2 seconds
            setTimeout(() => {
                window.location.href = "browse.html";
            }, 2000);

        } else {
            throw new Error(result.error || "Failed to save profile");
        }

    } catch (error) {
        console.error("Error:", error);
        submitMessage.textContent = "Error saving profile. Check the console for details.";
        submitMessage.className = "message-box message-error";
        submitMessage.style.display = "block";
    } finally {
        submitBtn.textContent = "Save Profile to Database";
        submitBtn.disabled = false;
    }
});