document.addEventListener("DOMContentLoaded", function () {
    const imageContainer = document.querySelector(".image-container");

    // Function to scroll images
    function scrollImages() {
        imageContainer.style.transition = "none";
        imageContainer.style.transform = "translateX(0)";

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                imageContainer.style.transition = "transform 5s linear"; // Adjust the duration for scrolling speed
                imageContainer.style.transform = "translateX(-100%)";
            });
        });
    }

    // Initial scroll and set interval to continue scrolling
    scrollImages();
    setInterval(scrollImages, 5000); // Adjust the interval for scrolling speed
});
