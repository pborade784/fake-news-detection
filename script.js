// Google Apps Script Web App URL
const TRACKING_URL = "https://script.google.com/macros/s/AKfycbyhPhcnoLqO2VfPLCaW4vYJeLLPnSGpvFY6ueMRGcSuqNEDNn0YLctwUZUNLppgaaCXUA/exec";

// Send activity data
function trackActivity(action, details) {

    const data = {
        time: new Date().toISOString(),
        action: action || "",
        details: details || "",
        page: window.location.pathname.split("/").pop() || "index.html"
    };

    // Save activity locally
    try {
        const oldData = JSON.parse(
            localStorage.getItem("fakeNewsActivity") || "[]"
        );

        oldData.push(data);

        localStorage.setItem(
            "fakeNewsActivity",
            JSON.stringify(oldData)
        );

    } catch (error) {
        console.error("Local storage error:", error);
    }

    // Send data to Google Sheet
    if (TRACKING_URL) {

        fetch(TRACKING_URL, {
            method: "POST",
            mode: "no-cors",
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify(data)
        }).catch(function(error) {
            console.error("Google Sheet tracking error:", error);
        });
    }
}


// Track page visit
document.addEventListener("DOMContentLoaded", function() {

    trackActivity(
        "PAGE_VISIT",
        "Visited: " +
        (window.location.pathname.split("/").pop() || "index.html")
    );

});


// News Checker
function checkNews() {

    const input = document.getElementById("newsInput");
    const result = document.getElementById("result");

    if (!input || !result) {
        return;
    }

    const news = input.value.trim().toLowerCase();

    if (news === "") {

        result.className = "result-warning";

        result.innerHTML =
            "⚠️ <strong>Please enter some news to check.</strong>";

        return;
    }


    const warningWords = [
        "shocking",
        "breaking",
        "100% true",
        "secret",
        "miracle",
        "urgent",
        "forward this",
        "you won't believe",
        "guaranteed",
        "viral",
        "click here",
        "share immediately"
    ];


    let count = 0;
    let matchedWords = [];


    warningWords.forEach(function(word) {

        if (news.includes(word)) {

            count++;
            matchedWords.push(word);

        }

    });


    let status = "";


    if (count >= 2) {

        status = "Potentially Suspicious";

        result.className = "result-danger";

        result.innerHTML =
            "🔴 <strong>Potentially Suspicious!</strong><br>" +
            "This news contains multiple warning signs. " +
            "Verify it using reliable sources before sharing.";

    }

    else if (count === 1) {

        status = "Needs Verification";

        result.className = "result-warning";

        result.innerHTML =
            "🟡 <strong>Needs Verification</strong><br>" +
            "This news contains a warning sign. " +
            "Check the source and verify the information.";

    }

    else {

        status = "Likely Reliable";

        result.className = "result-safe";

        result.innerHTML =
            "🟢 <strong>Likely Reliable</strong><br>" +
            "No major warning signs were detected. " +
            "Still verify important information from reliable sources.";

    }


    // Track news check
    trackActivity(
        "NEWS_CHECK",
        "Search: " + input.value +
        " | Result: " + status +
        " | Warning words: " +
        (
            matchedWords.length > 0
                ? matchedWords.join(", ")
                : "None"
        )
    );

}

/* FEEDBACK SYSTEM */
document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("feedbackForm");
    const stars = document.querySelectorAll(".star");
    const ratingInput = document.getElementById("rating");
    const nameInput = document.getElementById("visitorName");
    const messageInput = document.getElementById("feedbackMessage");
    const statusMessage = document.getElementById("feedbackStatus");

    if (!form || !ratingInput || !messageInput || !statusMessage) {
        console.error("Feedback form elements are missing.");
        return;
    }

    let selectedRating = 0;

    function updateStars(rating) {
        stars.forEach(function (star) {
            const value = Number(star.dataset.rating);
            star.classList.toggle("active", value <= rating);
            star.setAttribute("aria-pressed", value <= rating ? "true" : "false");
        });

        ratingInput.value = rating || "";
    }

    stars.forEach(function (star) {
        star.style.cursor = "pointer";
        star.addEventListener("click", function () {
            selectedRating = Number(star.dataset.rating);
            updateStars(selectedRating);
        });
    });

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = nameInput ? nameInput.value.trim() : "";
        const feedback = messageInput.value.trim();

        if (selectedRating < 1 || selectedRating > 5) {
            statusMessage.textContent = "Please select a star rating.";
            return;
        }

        if (!feedback) {
            statusMessage.textContent = "Please enter your feedback.";
            return;
        }

        const submitButton = form.querySelector(
            'button[type="submit"], input[type="submit"]'
        );

        if (submitButton) submitButton.disabled = true;
        statusMessage.textContent = "Submitting feedback...";

        try {
            await fetch(TRACKING_URL, {
                method: "POST",
                mode: "no-cors",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8"
                },
                body: JSON.stringify({
                    action: "FEEDBACK_SUBMIT",
                    name: name || "Anonymous",
                    rating: selectedRating,
                    feedback: feedback,
                    time: new Date().toISOString(),
                    page: window.location.pathname.split("/").pop() || "feedback.html"
                })
            });

            statusMessage.textContent =
                "Thank you! Your feedback has been submitted.";

            form.reset();
            selectedRating = 0;
            updateStars(0);
        } catch (error) {
            console.error("Feedback submission error:", error);
            statusMessage.textContent =
                "Unable to submit feedback. Please try again.";
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });
});

/* DISPLAY USER REVIEWS */
document.addEventListener("DOMContentLoaded", async function () {
    const reviewsList = document.getElementById("reviewsList");
    if (!reviewsList) return;

    reviewsList.textContent = "Loading reviews...";

    try {
        const response = await fetch(TRACKING_URL);
        if (!response.ok) throw new Error("Could not load reviews");

        const reviews = await response.json();

        if (!Array.isArray(reviews)) {
            throw new Error("Invalid reviews data");
        }

        reviewsList.replaceChildren();

        if (reviews.length === 0) {
            reviewsList.textContent =
                "No reviews yet. Be the first to share your feedback!";
            return;
        }

        reviews.slice().reverse().forEach(function (review) {
            const card = document.createElement("div");
            card.className = "review-card";

            const header = document.createElement("div");
            header.className = "review-header";

            const avatar = document.createElement("div");
            avatar.className = "review-avatar";
            avatar.textContent = (review.name || "A").charAt(0).toUpperCase();

            const info = document.createElement("div");
            info.className = "review-user-info";

            const name = document.createElement("h3");
            name.textContent = review.name || "Anonymous";

            const date = document.createElement("small");
            date.className = "review-date";

            if (review.date) {
                date.textContent = new Date(review.date).toLocaleString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                });
            }

            info.append(name, date);
            header.append(avatar, info);

            const stars = document.createElement("div");
            stars.className = "review-stars";

            const rating = Math.max(0, Math.min(5, Number(review.rating) || 0));
            stars.textContent = "★".repeat(rating) + "☆".repeat(5 - rating);

            const message = document.createElement("p");
            message.className = "review-message";
            message.textContent = review.feedback || "";

            card.append(header, stars, message);
            reviewsList.appendChild(card);
        });
    } catch (error) {
        console.error("Reviews loading error:", error);
        reviewsList.textContent =
            "Reviews could not be loaded. Please try again later.";
    }
});