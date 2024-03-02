// List of image URLs
const imageUrls = [
    'https://pixyshare.in/Gallary/image7.JPG',
    'https://pixyshare.in/Gallary/image21.jpeg',
    // Add more image URLs as needed
];

let currentIndex = 0;

function showRandomImage() {
    const randomIndex = Math.floor(Math.random() * imageUrls.length);
    currentIndex = randomIndex;
    const randomImage = document.getElementById('randomImage');
    randomImage.src = imageUrls[currentIndex];
}

function nextImage() {
    currentIndex = (currentIndex + 1) % imageUrls.length;
    updateImage();
}

function prevImage() {
    currentIndex = (currentIndex - 1 + imageUrls.length) % imageUrls.length;
    updateImage();
}

function updateImage() {
    const randomImage = document.getElementById('randomImage');
    randomImage.src = imageUrls[currentIndex];
}

// Initial image display
showRandomImage();
